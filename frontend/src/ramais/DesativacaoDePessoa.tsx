import { useState, type FormEvent } from 'react'
import { Button, Column, Form, Grid, InlineNotification, Modal, Stack } from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { ondeEncontrar, type Pessoa } from './tipos'

type Props = {
  pessoa: Pessoa | null
  aoFechar: () => void
  aoDesativar: (pessoa: Pessoa) => void
}

// Quem sai da empresa é desativado, e não excluído: some da lista, do Início e do sino.
export function DesativacaoDePessoa({ pessoa, aoFechar, aoDesativar }: Props) {
  const [recusa, setRecusa] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  if (!pessoa) return null

  function fechar() {
    setRecusa(undefined)
    aoFechar()
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setRecusa(undefined)
    try {
      await api.gravar(`/api/pessoas/${pessoa!.id}/desativar`)
      aoDesativar(pessoa!)
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
      modalLabel={ondeEncontrar(pessoa)}
      modalHeading={`Desativar ${pessoa.nome}`}
      closeButtonLabel="Fechar"
      passiveModal
      size="md"
    >
      <Form autoComplete="off" onSubmit={enviar}>
        <Stack gap={5}>
          {recusa && (
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <InlineNotification kind="error" title="A desativação foi recusada." subtitle={recusa} hideCloseButton />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <p>
                A pessoa sai da lista de ramais, do Início e do sino, e o ramal fica livre para outra pessoa. Use quando
                alguém sai da empresa.
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
                  {enviando ? 'Desativando…' : 'Desativar pessoa'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
