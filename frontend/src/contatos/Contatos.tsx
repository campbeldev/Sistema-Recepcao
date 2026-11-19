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
import { CampoDeBusca, Confirmacao, LinhaQueAbre, SegundaLinha, combinaComBusca } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { irPara } from '../comum/endereco'
import { VAZIO } from '../comum/formato'
import { ehAdmin, useSessao } from '../comum/sessao'
import { CadastroDeContato } from './CadastroDeContato'
import { ConsultaDoContato } from './ConsultaDoContato'
import { ExclusaoDeContato } from './ExclusaoDeContato'
import { LinkDoWhatsapp } from './LinkDoWhatsapp'
import { porNome, type Contato } from './tipos'

const COLUNAS = 6

export function Contatos() {
  const sessao = useSessao()
  const [contatos, setContatos] = useState<Contato[]>()
  const [falha, setFalha] = useState<string>()
  const [busca, setBusca] = useState('')
  const [cadastrando, setCadastrando] = useState(false)
  const [alterando, setAlterando] = useState<Contato | null>(null)
  const [excluindo, setExcluindo] = useState<Contato | null>(null)
  const [vendo, setVendo] = useState<Contato | null>(null)
  const [aviso, setAviso] = useState<string>()

  const carregar = useCallback(() => {
    api
      .ler<Contato[]>('/contatos')
      .then((lidos) => {
        setContatos([...lidos].sort(porNome))
        setFalha(undefined)
      })
      .catch((erro) => setFalha(mensagemDe(erro)))
  }, [])

  useEffect(carregar, [carregar])

  function gravado(contato: Contato, novo: boolean) {
    setCadastrando(false)
    setAlterando(null)
    // Alterado a partir da janela do contato: ela volta já com os dados novos.
    if (vendo) setVendo(contato)
    setAviso(novo ? 'Contato cadastrado.' : 'Contato alterado.')
    carregar()
  }

  function excluido() {
    setExcluindo(null)
    setVendo(null)
    setAviso('Contato excluído.')
    carregar()
  }

  if (falha) {
    return (
      <InlineNotification kind="error" title="Não foi possível carregar os contatos." subtitle={falha} hideCloseButton />
    )
  }

  const encontrados = (contatos ?? []).filter((contato) =>
    combinaComBusca(
      busca,
      contato.nomeParticipante,
      contato.nomeEmpresa ?? '',
      contato.email ?? '',
      contato.telefone ?? '',
      contato.whatsapp ?? '',
    ),
  )

  return (
    <Stack gap={5}>
      {aviso && <Confirmacao texto={aviso} aoFechar={() => setAviso(undefined)} />}

      {!contatos ? (
        <DataTableSkeleton columnCount={COLUNAS} showHeader={false} showToolbar={false} />
      ) : (
        <TableContainer>
          <TableToolbar>
            <TableToolbarContent>
              <CampoDeBusca texto="Buscar por nome, empresa, e-mail ou telefone" aoBuscar={setBusca} />
              <Button renderIcon={Add} onClick={() => setCadastrando(true)}>
                Cadastrar contato
              </Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Nome</TableHeader>
                <TableHeader className="campbel-so-no-computador">Empresa</TableHeader>
                <TableHeader className="campbel-so-no-computador">E-mail</TableHeader>
                <TableHeader className="campbel-so-no-computador">Telefone</TableHeader>
                <TableHeader className="campbel-so-no-computador">WhatsApp</TableHeader>
                <TableHeader aria-label="Ações" />
              </TableRow>
            </TableHead>
            <TableBody>
              {encontrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLUNAS}>
                    {busca ? 'Nenhum contato encontrado nessa busca.' : 'Nenhum contato cadastrado.'}
                  </TableCell>
                </TableRow>
              )}
              {encontrados.map((contato) => (
                <LinhaQueAbre key={contato.id} aoAbrir={() => setVendo(contato)}>
                  <TableCell>
                    {contato.nomeParticipante}
                    <SegundaLinha>
                      {[contato.nomeEmpresa, contato.email, contato.telefone ?? contato.whatsapp].filter(Boolean).join(' · ') ||
                        VAZIO}
                    </SegundaLinha>
                  </TableCell>
                  <TableCell className="campbel-so-no-computador">{contato.nomeEmpresa ?? VAZIO}</TableCell>
                  <TableCell className="campbel-so-no-computador">{contato.email ?? VAZIO}</TableCell>
                  <TableCell className="campbel-so-no-computador">{contato.telefone ?? VAZIO}</TableCell>
                  <TableCell className="campbel-so-no-computador">
                    {contato.whatsapp ? <LinkDoWhatsapp numero={contato.whatsapp} /> : VAZIO}
                  </TableCell>
                  <TableCell
                    className="cds--table-column-menu"
                    onClick={(evento) => evento.stopPropagation()}
                    onKeyDown={(evento) => evento.stopPropagation()}
                  >
                    <OverflowMenu aria-label={`Ações de ${contato.nomeParticipante}`} flipped size="sm">
                      <OverflowMenuItem itemText="Alterar" onClick={() => setAlterando(contato)} />
                      <OverflowMenuItem
                        itemText="Agendar reunião"
                        onClick={() => irPara(`/reunioes?agendar&contato=${contato.id}`)}
                      />
                      {ehAdmin(sessao) && (
                        <OverflowMenuItem itemText="Excluir" onClick={() => setExcluindo(contato)} />
                      )}
                    </OverflowMenu>
                  </TableCell>
                </LinhaQueAbre>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CadastroDeContato
        aberto={cadastrando || alterando !== null}
        contato={alterando}
        aoFechar={() => {
          setCadastrando(false)
          setAlterando(null)
        }}
        aoGravar={gravado}
      />
      <ConsultaDoContato
        contato={cadastrando || alterando || excluindo ? null : vendo}
        podeExcluir={ehAdmin(sessao)}
        aoFechar={() => setVendo(null)}
        aoAlterar={setAlterando}
        aoAgendar={(contato) => irPara(`/reunioes?agendar&contato=${contato.id}`)}
        aoExcluir={setExcluindo}
      />
      <ExclusaoDeContato contato={excluindo} aoFechar={() => setExcluindo(null)} aoExcluir={excluido} />
    </Stack>
  )
}
