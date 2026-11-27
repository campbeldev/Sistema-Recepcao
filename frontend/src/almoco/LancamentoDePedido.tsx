import { useEffect, useState, type FormEvent } from 'react'
import { Button, Column, Form, Grid, InlineNotification, Modal, Stack, TextInput } from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, camposDe, mensagemDe } from '../comum/api'
import { CamposDoPedido, PEDIDO_VAZIO, pedidoParaApi, valoresDoPedido, type ValoresDoPedido } from './CamposDoPedido'
import type { Cardapio, Pedido } from './tipos'

type Props = {
  aberto: boolean
  cardapio: Cardapio
  pedido: Pedido | null
  aoFechar: () => void
  aoGravar: (pedido: Pedido, novo: boolean) => void
}

// A recepção lança o pedido de quem ligou ou falou pessoalmente, ou altera o de alguém.
// Funciona mesmo depois de fechar: é o jeito de corrigir antes de mandar o PDF.
export function LancamentoDePedido({ aberto, cardapio, pedido, aoFechar, aoGravar }: Props) {
  const [nome, setNome] = useState('')
  const [valores, setValores] = useState<ValoresDoPedido>(PEDIDO_VAZIO)
  const [recusa, setRecusa] = useState<string>()
  const [recusados, setRecusados] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setNome(pedido?.nome ?? '')
    setValores(valoresDoPedido(pedido))
    setRecusa(undefined)
    setRecusados({})
  }, [aberto, pedido])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const erros: Record<string, string> = {}
    if (!nome.trim()) erros.nome = 'Digite o nome.'
    if (!valores.proteina) erros.proteina = 'Escolha a proteína.'
    if (Object.keys(erros).length) {
      setRecusados(erros)
      return
    }
    setEnviando(true)
    setRecusa(undefined)
    const corpo = { nome: nome.trim(), ...pedidoParaApi(valores) }
    try {
      const gravado = pedido
        ? await api.alterar<Pedido>(`/api/almoco/hoje/pedidos/${pedido.id}`, corpo)
        : await api.gravar<Pedido>('/api/almoco/hoje/pedidos', corpo)
      aoGravar(gravado, !pedido)
    } catch (erro) {
      setRecusa(mensagemDe(erro))
      setRecusados(camposDe(erro))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open={aberto}
      onRequestClose={aoFechar}
      modalHeading={pedido ? `Alterar o pedido de ${pedido.nome}` : 'Lançar pedido'}
      closeButtonLabel="Fechar"
      passiveModal
      size="md"
    >
      <Form autoComplete="off" onSubmit={enviar}>
        <Stack gap={5}>
          {recusa && (
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <InlineNotification
                  kind="error"
                  title={pedido ? 'A alteração foi recusada.' : 'O pedido foi recusado.'}
                  subtitle={recusa}
                  hideCloseButton
                />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <TextInput
                id="lancamento-nome"
                data-modal-primary-focus
                labelText="Para quem"
                placeholder="Nome e sobrenome"
                maxLength={80}
                value={nome}
                onChange={(evento) => {
                  setNome(evento.target.value)
                  setRecusados((antes) => ({ ...antes, nome: '' }))
                }}
                invalid={Boolean(recusados.nome)}
                invalidText={recusados.nome}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <CamposDoPedido
                prefixo="lancamento"
                cardapio={cardapio}
                valores={valores}
                erros={recusados}
                aoMudar={(novos) => {
                  setValores(novos)
                  setRecusados((antes) => ({ nome: antes.nome ?? '' }))
                }}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Acoes>
                <Button kind="secondary" size="md" onClick={aoFechar}>
                  Cancelar
                </Button>
                <Button type="submit" size="md" disabled={enviando}>
                  {pedido ? (enviando ? 'Salvando…' : 'Salvar') : enviando ? 'Lançando…' : 'Lançar pedido'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
