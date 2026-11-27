import { useEffect, useState, type FormEvent } from 'react'
import { Button, Form, InlineLoading, InlineNotification, Stack, TextInput } from '@carbon/react'
import { api, camposDe, mensagemDe } from '../comum/api'
import { CamposDoPedido, PEDIDO_VAZIO, pedidoParaApi, valoresDoPedido, type ValoresDoPedido } from './CamposDoPedido'
import { acompanhamentosDo, emHoraCurta, situacaoDo, type Cardapio, type Pedido, type PedidoComChave } from './tipos'
import './Almoco.css'

const SIMBOLO = '/plataforma/campbel/campbel-simbolo.png'
const CABECALHO_DA_CHAVE = 'X-Chave-Do-Pedido'
// A chave do pedido de hoje fica neste celular: só com ela dá para alterar ou cancelar.
const LEMBRAR_PEDIDO = 'recepcao-almoco-pedido'
// O nome digitado, para não digitar de novo amanhã.
const LEMBRAR_NOME = 'recepcao-almoco-nome'
const LINK_SEM_VALOR = 'Este link não vale mais. Use o link de hoje, que a recepção manda no grupo.'

// /almoco/{código do dia}
const codigo = window.location.pathname.split('/')[2] ?? ''

function chaveGuardada(): string | null {
  try {
    const guardado = JSON.parse(window.localStorage.getItem(LEMBRAR_PEDIDO) ?? 'null')
    return guardado?.codigo === codigo && typeof guardado.chave === 'string' ? guardado.chave : null
  } catch {
    return null
  }
}

function guardarChave(chave: string | null) {
  try {
    if (chave) window.localStorage.setItem(LEMBRAR_PEDIDO, JSON.stringify({ codigo, chave }))
    else window.localStorage.removeItem(LEMBRAR_PEDIDO)
  } catch {
    // Navegador sem armazenamento: o pedido vale, mas só a recepção consegue alterar.
  }
}

function nomeGuardado(): string {
  try {
    return window.localStorage.getItem(LEMBRAR_NOME) ?? ''
  } catch {
    return ''
  }
}

function guardarNome(nome: string) {
  try {
    window.localStorage.setItem(LEMBRAR_NOME, nome)
  } catch {
    // Sem armazenamento: a pessoa digita o nome de novo amanhã.
  }
}

