// Como os valores aparecem na tela, sempre em português, do jeito que o kit pede.

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })

export const VAZIO = '—'

export function emReais(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? VAZIO : reais.format(valor)
}

export function emNumero(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? VAZIO : numero.format(valor)
}

// A API manda a data como "2026-10-27". Lida como texto, para o fuso não puxar para o dia anterior.
export function emData(valor: string | null | undefined): string {
  if (!valor) return VAZIO
  const [ano, mes, dia] = valor.slice(0, 10).split('-')
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : VAZIO
}

export function emMomento(valor: string | null | undefined): string {
  if (!valor) return VAZIO
  return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function hojeNaApi(): string {
  const hoje = new Date()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${hoje.getFullYear()}-${mes}-${dia}`
}

// O DatePicker do Carbon entrega um Date; a API recebe "aaaa-mm-dd".
export function dataParaApi(data: Date | undefined): string {
  if (!data) return ''
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export function dataDaApi(valor: string | null | undefined): Date | undefined {
  if (!valor) return undefined
  const [ano, mes, dia] = valor.slice(0, 10).split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

// A API manda o momento como "2026-10-30T14:00:00", sem fuso: é a hora local da recepção.
export function emHora(valor: string | null | undefined): string {
  return valor ? valor.slice(11, 16) : VAZIO
}

export function dataDoMomento(valor: string): string {
  return valor.slice(0, 10)
}

// (11) 91234-5678 ou (11) 3456-7890, enquanto a pessoa digita.
export function comMascaraDeTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 11)
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
  if (numeros.length <= 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
}

// Os horários da recepção, de meia em meia hora, das 07:00 às 19:30.
export const HORARIOS = Array.from({ length: 26 }, (_, i) => {
  const minutos = 7 * 60 + i * 30
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
})

// Telefone fixo ou celular, com ou sem DDD: 3456-7890, 91234-5678, (11) 3456-7890 ou (11) 91234-5678.
export function comMascaraDeQualquerTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 11)
  if (numeros.length <= 4) return numeros
  if (numeros.length <= 8) return `${numeros.slice(0, 4)}-${numeros.slice(4)}`
  if (numeros.length === 9) return `${numeros.slice(0, 5)}-${numeros.slice(5)}`
  return comMascaraDeTelefone(numeros)
}
