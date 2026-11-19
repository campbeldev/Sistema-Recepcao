import { useEffect, useState, type FormEvent } from 'react'
import {
  Button,
  Column,
  DatePicker,
  DatePickerInput,
  Form,
  Grid,
  InlineNotification,
  Modal,
  Select,
  SelectItem,
  Stack,
  TextArea,
  TextInput,
} from '@carbon/react'
import { Acoes } from 'campbel-ui'
import { api, camposDe, mensagemDe } from '../comum/api'
import { HORARIOS, dataParaApi, emData } from '../comum/formato'
import { porNome, type Contato } from '../contatos/tipos'
import { ListaDePessoas, novaLinha, type Linha } from './ListaDePessoas'
import { SALAS, type Reuniao } from './tipos'

// A janela de agendar e de alterar uma reunião (molde do cadastro).
// `reuniao` preenchida é alteração; `participante` já começa na lista quando vem da tela de Contatos.

type Props = {
  aberto: boolean
  reuniao?: Reuniao | null
  participante?: Contato | null
  aoFechar: () => void
  aoGravar: (reuniao: Reuniao, nova: boolean) => void
}

type Valores = {
  titulo: string
  data: string
  hora: string
  sala: string
  empresa: string
  motivo: string
  anfitrioes: Linha[]
  participantes: Linha[]
}

function valoresDe(reuniao?: Reuniao | null, participante?: Contato | null): Valores {
  if (!reuniao) {
    return {
      titulo: '',
      data: '',
      hora: '',
      sala: '',
      empresa: participante?.nomeEmpresa ?? '',
      motivo: '',
      anfitrioes: [novaLinha()],
      participantes: [novaLinha(participante ?? null)],
    }
  }
  const comLinha = (linhas: Linha[]) => (linhas.length > 0 ? linhas : [novaLinha()])
  return {
    titulo: reuniao.titulo,
    data: reuniao.datahoraReuniao.slice(0, 10),
    hora: reuniao.datahoraReuniao.slice(11, 16),
    sala: reuniao.sala ?? '',
    empresa: reuniao.empresaReuniao ?? '',
    motivo: reuniao.motivo ?? '',
    anfitrioes: comLinha(reuniao.anfitrioes.map((pessoa) => novaLinha(pessoa.contato))),
    participantes: comLinha(reuniao.participantes.map((pessoa) => novaLinha(pessoa.contato))),
  }
}

function idsDe(linhas: Linha[]) {
  return linhas.filter((linha) => linha.contato).map((linha) => ({ contato: { id: linha.contato!.id } }))
}

