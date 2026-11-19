import type { ReactNode } from 'react'
import { Link, Modal } from '@carbon/react'
import { VAZIO } from '../comum/formato'
import { LinkDoWhatsapp } from './LinkDoWhatsapp'
import type { Contato } from './tipos'
import '../reunioes/ConsultaDaReuniao.css'

type Props = {
  contato: Contato | null
  podeExcluir: boolean
  aoFechar: () => void
  aoAlterar: (contato: Contato) => void
  aoAgendar: (contato: Contato) => void
  aoExcluir: (contato: Contato) => void
}

function Fato({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="recepcao-consulta__fato">
      <span className="recepcao-consulta__rotulo">
        {rotulo}
      </span>
      <span>{children}</span>
    </div>
  )
}

// O contato como ficha, no mesmo jeito da janela da reunião: o nome no alto, a empresa acima dele,
// e-mail, telefone e WhatsApp em quadros (cada um abre o que faz sentido: e-mail, ligação, conversa).
// No rodapé: excluir (só admin), agendar reunião com ele e alterar. O X fecha.
export function ConsultaDoContato({ contato, podeExcluir, aoFechar, aoAlterar, aoAgendar, aoExcluir }: Props) {
  if (!contato) return null

  const agendar = { buttonText: 'Agendar reunião', onClick: () => aoAgendar(contato) }
  const botoes = podeExcluir
    ? { secondaryButtons: [{ buttonText: 'Excluir', onClick: () => aoExcluir(contato) }, agendar] }
    : { secondaryButtonText: agendar.buttonText, onSecondarySubmit: agendar.onClick }

  return (
    <Modal
      open
      className={`recepcao-consulta${podeExcluir ? ' recepcao-consulta--com-exclusao' : ''}`}
      modalLabel={contato.nomeEmpresa || 'Contato'}
      modalHeading={contato.nomeParticipante}
      onRequestClose={aoFechar}
      onRequestSubmit={() => aoAlterar(contato)}
      primaryButtonText="Alterar"
      closeButtonLabel="Fechar"
      size="md"
      {...botoes}
    >
      <div className="recepcao-consulta__fatos">
        <Fato rotulo="E-mail">
          {contato.email ? <Link href={`mailto:${contato.email}`}>{contato.email}</Link> : VAZIO}
        </Fato>
        <Fato rotulo="Telefone">
          {contato.telefone ? (
            <Link href={`tel:${contato.telefone.replace(/[^\d+]/g, '')}`}>{contato.telefone}</Link>
          ) : (
            VAZIO
          )}
        </Fato>
        <Fato rotulo="WhatsApp">{contato.whatsapp ? <LinkDoWhatsapp numero={contato.whatsapp} /> : VAZIO}</Fato>
      </div>
    </Modal>
  )
}
