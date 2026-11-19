import type { AvisoDoSino } from 'campbel-ui'
import type { Contato } from '../contatos/tipos'
import { emHora, hojeNaApi } from '../comum/formato'

export type StatusReuniao = 'AGENDADA' | 'FINALIZADA' | 'CANCELADA'

export type Pessoa = { id: number; contato: Contato }

export type Reuniao = {
  id: number
  datahoraReuniao: string
  titulo: string
  motivo: string | null
  sala: string | null
  empresaReuniao: string | null
  status: StatusReuniao
  anfitrioes: Pessoa[]
  participantes: Pessoa[]
}

// O valor gravado e o nome que a tela mostra.
export const SALAS = [
  { valor: 'Sala 01', nome: 'Sala de reunião 1' },
  { valor: 'Sala 02', nome: 'Sala de reunião 2' },
]

// A sala é opcional: reunião sem sala aparece como "Sem sala".
export function nomeDaSala(valor: string | null): string {
  if (!valor) return 'Sem sala'
  return SALAS.find((sala) => sala.valor === valor)?.nome ?? valor
}

export const NOMES_DA_SITUACAO: Record<StatusReuniao, string> = {
  AGENDADA: 'Agendada',
  FINALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
}

export function nomesDe(pessoas: Pessoa[]): string {
  return pessoas.map((pessoa) => pessoa.contato.nomeParticipante).join(', ')
}

export function ehHoje(reuniao: Reuniao): boolean {
  return reuniao.datahoraReuniao.slice(0, 10) === hojeNaApi()
}

// Ordem de agenda: a mais próxima primeiro.
export function porHorario(a: Reuniao, b: Reuniao): number {
  return a.datahoraReuniao.localeCompare(b.datahoraReuniao)
}

// As reuniões agendadas que ainda vão acontecer hoje, para o sino.
export function avisosDoDia(reunioes: Reuniao[]): AvisoDoSino[] {
  const agora = new Date()
  return reunioes
    .filter((reuniao) => reuniao.status === 'AGENDADA' && ehHoje(reuniao) && new Date(reuniao.datahoraReuniao) >= agora)
    .sort(porHorario)
    .map((reuniao) => ({
      chave: `reuniao-${reuniao.id}`,
      gravidade: 'pendente' as const,
      titulo: `${reuniao.titulo} às ${emHora(reuniao.datahoraReuniao)}`,
      descricao: [nomeDaSala(reuniao.sala), nomesDe(reuniao.anfitrioes)].filter(Boolean).join(' · '),
      momento: reuniao.datahoraReuniao,
      endereco: `/reunioes?ver=${reuniao.id}`,
      dispensavel: false,
    }))
}
