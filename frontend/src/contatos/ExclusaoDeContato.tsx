import { useState, type FormEvent } from 'react'
import { Button, Column, Form, Grid, InlineNotification, Modal, Stack } from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import type { Contato } from './tipos'

type Props = {
  contato: Contato | null
  aoFechar: () => void
  aoExcluir: (contato: Contato) => void
}

// Só ADMIN vê esta ação. O servidor recusa o contato que já está em alguma reunião.
export function ExclusaoDeContato({ contato, aoFechar, aoExcluir }: Props) {
  const [recusa, setRecusa] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  if (!contato) return null

  function fechar() {
    setRecusa(undefined)
    aoFechar()
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setRecusa(undefined)
    try {
      await api.apagar(`/contatos/${contato!.id}`)
      aoExcluir(contato!)
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
      modalLabel={contato.nomeEmpresa ?? undefined}
      modalHeading={`Excluir ${contato.nomeParticipante}`}
      closeButtonLabel="Fechar"
      passiveModal
      size="md"
    >
      <Form autoComplete="off" onSubmit={enviar}>
        <Stack gap={5}>
          {recusa && (
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <InlineNotification kind="error" title="A exclusão foi recusada." subtitle={recusa} hideCloseButton />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <p>O contato sai da agenda e não pode ser recuperado. Só é possível excluir quem não está em nenhuma reunião.</p>
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Acoes>
                <Button kind="secondary" size="md" data-modal-primary-focus onClick={fechar}>
                  Voltar
                </Button>
                <Button type="submit" size="md" disabled={enviando}>
                  {enviando ? 'Excluindo…' : 'Excluir contato'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
