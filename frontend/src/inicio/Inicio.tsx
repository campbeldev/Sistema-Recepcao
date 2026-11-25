import { useEffect, useState } from 'react'
import {
  DataTableSkeleton,
  InlineNotification,
  Stack,
  Tile,
} from '@carbon/react'
import type { ReactNode } from 'react'
import { SegundaLinha } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { irPara } from '../comum/endereco'
import { VAZIO, emHora, emNumero, hojeNaApi } from '../comum/formato'
import { CartaoDaReuniao } from '../reunioes/CartaoDaReuniao'
import { SituacaoDaReuniao } from '../reunioes/SituacaoDaReuniao'
import { ehHoje, nomeDaSala, nomesDe, porHorario, type Reuniao } from '../reunioes/tipos'
import { SituacaoDoLembrete } from '../lembretes/SituacaoDoLembrete'
import { horaDo, naOrdem, paraHoje, type Lembrete } from '../lembretes/tipos'
import './Inicio.css'

const COLUNAS = 5
const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

// O dia "aaaa-mm-dd" daqui a tantos dias.
function daquiA(dias: number): string {
  const hoje = new Date()
  const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias)
  return `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`
}

// "45 min", "1 h" ou "2 h 15 min".
function emQuanto(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas} h ${resto} min` : `${horas} h`
}

// A hora de agora, que anda sozinha a cada minuto: a próxima reunião e o "começa em" acompanham.
function useAgora(): Date {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const relogio = window.setInterval(() => setAgora(new Date()), 60_000)
    return () => window.clearInterval(relogio)
  }, [])
  return agora
}

// Os quatro números numa faixa só, logo abaixo do título.
function FaixaDeNumeros({ itens }: { itens: { valor: string; rotulo: string }[] }) {
  return (
    <div className="recepcao-faixa">
      {itens.map((item) => (
        <div key={item.rotulo}>
          <strong>{item.valor}</strong>
          <span>{item.rotulo}</span>
        </div>
      ))}
    </div>
  )
}

// Uma caixa branca com o título à esquerda e a contagem à direita, como as do layout escolhido.
function Bloco({ titulo, contagem, children }: { titulo: string; contagem: string; children: ReactNode }) {
  return (
    <section className="recepcao-bloco">
      <div className="recepcao-bloco__topo">
        <h3>{titulo}</h3>
        <span>{contagem}</span>
      </div>
      {children}
    </section>
  )
}

// Hoje em mosaico: a próxima reunião numa folha grande de lateral preta, ocupando dois quadrados;
// as outras que ainda vão acontecer preenchem os espaços ao redor.
function Mosaico({ proxima, outras, agora }: { proxima?: Reuniao; outras: Reuniao[]; agora: Date }) {
  const quantas = (proxima ? 1 : 0) + outras.length
  return (
    <Bloco titulo="Hoje" contagem={quantas === 1 ? '1 ainda vai acontecer' : `${quantas} ainda vão acontecer`}>
      <div className="recepcao-corpo">
        {!proxima ? (
          <Tile>Nenhuma reunião agendada para o resto de hoje.</Tile>
        ) : (
          <div className="recepcao-mosaico">
            <CartaoDaReuniao
              reuniao={proxima}
              className="recepcao-mosaico__destaque"
              aviso={`Próxima · começa em ${emQuanto(
                Math.max(0, Math.ceil((new Date(proxima.datahoraReuniao).getTime() - agora.getTime()) / 60_000)),
              )}`}
            />
            {outras.map((reuniao) => (
              <CartaoDaReuniao key={reuniao.id} reuniao={reuniao} />
            ))}
          </div>
        )}
      </div>
    </Bloco>
  )
}

// As agendadas de amanhã até daqui a uma semana, agrupadas por dia.
function ProximosDias({ reunioes }: { reunioes: Reuniao[] }) {
  const porDia = new Map<string, Reuniao[]>()
  reunioes.forEach((reuniao) => {
    const dia = reuniao.datahoraReuniao.slice(0, 10)
    porDia.set(dia, [...(porDia.get(dia) ?? []), reuniao])
  })

  return (
    <Bloco titulo="Próximos dias" contagem={`${reunioes.length} agendadas`}>
      <div className="recepcao-corpo">
        {reunioes.length === 0 && <p>Nenhuma reunião agendada nos próximos 7 dias.</p>}
        {[...porDia.entries()].map(([dia, doDia]) => {
          const [ano, mes, numero] = dia.split('-').map(Number)
          const semana = DIAS_DA_SEMANA[new Date(ano, mes - 1, numero).getDay()]
          return (
            <div key={dia} className="recepcao-dia">
              <h4>
                {semana}, {dia.slice(8, 10)}/{dia.slice(5, 7)}
              </h4>
              {doDia.map((reuniao) => (
                <div
                  key={reuniao.id}
                  className="recepcao-dia__item"
                  role="link"
                  tabIndex={0}
                  title="Ver reunião"
                  onClick={() => irPara(`/reunioes?ver=${reuniao.id}`)}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter' || evento.key === ' ') {
                      evento.preventDefault()
                      irPara(`/reunioes?ver=${reuniao.id}`)
                    }
                  }}
                >
                  <span className="recepcao-dia__hora">{emHora(reuniao.datahoraReuniao)}</span>
                  <span>
                    {reuniao.titulo}
                    <SegundaLinha>
                      {[nomeDaSala(reuniao.sala), nomesDe(reuniao.anfitrioes)].filter(Boolean).join(' · ')}
                    </SegundaLinha>
                  </span>
                  <SituacaoDaReuniao valor={reuniao.status} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </Bloco>
  )
}

// O dia de um lembrete de outro dia: "25/11", em vermelho quando já passou.
function DiaDoLembrete({ lembrete }: { lembrete: Lembrete }) {
  const atrasado = lembrete.dia < hojeNaApi()
  return (
    <span className={`recepcao-lembretes__dia${atrasado ? ' recepcao-lembretes__dia--atrasado' : ''}`}>
      {lembrete.dia.slice(8, 10)}/{lembrete.dia.slice(5, 7)}
    </span>
  )
}

// Só os lembretes por fazer; os feitos ficam na tela de Lembretes (opção D escolhida em 2026-11-24).
// Os de hoje em cima, em quadros com a hora grande, como os cartões de reunião;
// os atrasados e os dos próximos dias embaixo, numa lista curta com a data.
function BlocoDeLembretes({ lembretes }: { lembretes: Lembrete[] }) {
  const hoje = hojeNaApi()
  const deHoje = lembretes.filter((lembrete) => lembrete.dia === hoje)
  const outros = lembretes.filter((lembrete) => lembrete.dia !== hoje)
  const contagem = [
    deHoje.length === 1 ? '1 hoje' : `${deHoje.length} hoje`,
    outros.length === 1 ? '1 outro' : `${outros.length} outros`,
  ].join(' · ')

  return (
    <Bloco titulo="Lembretes" contagem={contagem}>
      {lembretes.length === 0 && (
        <div className="recepcao-corpo">
          <p>Nenhum lembrete pendente.</p>
        </div>
      )}
      {deHoje.length > 0 && (
        <div className="recepcao-lembretes__hoje">
          {deHoje.map((lembrete) => {
            const hora = horaDo(lembrete)
            return (
              <button
                key={lembrete.id}
                type="button"
                className="recepcao-lembretes__cartao"
                title="Ver lembretes"
                onClick={() => irPara('/lembretes')}
              >
                <span className={hora ? 'recepcao-lembretes__hora' : 'recepcao-lembretes__hora recepcao-lembretes__hora--dia'}>
                  {hora ?? 'Dia todo'}
                </span>
                <span>
                  {lembrete.descricao}
                  {lembrete.paraQuem && <SegundaLinha>Para {lembrete.paraQuem}</SegundaLinha>}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {outros.length > 0 && (
        <>
          <div className="recepcao-lembretes__rotulo">{deHoje.length > 0 ? 'Outros dias' : 'Próximos e atrasados'}</div>
          {outros.map((lembrete) => (
            <button
              key={lembrete.id}
              type="button"
              className="recepcao-lembretes__linha"
              title="Ver lembretes"
              onClick={() => irPara('/lembretes')}
            >
              <DiaDoLembrete lembrete={lembrete} />
              <span>
                {lembrete.descricao}
                {lembrete.paraQuem && <SegundaLinha>Para {lembrete.paraQuem}</SegundaLinha>}
              </span>
              <SituacaoDoLembrete lembrete={lembrete} />
            </button>
          ))}
        </>
      )}
    </Bloco>
  )
}

export function Inicio() {
  const [reunioes, setReunioes] = useState<Reuniao[]>()
  const [lembretes, setLembretes] = useState<Lembrete[]>()
  const [falha, setFalha] = useState<string>()
  const agora = useAgora()

  useEffect(() => {
    api
      .ler<Reuniao[]>('/reunioes')
      .then(setReunioes)
      .catch((erro) => setFalha(mensagemDe(erro)))
    api
      .ler<Lembrete[]>('/api/lembretes')
      .then(setLembretes)
      .catch(() => setLembretes([]))
  }, [])

  if (falha) {
    return (
      <InlineNotification kind="error" title="Não foi possível carregar as reuniões." subtitle={falha} hideCloseButton />
    )
  }

  const naoCanceladas = (reunioes ?? []).filter((reuniao) => reuniao.status !== 'CANCELADA')
  const deHoje = naoCanceladas.filter(ehHoje).sort(porHorario)
  const amanha = daquiA(1)
  const semana = daquiA(7)
  const proximas = naoCanceladas
    .filter((reuniao) => {
      const dia = reuniao.datahoraReuniao.slice(0, 10)
      return dia >= amanha && dia <= semana
    })
    .sort(porHorario)
  const agendadas = naoCanceladas.filter(
    (reuniao) => reuniao.status === 'AGENDADA' && reuniao.datahoraReuniao.slice(0, 10) >= hojeNaApi(),
  )
  const lembretesDeHoje = (lembretes ?? []).filter(paraHoje)
  const lembretesPendentes = (lembretes ?? []).filter((lembrete) => !lembrete.feito).sort(naOrdem)

  // No mosaico e nos próximos dias só entram as que ainda vão acontecer: sem canceladas nem realizadas.
  const [proxima, ...outrasDeHoje] = deHoje.filter(
    (reuniao) => reuniao.status === 'AGENDADA' && new Date(reuniao.datahoraReuniao) >= agora,
  )
  const agendadasProximas = proximas.filter((reuniao) => reuniao.status === 'AGENDADA')

  return (
    <Stack gap={5} className="recepcao-inicio">
      <FaixaDeNumeros
        itens={[
          { valor: reunioes ? emNumero(deHoje.length) : VAZIO, rotulo: 'hoje' },
          { valor: reunioes ? emNumero(proximas.length) : VAZIO, rotulo: 'nos próximos 7 dias' },
          { valor: reunioes ? emNumero(agendadas.length) : VAZIO, rotulo: 'agendadas' },
          { valor: lembretes ? emNumero(lembretesDeHoje.length) : VAZIO, rotulo: 'lembretes para hoje' },
        ]}
      />

      {!reunioes || !lembretes ? (
        <DataTableSkeleton columnCount={COLUNAS} rowCount={3} showHeader={false} showToolbar={false} />
      ) : (
        <>
          <Mosaico proxima={proxima} outras={outrasDeHoje} agora={agora} />
          <div className="recepcao-meio-a-meio">
            <ProximosDias reunioes={agendadasProximas} />
            <BlocoDeLembretes lembretes={lembretesPendentes} />
          </div>
        </>
      )}
    </Stack>
  )
}
