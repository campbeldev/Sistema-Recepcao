import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, InlineNotification, Modal, Tag } from '@carbon/react'
import { CheckmarkOutline } from '@carbon/icons-react'
import { api, mensagemDe } from '../comum/api'
import { dataDaApi, dataParaApi, emData, hojeNaApi } from '../comum/formato'
import { irPara } from '../comum/endereco'
import { horaDo, naOrdem, type Lembrete } from './tipos'
import './PerguntaDosAtrasados.css'

// Quanto tempo depois do horário o lembrete com hora é perguntado: dá margem para quem atrasou só um pouco.
const MARGEM_EM_MINUTOS = 60
// De quanto em quanto tempo, com o sistema aberto, ele confere se algum lembrete venceu.
const INTERVALO_EM_MS = 60_000

/*
 * O que já foi perguntado hoje, por usuário, guardado no navegador.
 * A chave de cada lembrete leva o dia e a hora dele: se a pessoa passa o lembrete para outro horário,
 * a chave muda e ele é perguntado de novo quando o novo horário vencer.
 * Quando o dia vira, a lista zera: na primeira entrada do dia, tudo o que está vencido é perguntado de novo.
 */
const ARMAZENADO = 'recepcao.lembretes-perguntados.'

type Perguntados = { dia: string; chaves: string[] }

function chaveDo(lembrete: Lembrete): string {
  return `${lembrete.id}@${lembrete.dia}T${lembrete.hora ?? ''}`
}

function lerPerguntados(usuario: string): Set<string> {
  try {
    const lido = JSON.parse(window.localStorage.getItem(ARMAZENADO + usuario) ?? 'null') as Perguntados | null
    return new Set(lido && lido.dia === hojeNaApi() ? lido.chaves : [])
  } catch {
    return new Set()
  }
}

function guardarPerguntados(usuario: string, chaves: Set<string>) {
  try {
    const valor: Perguntados = { dia: hojeNaApi(), chaves: [...chaves] }
    window.localStorage.setItem(ARMAZENADO + usuario, JSON.stringify(valor))
  } catch {
    // Sem armazenamento, o pop-up pode repetir numa nova entrada, o que não faz mal.
  }
}

/** O momento do horário do lembrete, na hora local da recepção. */
function horarioDo(lembrete: Lembrete): Date | null {
  if (!lembrete.hora) return null
  const momento = dataDaApi(lembrete.dia)!
  const [hora, minuto] = lembrete.hora.split(':').map(Number)
  momento.setHours(hora, minuto, 0, 0)
  return momento
}

function minutosDesde(momento: Date, agora: Date): number {
  return Math.floor((agora.getTime() - momento.getTime()) / 60_000)
}

/**
 * Venceu e precisa da pergunta: de um dia que já passou, ou de hoje com a hora vencida há mais de uma hora.
 * Lembrete de hoje sem hora vale o dia todo: só é perguntado amanhã.
 */
function venceu(lembrete: Lembrete, agora: Date): boolean {
  if (lembrete.feito) return false
  const hoje = hojeNaApi()
  if (lembrete.dia < hoje) return true
  if (lembrete.dia > hoje) return false
  const horario = horarioDo(lembrete)
  return horario !== null && minutosDesde(horario, agora) >= MARGEM_EM_MINUTOS
}

function atrasoDo(lembrete: Lembrete, agora: Date): string {
  if (lembrete.dia < hojeNaApi()) {
    const dias = Math.round((dataDaApi(hojeNaApi())!.getTime() - dataDaApi(lembrete.dia)!.getTime()) / 86_400_000)
    return dias === 1 ? '1 dia de atraso' : `${dias} dias de atraso`
  }
  const minutos = minutosDesde(horarioDo(lembrete)!, agora)
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return `${horas}h${resto ? String(resto).padStart(2, '0') : ''} de atraso`
}

function amanhaNaApi(): string {
  const amanha = dataDaApi(hojeNaApi())!
  amanha.setDate(amanha.getDate() + 1)
  return dataParaApi(amanha)
}

