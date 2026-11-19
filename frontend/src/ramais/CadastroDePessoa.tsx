import { useEffect, useState, type FormEvent } from 'react'
import {
  Button,
  Column,
  ComboBox,
  Form,
  Grid,
  InlineNotification,
  Modal,
  RadioButton,
  RadioButtonGroup,
  Select,
  SelectItem,
  Stack,
  TextInput,
} from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, camposDe, mensagemDe } from '../comum/api'
import { comMascaraDeTelefone } from '../comum/formato'
import { MESES, type Pessoa } from './tipos'

type Props = {
  aberto: boolean
  pessoa?: Pessoa | null
  setores: string[]
  aoFechar: () => void
  aoGravar: (pessoa: Pessoa, nova: boolean) => void
}

// Na tela, tudo é texto (o dia e o mês vêm dos Selects); a API recebe números ou nulo.
type Valores = {
  nome: string
  setor: string
  cargo: string
  ramal: string
  email: string
  celular: string
  diaAniversario: string
  mesAniversario: string
  mostrarAniversario: boolean
}

const VAZIO: Valores = {
  nome: '',
  setor: '',
  cargo: '',
  ramal: '',
  email: '',
  celular: '',
  diaAniversario: '',
  mesAniversario: '',
  mostrarAniversario: true,
}

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1))

function valoresDe(pessoa?: Pessoa | null): Valores {
  if (!pessoa) return VAZIO
  return {
    nome: pessoa.nome,
    setor: pessoa.setor,
    cargo: pessoa.cargo ?? '',
    ramal: pessoa.ramal ?? '',
    email: pessoa.email ?? '',
    celular: pessoa.celular ?? '',
    diaAniversario: pessoa.diaAniversario ? String(pessoa.diaAniversario) : '',
    mesAniversario: pessoa.mesAniversario ? String(pessoa.mesAniversario) : '',
    mostrarAniversario: pessoa.mostrarAniversario,
  }
}

function paraApi(valores: Valores) {
  const limpo = (texto: string) => (texto.trim() ? texto.trim() : null)
  return {
    nome: valores.nome.trim(),
    setor: valores.setor.trim(),
    cargo: limpo(valores.cargo),
    ramal: limpo(valores.ramal),
    email: limpo(valores.email),
    celular: limpo(valores.celular),
    diaAniversario: valores.diaAniversario ? Number(valores.diaAniversario) : null,
    mesAniversario: valores.mesAniversario ? Number(valores.mesAniversario) : null,
    mostrarAniversario: valores.mostrarAniversario,
  }
}

// O que dá para conferir antes de enviar. O resto (o ramal de outra pessoa, o 31 de abril) o servidor recusa.
function conferir(valores: Valores): Record<string, string> {
  const erros: Record<string, string> = {}
  if (!valores.nome.trim()) erros.nome = 'Informe o nome.'
  if (!valores.setor.trim()) erros.setor = 'Informe o setor.'
  if (valores.ramal && !/^\d{1,6}$/.test(valores.ramal.trim())) erros.ramal = 'O ramal tem só números, até 6.'
  if (valores.diaAniversario && !valores.mesAniversario) erros.mesAniversario = 'Escolha o mês.'
  if (valores.mesAniversario && !valores.diaAniversario) erros.diaAniversario = 'Escolha o dia.'
  return erros
}

