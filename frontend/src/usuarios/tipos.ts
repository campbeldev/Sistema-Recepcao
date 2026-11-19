import type { Perfil } from '../comum/sessao'

export type Usuario = {
  id: number
  username: string
  nome: string
  email: string | null
  perfil: Perfil
  ativo: boolean
}

export const PERFIS: Record<Perfil, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
}
