import { useEffect, useRef, useState } from 'react'
import { Close } from '@carbon/icons-react'
import { api } from '../comum/api'
import { irPara } from '../comum/endereco'
import { emHora, hojeNaApi } from '../comum/formato'
import { ehHoje, nomeDaSala, nomesDe, porHorario, type Reuniao } from '../reunioes/tipos'
import { horaDo, naOrdem, type Lembrete } from '../lembretes/tipos'
import './ResumoDoDia.css'

/*
 * Guardado por aba do navegador (sessionStorage): o pop-up aparece uma vez a cada entrada no sistema.
 * Sair apaga a marca (esqueceResumoDoDia), então a próxima entrada mostra de novo.
 */
const ARMAZENADO = 'recepcao.resumo-do-dia.'

function jaMostrado(usuario: string): boolean {
  try {
    return window.sessionStorage.getItem(ARMAZENADO + usuario) === hojeNaApi()
  } catch {
    return false
  }
}

function marcarMostrado(usuario: string) {
  try {
    window.sessionStorage.setItem(ARMAZENADO + usuario, hojeNaApi())
  } catch {
    // Sem armazenamento, o pop-up pode aparecer de novo ao recarregar, o que não faz mal.
  }
}

export function esqueceResumoDoDia() {
  try {
    Object.keys(window.sessionStorage)
      .filter((chave) => chave.startsWith(ARMAZENADO))
      .forEach((chave) => window.sessionStorage.removeItem(chave))
  } catch {
    // Nada a apagar.
  }
}

function saudacao(agora: Date): string {
  const hora = agora.getHours()
  if (hora < 12) return 'Bom dia!'
  if (hora < 18) return 'Boa tarde!'
  return 'Boa noite!'
}

function quantos(numero: number, um: string, varios: string): string {
  return numero === 1 ? um : varios
}

type Props = {
  usuario: string
  /** Fechou, ou não havia nada para mostrar: a Plataforma segue para a pergunta dos atrasados. */
  aoTerminar: () => void
}

/**
 * O pop-up da entrada (opção B escolhida em 2026-11-24): uma faixa preta à esquerda com o dia em número grande
 * e as contagens; à direita, as reuniões agendadas para hoje e os lembretes de hoje que ainda não foram feitos.
 */
export function ResumoDoDia({ usuario, aoTerminar }: Props) {
  const [reunioes, setReunioes] = useState<Reuniao[]>([])
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [aberto, setAberto] = useState(false)
  const botao = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (jaMostrado(usuario)) {
      aoTerminar()
      return
    }
    Promise.all([
      api.ler<Reuniao[]>('/reunioes').catch(() => [] as Reuniao[]),
      api.ler<Lembrete[]>('/api/lembretes').catch(() => [] as Lembrete[]),
    ]).then(([todasAsReunioes, todosOsLembretes]) => {
      const hoje = hojeNaApi()
      const deHoje = todasAsReunioes
        .filter((reuniao) => reuniao.status === 'AGENDADA' && ehHoje(reuniao))
        .sort(porHorario)
      const lembretesDeHoje = todosOsLembretes
        .filter((lembrete) => !lembrete.feito && lembrete.dia === hoje)
        .sort(naOrdem)
      marcarMostrado(usuario)
      if (deHoje.length === 0 && lembretesDeHoje.length === 0) {
        aoTerminar()
        return
      }
      setReunioes(deHoje)
      setLembretes(lembretesDeHoje)
      setAberto(true)
    })
    // Só na entrada: não refaz quando a Plataforma renderiza de novo.
  }, [usuario])

  // Aberto: o foco vai para o botão e o Esc fecha.
  useEffect(() => {
    if (!aberto) return
    botao.current?.focus()
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  function fechar() {
    setAberto(false)
    aoTerminar()
  }

  function abrir(endereco: string) {
    fechar()
    irPara(endereco)
  }

  if (!aberto) return null

  const agora = new Date()
  const semana = agora.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '')
  const mes = agora.toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <div className="recepcao-resumo" onClick={fechar}>
      <div
        className="recepcao-resumo__janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recepcao-resumo-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <aside className="recepcao-resumo__lado">
          <div>
            <div className="recepcao-resumo__dia">{agora.getDate()}</div>
            <div className="recepcao-resumo__mes">
              {semana} · {mes}
            </div>
          </div>
          <div className="recepcao-resumo__conta">
            <strong>{reunioes.length}</strong>
            <span>{quantos(reunioes.length, 'reunião', 'reuniões')}</span>
          </div>
          <div className="recepcao-resumo__conta">
            <strong>{lembretes.length}</strong>
            <span>{quantos(lembretes.length, 'lembrete', 'lembretes')}</span>
          </div>
        </aside>

        <div className="recepcao-resumo__direita">
          <header className="recepcao-resumo__topo">
            <h2 id="recepcao-resumo-titulo">{saudacao(agora)}</h2>
            <button type="button" className="recepcao-resumo__fechar" aria-label="Fechar" onClick={fechar}>
              <Close size={20} />
            </button>
          </header>

          <div className="recepcao-resumo__corpo">
            <section>
              <h3>Reuniões</h3>
              {reunioes.length === 0 && <p className="recepcao-resumo__nada">Nenhuma reunião agendada para hoje.</p>}
              {reunioes.map((reuniao) => (
                <button
                  key={reuniao.id}
                  type="button"
                  className="recepcao-resumo__item"
                  onClick={() => abrir(`/reunioes?ver=${reuniao.id}`)}
                >
                  <span className="recepcao-resumo__hora">{emHora(reuniao.datahoraReuniao)}</span>
                  <span>
                    {reuniao.titulo}
                    <small>{[nomeDaSala(reuniao.sala), nomesDe(reuniao.anfitrioes)].filter(Boolean).join(' · ')}</small>
                  </span>
                </button>
              ))}
            </section>

            <section>
              <h3>Lembretes</h3>
              {lembretes.length === 0 && <p className="recepcao-resumo__nada">Nenhum lembrete para hoje.</p>}
              {lembretes.map((lembrete) => {
                const hora = horaDo(lembrete)
                return (
                  <button key={lembrete.id} type="button" className="recepcao-resumo__item" onClick={() => abrir('/lembretes')}>
                    <span className={hora ? 'recepcao-resumo__hora' : 'recepcao-resumo__hora recepcao-resumo__hora--dia'}>
                      {hora ?? 'dia todo'}
                    </span>
                    <span>
                      {lembrete.descricao}
                      {lembrete.paraQuem && <small>Para {lembrete.paraQuem}</small>}
                    </span>
                  </button>
                )
              })}
            </section>
          </div>

          <button ref={botao} type="button" className="recepcao-resumo__entendi" onClick={fechar}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