export function CadastroDePessoa({ aberto, pessoa, setores, aoFechar, aoGravar }: Props) {
  const alterando = Boolean(pessoa)
  const [valores, setValores] = useState<Valores>(VAZIO)
  const [recusa, setRecusa] = useState<string>()
  const [recusados, setRecusados] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setValores(valoresDe(pessoa))
    setRecusa(undefined)
    setRecusados({})
  }, [aberto, pessoa])

  function mudar<C extends keyof Valores>(campo: C, valor: Valores[C]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
    setRecusados((antes) => ({ ...antes, [campo]: '' }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const erros = conferir(valores)
    if (Object.keys(erros).length) {
      setRecusados(erros)
      return
    }
    setEnviando(true)
    setRecusa(undefined)
    try {
      const gravada = pessoa
        ? await api.alterar<Pessoa>(`/api/pessoas/${pessoa.id}`, paraApi(valores))
        : await api.gravar<Pessoa>('/api/pessoas', paraApi(valores))
      aoGravar(gravada, !pessoa)
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
      modalLabel={pessoa ? [pessoa.setor, pessoa.ramal && `ramal ${pessoa.ramal}`].filter(Boolean).join(' · ') : undefined}
      modalHeading={pessoa ? `Alterar ${pessoa.nome}` : 'Cadastrar pessoa'}
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
                id="pessoa-nome"
                data-modal-primary-focus
                labelText="Nome"
                maxLength={120}
                value={valores.nome}
                onChange={(evento) => mudar('nome', evento.target.value)}
                invalid={Boolean(recusados.nome)}
                invalidText={recusados.nome}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={4} lg={8}>
              {/* A chave recria o campo a cada abertura, para ele começar com o setor da pessoa. */}
              <ComboBox<string>
                key={aberto ? (pessoa?.id ?? 'nova') : 'fechada'}
                id="pessoa-setor"
                titleText="Setor"
                placeholder="Escolha o setor"
                helperText="Escolha um da lista ou escreva um novo."
                items={setores}
                initialSelectedItem={pessoa?.setor}
                allowCustomValue
                onInputChange={(texto) => mudar('setor', texto ?? '')}
                onChange={({ selectedItem }) => {
                  if (selectedItem) mudar('setor', selectedItem)
                }}
                invalid={Boolean(recusados.setor)}
                invalidText={recusados.setor}
              />
            </Column>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="pessoa-cargo"
                labelText="Cargo (opcional)"
                maxLength={80}
                value={valores.cargo}
                onChange={(evento) => mudar('cargo', evento.target.value)}
                invalid={Boolean(recusados.cargo)}
                invalidText={recusados.cargo}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="pessoa-ramal"
                labelText="Ramal (opcional)"
                helperText="O número que se disca do telefone da mesa."
                inputMode="numeric"
                maxLength={6}
                value={valores.ramal}
                onChange={(evento) => mudar('ramal', evento.target.value.replace(/\D/g, ''))}
                invalid={Boolean(recusados.ramal)}
                invalidText={recusados.ramal}
              />
            </Column>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="pessoa-email"
                type="email"
                labelText="E-mail (opcional)"
                maxLength={255}
                value={valores.email}
                onChange={(evento) => mudar('email', evento.target.value)}
                invalid={Boolean(recusados.email)}
                invalidText={recusados.email}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="pessoa-celular"
                labelText="Celular (opcional)"
                helperText="Com DDD. Na lista, abre a conversa no WhatsApp."
                placeholder="(31) 91234-5678"
                inputMode="tel"
                value={valores.celular}
                onChange={(evento) => mudar('celular', comMascaraDeTelefone(evento.target.value))}
                invalid={Boolean(recusados.celular)}
                invalidText={recusados.celular}
              />
            </Column>
            <Column sm={2} md={2} lg={3}>
              <Select
                id="pessoa-dia"
                labelText="Aniversário (opcional)"
                helperText="Só o dia e o mês."
                value={valores.diaAniversario}
                onChange={(evento) => mudar('diaAniversario', evento.target.value)}
                invalid={Boolean(recusados.diaAniversario)}
                invalidText={recusados.diaAniversario}
              >
                <SelectItem value="" text="Dia" />
                {DIAS.map((dia) => (
                  <SelectItem key={dia} value={dia} text={dia} />
                ))}
              </Select>
            </Column>
            <Column sm={2} md={2} lg={5}>
              <Select
                id="pessoa-mes"
                labelText="Mês"
                value={valores.mesAniversario}
                onChange={(evento) => mudar('mesAniversario', evento.target.value)}
                invalid={Boolean(recusados.mesAniversario)}
                invalidText={recusados.mesAniversario}
              >
                <SelectItem value="" text="Mês" />
                {MESES.map((nome, posicao) => (
                  <SelectItem key={nome} value={String(posicao + 1)} text={nome} />
                ))}
              </Select>
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <RadioButtonGroup
                legendText="O aniversário aparece no Início e no sino?"
                name="pessoa-mostrar"
                valueSelected={valores.mostrarAniversario ? 'sim' : 'nao'}
                onChange={(valor) => mudar('mostrarAniversario', valor === 'sim')}
                helperText="Escolha Não divulgar se a pessoa preferir."
              >
                <RadioButton id="pessoa-mostrar-sim" labelText="Mostrar" value="sim" />
                <RadioButton id="pessoa-mostrar-nao" labelText="Não divulgar" value="nao" />
              </RadioButtonGroup>
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
