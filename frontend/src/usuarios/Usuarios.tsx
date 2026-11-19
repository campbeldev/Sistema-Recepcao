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
import { CampoDeBusca, Codigo, Confirmacao, Etiqueta, SegundaLinha, Situacao, combinaComBusca } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { VAZIO } from '../comum/formato'
import { CadastroDeUsuario } from './CadastroDeUsuario'
import { PERFIS, type Usuario } from './tipos'

const COLUNAS = 6

// Ninguém é excluído: a conta sai de uso ao ser desativada, e a pessoa deixa de conseguir entrar.
export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>()
  const [falha, setFalha] = useState<string>()
  const [recusa, setRecusa] = useState<string>()
  const [busca, setBusca] = useState('')
  const [cadastrando, setCadastrando] = useState(false)
  const [alterando, setAlterando] = useState<Usuario | null>(null)
  const [aviso, setAviso] = useState<string>()

  const carregar = useCallback(() => {
    api
      .ler<Usuario[]>('/api/usuarios')
      .then((lidos) => {
        setUsuarios(lidos)
        setFalha(undefined)
      })
      .catch((erro) => setFalha(mensagemDe(erro)))
  }, [])

  useEffect(carregar, [carregar])

  function gravado(_usuario: Usuario, novo: boolean) {
    setCadastrando(false)
    setAlterando(null)
    setAviso(novo ? 'Usuário cadastrado.' : 'Usuário alterado.')
    carregar()
  }

  async function mudarSituacao(usuario: Usuario) {
    setRecusa(undefined)
    try {
      await api.gravar(`/api/usuarios/${usuario.id}/${usuario.ativo ? 'desativar' : 'ativar'}`)
      setAviso(usuario.ativo ? 'Usuário desativado.' : 'Usuário ativado.')
      carregar()
    } catch (erro) {
      setRecusa(mensagemDe(erro))
    }
  }

  if (falha) {
    return (
      <InlineNotification kind="error" title="Não foi possível carregar os usuários." subtitle={falha} hideCloseButton />
    )
  }

  const encontrados = (usuarios ?? []).filter((usuario) =>
    combinaComBusca(
      busca,
      usuario.nome,
      usuario.username,
      usuario.email ?? '',
      PERFIS[usuario.perfil],
      usuario.ativo ? 'Ativo' : 'Inativo',
    ),
  )

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

      {!usuarios ? (
        <DataTableSkeleton columnCount={COLUNAS} showHeader={false} showToolbar={false} />
      ) : (
        <TableContainer>
          <TableToolbar>
            <TableToolbarContent>
              <CampoDeBusca texto="Buscar por nome, login, e-mail ou perfil" aoBuscar={setBusca} />
              <Button renderIcon={Add} onClick={() => setCadastrando(true)}>
                Cadastrar usuário
              </Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Nome</TableHeader>
                <TableHeader className="campbel-so-no-computador">Login</TableHeader>
                <TableHeader className="campbel-so-no-computador">E-mail</TableHeader>
                <TableHeader className="campbel-so-no-computador">Perfil</TableHeader>
                <TableHeader>Situação</TableHeader>
                <TableHeader aria-label="Ações" />
              </TableRow>
            </TableHead>
            <TableBody>
              {encontrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLUNAS}>
                    {busca ? 'Nenhum usuário encontrado nessa busca.' : 'Nenhum usuário cadastrado.'}
                  </TableCell>
                </TableRow>
              )}
              {encontrados.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    {usuario.nome}
                    <SegundaLinha>
                      {usuario.username} · {PERFIS[usuario.perfil]}
                    </SegundaLinha>
                  </TableCell>
                  <TableCell className="campbel-so-no-computador">
                    <Codigo>{usuario.username}</Codigo>
                  </TableCell>
                  <TableCell className="campbel-so-no-computador">{usuario.email ?? VAZIO}</TableCell>
                  <TableCell className="campbel-so-no-computador">
                    <Etiqueta>{PERFIS[usuario.perfil]}</Etiqueta>
                  </TableCell>
                  <TableCell>
                    <Situacao valor={usuario.ativo ? 'ativo' : 'inativo'} />
                  </TableCell>
                  <TableCell className="cds--table-column-menu">
                    <OverflowMenu aria-label={`Ações de ${usuario.nome}`} flipped size="sm">
                      <OverflowMenuItem itemText="Alterar" onClick={() => setAlterando(usuario)} />
                      <OverflowMenuItem
                        itemText={usuario.ativo ? 'Desativar' : 'Ativar'}
                        onClick={() => mudarSituacao(usuario)}
                      />
                    </OverflowMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CadastroDeUsuario
        aberto={cadastrando || alterando !== null}
        usuario={alterando}
        aoFechar={() => {
          setCadastrando(false)
          setAlterando(null)
        }}
        aoGravar={gravado}
      />
    </Stack>
  )
}
