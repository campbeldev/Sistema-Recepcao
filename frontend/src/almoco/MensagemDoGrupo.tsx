import { useRef, useState } from 'react'
import { Button, Column, Grid, Modal, Stack, TextArea } from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { mensagemDoGrupo, type Cardapio } from './tipos'

type Props = {
  cardapio: Cardapio | null
  aoFechar: () => void
  aoCopiar: () => void
}

// O texto para colar no grupo do WhatsApp, com o link do pedido.
// Se o navegador não deixar copiar sozinho, o texto fica selecionado para o Ctrl+C.
export function MensagemDoGrupo({ cardapio, aoFechar, aoCopiar }: Props) {
  const campo = useRef<HTMLTextAreaElement>(null)
  const [selecionado, setSelecionado] = useState(false)

  if (!cardapio) return null
  const texto = mensagemDoGrupo(cardapio, `${window.location.origin}/almoco`)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      aoCopiar()
    } catch {
      campo.current?.focus()
      campo.current?.select()
      setSelecionado(true)
    }
  }

  return (
    <Modal
      open
      onRequestClose={aoFechar}
      modalHeading="Mensagem do grupo"
      closeButtonLabel="Fechar"
      passiveModal
      size="md"
    >
      <Stack gap={5}>
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <TextArea
              ref={campo}
              id="mensagem-do-grupo"
              labelText="Cole esta mensagem no grupo do almoço"
              helperText={
                selecionado
                  ? 'O navegador não deixou copiar sozinho. O texto está selecionado: use Ctrl+C.'
                  : 'Cada pessoa toca no link, escolhe o prato e envia.'
              }
              rows={4}
              readOnly
              value={texto}
            />
          </Column>
        </Grid>
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <Acoes>
              <Button kind="secondary" size="md" onClick={aoFechar}>
                Fechar
              </Button>
              <Button size="md" data-modal-primary-focus onClick={copiar}>
                Copiar mensagem
              </Button>
            </Acoes>
          </Column>
        </Grid>
      </Stack>
    </Modal>
  )
}
