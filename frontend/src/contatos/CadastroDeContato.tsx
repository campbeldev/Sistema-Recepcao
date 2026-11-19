import { useEffect, useState, type FormEvent } from 'react'
import { Button, Column, Form, Grid, InlineNotification, Modal, Stack, TextInput } from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, camposDe, mensagemDe } from '../comum/api'
import { comMascaraDeQualquerTelefone, comMascaraDeTelefone } from '../comum/formato'
import type { Contato } from './tipos'

type Props = {
  aberto: boolean
  contato?: Contato | null
  aoFechar: () => void
  aoGravar: (contato: Contato, novo: boolean) => void
}

type Valores = Omit<Contato, 'id'>

const VAZIO: Valores = {
  nomeParticipante: '',
  nomeEmpresa: '',
  email: '',
  telefone: '',
  whatsapp: '',
}

function valoresDe(contato?: Contato | null): Valores {
  if (!contato) return VAZIO
  return {
    nomeParticipante: contato.nomeParticipante,
    nomeEmpresa: contato.nomeEmpresa ?? '',
    email: contato.email ?? '',
    telefone: contato.telefone ?? '',
    whatsapp: contato.whatsapp ?? '',
  }
}

// Campo vazio vai como nulo, e não como texto vazio.
function paraApi(valores: Valores): Valores {
  const limpo = (texto: string | null) => (texto && texto.trim() ? texto.trim() : null)
  return {
    nomeParticipante: valores.nomeParticipante.trim(),
    nomeEmpresa: limpo(valores.nomeEmpresa),
    email: limpo(valores.email),
    telefone: limpo(valores.telefone),
    whatsapp: limpo(valores.whatsapp),
  }
}

export function CadastroDeContato({ aberto, contato, aoFechar, aoGravar }: Props) {
  const alterando = Boolean(contato)
  const [valores, setValores] = useState<Valores>(VAZIO)
  const [recusa, setRecusa] = useState<string>()
  const [recusados, setRecusados] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setValores(valoresDe(contato))
    setRecusa(undefined)
    setRecusados({})
  }, [aberto, contato])

  function mudar(campo: keyof Valores, valor: string) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
    setRecusados((antes) => ({ ...antes, [campo]: '' }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!valores.nomeParticipante.trim()) {
      setRecusados({ nomeParticipante: 'Informe o nome.' })
      return
    }
    setEnviando(true)
    setRecusa(undefined)
    try {
      const gravado = contato
        ? await api.alterar<Contato>(`/contatos/${contato.id}`, paraApi(valores))
        : await api.gravar<Contato>('/contatos', paraApi(valores))
      aoGravar(gravado, !contato)
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
      modalHeading={contato ? `Alterar ${contato.nomeParticipante}` : 'Cadastrar contato'}
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
                  title={alterando ? 'A alteração foi recusada.' : 'O cadastro foi recusado.'}
                  subtitle={recusa}
                  hideCloseButton
                />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <TextInput
                id="contato-nome"
                data-modal-primary-focus
                labelText="Nome"
                maxLength={255}
                value={valores.nomeParticipante}
                onChange={(evento) => mudar('nomeParticipante', evento.target.value)}
                invalid={Boolean(recusados.nomeParticipante)}
                invalidText={recusados.nomeParticipante}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="contato-empresa"
                labelText="Empresa (opcional)"
                maxLength={255}
                value={valores.nomeEmpresa ?? ''}
                onChange={(evento) => mudar('nomeEmpresa', evento.target.value)}
              />
            </Column>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="contato-email"
                type="email"
                labelText="E-mail (opcional)"
                helperText="É para onde vão a confirmação e o lembrete das reuniões."
                maxLength={255}
                value={valores.email ?? ''}
                onChange={(evento) => mudar('email', evento.target.value)}
                invalid={Boolean(recusados.email)}
                invalidText={recusados.email}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="contato-whatsapp"
                labelText="WhatsApp (opcional)"
                placeholder="(11) 91234-5678"
                inputMode="tel"
                value={valores.whatsapp ?? ''}
                onChange={(evento) => mudar('whatsapp', comMascaraDeTelefone(evento.target.value))}
                invalid={Boolean(recusados.whatsapp)}
                invalidText={recusados.whatsapp}
              />
            </Column>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="contato-telefone"
                labelText="Telefone (opcional)"
                helperText="Fixo ou celular, com ou sem DDD."
                placeholder="3456-7890"
                inputMode="tel"
                value={valores.telefone ?? ''}
                onChange={(evento) => mudar('telefone', comMascaraDeQualquerTelefone(evento.target.value))}
                invalid={Boolean(recusados.telefone)}
                invalidText={recusados.telefone}
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
                  {alterando ? (enviando ? 'Salvando…' : 'Salvar') : enviando ? 'Cadastrando…' : 'Cadastrar'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
