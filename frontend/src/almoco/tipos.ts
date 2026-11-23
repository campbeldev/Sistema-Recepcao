export type Cardapio = {
  id: number
  dia: string
  proteinas: string[]
  acompanhamentos: string[]
  fechaAs: string
  aberto: boolean
  encerrado: boolean
}

export type Pedido = {
  id: number
  pessoaId: number
  nome: string
  setor: string
  proteina: string
  acompanhamentos: string[]
  observacao: string | null
  feitoEm: string
  lancadoPor: string | null
}

export type PessoaDoAlmoco = { id: number; nome: string; setor: string }

export type Sugestao = { proteinas: string[]; acompanhamentos: string[]; fechaAs: string }

export type Painel = {
  cardapio: Cardapio | null
  pedidos: Pedido[]
  semPedido: PessoaDoAlmoco[]
  sugestao: Sugestao | null
}

export type Publico = { cardapio: Cardapio | null; pessoas: PessoaDoAlmoco[] }

export type PedidoEntrada = { proteina: string; acompanhamentos: string[]; observacao: string | null }

// A API manda a hora como "10:00:00".
export function emHoraCurta(hora: string): string {
  return hora.slice(0, 5)
}

// "Aberto até 10:00", "Fechado às 10:00" ou "Fechado pela recepção".
export function situacaoDo(cardapio: Cardapio): string {
  if (cardapio.aberto) return `Aberto até ${emHoraCurta(cardapio.fechaAs)}`
  if (cardapio.encerrado) return 'Fechado pela recepção'
  return `Fechado às ${emHoraCurta(cardapio.fechaAs)}`
}

// "Frango ao molho, Lasanha e Isca de carne"
export function emLista(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join('')
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

// "Arroz, Feijão de caldo" ou "Sem acompanhamento".
export function acompanhamentosDo(pedido: { acompanhamentos: string[] }): string {
  return pedido.acompanhamentos.length ? pedido.acompanhamentos.join(', ') : 'Sem acompanhamento'
}

// O texto que a recepção cola no grupo do WhatsApp.
export function mensagemDoGrupo(cardapio: Cardapio, endereco: string): string {
  const [, mes, dia] = cardapio.dia.split('-')
  return [
    `Cardápio de hoje (${dia}/${mes}): ${emLista(cardapio.proteinas)}.`,
    `Faça seu pedido até ${emHoraCurta(cardapio.fechaAs)} pelo link:`,
    endereco,
  ].join('\n')
}

export function quantosDe(pedidos: Pedido[], proteina: string): number {
  return pedidos.filter((pedido) => pedido.proteina === proteina).length
}
