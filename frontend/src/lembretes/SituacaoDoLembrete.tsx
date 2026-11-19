import { IconIndicator } from '@carbon/react'
import { estaAtrasado, type Lembrete } from './tipos'

// Pendente aguarda o dia (o losango roxo, como a reunião agendada), atrasado pede atenção
// (o amarelo de cuidado, não o vermelho de problema) e feito é o verde de concluído.
export function SituacaoDoLembrete({ lembrete }: { lembrete: Lembrete }) {
  if (lembrete.feito) return <IconIndicator kind="succeeded" label="Feito" size={16} />
  if (estaAtrasado(lembrete)) return <IconIndicator kind="caution-minor" label="Atrasado" size={16} />
  return <IconIndicator kind="undefined" label="Pendente" size={16} />
}
