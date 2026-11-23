import { RadioButton, RadioButtonGroup, Stack, TextInput } from '@carbon/react'
import { EscolhaDeAcompanhamentos } from './EscolhaDeAcompanhamentos'
import type { Cardapio, PedidoEntrada } from './tipos'

export type ValoresDoPedido = { proteina: string; acompanhamentos: string[]; observacao: string }

export const PEDIDO_VAZIO: ValoresDoPedido = { proteina: '', acompanhamentos: [], observacao: '' }

export function valoresDoPedido(pedido?: PedidoEntrada | null): ValoresDoPedido {
  if (!pedido) return PEDIDO_VAZIO
  return { proteina: pedido.proteina, acompanhamentos: [...pedido.acompanhamentos], observacao: pedido.observacao ?? '' }
}

export function pedidoParaApi(valores: ValoresDoPedido): PedidoEntrada {
  return {
    proteina: valores.proteina,
    acompanhamentos: valores.acompanhamentos,
    observacao: valores.observacao.trim() || null,
  }
}

type Props = {
  prefixo: string
  cardapio: Cardapio
  valores: ValoresDoPedido
  erros: Record<string, string>
  aoMudar: (valores: ValoresDoPedido) => void
}

// A proteína, os acompanhamentos e a observação: os mesmos no link do grupo e na janela da recepção.
export function CamposDoPedido({ prefixo, cardapio, valores, erros, aoMudar }: Props) {
  return (
    <Stack gap={6}>
      <RadioButtonGroup
        legendText="Proteína"
        name={`${prefixo}-proteina`}
        orientation="vertical"
        valueSelected={valores.proteina}
        onChange={(valor) => aoMudar({ ...valores, proteina: String(valor) })}
        invalid={Boolean(erros.proteina)}
        invalidText={erros.proteina}
      >
        {cardapio.proteinas.map((nome, posicao) => (
          <RadioButton key={nome} id={`${prefixo}-proteina-${posicao}`} labelText={nome} value={nome} />
        ))}
      </RadioButtonGroup>
      <EscolhaDeAcompanhamentos
        id={`${prefixo}-acompanhamentos`}
        opcoes={cardapio.acompanhamentos}
        escolhidos={valores.acompanhamentos}
        aoMudar={(acompanhamentos) => aoMudar({ ...valores, acompanhamentos })}
        erro={erros.acompanhamentos}
      />
      <TextInput
        id={`${prefixo}-observacao`}
        labelText="Observação (opcional)"
        placeholder="Sem cebola, pouco arroz…"
        maxLength={200}
        value={valores.observacao}
        onChange={(evento) => aoMudar({ ...valores, observacao: evento.target.value })}
        invalid={Boolean(erros.observacao)}
        invalidText={erros.observacao}
      />
    </Stack>
  )
}
