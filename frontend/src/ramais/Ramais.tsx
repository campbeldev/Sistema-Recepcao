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
import { CampoDeBusca, Codigo, Confirmacao, Etiqueta, FiltroDaTabela, SegundaLinha, combinaComBusca } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { VAZIO } from '../comum/formato'
import { LinkDoWhatsapp } from '../contatos/LinkDoWhatsapp'
import { CadastroDePessoa } from './CadastroDePessoa'
import { DesativacaoDePessoa } from './DesativacaoDePessoa'
import { emAniversario, fazHoje, porNome, type Pessoa } from './tipos'

const COLUNAS = 8

export function Ramais() {
  const [pessoas, setPessoas] = useState<Pessoa[]>()
  const [falha, setFalha] = useState<string>()
  const [busca, setBusca] = useState('')
  const [setor, setSetor] = useState('')
  const [cadastrando, setCadastrando] = useState(false)
  const [alterando, setAlterando] = useState<Pessoa | null>(null)
  const [desativando, setDesativando] = useState<Pessoa | null>(null)
  const [aviso, setAviso] = useState<string>()

  const carregar = useCallback(() => {
    api
      .ler<Pessoa[]>('/api/pessoas')
      .then((lidas) => {
        setPessoas([...lidas].sort(porNome))
        setFalha(undefined)
      })
      .catch((erro) => setFalha(mensagemDe(erro)))
  }, [])

  useEffect(carregar, [carregar])

  function gravada(_pessoa: Pessoa, nova: boolean) {
    setCadastrando(false)
    setAlterando(null)
    setAviso(nova ? 'Pessoa cadastrada.' : 'Pessoa alterada.')
    carregar()
  }

  function desativada() {
    setDesativando(null)
    setAviso('Pessoa desativada.')
    carregar()
  }

  if (falha) {
    return <InlineNotification kind="error" title="Não foi possível carregar os ramais." subtitle={falha} hideCloseButton />
  }

  // Os setores saem do próprio cadastro: o filtro e a janela mostram os que já existem.
  const setores = [...new Set((pessoas ?? []).map((pessoa) => pessoa.setor))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const encontradas = (pessoas ?? []).filter(
    (pessoa) =>
      (!setor || pessoa.setor === setor) &&
      combinaComBusca(
        busca,
        pessoa.nome,
        pessoa.setor,
        pessoa.cargo ?? '',
        pessoa.ramal ?? '',
        pessoa.email ?? '',
        pessoa.celular ?? '',
      ),
  )

  return (
    <Stack gap={5}>
      {aviso && <Confirmacao texto={aviso} aoFechar={() => setAviso(undefined)} />}

      {!pessoas ? (
        <DataTableSkeleton columnCount={COLUNAS} showHeader={false} showToolbar={false} />
      ) : (
        <TableContainer>
          <TableToolbar>
            <TableToolbarContent>
              <CampoDeBusca texto="Buscar por nome, setor, ramal ou e-mail" aoBuscar={setBusca} />
              <FiltroDaTabela
                id="filtro-setor"
                titulo="Setor"
                opcoes={[{ valor: '', nome: 'Todos' }, ...setores.map((nome) => ({ valor: nome, nome }))]}
                valor={setor}
                aoEscolher={setSetor}
              />
              <Button renderIcon={Add} onClick={() => setCadastrando(true)}>
                Cadastrar pessoa
              </Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Nome</TableHeader>
                <TableHeader className="campbel-so-no-computador">Setor</TableHeader>
                <TableHeader className="campbel-so-no-computador">Cargo</TableHeader>
                <TableHeader>Ramal</TableHeader>
                <TableHeader className="campbel-so-no-computador">E-mail</TableHeader>
                <TableHeader className="campbel-so-no-computador">Celular</TableHeader>
                <TableHeader className="campbel-so-no-computador">Aniversário</TableHeader>
                <TableHeader aria-label="Ações" />
              </TableRow>
            </TableHead>
            <TableBody>
              {encontradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLUNAS}>
                    {busca || setor ? 'Nenhuma pessoa encontrada nessa busca.' : 'Nenhuma pessoa cadastrada.'}
                  </TableCell>
                </TableRow>
              )}
              {encontradas.map((pessoa) => (
                <TableRow key={pessoa.id}>
                  <TableCell>
                    {pessoa.nome}
                    <SegundaLinha>{[pessoa.setor, pessoa.celular].filter(Boolean).join(' · ')}</SegundaLinha>
                  </TableCell>
                  <TableCell className="campbel-so-no-computador">
                    <Etiqueta>{pessoa.setor}</Etiqueta>
                  </TableCell>
                  <TableCell className="campbel-so-no-computador">{pessoa.cargo ?? VAZIO}</TableCell>
                  <TableCell>{pessoa.ramal ? <Codigo>{pessoa.ramal}</Codigo> : VAZIO}</TableCell>
                  <TableCell className="campbel-so-no-computador">{pessoa.email ?? VAZIO}</TableCell>
                  <TableCell className="campbel-so-no-computador">
                    {pessoa.celular ? <LinkDoWhatsapp numero={pessoa.celular} /> : VAZIO}
                  </TableCell>
                  <TableCell className="campbel-so-no-computador">
                    {fazHoje(pessoa) ? <Etiqueta>Hoje</Etiqueta> : emAniversario(pessoa)}
                    {!pessoa.mostrarAniversario && pessoa.diaAniversario && ' · não divulgado'}
                  </TableCell>
                  <TableCell className="cds--table-column-menu">
                    <OverflowMenu aria-label={`Ações de ${pessoa.nome}`} flipped size="sm">
                      <OverflowMenuItem itemText="Alterar" onClick={() => setAlterando(pessoa)} />
                      <OverflowMenuItem itemText="Desativar" onClick={() => setDesativando(pessoa)} />
                    </OverflowMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CadastroDePessoa
        aberto={cadastrando || alterando !== null}
        pessoa={alterando}
        setores={setores}
        aoFechar={() => {
          setCadastrando(false)
          setAlterando(null)
        }}
        aoGravar={gravada}
      />
      <DesativacaoDePessoa pessoa={desativando} aoFechar={() => setDesativando(null)} aoDesativar={desativada} />
    </Stack>
  )
}
