import { useEffect, useState } from 'react'
import {
  DataTableSkeleton,
  InlineNotification,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tile,
} from '@carbon/react'
import type { ReactNode } from 'react'
import { Etiqueta, LinhaQueAbre, SegundaLinha } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { irPara } from '../comum/endereco'
import { VAZIO, emHora, emNumero, hojeNaApi } from '../comum/formato'
import { CartaoDaReuniao } from '../reunioes/CartaoDaReuniao'
import { SituacaoDaReuniao } from '../reunioes/SituacaoDaReuniao'
import { ehHoje, nomeDaSala, nomesDe, porHorario, type Reuniao } from '../reunioes/tipos'
import { SituacaoDoLembrete } from '../lembretes/SituacaoDoLembrete'
import { naOrdem, paraHoje, quandoDo, type Lembrete } from '../lembretes/tipos'
import {
  JANELA_DE_ANIVERSARIOS,
  aniversariantes,
  ondeEncontrar,
  quandoFaz,
  type Aniversariante,
  type Pessoa,
} from '../ramais/tipos'
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

// Só os lembretes por fazer (atrasados, de hoje e dos próximos dias); os feitos ficam na tela de Lembretes.
function TabelaDeLembretes({ lembretes }: { lembretes: Lembrete[] }) {
  const porFazer = lembretes.length
  return (
    <Bloco titulo="Lembretes" contagem={porFazer === 1 ? '1 por fazer' : `${porFazer} por fazer`}>
      <Table>
        <TableBody>
          {lembretes.length === 0 && (
            <TableRow>
              <TableCell colSpan={2}>Nenhum lembrete pendente.</TableCell>
            </TableRow>
          )}
          {lembretes.map((lembrete) => (
            <LinhaQueAbre key={lembrete.id} aoAbrir={() => irPara('/lembretes')}>
              <TableCell>
                {lembrete.descricao}
                <SegundaLinha>
                  {quandoDo(lembrete)}
                  {lembrete.paraQuem && ` · Para ${lembrete.paraQuem}`}
                </SegundaLinha>
              </TableCell>
              <TableCell>
                <SituacaoDoLembrete lembrete={lembrete} />
              </TableCell>
            </LinhaQueAbre>
          ))}
        </TableBody>
      </Table>
    </Bloco>
  )
}

// Quem faz aniversário hoje e nos próximos dias; quem pediu para não divulgar fica de fora.
function Aniversariantes({ itens }: { itens: Aniversariante[] }) {
  const quantos = itens.length
  return (
    <Bloco titulo="Aniversariantes" contagem={`${quantos} nos próximos ${JANELA_DE_ANIVERSARIOS} dias`}>
      <Table>
        <TableBody>
          {quantos === 0 && (
            <TableRow>
              <TableCell colSpan={2}>Nenhum aniversário nos próximos {JANELA_DE_ANIVERSARIOS} dias.</TableCell>
            </TableRow>
          )}
          {itens.map((item) => (
            <LinhaQueAbre key={item.pessoa.id} aoAbrir={() => irPara('/ramais')}>
              <TableCell>
                {item.pessoa.nome}
                <SegundaLinha>{ondeEncontrar(item.pessoa)}</SegundaLinha>
              </TableCell>
              <TableCell>{item.faltam === 0 ? <Etiqueta>Hoje</Etiqueta> : quandoFaz(item)}</TableCell>
            </LinhaQueAbre>
          ))}
        </TableBody>
      </Table>
    </Bloco>
  )
}

export function Inicio() {
  const [reunioes, setReunioes] = useState<Reuniao[]>()
  const [lembretes, setLembretes] = useState<Lembrete[]>()
  const [pessoas, setPessoas] = useState<Pessoa[]>()
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
    api
      .ler<Pessoa[]>('/api/pessoas')
      .then(setPessoas)
      .catch(() => setPessoas([]))
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
    <Stack gap={5}>
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
          <div className="recepcao-meio-a-meio recepcao-meio-a-meio--tres">
            <ProximosDias reunioes={agendadasProximas} />
            <TabelaDeLembretes lembretes={lembretesPendentes} />
            <Aniversariantes itens={aniversariantes(pessoas ?? [], JANELA_DE_ANIVERSARIOS, agora)} />
          </div>
        </>
      )}
    </Stack>
  )
}
