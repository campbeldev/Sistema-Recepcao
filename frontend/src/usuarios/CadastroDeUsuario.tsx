import { useEffect, useState, type FormEvent } from 'react'
import {
  Button,
  Column,
  Form,
  Grid,
  InlineNotification,
  Modal,
  PasswordInput,
  RadioButton,
  RadioButtonGroup,
  Stack,
  TextInput,
} from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, camposDe, mensagemDe } from '../comum/api'
import type { Perfil } from '../comum/sessao'
import { PERFIS, type Usuario } from './tipos'

type Props = {
  aberto: boolean
  usuario?: Usuario | null
  aoFechar: () => void
  aoGravar: (usuario: Usuario, novo: boolean) => void
}

type Valores = { nome: string; email: string; username: string; senha: string; perfil: Perfil }

const VAZIO: Valores = { nome: '', email: '', username: '', senha: '', perfil: 'RECEPCIONISTA' }

export function CadastroDeUsuario({ aberto, usuario, aoFechar, aoGravar }: Props) {
  const alterando = Boolean(usuario)
  const [valores, setValores] = useState<Valores>(VAZIO)
  const [recusa, setRecusa] = useState<string>()
  const [recusados, setRecusados] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setValores(
      usuario
        ? { nome: usuario.nome, email: usuario.email ?? '', username: usuario.username, senha: '', perfil: usuario.perfil }
        : VAZIO,
    )
    setRecusa(undefined)
    setRecusados({})
  }, [aberto, usuario])

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
    setRecusados((antes) => ({ ...antes, [campo]: '' }))
  }

  function faltando(): Record<string, string> {
    const falta: Record<string, string> = {}
    if (!valores.nome.trim()) falta.nome = 'Informe o nome.'
    if (!alterando && !valores.username.trim()) falta.username = 'Informe o login.'
    if ((!alterando || valores.senha) && valores.senha.length < 8) falta.senha = 'A senha precisa ter pelo menos 8 caracteres.'
    return falta
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const falta = faltando()
    if (Object.keys(falta).length > 0) {
      setRecusados(falta)
      return
    }
    setEnviando(true)
    setRecusa(undefined)
    const corpo = {
      nome: valores.nome.trim(),
      email: valores.email.trim() || null,
      username: valores.username.trim(),
      senha: valores.senha || null,
      perfil: valores.perfil,
    }
    try {
      const gravado = usuario
        ? await api.alterar<Usuario>(`/api/usuarios/${usuario.id}`, corpo)
        : await api.gravar<Usuario>('/api/usuarios', corpo)
      aoGravar(gravado, !usuario)
    } catch (erro) {
      setRecusa(mensagemDe(erro))
      setRecusados(camposDe(erro))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open={aberto}
      onRequestClose={aoFechar}
      modalLabel={usuario ? `Login ${usuario.username}` : undefined}
      modalHeading={usuario ? `Alterar ${usuario.nome}` : 'Cadastrar usuário'}
      closeButtonLabel="Fechar"
      passiveModal
      size="md"
    >
      <Form autoComplete="off" onSubmit={enviar}>
        <Stack gap={5}>
          {recusa && (
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <InlineNotification
                  kind="error"
                  title={alterando ? 'A alteração foi recusada.' : 'O cadastro foi recusado.'}
                  subtitle={recusa}
                  hideCloseButton
                />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <TextInput
                id="usuario-nome"
                data-modal-primary-focus
                labelText="Nome"
                maxLength={120}
                value={valores.nome}
                onChange={(evento) => mudar('nome', evento.target.value)}
                invalid={Boolean(recusados.nome)}
                invalidText={recusados.nome}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <TextInput
                id="usuario-email"
                type="email"
                labelText="E-mail (opcional)"
                maxLength={120}
                value={valores.email}
                onChange={(evento) => mudar('email', evento.target.value)}
                invalid={Boolean(recusados.email)}
                invalidText={recusados.email}
              />
            </Column>
          </Grid>
          <Grid>
            {!alterando && (
              <Column sm={4} md={4} lg={8}>
                <TextInput
                  id="usuario-login"
                  labelText="Login"
                  helperText="É o que a pessoa digita para entrar. Não muda depois."
                  maxLength={60}
                  value={valores.username}
                  onChange={(evento) => mudar('username', evento.target.value)}
                  invalid={Boolean(recusados.username)}
                  invalidText={recusados.username}
                />
              </Column>
            )}
            <Column sm={4} md={4} lg={8}>
              <PasswordInput
                id="usuario-senha"
                labelText={alterando ? 'Nova senha (opcional)' : 'Senha'}
                helperText={alterando ? 'Em branco, a senha atual continua valendo.' : 'Pelo menos 8 caracteres.'}
                showPasswordLabel="Mostrar a senha"
                hidePasswordLabel="Esconder a senha"
                autoComplete="new-password"
                value={valores.senha}
                onChange={(evento) => mudar('senha', evento.target.value)}
                invalid={Boolean(recusados.senha)}
                invalidText={recusados.senha}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <RadioButtonGroup
                legendText="Perfil"
                name="usuario-perfil"
                valueSelected={valores.perfil}
                onChange={(valor) => mudar('perfil', valor as Perfil)}
                helperText="O administrador também cuida dos usuários e pode excluir contatos."
              >
                {(Object.keys(PERFIS) as Perfil[]).map((perfil) => (
                  <RadioButton key={perfil} id={`perfil-${perfil}`} value={perfil} labelText={PERFIS[perfil]} />
                ))}
              </RadioButtonGroup>
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Acoes>
                <Button kind="secondary" size="md" onClick={aoFechar}>
                  Cancelar
                </Button>
                <Button type="submit" size="md" disabled={enviando}>
                  {alterando ? (enviando ? 'Salvando…' : 'Salvar') : enviando ? 'Cadastrando…' : 'Cadastrar'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
