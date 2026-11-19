// No Carbon 1.117.0, IconIndicator e ShapeIndicator só saem com o prefixo preview__.
// O kit os expõe sem o prefixo (CampbelUI.Carbon), e é assim que as telas importam.
import type { preview__IconIndicator, preview__ShapeIndicator } from '@carbon/react'

declare module '@carbon/react' {
  export const IconIndicator: typeof preview__IconIndicator
  export const ShapeIndicator: typeof preview__ShapeIndicator
}
