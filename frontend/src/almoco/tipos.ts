export type Cardapio = {
  id: number
  dia: string
  proteinas: string[]
  acompanhamentos: string[]
  fechaAs: string
  aberto: boolean
  encerrado: boolean
  // O fim do link do dia: /almoco/{codigoDoLink}.
  codigoDoLink: string
}

export type Pedido = {
  id: number
  nome: string
  proteina: string
  acompanhamentos: string[]
  observacao: string | null
  feitoEm: string
  lancadoPor: string | null
}

// O pedido feito pelo link volta com a chave que o celular guarda para alterar ou cancelar.
export type PedidoComChave = { pedido: Pedido; chave: string }

export type Sugestao = { proteinas: string[]; acompanhamentos: string[]; fechaAs: string }

export type Painel = {
  cardapio: Cardapio | null
  pedidos: Pedido[]
  sugestao: Sugestao | null
}

// O prato: o mesmo no link do grupo e na janela da recepção.
export type PratoEntrada = { proteina: string; acompanhamentos: string[]; observacao: string | null }

export type PedidoEntrada = PratoEntrada & { nome: string }

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

// O link do dia, com o código que só vale hoje.
export function linkDoDia(cardapio: Cardapio): string {
  return `${window.location.origin}/almoco/${cardapio.codigoDoLink}`
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

// Nomes que aparecem mais de uma vez na lista: a recepção confere se é a mesma pessoa pedindo duas vezes.
export function nomesRepetidos(pedidos: Pedido[]): Set<string> {
  const vistos = new Set<string>()
  const repetidos = new Set<string>()
  for (const pedido of pedidos) {
    const nome = normalizado(pedido.nome)
    if (vistos.has(nome)) repetidos.add(nome)
    vistos.add(nome)
  }
  return repetidos
}

export function normalizado(nome: string): string {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
}
