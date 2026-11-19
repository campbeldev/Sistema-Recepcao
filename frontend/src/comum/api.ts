// Conversa com a API do Spring. Toda tela usa estas funções, e não o fetch direto,
// para que a sessão expirada leve ao login, o token CSRF vá junto em toda alteração
// e a recusa do servidor chegue com a mensagem dele.

export class Recusa extends Error {
  status: number
  campos: Record<string, string>

  constructor(mensagem: string, status: number, campos: Record<string, string> = {}) {
    super(mensagem)
    this.status = status
    this.campos = campos
  }
}

export type Csrf = { cabecalho: string; parametro: string; token: string }

// Vem de /api/sessao quando a Plataforma abre (ver Plataforma.tsx).
let csrf: Csrf | undefined

export function guardarCsrf(token: Csrf) {
  csrf = token
}

export function csrfAtual(): Csrf | undefined {
  return csrf
}

function sessaoExpirada(): never {
  window.location.replace('/login?expirada')
  throw new Recusa('A sessão expirou.', 401)
}

async function pedir<T>(metodo: string, endereco: string, corpo?: unknown): Promise<T> {
  const cabecalhos: Record<string, string> = {}
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'
  if (metodo !== 'GET' && csrf) cabecalhos[csrf.cabecalho] = csrf.token

  const resposta = await fetch(endereco, {
    method: metodo,
    credentials: 'same-origin',
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })

  const caminho = new URL(resposta.url, window.location.origin).pathname
  if (resposta.status === 401 || (resposta.redirected && caminho === '/login')) {
    sessaoExpirada()
  }

  const tipo = resposta.headers.get('content-type') ?? ''

  if (!resposta.ok) {
    let mensagem = `O servidor respondeu ${resposta.status}.`
    let campos: Record<string, string> = {}
    if (resposta.status === 403) mensagem = 'Seu perfil não permite fazer isso.'
    try {
      if (tipo.includes('application/json')) {
        const erro = await resposta.json()
        mensagem = erro.mensagem ?? mensagem
        campos = erro.campos ?? {}
      }
    } catch {
      // Sem corpo legível: fica a mensagem com o código da resposta.
    }
    throw new Recusa(mensagem, resposta.status, campos)
  }

  if (tipo.includes('text/html')) {
    // O Spring devolve a tela de entrada no lugar do JSON quando a sessão acabou.
    sessaoExpirada()
  }

  if (resposta.status === 204) return null as T
  if (tipo.includes('application/json')) return resposta.json()
  const texto = await resposta.text()
  return (texto || null) as T
}

export const api = {
  ler: <T>(endereco: string) => pedir<T>('GET', endereco),
  gravar: <T>(endereco: string, corpo?: unknown) => pedir<T>('POST', endereco, corpo),
  alterar: <T>(endereco: string, corpo?: unknown) => pedir<T>('PUT', endereco, corpo),
  apagar: <T>(endereco: string) => pedir<T>('DELETE', endereco),
}

export function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro)
}

export function camposDe(erro: unknown): Record<string, string> {
  return erro instanceof Recusa ? erro.campos : {}
}
