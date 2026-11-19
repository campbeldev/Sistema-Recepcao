import { useCallback, useEffect, useState, type ComponentType } from 'react'
import { InlineNotification } from '@carbon/react'
import { Casca, type AvisoDoSino } from 'campbel-ui'
import { api, csrfAtual, guardarCsrf, mensagemDe } from './comum/api'
import { ContextoDaSessao, type Conectado, type RespostaDaSessao } from './comum/sessao'
import { useEndereco } from './comum/endereco'
import { menuDe } from './menu'
import { Entrada } from './entrada/Entrada'
import { Inicio } from './inicio/Inicio'
import { Reunioes } from './reunioes/Reunioes'
import { Contatos } from './contatos/Contatos'
import { Lembretes } from './lembretes/Lembretes'
import { Relatorio } from './relatorio/Relatorio'
import { Usuarios } from './usuarios/Usuarios'
import { avisosDoDia, type Reuniao } from './reunioes/tipos'
import { avisosDosLembretes, type Lembrete } from './lembretes/tipos'

const ROTAS: Record<string, ComponentType> = {
  '/': Inicio,
  '/reunioes': Reunioes,
  '/contatos': Contatos,
  '/lembretes': Lembretes,
  '/relatorio': Relatorio,
  '/usuarios': Usuarios,
}

// Sair é um POST com o token CSRF, como o Spring Security pede.
function sair() {
  const token = csrfAtual()
  const formulario = document.createElement('form')
  formulario.method = 'post'
  formulario.action = '/logout'
  if (token) {
    const campo = document.createElement('input')
    campo.type = 'hidden'
    campo.name = token.parametro
    campo.value = token.token
    formulario.appendChild(campo)
  }
  document.body.appendChild(formulario)
  formulario.submit()
}

export function Plataforma() {
  const endereco = useEndereco()
  const [sessao, setSessao] = useState<RespostaDaSessao>()
  const [falha, setFalha] = useState<string>()
  const [avisos, setAvisos] = useState<AvisoDoSino[]>([])

  // O sino mostra os lembretes de hoje e os atrasados, e as reuniões agendadas que ainda vão acontecer hoje.
  // Se uma das listas não carregar, o sino mostra a outra.
  const carregarAvisos = useCallback(() => {
    Promise.all([
      api.ler<Lembrete[]>('/api/lembretes').then(avisosDosLembretes).catch(() => []),
      api.ler<Reuniao[]>('/reunioes').then(avisosDoDia).catch(() => []),
    ]).then(([deLembretes, deReunioes]) => setAvisos([...deLembretes, ...deReunioes]))
  }, [])

  useEffect(() => {
    api
      .ler<RespostaDaSessao>('/api/sessao')
      .then((lida) => {
        guardarCsrf(lida.csrf)
        setSessao(lida)
      })
      .catch((erro) => setFalha(mensagemDe(erro)))
  }, [])

  useEffect(() => {
    if (sessao?.usuario) carregarAvisos()
  }, [sessao, endereco, carregarAvisos])

  if (falha) {
    return (
      <InlineNotification kind="error" title="Não foi possível abrir o sistema." subtitle={falha} hideCloseButton />
    )
  }
  if (!sessao) return null

  if (!sessao.usuario || window.location.pathname === '/login') {
    // A entrada ocupa a página toda, sem a casca: metade preta com a marca, metade com o formulário.
    return <Entrada csrf={sessao.csrf} />
  }

  const usuario: Conectado = sessao.usuario
  const permitida = ROTAS[endereco] && (endereco !== '/usuarios' || usuario.perfil === 'ADMIN')
  const Tela = permitida ? ROTAS[endereco] : Inicio

  return (
    <ContextoDaSessao.Provider value={usuario}>
      <Casca
        menu={menuDe(usuario.perfil)}
        conectado={usuario.nome}
        avisos={avisos}
        atual={permitida ? endereco : '/'}
        aoSair={sair}
      >
        <Tela key={endereco} />
      </Casca>
    </ContextoDaSessao.Provider>
  )
}
