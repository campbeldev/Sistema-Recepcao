import type { ReactNode } from 'react'
import { Modal } from '@carbon/react'
import { Time } from '@carbon/icons-react'
import { emMomento } from '../comum/formato'
import { SituacaoDaReuniao } from './SituacaoDaReuniao'
import { LinkDoWhatsapp } from '../contatos/LinkDoWhatsapp'
import { nomeDaSala, type Pessoa, type Reuniao } from './tipos'
import './ConsultaDaReuniao.css'

type Props = {
  reuniao: Reuniao | null
  aoFechar: () => void
  aoAlterar: (reuniao: Reuniao) => void
  aoCancelar: (reuniao: Reuniao) => void
  aoReagendar: (reuniao: Reuniao) => void
}

// O kit não traz Location nem Enterprise: a mesma marcação dos ícones do Carbon, com os desenhos deles.
function Icone({ children }: { children: ReactNode }) {
  return (
    <svg width={16} height={16} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

function Local() {
  return (
    <Icone>
      <path d="M16,18a5,5,0,1,1,5-5A5.0057,5.0057,0,0,1,16,18Zm0-8a3,3,0,1,0,3,3A3.0033,3.0033,0,0,0,16,10Z" />
      <path d="M16,30,7.5645,20.0513c-.0479-.0571-.3482-.4515-.3482-.4515A10.8888,10.8888,0,0,1,5,13a11,11,0,0,1,22,0,10.8844,10.8844,0,0,1-2.2148,6.5973l-.0015.0025s-.3.3944-.3447.4474ZM8.8125,18.395c.001.0007.2334.3082.2866.3744L16,26.9079l6.91-8.15c.0439-.0552.2783-.3649.2788-.3657A8.901,8.901,0,0,0,25,13,9,9,0,1,0,7,13a8.9054,8.9054,0,0,0,1.8125,5.395Z" />
    </Icone>
  )
}

function Empresa() {
  return (
    <Icone>
      <path d="M8 8H10V12H8z" />
      <path d="M8 14H10V18H8z" />
      <path d="M14 8H16V12H14z" />
      <path d="M14 14H16V18H14z" />
      <path d="M8 20H10V24H8z" />
      <path d="M14 20H16V24H14z" />
      <path d="M30,14a2,2,0,0,0-2-2H22V4a2,2,0,0,0-2-2H4A2,2,0,0,0,2,4V30H30ZM4,4H20V28H4ZM22,28V14h6V28Z" />
    </Icone>
  )
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('')
}

function Fato({ icone, rotulo, children }: { icone: ReactNode; rotulo: string; children: ReactNode }) {
  return (
    <div className="recepcao-consulta__fato">
      <span className="recepcao-consulta__rotulo">
        {icone}
        {rotulo}
      </span>
      <span>{children}</span>
    </div>
  )
}

function Pessoas({ titulo, pessoas, anfitriao }: { titulo: string; pessoas: Pessoa[]; anfitriao?: boolean }) {
  return (
    <section className="recepcao-consulta__grupo">
      <h4>
        {titulo} · {pessoas.length}
      </h4>
      {pessoas.length === 0 && <p className="recepcao-consulta__nenhuma">Ninguém.</p>}
      {pessoas.map(({ id, contato }) => {
        // O telefone só aparece quando é diferente do WhatsApp, que vira link para a conversa.
        const telefone = contato.telefone && contato.telefone !== contato.whatsapp ? contato.telefone : null
        return (
          <div key={id} className="recepcao-consulta__pessoa">
            <span
              className={`recepcao-consulta__iniciais${anfitriao ? ' recepcao-consulta__iniciais--anfitriao' : ''}`}
              aria-hidden="true"
            >
              {iniciais(contato.nomeParticipante)}
            </span>
            <div>
              <div>{contato.nomeParticipante}</div>
              {(contato.email || telefone || contato.whatsapp) && (
                <div className="recepcao-consulta__contato">
                  {contato.email && <span>{contato.email}</span>}
                  {telefone && <span>{telefone}</span>}
                  {contato.whatsapp && (
                    <span>
                      <LinkDoWhatsapp numero={contato.whatsapp} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}

// A reunião como ficha (opção A escolhida em 2026-11-09): a situação e o título no alto; quando, onde
// e a empresa em três quadros; o motivo em destaque; e as pessoas separadas em quem recebe e quem vem.
// As ações ficam no rodapé da janela.
export function ConsultaDaReuniao({ reuniao, aoFechar, aoAlterar, aoCancelar, aoReagendar }: Props) {
  if (!reuniao) return null

  const agendada = reuniao.status === 'AGENDADA'
  const cancelada = reuniao.status === 'CANCELADA'

  const botoes = agendada
    ? {
        secondaryButtons: [
          { buttonText: 'Cancelar reunião', onClick: () => aoCancelar(reuniao) },
          { buttonText: 'Alterar', onClick: () => aoAlterar(reuniao) },
        ],
      }
    : cancelada
      ? { secondaryButtonText: 'Voltar a agendar', onSecondarySubmit: () => aoReagendar(reuniao) }
      : {}

  return (
    <Modal
      open
      className={`recepcao-consulta${agendada ? ' recepcao-consulta--agendada' : ''}`}
      modalLabel={<SituacaoDaReuniao valor={reuniao.status} />}
      modalHeading={reuniao.titulo}
      onRequestClose={aoFechar}
      onRequestSubmit={aoFechar}
      primaryButtonText="Fechar"
      closeButtonLabel="Fechar"
      size="lg"
      {...botoes}
    >
      <div className="recepcao-consulta__fatos">
        <Fato icone={<Time size={16} />} rotulo="Quando">
          {emMomento(reuniao.datahoraReuniao)}
        </Fato>
        <Fato icone={<Local />} rotulo="Onde">
          {nomeDaSala(reuniao.sala)}
        </Fato>
        <Fato icone={<Empresa />} rotulo="Empresa">
          {reuniao.empresaReuniao || '—'}
        </Fato>
      </div>

      {reuniao.motivo && (
        <div className="recepcao-consulta__motivo">
          <span className="recepcao-consulta__rotulo">Motivo</span>
          <p>{reuniao.motivo}</p>
        </div>
      )}

      <div className="recepcao-consulta__pessoas">
        <Pessoas titulo="Quem recebe" pessoas={reuniao.anfitrioes} anfitriao />
        <Pessoas titulo="Quem vem" pessoas={reuniao.participantes} />
      </div>
    </Modal>
  )
}
