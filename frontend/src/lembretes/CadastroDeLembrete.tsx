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
import { HORARIOS, dataParaApi, emData, emMomento, hojeNaApi } from '../comum/formato'
import { horaDo, type Lembrete } from './tipos'

// A janela de anotar e de alterar um lembrete (molde do cadastro).

type Props = {
  aberto: boolean
  lembrete?: Lembrete | null
  aoFechar: () => void
  aoGravar: (lembrete: Lembrete, novo: boolean) => void
}

type Valores = { descricao: string; paraQuem: string; dia: string; hora: string }

function valoresDe(lembrete?: Lembrete | null): Valores {
  if (!lembrete) return { descricao: '', paraQuem: '', dia: hojeNaApi(), hora: '' }
  return {
    descricao: lembrete.descricao,
    paraQuem: lembrete.paraQuem ?? '',
    dia: lembrete.dia,
    hora: horaDo(lembrete) ?? '',
  }
}

export function CadastroDeLembrete({ aberto, lembrete, aoFechar, aoGravar }: Props) {
  const alterando = Boolean(lembrete)
  const [valores, setValores] = useState<Valores>(() => valoresDe(lembrete))
  const [recusa, setRecusa] = useState<string>()
  const [recusados, setRecusados] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setValores(valoresDe(lembrete))
    setRecusa(undefined)
    setRecusados({})
  }, [aberto, lembrete])

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
    setRecusados((antes) => ({ ...antes, [campo]: '' }))
  }

  function faltando(): Record<string, string> {
    const falta: Record<string, string> = {}
    if (!valores.descricao.trim()) falta.descricao = 'Informe o que lembrar.'
    if (!valores.dia) falta.dia = 'Escolha o dia.'
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
      descricao: valores.descricao.trim(),
      paraQuem: valores.paraQuem.trim() || null,
      dia: valores.dia,
      hora: valores.hora || null,
    }
    try {
      const gravado = lembrete
        ? await api.alterar<Lembrete>(`/api/lembretes/${lembrete.id}`, corpo)
        : await api.gravar<Lembrete>('/api/lembretes', corpo)
      aoGravar(gravado, !lembrete)
    } catch (erro) {
      setRecusa(mensagemDe(erro))
      setRecusados(camposDe(erro))
    } finally {
      setEnviando(false)
    }
  }

  const horarios = valores.hora && !HORARIOS.includes(valores.hora) ? [valores.hora, ...HORARIOS].sort() : HORARIOS

  return (
    <Modal
      open={aberto}
      onRequestClose={aoFechar}
      modalLabel={lembrete ? `Anotado por ${lembrete.criadoPor} em ${emMomento(lembrete.criadoEm)}` : undefined}
      modalHeading={lembrete ? 'Alterar lembrete' : 'Anotar lembrete'}
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
                  title={alterando ? 'A alteração foi recusada.' : 'O lembrete foi recusado.'}
                  subtitle={recusa}
                  hideCloseButton
                />
              </Column>
            </Grid>
          )}
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <TextArea
                id="lembrete-descricao"
                data-modal-primary-focus
                labelText="O que lembrar"
                placeholder="Ex.: buscar o exame no laboratório"
                rows={3}
                maxCount={500}
                enableCounter
                value={valores.descricao}
                onChange={(evento) => mudar('descricao', evento.target.value)}
                invalid={Boolean(recusados.descricao)}
                invalidText={recusados.descricao}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <TextInput
                id="lembrete-para-quem"
                labelText="Para quem (opcional)"
                helperText="Quem pediu ou quem precisa saber."
                maxLength={120}
                value={valores.paraQuem}
                onChange={(evento) => mudar('paraQuem', evento.target.value)}
              />
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={4} lg={8}>
              <DatePicker
                datePickerType="single"
                dateFormat="d/m/Y"
                locale="pt"
                value={valores.dia ? [emData(valores.dia)] : []}
                onChange={(datas) => mudar('dia', dataParaApi(datas[0]))}
              >
                <DatePickerInput
                  id="lembrete-dia"
                  labelText="Dia"
                  placeholder="dd/mm/aaaa"
                  invalid={Boolean(recusados.dia)}
                  invalidText={recusados.dia}
                />
              </DatePicker>
            </Column>
            <Column sm={4} md={4} lg={8}>
              <Select
                id="lembrete-hora"
                labelText="Hora (opcional)"
                value={valores.hora}
                onChange={(evento) => mudar('hora', evento.target.value)}
              >
                <SelectItem value="" text="O dia todo" />
                {horarios.map((hora) => (
                  <SelectItem key={hora} value={hora} text={hora} />
                ))}
              </Select>
            </Column>
          </Grid>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <Acoes>
                <Button kind="secondary" size="md" onClick={aoFechar}>
                  Cancelar
                </Button>
                <Button type="submit" size="md" disabled={enviando}>
                  {alterando ? (enviando ? 'Salvando…' : 'Salvar') : enviando ? 'Anotando…' : 'Anotar'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
