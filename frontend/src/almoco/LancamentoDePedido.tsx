import { useEffect, useState, type FormEvent } from 'react'
import { Button, Column, ComboBox, Form, Grid, InlineNotification, Modal, Stack } from '@carbon/react'
import { Acoes, combinaComBusca } from 'campbel-ui'
import { api, camposDe, mensagemDe } from '../comum/api'
import { CamposDoPedido, PEDIDO_VAZIO, pedidoParaApi, valoresDoPedido, type ValoresDoPedido } from './CamposDoPedido'
import type { Cardapio, Pedido, PessoaDoAlmoco } from './tipos'

type Props = {
  aberto: boolean
  cardapio: Cardapio
  pedido: Pedido | null
  semPedido: PessoaDoAlmoco[]
  aoFechar: () => void
  aoGravar: (pedido: Pedido, novo: boolean) => void
}

// A recepção lança o pedido de quem ligou ou falou pessoalmente, ou altera o de alguém.
// Funciona mesmo depois de fechar: é o jeito de corrigir antes de mandar o PDF.
export function LancamentoDePedido({ aberto, cardapio, pedido, semPedido, aoFechar, aoGravar }: Props) {
  const [pessoa, setPessoa] = useState<PessoaDoAlmoco | null>(null)
  const [valores, setValores] = useState<ValoresDoPedido>(PEDIDO_VAZIO)
  const [recusa, setRecusa] = useState<string>()
  const [recusados, setRecusados] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setPessoa(null)
    setValores(valoresDoPedido(pedido))
    setRecusa(undefined)
    setRecusados({})
  }, [aberto, pedido])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const pessoaId = pedido?.pessoaId ?? pessoa?.id
    const erros: Record<string, string> = {}
    if (!pessoaId) erros.pessoa = 'Escolha a pessoa.'
    if (!valores.proteina) erros.proteina = 'Escolha a proteína.'
    if (Object.keys(erros).length) {
      setRecusados(erros)
      return
    }
    setEnviando(true)
    setRecusa(undefined)
    try {
      const gravado = await api.alterar<Pedido>(`/api/almoco/hoje/pedidos/${pessoaId}`, pedidoParaApi(valores))
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
      modalLabel={pedido?.setor}
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
          {!pedido && (
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <ComboBox<PessoaDoAlmoco>
                  key={aberto ? 'aberto' : 'fechado'}
                  id="lancamento-pessoa"
                  data-modal-primary-focus
                  titleText="Para quem"
                  placeholder="Busque pelo nome"
                  helperText="Só aparece quem ainda não pediu hoje. A lista vem de Ramais."
                  items={semPedido}
                  itemToString={(item) => (item ? `${item.nome} · ${item.setor}` : '')}
                  shouldFilterItem={({ item, inputValue }) => combinaComBusca(inputValue ?? '', item.nome, item.setor)}
                  selectedItem={pessoa}
                  onChange={({ selectedItem }) => {
                    setPessoa(selectedItem ?? null)
                    setRecusados((antes) => ({ ...antes, pessoa: '' }))
                  }}
                  invalid={Boolean(recusados.pessoa)}
                  invalidText={recusados.pessoa}
                />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <CamposDoPedido
                prefixo="lancamento"
                cardapio={cardapio}
                valores={valores}
                erros={recusados}
                aoMudar={(novos) => {
                  setValores(novos)
                  setRecusados({})
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
