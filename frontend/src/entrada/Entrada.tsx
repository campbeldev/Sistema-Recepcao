import { useRef, useState, type FormEvent } from 'react'
import { Button, Form, InlineNotification, PasswordInput, Stack, TextInput } from '@carbon/react'
import type { Csrf } from '../comum/api'
import './Entrada.css'

// O símbolo da Campbel vem do kit, publicado junto com a plataforma.
const SIMBOLO = '/plataforma/campbel/campbel-simbolo.png'

type Props = { csrf: Csrf }

// O recado que a tela de entrada mostra, vindo do endereço: /login?erro, ?saiu ou ?expirada.
function recado() {
  const consulta = new URLSearchParams(window.location.search)
  if (consulta.has('erro')) {
    return {
      kind: 'error' as const,
      title: 'A entrada foi recusada.',
      subtitle: 'O login ou a senha não conferem, ou a conta está desativada.',
    }
  }
  if (consulta.has('expirada')) {
    return { kind: 'info' as const, title: 'A sessão expirou.', subtitle: 'Entre de novo para continuar.' }
  }
  if (consulta.has('saiu')) {
    return { kind: 'success' as const, title: 'Você saiu do sistema.', subtitle: '' }
  }
  return undefined
}

// A tela de entrada em metade preta (opção A escolhida em 2026-11-09): à esquerda o símbolo,
// o nome Recepção e o que o sistema faz; à direita o formulário.
// O formulário vai para o Spring Security (POST /login, por fetch: ver entrar), que leva ao início
// ou de volta para cá com ?erro.
// A entrada vai por fetch, sem recarregar a página: o Spring responde com o redirecionamento
// para /plataforma/ (entrou) ou para /login?erro (recusou), e o fetch segue e conta onde parou.
// Se o fetch falhar (rede), o formulário é enviado do jeito clássico.
export function Entrada({ csrf }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState(recado)
  // Muda a cada recusa, para a mensagem entrar de novo com a animação mesmo se já estava na tela.
  const [tentativa, setTentativa] = useState(0)
  const [senha, setSenha] = useState('')
  const campoSenha = useRef<HTMLInputElement>(null)

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const corpo = new URLSearchParams()
    new FormData(formulario).forEach((valor, nome) => corpo.append(nome, String(valor)))
    setEnviando(true)

    try {
      const resposta = await fetch('/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: corpo,
      })
      const destino = new URL(resposta.url, window.location.origin)
      if (destino.pathname === '/login' && destino.searchParams.has('erro')) {
        window.history.replaceState(null, '', '/login')
        setAviso({
          kind: 'error',
          title: 'A entrada foi recusada.',
          subtitle: 'O login ou a senha não conferem, ou a conta está desativada.',
        })
        setTentativa((n) => n + 1)
        setSenha('')
        setEnviando(false)
        campoSenha.current?.focus()
        return
      }
      window.location.assign(destino.href)
    } catch {
      formulario.submit()
    }
  }

  return (
    <div className="recepcao-entrada">
      <div className="recepcao-entrada__marca">
        <div>
          <img src={SIMBOLO} alt="Campbel" />
          <h1>Recepção</h1>
          <p>As reuniões nas salas, quem recebe, quem vem e os lembretes do dia.</p>
        </div>
        <span className="recepcao-entrada__faixa" aria-hidden="true" />
        <small>Plataforma Campbel</small>
      </div>

      <div className="recepcao-entrada__lado">
        <Form
          className="recepcao-entrada__formulario"
          method="post"
          action="/login"
          autoComplete="off"
          onSubmit={entrar}
        >
          <Stack gap={6}>
            <div>
              <h2>Entrar</h2>
              <p>Use o login e a senha que o administrador passou.</p>
            </div>
            {aviso && (
              <InlineNotification
                key={tentativa}
                className="recepcao-entrada__aviso"
                kind={aviso.kind}
                lowContrast
                title={aviso.title}
                subtitle={aviso.subtitle}
                hideCloseButton
              />
            )}
            <input type="hidden" name={csrf.parametro} value={csrf.token} />
            <TextInput id="login" name="username" labelText="Login" required autoFocus />
            <PasswordInput
              id="senha"
              name="password"
              labelText="Senha"
              ref={campoSenha}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              showPasswordLabel="Mostrar a senha"
              hidePasswordLabel="Esconder a senha"
              required
            />
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Entrando…' : 'Entrar'}
            </Button>
            <p className="recepcao-entrada__ajuda">Esqueceu a senha? Fale com o administrador.</p>
          </Stack>
        </Form>
      </div>
    </div>
  )
}