// A página do link que vai no grupo do WhatsApp, aberta sem login: cada pessoa digita o nome,
// escolhe a proteína e os acompanhamentos, e pode alterar ou cancelar até a hora de fechar,
// só do mesmo celular. Fora do dia ou depois de fechar, o link não mostra nada.
export function PedidoDeAlmoco() {
  const [cardapio, setCardapio] = useState<Cardapio>()
  const [falha, setFalha] = useState<string>()
  const [chave, setChave] = useState<string | null>(chaveGuardada)
  // undefined: carregando; null: ainda não pediu deste celular.
  const [pedido, setPedido] = useState<Pedido | null>()
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(nomeGuardado)
  const [valores, setValores] = useState<ValoresDoPedido>(PEDIDO_VAZIO)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [recusa, setRecusa] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)

  useEffect(() => {
    document.title = 'Almoço de hoje · Campbel'
    try {
      // O que o link antigo guardava: o número da pessoa no Ramal. Não serve mais.
      window.localStorage.removeItem('recepcao-almoco-pessoa')
    } catch {
      // Sem armazenamento: nada a limpar.
    }
    if (!codigo) {
      setFalha(LINK_SEM_VALOR)
      return
    }
    async function carregar() {
      try {
        const lido = await api.ler<Cardapio>(`/api/almoco/publico/${codigo}`)
        const guardada = chaveGuardada()
        const meu = guardada
          ? await api.ler<Pedido | null>(`/api/almoco/publico/${codigo}/pedidos/meu`, { [CABECALHO_DA_CHAVE]: guardada })
          : null
        if (!meu && guardada) {
          // A recepção cancelou o pedido, ou a chave é de outro dia.
          guardarChave(null)
          setChave(null)
        }
        setCardapio(lido)
        setPedido(meu)
        setValores(valoresDoPedido(meu))
        if (meu) setNome(meu.nome)
        setEditando(!meu)
      } catch (erro) {
        setFalha(mensagemDe(erro))
      }
    }
    carregar()
  }, [])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const faltando: Record<string, string> = {}
    if (!nome.trim()) faltando.nome = 'Digite o seu nome.'
    if (!valores.proteina) faltando.proteina = 'Escolha a proteína.'
    if (Object.keys(faltando).length) {
      setErros(faltando)
      return
    }
    setEnviando(true)
    setRecusa(undefined)
    const corpo = { nome: nome.trim(), ...pedidoParaApi(valores) }
    try {
      let gravado: Pedido
      if (pedido && chave) {
        gravado = await api.alterar<Pedido>(`/api/almoco/publico/${codigo}/pedidos/meu`, corpo, {
          [CABECALHO_DA_CHAVE]: chave,
        })
      } else {
        const feito = await api.gravar<PedidoComChave>(`/api/almoco/publico/${codigo}/pedidos`, corpo)
        guardarChave(feito.chave)
        setChave(feito.chave)
        gravado = feito.pedido
      }
      guardarNome(gravado.nome)
      setNome(gravado.nome)
      setPedido(gravado)
      setEditando(false)
    } catch (erro) {
      setRecusa(mensagemDe(erro))
      setErros(camposDe(erro))
    } finally {
      setEnviando(false)
    }
  }

  async function cancelar() {
    if (!chave) return
    setEnviando(true)
    setRecusa(undefined)
    try {
      await api.apagar(`/api/almoco/publico/${codigo}/pedidos/meu`, { [CABECALHO_DA_CHAVE]: chave })
      guardarChave(null)
      setChave(null)
      setPedido(null)
      setValores(PEDIDO_VAZIO)
      setEditando(true)
      setConfirmandoCancelamento(false)
    } catch (erro) {
      setRecusa(mensagemDe(erro))
    } finally {
      setEnviando(false)
    }
  }

  const dia = cardapio ? `${cardapio.dia.slice(8, 10)}/${cardapio.dia.slice(5, 7)}` : ''

  function conteudo() {
    if (falha) {
      return (
        <InlineNotification
          kind="info"
          lowContrast
          title="Este link não está recebendo pedidos."
          subtitle={falha}
          hideCloseButton
        />
      )
    }
    if (!cardapio || pedido === undefined) return <InlineLoading description="Carregando o cardápio…" />

    return (
      <Stack gap={6}>
        <p>{situacaoDo(cardapio)}</p>

        {pedido && !editando && (
          <Stack gap={5}>
            <InlineNotification
              kind="success"
              lowContrast
              title={`Pedido de ${pedido.nome} feito.`}
              subtitle={`${pedido.proteina} com ${acompanhamentosDo(pedido).toLowerCase()}${
                pedido.observacao ? `. ${pedido.observacao}` : ''
              }.`}
              hideCloseButton
            />
            {confirmandoCancelamento ? (
              <Stack gap={3}>
                <p>Cancelar o seu pedido de hoje?</p>
                <Button className="recepcao-pedir__largo" onClick={cancelar} disabled={enviando}>
                  {enviando ? 'Cancelando…' : 'Cancelar pedido'}
                </Button>
                <Button className="recepcao-pedir__largo" kind="secondary" onClick={() => setConfirmandoCancelamento(false)}>
                  Voltar
                </Button>
              </Stack>
            ) : (
              <Stack gap={3}>
                <p>
                  Dá para alterar ou cancelar até {emHoraCurta(cardapio.fechaAs)}, por este celular. De outro aparelho,
                  fale com a recepção.
                </p>
                <Button className="recepcao-pedir__largo" onClick={() => setEditando(true)}>
                  Alterar pedido
                </Button>
                <Button className="recepcao-pedir__largo" kind="secondary" onClick={() => setConfirmandoCancelamento(true)}>
                  Cancelar pedido
                </Button>
              </Stack>
            )}
          </Stack>
        )}

        {recusa && <InlineNotification kind="error" title="O pedido foi recusado." subtitle={recusa} hideCloseButton />}

        {editando && (
          <Form autoComplete="off" onSubmit={enviar}>
            <Stack gap={6}>
              <TextInput
                id="pedir-nome"
                labelText="Seu nome"
                placeholder="Nome e sobrenome"
                helperText="Do jeito que você quer que apareça na lista do restaurante."
                maxLength={80}
                autoComplete="name"
                value={nome}
                onChange={(evento) => {
                  setNome(evento.target.value)
                  setErros((antes) => ({ ...antes, nome: '' }))
                }}
                invalid={Boolean(erros.nome)}
                invalidText={erros.nome}
              />
              <CamposDoPedido
                prefixo="pedir"
                cardapio={cardapio}
                valores={valores}
                erros={erros}
                aoMudar={(novos) => {
                  setValores(novos)
                  setErros((antes) => ({ nome: antes.nome ?? '' }))
                }}
              />
              <Stack gap={3}>
                <Button className="recepcao-pedir__largo" type="submit" disabled={enviando}>
                  {pedido ? (enviando ? 'Salvando…' : 'Salvar alteração') : enviando ? 'Enviando…' : 'Enviar pedido'}
                </Button>
                {pedido && (
                  <Button
                    className="recepcao-pedir__largo"
                    kind="secondary"
                    onClick={() => {
                      setValores(valoresDoPedido(pedido))
                      setNome(pedido.nome)
                      setEditando(false)
                      setRecusa(undefined)
                      setErros({})
                    }}
                  >
                    Voltar
                  </Button>
                )}
              </Stack>
            </Stack>
          </Form>
        )}
      </Stack>
    )
  }

  return (
    <div className="recepcao-pedir">
      <header className="recepcao-pedir__faixa">
        <img src={SIMBOLO} alt="" />
        <strong>Almoço de hoje</strong>
        {dia && <span>{dia}</span>}
      </header>
      <main className="recepcao-pedir__corpo">{conteudo()}</main>
    </div>
  )
}
