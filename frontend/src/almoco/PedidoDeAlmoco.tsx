import { useEffect, useState, type FormEvent } from 'react'
import { Button, ComboBox, Form, InlineLoading, InlineNotification, Stack } from '@carbon/react'
import { combinaComBusca } from 'campbel-ui'
import { api, camposDe, mensagemDe } from '../comum/api'
import { CamposDoPedido, PEDIDO_VAZIO, pedidoParaApi, valoresDoPedido, type ValoresDoPedido } from './CamposDoPedido'
import { acompanhamentosDo, emHoraCurta, situacaoDo, type Pedido, type PessoaDoAlmoco, type Publico } from './tipos'
import './Almoco.css'

const SIMBOLO = '/plataforma/campbel/campbel-simbolo.png'
// O celular lembra quem é a pessoa, para ela não procurar o nome todo dia.
const LEMBRAR = 'recepcao-almoco-pessoa'

function lembrada(): number | null {
  try {
    const valor = window.localStorage.getItem(LEMBRAR)
    return valor ? Number(valor) : null
  } catch {
    return null
  }
}

function lembrar(pessoa: PessoaDoAlmoco | null) {
  try {
    if (pessoa) window.localStorage.setItem(LEMBRAR, String(pessoa.id))
    else window.localStorage.removeItem(LEMBRAR)
  } catch {
    // Navegador sem armazenamento: a pessoa só escolhe o nome de novo amanhã.
  }
}

// A página do link que vai no grupo do WhatsApp, aberta sem login: cada pessoa escolhe o nome,
// a proteína e os acompanhamentos, e pode alterar ou cancelar até a hora de fechar.
export function PedidoDeAlmoco() {
  const [dados, setDados] = useState<Publico>()
  const [falha, setFalha] = useState<string>()
  const [pessoa, setPessoa] = useState<PessoaDoAlmoco | null>(null)
  // undefined: carregando; null: ainda não pediu.
  const [pedido, setPedido] = useState<Pedido | null>()
  const [editando, setEditando] = useState(false)
  const [valores, setValores] = useState<ValoresDoPedido>(PEDIDO_VAZIO)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [recusa, setRecusa] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)

  useEffect(() => {
    document.title = 'Almoço de hoje · Campbel'
    api
      .ler<Publico>('/api/almoco/publico')
      .then((lidos) => {
        setDados(lidos)
        const id = lembrada()
        setPessoa(lidos.pessoas.find((outra) => outra.id === id) ?? null)
      })
      .catch((erro) => setFalha(mensagemDe(erro)))
  }, [])

  const cardapio = dados?.cardapio ?? null

  useEffect(() => {
    if (!pessoa || !cardapio) return
    setPedido(undefined)
    setRecusa(undefined)
    setErros({})
    setConfirmandoCancelamento(false)
    api
      .ler<Pedido | null>(`/api/almoco/publico/pedidos/${pessoa.id}`)
      .then((lido) => {
        setPedido(lido)
        setValores(valoresDoPedido(lido))
        setEditando(!lido)
      })
      .catch((erro) => setRecusa(mensagemDe(erro)))
  }, [pessoa, cardapio])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!pessoa) return
    if (!valores.proteina) {
      setErros({ proteina: 'Escolha a proteína.' })
      return
    }
    setEnviando(true)
    setRecusa(undefined)
    try {
      const gravado = await api.alterar<Pedido>(`/api/almoco/publico/pedidos/${pessoa.id}`, pedidoParaApi(valores))
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
    if (!pessoa) return
    setEnviando(true)
    setRecusa(undefined)
    try {
      await api.apagar(`/api/almoco/publico/pedidos/${pessoa.id}`)
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
      return <InlineNotification kind="error" title="Não foi possível carregar o cardápio." subtitle={falha} hideCloseButton />
    }
    if (!dados) return <InlineLoading description="Carregando o cardápio…" />
    if (!cardapio) {
      return (
        <InlineNotification
          kind="info"
          lowContrast
          title="O cardápio de hoje ainda não foi publicado."
          subtitle="Assim que a recepção publicar, ele aparece aqui. Atualize a página daqui a pouco."
          hideCloseButton
        />
      )
    }
    if (dados.pessoas.length === 0) {
      return (
        <InlineNotification
          kind="info"
          lowContrast
          title="Nenhum nome cadastrado ainda."
          subtitle="A recepção cadastra os nomes na tela Ramais do sistema."
          hideCloseButton
        />
      )
    }

    return (
      <Stack gap={6}>
        <p>{situacaoDo(cardapio)}</p>
        <ComboBox<PessoaDoAlmoco>
          id="pedir-pessoa"
          titleText="Seu nome"
          placeholder="Busque pelo seu nome"
          helperText="Este celular lembra o seu nome para os próximos dias."
          items={dados.pessoas}
          itemToString={(item) => (item ? item.nome : '')}
          shouldFilterItem={({ item, inputValue }) => combinaComBusca(inputValue ?? '', item.nome, item.setor)}
          selectedItem={pessoa}
          onChange={({ selectedItem }) => {
            setPessoa(selectedItem ?? null)
            lembrar(selectedItem ?? null)
          }}
        />

        {pessoa && pedido === undefined && !recusa && <InlineLoading description="Procurando o seu pedido…" />}

        {pessoa && pedido !== undefined && !editando && pedido && (
          <Stack gap={5}>
            <InlineNotification
              kind="success"
              lowContrast
              title="Seu pedido está feito."
              subtitle={`${pedido.proteina} com ${acompanhamentosDo(pedido).toLowerCase()}${
                pedido.observacao ? `. ${pedido.observacao}` : ''
              }.`}
              hideCloseButton
            />
            {cardapio.aberto ? (
              confirmandoCancelamento ? (
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
                  <p>Dá para alterar ou cancelar até {emHoraCurta(cardapio.fechaAs)}.</p>
                  <Button className="recepcao-pedir__largo" onClick={() => setEditando(true)}>
                    Alterar pedido
                  </Button>
                  <Button className="recepcao-pedir__largo" kind="secondary" onClick={() => setConfirmandoCancelamento(true)}>
                    Cancelar pedido
                  </Button>
                </Stack>
              )
            ) : (
              <p>Os pedidos de hoje já fecharam. Para mudar alguma coisa, fale com a recepção.</p>
            )}
          </Stack>
        )}

        {pessoa && pedido !== undefined && editando && !cardapio.aberto && (
          <InlineNotification
            kind="warning"
            lowContrast
            title="Os pedidos de hoje já fecharam."
            subtitle={`${situacaoDo(cardapio)}. Para pedir agora, fale com a recepção.`}
            hideCloseButton
          />
        )}

        {recusa && (
          <InlineNotification kind="error" title="O pedido foi recusado." subtitle={recusa} hideCloseButton />
        )}

        {pessoa && pedido !== undefined && editando && cardapio.aberto && (
          <Form autoComplete="off" onSubmit={enviar}>
            <Stack gap={6}>
              <CamposDoPedido
                prefixo="pedir"
                cardapio={cardapio}
                valores={valores}
                erros={erros}
                aoMudar={(novos) => {
                  setValores(novos)
                  setErros({})
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
                      setEditando(false)
                      setRecusa(undefined)
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
