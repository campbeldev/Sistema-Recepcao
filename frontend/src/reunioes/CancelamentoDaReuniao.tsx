import { useState, type FormEvent } from 'react'
import { Button, Column, Form, Grid, InlineNotification, Modal, Stack } from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { emMomento } from '../comum/formato'
import { nomeDaSala, type Reuniao } from './tipos'

type Props = {
  reuniao: Reuniao | null
  aoFechar: () => void
  aoCancelar: (reuniao: Reuniao) => void
}

export function CancelamentoDaReuniao({ reuniao, aoFechar, aoCancelar }: Props) {
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
      aoCancelar(await api.gravar<Reuniao>(`/reunioes/${reuniao!.id}/cancelar`))
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
      modalHeading={`Cancelar ${reuniao.titulo}`}
      closeButtonLabel="Fechar"
      passiveModal
      size="md"
    >
      <Form autoComplete="off" onSubmit={enviar}>
        <Stack gap={5}>
          {recusa && (
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <InlineNotification kind="error" title="O cancelamento foi recusado." subtitle={recusa} hideCloseButton />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <p>
                A reunião continua na lista como cancelada, a sala fica livre nesse horário e ninguém recebe o lembrete.
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
                  {enviando ? 'Cancelando…' : 'Cancelar reunião'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
