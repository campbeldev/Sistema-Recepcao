import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  DataTableSkeleton,
  InlineNotification,
  OverflowMenu,
  OverflowMenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
} from '@carbon/react'
import { Add } from '@carbon/icons-react'
import { CampoDeBusca, Confirmacao, FiltroDaTabela, LinhaQueAbre, SegundaLinha, combinaComBusca } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { irPara, parametro } from '../comum/endereco'
import { VAZIO, emMomento, hojeNaApi } from '../comum/formato'
import type { Contato } from '../contatos/tipos'
import { CadastroDeReuniao } from './CadastroDeReuniao'
import { CancelamentoDaReuniao } from './CancelamentoDaReuniao'
import { ConsultaDaReuniao } from './ConsultaDaReuniao'
import { ReagendamentoDaReuniao } from './ReagendamentoDaReuniao'
import { SituacaoDaReuniao } from './SituacaoDaReuniao'
import { NOMES_DA_SITUACAO, ehHoje, nomeDaSala, nomesDe, type Reuniao, type StatusReuniao } from './tipos'

const COLUNAS = 6

const PERIODOS = [
  { valor: '', nome: 'Todas' },
  { valor: 'hoje', nome: 'Hoje' },
  { valor: 'semana', nome: 'Nesta semana' },
  { valor: 'proximas', nome: 'Daqui para a frente' },
]

const SITUACOES = [
  { valor: '', nome: 'Todas' },
  ...(Object.keys(NOMES_DA_SITUACAO) as StatusReuniao[]).map((valor) => ({ valor, nome: NOMES_DA_SITUACAO[valor] })),
]

// De domingo a sábado da semana de hoje, como texto "aaaa-mm-dd" para comparar com a API.
function semanaAtual(): [string, string] {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay())
  const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6)
  const texto = (data: Date) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
  return [texto(inicio), texto(fim)]
}

function noPeriodo(reuniao: Reuniao, periodo: string): boolean {
  const dia = reuniao.datahoraReuniao.slice(0, 10)
  if (periodo === 'hoje') return ehHoje(reuniao)
  if (periodo === 'semana') {
    const [inicio, fim] = semanaAtual()
    return dia >= inicio && dia <= fim
  }
  if (periodo === 'proximas') return dia >= hojeNaApi()
  return true
}

// As próximas primeiro, na ordem em que acontecem; depois as passadas, da mais recente para a mais antiga.
function naOrdemDaAgenda(a: Reuniao, b: Reuniao): number {
  const hoje = hojeNaApi()
  const aVem = a.datahoraReuniao.slice(0, 10) >= hoje
  const bVem = b.datahoraReuniao.slice(0, 10) >= hoje
  if (aVem !== bVem) return aVem ? -1 : 1
  return aVem ? a.datahoraReuniao.localeCompare(b.datahoraReuniao) : b.datahoraReuniao.localeCompare(a.datahoraReuniao)
}

