import { IconIndicator } from '@carbon/react'
import type { StatusReuniao } from './tipos'

// O kit não traz o calendário entre os indicadores. Este monta a mesma marcação do IconIndicator
// (cds--icon-indicator) com o ícone Calendar do Carbon, pintado com o azul do indicador "informative".
function Agendada() {
  return (
    <div className="cds--icon-indicator">
      <svg
        className="cds--icon-indicator--informative"
        width={16}
        height={16}
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M26,4h-4V2h-2v2h-8V2h-2v2H6C4.9,4,4,4.9,4,6v20c0,1.1,0.9,2,2,2h20c1.1,0,2-0.9,2-2V6C28,4.9,27.1,4,26,4z M26,26H6V12h20 V26z M26,10H6V6h4v2h2V6h8v2h2V6h4V10z" />
      </svg>
      Agendada
    </div>
  )
}

// A situação da reunião: agendada é o calendário azul, realizada é o verde de concluído
// e cancelada é o X vermelho ("failed").
export function SituacaoDaReuniao({ valor }: { valor: StatusReuniao }) {
  if (valor === 'AGENDADA') return <Agendada />
  if (valor === 'CANCELADA') return <IconIndicator kind="failed" label="Cancelada" size={16} />
  return <IconIndicator kind="succeeded" label="Realizada" size={16} />
}
