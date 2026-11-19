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
import { VAZIO } from '../comum/formato'
import { CadastroDeLembrete } from './CadastroDeLembrete'
import { SituacaoDoLembrete } from './SituacaoDoLembrete'
import { estaAtrasado, naOrdem, nomeDaSituacao, quandoDo, type Lembrete } from './tipos'

const COLUNAS = 5

const SITUACOES = [
  { valor: '', nome: 'Todos' },
  { valor: 'pendentes', nome: 'Pendentes' },
  { valor: 'atrasados', nome: 'Atrasados' },
  { valor: 'feitos', nome: 'Feitos' },
]

function naSituacao(lembrete: Lembrete, situacao: string): boolean {
  if (situacao === 'pendentes') return !lembrete.feito
  if (situacao === 'atrasados') return estaAtrasado(lembrete)
  if (situacao === 'feitos') return lembrete.feito
  return true
}

// Ninguém é excluído: o lembrete sai da frente ao ser marcado como feito e pode ser reaberto.
export function Lembretes() {
  const [lembretes, setLembretes] = useState<Lembrete[]>()
  const [falha, setFalha] = useState<string>()
  const [recusa, setRecusa] = useState<string>()
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState('')
  const [anotando, setAnotando] = useState(false)
  const [alterando, setAlterando] = useState<Lembrete | null>(null)
  const [aviso, setAviso] = useState<string>()

  const carregar = useCallback(() => {
    api
      .ler<Lembrete[]>('/api/lembretes')
      .then((lidos) => {
        setLembretes(lidos)
        setFalha(undefined)
      })
      .catch((erro) => setFalha(mensagemDe(erro)))
  }, [])

  useEffect(carregar, [carregar])

  function gravado(_lembrete: Lembrete, novo: boolean) {
    setAnotando(false)
    setAlterando(null)
    setAviso(novo ? 'Lembrete anotado.' : 'Lembrete alterado.')
    carregar()
  }

  async function mudarSituacao(lembrete: Lembrete) {
    setRecusa(undefined)
    try {
      await api.gravar(`/api/lembretes/${lembrete.id}/${lembrete.feito ? 'reabrir' : 'concluir'}`)
      setAviso(lembrete.feito ? 'Lembrete reaberto.' : 'Lembrete marcado como feito.')
      carregar()
    } catch (erro) {
      setRecusa(mensagemDe(erro))
    }
  }

  if (falha) {
    return (
      <InlineNotification kind="error" title="Não foi possível carregar os lembretes." subtitle={falha} hideCloseButton />
    )
  }

  const encontrados = (lembretes ?? [])
    .filter(
      (lembrete) =>
        naSituacao(lembrete, situacao) &&
        combinaComBusca(busca, quandoDo(lembrete), lembrete.descricao, lembrete.paraQuem ?? '', nomeDaSituacao(lembrete)),
    )
    .sort(naOrdem)

  return (
    <Stack gap={5}>
      {aviso && <Confirmacao texto={aviso} aoFechar={() => setAviso(undefined)} />}
      {recusa && (
        <InlineNotification
          kind="error"
          title="A mudança foi recusada."
          subtitle={recusa}
          onCloseButtonClick={() => setRecusa(undefined)}
        />
      )}

      {!lembretes ? (
        <DataTableSkeleton columnCount={COLUNAS} showHeader={false} showToolbar={false} />
      ) : (
        <TableContainer>
          <TableToolbar>
            <TableToolbarContent>
              <CampoDeBusca texto="Buscar pelo que lembrar ou para quem" aoBuscar={setBusca} />
              <FiltroDaTabela
                id="filtro-situacao"
                titulo="Situação"
                opcoes={SITUACOES}
                valor={situacao}
                aoEscolher={setSituacao}
              />
              <Button renderIcon={Add} onClick={() => setAnotando(true)}>
                Anotar lembrete
              </Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Quando</TableHeader>
                <TableHeader>O que lembrar</TableHeader>
                <TableHeader className="campbel-so-no-computador">Para quem</TableHeader>
                <TableHeader>Situação</TableHeader>
                <TableHeader aria-label="Ações" />
              </TableRow>
            </TableHead>
            <TableBody>
              {encontrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLUNAS}>
                    {busca || situacao ? 'Nenhum lembrete encontrado nessa busca.' : 'Nenhum lembrete anotado.'}
                  </TableCell>
                </TableRow>
              )}
              {encontrados.map((lembrete) => (
                <LinhaQueAbre key={lembrete.id} aoAbrir={() => setAlterando(lembrete)}>
                  <TableCell className="campbel-sem-quebra">{quandoDo(lembrete)}</TableCell>
                  <TableCell>
                    {lembrete.descricao}
                    {lembrete.paraQuem && <SegundaLinha>Para {lembrete.paraQuem}</SegundaLinha>}
                  </TableCell>
                  <TableCell className="campbel-so-no-computador">{lembrete.paraQuem ?? VAZIO}</TableCell>
                  <TableCell>
                    <SituacaoDoLembrete lembrete={lembrete} />
                  </TableCell>
                  <TableCell
                    className="cds--table-column-menu"
                    onClick={(evento) => evento.stopPropagation()}
                    onKeyDown={(evento) => evento.stopPropagation()}
                  >
                    <OverflowMenu aria-label={`Ações do lembrete ${lembrete.descricao}`} flipped size="sm">
                      <OverflowMenuItem
                        itemText={lembrete.feito ? 'Reabrir' : 'Marcar como feito'}
                        onClick={() => mudarSituacao(lembrete)}
                      />
                      <OverflowMenuItem itemText="Alterar" onClick={() => setAlterando(lembrete)} />
                    </OverflowMenu>
                  </TableCell>
                </LinhaQueAbre>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CadastroDeLembrete
        aberto={anotando || alterando !== null}
        lembrete={alterando}
        aoFechar={() => {
          setAnotando(false)
          setAlterando(null)
        }}
        aoGravar={gravado}
      />
    </Stack>
  )
}
