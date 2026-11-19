import { createContext, useContext } from 'react'
import type { Csrf } from './api'

export type Perfil = 'ADMIN' | 'RECEPCIONISTA'

export type Conectado = {
  nome: string
  username: string
  perfil: Perfil
}

// O que /api/sessao responde: quem está conectado (ou ninguém) e o token CSRF.
export type RespostaDaSessao = {
  usuario: Conectado | null
  csrf: Csrf
}

export const ContextoDaSessao = createContext<Conectado | null>(null)

export function useSessao(): Conectado {
  const sessao = useContext(ContextoDaSessao)
  if (!sessao) throw new Error('A tela está fora da Plataforma.')
  return sessao
}

export function ehAdmin(sessao: Conectado): boolean {
  return sessao.perfil === 'ADMIN'
}