export function Reunioes() {
  const [reunioes, setReunioes] = useState<Reuniao[]>()
  const [falha, setFalha] = useState<string>()
  const [busca, setBusca] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [situacao, setSituacao] = useState('')
  const [agendando, setAgendando] = useState(parametro('agendar') !== null)
  const [participante, setParticipante] = useState<Contato | null>(null)
  const [alterando, setAlterando] = useState<Reuniao | null>(null)
  const [vendo, setVendo] = useState<Reuniao | null>(null)
  const [cancelando, setCancelando] = useState<Reuniao | null>(null)
  const [reagendando, setReagendando] = useState<Reuniao | null>(null)
  const [aviso, setAviso] = useState<string>()

  const carregar = useCallback(() => {
    api
      .ler<Reuniao[]>('/reunioes')
      .then((lidas) => {
        setReunioes(lidas)
        setFalha(undefined)
      })
      .catch((erro) => setFalha(mensagemDe(erro)))
  }, [])

  useEffect(() => {
    carregar()
    // Vindo do sino ou do e-mail (#/reunioes?ver=12), a reunião já abre na consulta.
    const ver = parametro('ver')
    if (ver) {
      api.ler<Reuniao>(`/reunioes/${ver}`).then(setVendo).catch(() => undefined)
    }
    // Vindo de Contatos (#/reunioes?agendar&contato=3), o contato já entra como participante.
    const contato = parametro('contato')
    if (contato) {
      api.ler<Contato>(`/contatos/${contato}`).then(setParticipante).catch(() => undefined)
    }
  }, [carregar])

  function fecharCadastro() {
    setAgendando(false)
    setAlterando(null)
    setParticipante(null)
    if (parametro('agendar') !== null) irPara('/reunioes')
  }

  function gravada(reuniao: Reuniao, nova: boolean) {
    fecharCadastro()
    setAviso(nova ? 'Reunião agendada.' : 'Reunião alterada.')
    if (vendo) setVendo(reuniao)
    carregar()
  }

  function cancelada(reuniao: Reuniao) {
    setCancelando(null)
    if (vendo) setVendo(reuniao)
    setAviso('Reunião cancelada.')
    carregar()
  }

  function reagendada(reuniao: Reuniao) {
    setReagendando(null)
    if (vendo) setVendo(reuniao)
    setAviso('Reunião agendada de novo.')
    carregar()
  }

  if (falha) {
    return (
      <InlineNotification kind="error" title="Não foi possível carregar as reuniões." subtitle={falha} hideCloseButton />
    )
  }

  const encontradas = (reunioes ?? [])
    .filter(
      (reuniao) =>
        noPeriodo(reuniao, periodo) &&
        (!situacao || reuniao.status === situacao) &&
        combinaComBusca(
          busca,
          emMomento(reuniao.datahoraReuniao),
          reuniao.titulo,
          nomeDaSala(reuniao.sala),
          reuniao.empresaReuniao ?? '',
          nomesDe(reuniao.anfitrioes),
          nomesDe(reuniao.participantes),
          NOMES_DA_SITUACAO[reuniao.status],
        ),
    )
    .sort(naOrdemDaAgenda)

  return (
    <Stack gap={5}>
      {aviso && <Confirmacao texto={aviso} aoFechar={() => setAviso(undefined)} />}

      {!reunioes ? (
        <DataTableSkeleton columnCount={COLUNAS} showHeader={false} showToolbar={false} />
      ) : (
        <TableContainer>
          <TableToolbar>
            <TableToolbarContent>
              <CampoDeBusca texto="Buscar por título, sala, empresa ou pessoa" aoBuscar={setBusca} />
              <FiltroDaTabela id="filtro-periodo" titulo="Período" opcoes={PERIODOS} valor={periodo} aoEscolher={setPeriodo} />
              <FiltroDaTabela
                id="filtro-situacao"
                titulo="Situação"
                opcoes={SITUACOES}
                valor={situacao}
                aoEscolher={setSituacao}
              />
              <Button renderIcon={Add} onClick={() => setAgendando(true)}>
                Agendar reunião
              </Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Quando</TableHeader>
                <TableHeader>Título</TableHeader>
                <TableHeader className="campbel-so-no-computador">Sala</TableHeader>
                <TableHeader className="campbel-so-no-computador">Anfitrião</TableHeader>
                <TableHeader>Situação</TableHeader>
                <TableHeader aria-label="Ações" />
              </TableRow>
            </TableHead>
            <TableBody>
              {encontradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLUNAS}>
                    {busca || periodo || situacao ? 'Nenhuma reunião encontrada nessa busca.' : 'Nenhuma reunião agendada.'}
                  </TableCell>
                </TableRow>
              )}
              {encontradas.map((reuniao) => (
                <LinhaQueAbre key={reuniao.id} aoAbrir={() => setVendo(reuniao)}>
                  <TableCell className="campbel-sem-quebra">{emMomento(reuniao.datahoraReuniao)}</TableCell>
                  <TableCell>
                    {reuniao.titulo}
                    <SegundaLinha>
                      {[nomeDaSala(reuniao.sala), nomesDe(reuniao.anfitrioes)].filter(Boolean).join(' · ')}
                    </SegundaLinha>
                  </TableCell>
                  <TableCell className="campbel-so-no-computador">{nomeDaSala(reuniao.sala)}</TableCell>
                  <TableCell className="campbel-so-no-computador">{nomesDe(reuniao.anfitrioes) || VAZIO}</TableCell>
                  <TableCell>
                    <SituacaoDaReuniao valor={reuniao.status} />
                  </TableCell>
                  <TableCell
                    className="cds--table-column-menu"
                    onClick={(evento) => evento.stopPropagation()}
                    onKeyDown={(evento) => evento.stopPropagation()}
                  >
                    {reuniao.status === 'AGENDADA' && (
                      <OverflowMenu aria-label={`Ações de ${reuniao.titulo}`} flipped size="sm">
                        <OverflowMenuItem itemText="Alterar" onClick={() => setAlterando(reuniao)} />
                        <OverflowMenuItem itemText="Cancelar reunião" onClick={() => setCancelando(reuniao)} />
                      </OverflowMenu>
                    )}
                    {reuniao.status === 'CANCELADA' && (
                      <OverflowMenu aria-label={`Ações de ${reuniao.titulo}`} flipped size="sm">
                        <OverflowMenuItem itemText="Voltar a agendar" onClick={() => setReagendando(reuniao)} />
                      </OverflowMenu>
                    )}
                  </TableCell>
                </LinhaQueAbre>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CadastroDeReuniao
        aberto={agendando || alterando !== null}
        reuniao={alterando}
        participante={participante}
        aoFechar={fecharCadastro}
        aoGravar={gravada}
      />
      <ConsultaDaReuniao
        reuniao={alterando || cancelando || reagendando ? null : vendo}
        aoFechar={() => setVendo(null)}
        aoAlterar={setAlterando}
        aoCancelar={setCancelando}
        aoReagendar={setReagendando}
      />
      <CancelamentoDaReuniao reuniao={cancelando} aoFechar={() => setCancelando(null)} aoCancelar={cancelada} />
      <ReagendamentoDaReuniao reuniao={reagendando} aoFechar={() => setReagendando(null)} aoReagendar={reagendada} />
    </Stack>
  )
}
