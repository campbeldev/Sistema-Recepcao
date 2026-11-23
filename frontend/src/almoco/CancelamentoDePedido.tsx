import { useState, type FormEvent } from 'react'
import { Button, Column, Form, Grid, InlineNotification, Modal, Stack } from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { acompanhamentosDo, type Pedido } from './tipos'

type Props = {
  pedido: Pedido | null
  aoFechar: () => void
  aoCancelar: (pedido: Pedido) => void
}

export function CancelamentoDePedido({ pedido, aoFechar, aoCancelar }: Props) {
  const [recusa, setRecusa] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  if (!pedido) return null

  function fechar() {
    setRecusa(undefined)
    aoFechar()
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setRecusa(undefined)
    try {
      await api.apagar(`/api/almoco/hoje/pedidos/${pedido!.pessoaId}`)
      aoCancelar(pedido!)
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
      modalLabel={`${pedido.proteina} · ${acompanhamentosDo(pedido)}`}
      modalHeading={`Cancelar o pedido de ${pedido.nome}`}
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
              <p>O prato sai da lista de hoje e do PDF. A pessoa pode pedir de novo enquanto os pedidos estiverem abertos.</p>
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Acoes>
                <Button kind="secondary" size="md" data-modal-primary-focus onClick={fechar}>
                  Voltar
                </Button>
                <Button type="submit" size="md" disabled={enviando}>
                  {enviando ? 'Cancelando…' : 'Cancelar pedido'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
