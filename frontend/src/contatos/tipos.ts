export type Contato = {
  id: number
  nomeParticipante: string
  nomeEmpresa: string | null
  email: string | null
  telefone: string | null
  whatsapp: string | null
}

export function porNome(a: Contato, b: Contato): number {
  return a.nomeParticipante.localeCompare(b.nomeParticipante, 'pt-BR')
}

// Como o contato aparece numa lista de escolha: o nome e, quando há, a empresa.
export function rotuloDo(contato: Contato | null | undefined): string {
  if (!contato) return ''
  return contato.nomeEmpresa ? `${contato.nomeParticipante} · ${contato.nomeEmpresa}` : contato.nomeParticipante
}
