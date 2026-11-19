import type { AvisoDoSino } from 'campbel-ui'
import { emData, hojeNaApi } from '../comum/formato'

export type Lembrete = {
  id: number
  descricao: string
  paraQuem: string | null
  dia: string
  hora: string | null
  feito: boolean
  criadoPor: string
  criadoEm: string
}

// A API manda a hora como "14:00:00"; a tela usa "14:00".
export function horaDo(lembrete: Lembrete): string | null {
  return lembrete.hora ? lembrete.hora.slice(0, 5) : null
}

export function quandoDo(lembrete: Lembrete): string {
  const hora = horaDo(lembrete)
  return hora ? `${emData(lembrete.dia)} ${hora}` : emData(lembrete.dia)
}

export function estaAtrasado(lembrete: Lembrete): boolean {
  return !lembrete.feito && lembrete.dia < hojeNaApi()
}

// O que ainda está por fazer até hoje, contando os atrasados.
export function paraHoje(lembrete: Lembrete): boolean {
  return !lembrete.feito && lembrete.dia <= hojeNaApi()
}

export function nomeDaSituacao(lembrete: Lembrete): string {
  if (lembrete.feito) return 'Feito'
  return estaAtrasado(lembrete) ? 'Atrasado' : 'Pendente'
}

// Os pendentes primeiro, do mais antigo para o mais novo; sem hora vem antes, valendo o dia todo.
// Depois os feitos, do mais recente para o mais antigo.
export function naOrdem(a: Lembrete, b: Lembrete): number {
  if (a.feito !== b.feito) return a.feito ? 1 : -1
  const chave = (lembrete: Lembrete) => `${lembrete.dia} ${lembrete.hora ?? ''}`
  return a.feito ? chave(b).localeCompare(chave(a)) : chave(a).localeCompare(chave(b))
}

// Os lembretes de hoje e os atrasados, para o sino.
export function avisosDosLembretes(lembretes: Lembrete[]): AvisoDoSino[] {
  return lembretes
    .filter(paraHoje)
    .sort(naOrdem)
    .map((lembrete) => ({
      chave: `lembrete-${lembrete.id}`,
      gravidade: estaAtrasado(lembrete) ? ('alerta' as const) : ('pendente' as const),
      titulo: lembrete.descricao,
      descricao: [estaAtrasado(lembrete) ? `Atrasado desde ${emData(lembrete.dia)}` : horaDo(lembrete), lembrete.paraQuem]
        .filter(Boolean)
        .join(' · '),
      momento: `${lembrete.dia}T${lembrete.hora ?? '00:00:00'}`,
      endereco: '/lembretes',
      dispensavel: false,
    }))
}
