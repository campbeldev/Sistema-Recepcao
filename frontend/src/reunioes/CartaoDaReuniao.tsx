import { Link, Stack, Tile } from '@carbon/react'
import { SegundaLinha } from 'campbel-ui'
import { emHora } from '../comum/formato'
import { SituacaoDaReuniao } from './SituacaoDaReuniao'
import { nomeDaSala, nomesDe, type Reuniao } from './tipos'
import './CartaoDaReuniao.css'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// A reunião num cartão, como no painel do sistema antigo: à esquerda uma folha de calendário
// (mês, dia e hora); à direita a situação, o título, a sala, quem recebe e quem vem.
// Com "aviso", vira a folha grande da próxima reunião: lateral preta e o aviso no alto.
type Props = { reuniao: Reuniao; aviso?: string; className?: string }

export function CartaoDaReuniao({ reuniao, aviso, className }: Props) {
  const dia = reuniao.datahoraReuniao.slice(8, 10)
  const mes = MESES[Number(reuniao.datahoraReuniao.slice(5, 7)) - 1]
  const anfitrioes = nomesDe(reuniao.anfitrioes)
  const participantes = nomesDe(reuniao.participantes)
  const classes = ['recepcao-folha', aviso && 'recepcao-folha--grande', className].filter(Boolean).join(' ')

  return (
    <Tile className={classes}>
      <div className="recepcao-folha__lateral">
        <span className="recepcao-folha__mes">{mes}</span>
        <span className="recepcao-folha__dia">{dia}</span>
        <span className="recepcao-folha__hora">{emHora(reuniao.datahoraReuniao)}</span>
      </div>
      <Stack gap={3} className="recepcao-folha__miolo">
        {aviso && <span className="recepcao-folha__aviso">{aviso}</span>}
        <SituacaoDaReuniao valor={reuniao.status} />
        <strong>{reuniao.titulo}</strong>
        <p>{nomeDaSala(reuniao.sala)}</p>
        <div>
          {anfitrioes && <SegundaLinha>Recebe: {anfitrioes}</SegundaLinha>}
          {participantes && <SegundaLinha>Participantes: {participantes}</SegundaLinha>}
          {reuniao.empresaReuniao && <SegundaLinha>Empresa: {reuniao.empresaReuniao}</SegundaLinha>}
          {reuniao.motivo && <SegundaLinha>Motivo: {reuniao.motivo}</SegundaLinha>}
        </div>
        <Link href={`#/reunioes?ver=${reuniao.id}`}>Ver reunião</Link>
      </Stack>
    </Tile>
  )
}
