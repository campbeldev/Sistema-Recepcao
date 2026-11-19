import type { AvisoDoSino } from 'campbel-ui'
import { VAZIO, hojeNaApi } from '../comum/formato'

export type Pessoa = {
  id: number
  nome: string
  setor: string
  cargo: string | null
  ramal: string | null
  email: string | null
  celular: string | null
  diaAniversario: number | null
  mesAniversario: number | null
  mostrarAniversario: boolean
}

export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const UM_DIA = 24 * 60 * 60 * 1000

// Quantos dias para a frente o Início mostra os aniversários.
export const JANELA_DE_ANIVERSARIOS = 30

export function porNome(a: Pessoa, b: Pessoa): number {
  return a.nome.localeCompare(b.nome, 'pt-BR')
}

const dois = (numero: number) => String(numero).padStart(2, '0')

// "19/11", ou o traço quando não há aniversário cadastrado.
export function emAniversario(pessoa: Pessoa): string {
  const { diaAniversario: dia, mesAniversario: mes } = pessoa
  return dia && mes ? `${dois(dia)}/${dois(mes)}` : VAZIO
}

// O dia do próximo aniversário, contando hoje. Quem faz em 29/02 comemora em 28/02 nos anos comuns.
export function proximoAniversario(pessoa: Pessoa, agora = new Date()): Date | undefined {
  const { diaAniversario: dia, mesAniversario: mes } = pessoa
  if (!dia || !mes) return undefined
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  for (const ano of [hoje.getFullYear(), hoje.getFullYear() + 1]) {
    const ultimoDoMes = new Date(ano, mes, 0).getDate()
    const data = new Date(ano, mes - 1, Math.min(dia, ultimoDoMes))
    if (data >= hoje) return data
  }
  return undefined
}

// Quantos dias faltam: 0 é hoje.
export function diasAte(pessoa: Pessoa, agora = new Date()): number | undefined {
  const data = proximoAniversario(pessoa, agora)
  if (!data) return undefined
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  return Math.round((data.getTime() - hoje.getTime()) / UM_DIA)
}

export function fazHoje(pessoa: Pessoa, agora = new Date()): boolean {
  return pessoa.mostrarAniversario && diasAte(pessoa, agora) === 0
}

export type Aniversariante = { pessoa: Pessoa; faltam: number; data: Date }

// Quem deixa mostrar o aniversário e faz nos próximos dias, do mais perto para o mais longe.
export function aniversariantes(pessoas: Pessoa[], dias = JANELA_DE_ANIVERSARIOS, agora = new Date()): Aniversariante[] {
  return pessoas
    .filter((pessoa) => pessoa.mostrarAniversario)
    .map((pessoa) => ({ pessoa, faltam: diasAte(pessoa, agora), data: proximoAniversario(pessoa, agora) }))
    .filter((item): item is Aniversariante => item.faltam !== undefined && item.data !== undefined && item.faltam <= dias)
    .sort((a, b) => a.faltam - b.faltam || porNome(a.pessoa, b.pessoa))
}

// "Hoje", "Amanhã" ou "sex, 22/11".
export function quandoFaz({ faltam, data }: Aniversariante): string {
  if (faltam === 0) return 'Hoje'
  if (faltam === 1) return 'Amanhã'
  return `${DIAS_DA_SEMANA[data.getDay()]}, ${dois(data.getDate())}/${dois(data.getMonth() + 1)}`
}

// "Financeiro · ramal 2107"
export function ondeEncontrar(pessoa: Pessoa): string {
  return [pessoa.setor, pessoa.ramal && `ramal ${pessoa.ramal}`].filter(Boolean).join(' · ')
}

// Os aniversários de hoje, para o sino.
export function avisosDosAniversarios(pessoas: Pessoa[]): AvisoDoSino[] {
  return pessoas
    .filter((pessoa) => fazHoje(pessoa))
    .sort(porNome)
    .map((pessoa) => ({
      chave: `aniversario-${pessoa.id}`,
      gravidade: 'sucesso' as const,
      titulo: `Aniversário de ${pessoa.nome}`,
      descricao: ondeEncontrar(pessoa),
      momento: `${hojeNaApi()}T00:00:00`,
      endereco: '/ramais',
      dispensavel: false,
    }))
}