/** Daqui a uma hora, arredondado para os próximos 15 minutos ("14:15:00"). Nulo se passar da meia-noite. */
function daquiAUmaHora(agora: Date): string | null {
  const depois = new Date(agora.getTime() + 60 * 60_000)
  depois.setMinutes(Math.ceil(depois.getMinutes() / 15) * 15, 0, 0)
  if (dataParaApi(depois) !== hojeNaApi()) return null
  return `${String(depois.getHours()).padStart(2, '0')}:${String(depois.getMinutes()).padStart(2, '0')}:00`
}

type Props = {
  usuario: string
  /** Algum lembrete mudou: a tela de trás e o sino precisam recarregar. */
  aoMudar: () => void
  /** Fecha depois de responder todos; a Plataforma mostra a confirmação. */
  aoTerminar: (texto: string) => void
}

/**
 * O pop-up que pergunta se os lembretes vencidos já foram feitos.
 * Na primeira entrada de cada dia, pergunta sobre tudo o que está vencido. Com o sistema aberto,
 * pergunta sobre o lembrete com hora uma hora depois do horário. Cada lembrete é perguntado uma vez por dia
 * (de novo se mudar de horário). Fechar não perde nada: o sino continua mostrando os atrasados.
 */
export function PerguntaDosAtrasados({ usuario, aoMudar, aoTerminar }: Props) {
  const [pendentes, setPendentes] = useState<Lembrete[]>([])
  const [agora, setAgora] = useState(() => new Date())
  const [menuDe, setMenuDe] = useState<number | null>(null)
  const [mexendo, setMexendo] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string>()
  const [recusa, setRecusa] = useState<string>()
  const mudou = useRef(false)

  const conferir = useCallback(() => {
    api
      .ler<Lembrete[]>('/api/lembretes')
      .then((lista) => {
        const momento = new Date()
        setAgora(momento)
        const perguntados = lerPerguntados(usuario)
        const novos = lista.filter((lembrete) => venceu(lembrete, momento) && !perguntados.has(chaveDo(lembrete)))
        if (novos.length === 0) return
        novos.forEach((lembrete) => perguntados.add(chaveDo(lembrete)))
        guardarPerguntados(usuario, perguntados)
        // Se o pop-up já está aberto, os novos entram na mesma lista.
        setPendentes((abertos) => {
          const ids = new Set(abertos.map((lembrete) => lembrete.id))
          return [...abertos, ...novos.filter((lembrete) => !ids.has(lembrete.id))].sort(naOrdem)
        })
      })
      .catch(() => {
        // Sem a lista, não pergunta agora: tenta de novo no próximo minuto, e o sino continua mostrando os atrasados.
      })
  }, [usuario])

  useEffect(() => {
    conferir()
    const relogio = window.setInterval(conferir, INTERVALO_EM_MS)
    // Ao voltar para a aba depois de um tempo, confere na hora, sem esperar o próximo minuto.
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') conferir()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      window.clearInterval(relogio)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [conferir])

  function fechar() {
    setPendentes([])
    setMenuDe(null)
    setAviso(undefined)
    setRecusa(undefined)
    if (mudou.current) {
      mudou.current = false
      aoMudar()
    }
  }

  async function responder(lembrete: Lembrete, acao: () => Promise<unknown>, texto: string) {
    setMexendo(lembrete.id)
    setRecusa(undefined)
    try {
      await acao()
      mudou.current = true
      const restantes = pendentes.filter((outro) => outro.id !== lembrete.id)
      setPendentes(restantes)
      setMenuDe(null)
      setAviso(texto)
      if (restantes.length === 0) {
        mudou.current = false
        setAviso(undefined)
        aoMudar()
        aoTerminar('Tudo em dia: nenhum lembrete atrasado.')
      }
    } catch (erro) {
      setRecusa(mensagemDe(erro))
    } finally {
      setMexendo(null)
    }
  }

  function concluir(lembrete: Lembrete) {
    return responder(lembrete, () => api.gravar(`/api/lembretes/${lembrete.id}/concluir`), 'Lembrete marcado como feito.')
  }

  function mudarPara(lembrete: Lembrete, dia: string, hora: string | null, texto: string) {
    const corpo = { descricao: lembrete.descricao, paraQuem: lembrete.paraQuem, dia, hora }
    return responder(lembrete, () => api.alterar(`/api/lembretes/${lembrete.id}`, corpo), texto)
  }

  // De um dia que passou para hoje: a hora só fica se ainda não venceu, senão o lembrete vale o dia todo.
  function passarParaHoje(lembrete: Lembrete) {
    const hoje = { ...lembrete, dia: hojeNaApi() }
    const horario = horarioDo(hoje)
    const hora = horario && minutosDesde(horario, new Date()) < MARGEM_EM_MINUTOS ? lembrete.hora : null
    return mudarPara(lembrete, hoje.dia, hora, 'Lembrete passado para hoje.')
  }

  if (pendentes.length === 0) return null

  const quantos = pendentes.length
  const umaHoraDepois = daquiAUmaHora(agora)
  return (
    <Modal
      open
      size="md"
      modalLabel="Lembretes"
      modalHeading={quantos === 1 ? 'Um lembrete está atrasado' : `${quantos} lembretes estão atrasados`}
      primaryButtonText="Responder depois"
      secondaryButtonText="Abrir Lembretes"
      closeButtonLabel="Fechar"
      onRequestClose={fechar}
      onRequestSubmit={fechar}
      onSecondarySubmit={() => {
        fechar()
        irPara('/lembretes?situacao=pendentes')
        // Recarrega a tela mesmo se ela já for a de Lembretes, para o filtro valer.
        aoMudar()
      }}
    >
      <p className="recepcao-atrasados__texto">
        {quantos === 1
          ? 'O horário passou e ele ainda não foi marcado como feito. Já foi concluído?'
          : 'O horário passou e eles ainda não foram marcados como feitos. Algum já foi concluído?'}
      </p>

      {recusa && (
        <InlineNotification
          kind="error"
          title="A mudança foi recusada."
          subtitle={recusa}
          onCloseButtonClick={() => setRecusa(undefined)}
        />
      )}
      {aviso && !recusa && (
        <InlineNotification kind="success" lowContrast title={aviso} onCloseButtonClick={() => setAviso(undefined)} />
      )}

      <ul className="recepcao-atrasados__lista">
        {pendentes.map((lembrete) => {
          const hora = horaDo(lembrete)
          const deHoje = lembrete.dia === hojeNaApi()
          const ocupado = mexendo !== null
          return (
            <li key={lembrete.id} className="recepcao-atrasados__linha">
              <div className="recepcao-atrasados__sobre">
                <span>{lembrete.descricao}</span>
                <span className="recepcao-atrasados__meta">
                  <Tag type="red" size="sm">
                    {atrasoDo(lembrete, agora)}
                  </Tag>
                  <span>
                    Era para {deHoje ? 'hoje' : emData(lembrete.dia).slice(0, 5)}
                    {hora ? ` às ${hora}` : ''}
                  </span>
                  {lembrete.paraQuem && <span>Para {lembrete.paraQuem}</span>}
                </span>
              </div>
              <div className="recepcao-atrasados__botoes">
                <Button
                  kind="tertiary"
                  size="sm"
                  renderIcon={CheckmarkOutline}
                  disabled={ocupado}
                  onClick={() => concluir(lembrete)}
                >
                  {mexendo === lembrete.id ? 'Gravando…' : 'Feito'}
                </Button>
                <Button
                  kind="ghost"
                  size="sm"
                  disabled={ocupado}
                  aria-expanded={menuDe === lembrete.id}
                  onClick={() => setMenuDe(menuDe === lembrete.id ? null : lembrete.id)}
                >
                  Passar para…
                </Button>
                {menuDe === lembrete.id && (
                  <div className="recepcao-atrasados__menu" role="menu">
                    {deHoje ? (
                      umaHoraDepois && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            mudarPara(lembrete, lembrete.dia, umaHoraDepois, `Lembrete passado para as ${umaHoraDepois.slice(0, 5)}.`)
                          }
                        >
                          Daqui a 1 hora ({umaHoraDepois.slice(0, 5)})
                        </button>
                      )
                    ) : (
                      <button type="button" role="menuitem" onClick={() => passarParaHoje(lembrete)}>
                        Hoje
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => mudarPara(lembrete, amanhaNaApi(), lembrete.hora, 'Lembrete passado para amanhã.')}
                    >
                      Amanhã
                    </button>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="recepcao-atrasados__ajuda">
        Os que ficarem sem resposta continuam no sino, e o sistema pergunta de novo amanhã, na primeira entrada.
      </p>
    </Modal>
  )
}