export function CadastroDeReuniao({ aberto, reuniao, participante, aoFechar, aoGravar }: Props) {
  const alterando = Boolean(reuniao)
  const [valores, setValores] = useState<Valores>(() => valoresDe(reuniao, participante))
  const [contatos, setContatos] = useState<Contato[]>([])
  const [recusa, setRecusa] = useState<string>()
  const [recusados, setRecusados] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setValores(valoresDe(reuniao, participante))
    setRecusa(undefined)
    setRecusados({})
    api
      .ler<Contato[]>('/contatos')
      .then((lidos) => setContatos([...lidos].sort(porNome)))
      .catch((erro) => setRecusa(`Não foi possível carregar os contatos. ${mensagemDe(erro)}`))
  }, [aberto, reuniao, participante])

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
    setRecusados((antes) => ({ ...antes, [campo]: '' }))
  }

  // O que a tela confere antes de enviar; o resto o servidor confere.
  function faltando(): Record<string, string> {
    const falta: Record<string, string> = {}
    if (!valores.titulo.trim()) falta.titulo = 'Informe o título.'
    if (!valores.data) falta.data = 'Escolha o dia.'
    if (!valores.hora) falta.hora = 'Escolha a hora.'
    if (!valores.anfitrioes.some((linha) => linha.contato)) falta.anfitrioes = 'Escolha quem recebe a reunião.'
    return falta
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const falta = faltando()
    if (Object.keys(falta).length > 0) {
      setRecusados(falta)
      return
    }
    setEnviando(true)
    setRecusa(undefined)
    const corpo = {
      titulo: valores.titulo.trim(),
      datahoraReuniao: `${valores.data}T${valores.hora}`,
      sala: valores.sala || null,
      empresaReuniao: valores.empresa.trim() || null,
      motivo: valores.motivo.trim() || null,
      anfitrioes: idsDe(valores.anfitrioes),
      participantes: idsDe(valores.participantes),
    }
    try {
      const gravada = reuniao
        ? await api.alterar<Reuniao>(`/reunioes/${reuniao.id}`, corpo)
        : await api.gravar<Reuniao>('/reunioes', corpo)
      aoGravar(gravada, !reuniao)
    } catch (erro) {
      const campos = camposDe(erro)
      setRecusa(mensagemDe(erro))
      setRecusados({ ...campos, data: campos.datahoraReuniao ?? '' })
    } finally {
      setEnviando(false)
    }
  }

  const horarios = valores.hora && !HORARIOS.includes(valores.hora) ? [valores.hora, ...HORARIOS].sort() : HORARIOS

  return (
    <Modal
      open={aberto}
      onRequestClose={aoFechar}
      modalLabel={reuniao ? `Marcada para ${emData(reuniao.datahoraReuniao)}` : undefined}
      modalHeading={reuniao ? `Alterar ${reuniao.titulo}` : 'Agendar reunião'}
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
                  title={alterando ? 'A alteração foi recusada.' : 'O agendamento foi recusado.'}
                  subtitle={recusa}
                  hideCloseButton
                />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <TextInput
                id="reuniao-titulo"
                data-modal-primary-focus
                labelText="Título"
                maxLength={255}
                value={valores.titulo}
                onChange={(evento) => mudar('titulo', evento.target.value)}
                invalid={Boolean(recusados.titulo)}
                invalidText={recusados.titulo}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={4} lg={8}>
              <DatePicker
                datePickerType="single"
                dateFormat="d/m/Y"
                locale="pt"
                value={valores.data ? [emData(valores.data)] : []}
                onChange={(datas) => mudar('data', dataParaApi(datas[0]))}
              >
                <DatePickerInput
                  id="reuniao-data"
                  labelText="Dia"
                  placeholder="dd/mm/aaaa"
                  invalid={Boolean(recusados.data)}
                  invalidText={recusados.data}
                />
              </DatePicker>
            </Column>
            <Column sm={4} md={4} lg={8}>
              <Select
                id="reuniao-hora"
                labelText="Hora"
                value={valores.hora}
                onChange={(evento) => mudar('hora', evento.target.value)}
                invalid={Boolean(recusados.hora)}
                invalidText={recusados.hora}
              >
                <SelectItem value="" text="Escolha a hora" />
                {horarios.map((hora) => (
                  <SelectItem key={hora} value={hora} text={hora} />
                ))}
              </Select>
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={4} lg={8}>
              <Select
                id="reuniao-sala"
                labelText="Sala (opcional)"
                value={valores.sala}
                onChange={(evento) => mudar('sala', evento.target.value)}
                invalid={Boolean(recusados.sala)}
                invalidText={recusados.sala}
              >
                <SelectItem value="" text="Sem sala" />
                {SALAS.map((sala) => (
                  <SelectItem key={sala.valor} value={sala.valor} text={sala.nome} />
                ))}
              </Select>
            </Column>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="reuniao-empresa"
                labelText="Empresa (opcional)"
                helperText="A empresa que vem para a reunião."
                maxLength={255}
                value={valores.empresa}
                onChange={(evento) => mudar('empresa', evento.target.value)}
              />
            </Column>
          </Grid>

          <ListaDePessoas
            id="anfitriao"
            rotulo="Anfitrião"
            adicionar="Adicionar anfitrião"
            contatos={contatos}
            linhas={valores.anfitrioes}
            invalido={recusados.anfitrioes}
            aoMudar={(linhas) => mudar('anfitrioes', linhas)}
          />
          <ListaDePessoas
            id="participante"
            rotulo="Participante"
            adicionar="Adicionar participante"
            contatos={contatos}
            linhas={valores.participantes}
            aoMudar={(linhas) => mudar('participantes', linhas)}
          />

          <Grid>
            <Column sm={4} md={8} lg={16}>
              <TextArea
                id="reuniao-motivo"
                labelText="Motivo ou pauta (opcional)"
                helperText="Vai no e-mail de confirmação que anfitriões e participantes recebem."
                rows={3}
                maxCount={255}
                enableCounter
                value={valores.motivo}
                onChange={(evento) => mudar('motivo', evento.target.value)}
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
                  {alterando ? (enviando ? 'Salvando…' : 'Salvar') : enviando ? 'Agendando…' : 'Agendar'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
