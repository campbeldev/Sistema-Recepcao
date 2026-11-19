import { useState, type FormEvent } from 'react'
import { Button, Column, Form, Grid, InlineNotification, Modal, Stack } from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { emMomento } from '../comum/formato'
import { nomeDaSala, type Reuniao } from './tipos'

type Props = {
  reuniao: Reuniao | null
  aoFechar: () => void
  aoReagendar: (reuniao: Reuniao) => void
}

// Desfaz o cancelamento: a reunião volta a ser agendada no mesmo dia, hora e sala.
export function ReagendamentoDaReuniao({ reuniao, aoFechar, aoReagendar }: Props) {
  const [recusa, setRecusa] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  if (!reuniao) return null

  function fechar() {
    setRecusa(undefined)
    aoFechar()
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setRecusa(undefined)
    try {
      aoReagendar(await api.gravar<Reuniao>(`/reunioes/${reuniao!.id}/reagendar`))
    } catch (erro) {
      setRecusa(mensagemDe(erro))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open
      onRequestClose={fechar}
      modalLabel={`${emMomento(reuniao.datahoraReuniao)} · ${nomeDaSala(reuniao.sala)}`}
      modalHeading={`Voltar a agendar ${reuniao.titulo}`}
      closeButtonLabel="Fechar"
      passiveModal
      size="md"
    >
      <Form autoComplete="off" onSubmit={enviar}>
        <Stack gap={5}>
          {recusa && (
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <InlineNotification kind="error" title="Não foi possível voltar a agendar." subtitle={recusa} hideCloseButton />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <p>
                A reunião volta a ficar agendada no mesmo dia, hora e sala, e os participantes recebem a confirmação por
                e-mail de novo. Se outra reunião já ocupa a sala nesse horário, o sistema recusa.
              </p>
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Acoes>
                <Button kind="secondary" size="md" data-modal-primary-focus onClick={fechar}>
                  Voltar
                </Button>
                <Button type="submit" size="md" disabled={enviando}>
                  {enviando ? 'Agendando…' : 'Voltar a agendar'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
