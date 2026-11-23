import { useEffect, useState, type FormEvent } from 'react'
import {
  Button,
  Column,
  Form,
  Grid,
  IconButton,
  InlineNotification,
  Modal,
  Select,
  SelectItem,
  Stack,
  TextInput,
} from '@carbon/react'
import { Add, TrashCan } from '@carbon/icons-react'
import { Acoes, LinhaDeCampos } from 'campbel-ui'
import { api, camposDe, mensagemDe } from '../comum/api'
import { HORARIOS } from '../comum/formato'
import { emHoraCurta, type Cardapio, type Sugestao } from './tipos'

type Props = {
  aberto: boolean
  cardapio: Cardapio | null
  sugestao: Sugestao | null
  aoFechar: () => void
  aoPublicar: (cardapio: Cardapio, novo: boolean) => void
}

type Valores = { proteinas: string[]; acompanhamentos: string[]; fechaAs: string }

// Começa pelo cardápio de hoje, ou pelo último que a recepção montou, ou em branco.
// As proteínas mudam todo dia, então só os acompanhamentos e a hora vêm do último cardápio.
function valoresDe(cardapio: Cardapio | null, sugestao: Sugestao | null): Valores {
  if (cardapio) {
    return {
      proteinas: [...cardapio.proteinas],
      acompanhamentos: [...cardapio.acompanhamentos],
      fechaAs: emHoraCurta(cardapio.fechaAs),
    }
  }
  return {
    proteinas: ['', '', ''],
    acompanhamentos: sugestao?.acompanhamentos.length ? [...sugestao.acompanhamentos] : [''],
    fechaAs: sugestao ? emHoraCurta(sugestao.fechaAs) : '10:00',
  }
}

type Lista = 'proteinas' | 'acompanhamentos'

export function CardapioDoDia({ aberto, cardapio, sugestao, aoFechar, aoPublicar }: Props) {
  const [valores, setValores] = useState<Valores>(() => valoresDe(cardapio, sugestao))
  const [recusa, setRecusa] = useState<string>()
  const [erroDasProteinas, setErroDasProteinas] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setValores(valoresDe(cardapio, sugestao))
    setRecusa(undefined)
    setErroDasProteinas(undefined)
  }, [aberto, cardapio, sugestao])

  function mudarItem(lista: Lista, posicao: number, texto: string) {
    setValores((atuais) => ({ ...atuais, [lista]: atuais[lista].map((item, i) => (i === posicao ? texto : item)) }))
    if (lista === 'proteinas') setErroDasProteinas(undefined)
  }

  function tirarItem(lista: Lista, posicao: number) {
    setValores((atuais) => ({ ...atuais, [lista]: atuais[lista].filter((_, i) => i !== posicao) }))
  }

  function adicionarItem(lista: Lista) {
    setValores((atuais) => ({ ...atuais, [lista]: [...atuais[lista], ''] }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const corpo = {
      proteinas: valores.proteinas.map((item) => item.trim()).filter(Boolean),
      acompanhamentos: valores.acompanhamentos.map((item) => item.trim()).filter(Boolean),
      fechaAs: valores.fechaAs,
    }
    if (corpo.proteinas.length === 0) {
      setErroDasProteinas('Informe ao menos uma proteína.')
      return
    }
    setEnviando(true)
    setRecusa(undefined)
    try {
      const publicado = await api.alterar<Cardapio>('/api/almoco/hoje/cardapio', corpo)
      aoPublicar(publicado, !cardapio)
    } catch (erro) {
      setRecusa(mensagemDe(erro))
      setErroDasProteinas(camposDe(erro).proteinas)
    } finally {
      setEnviando(false)
    }
  }

  function linhas(lista: Lista, rotulo: string, exemplo: string) {
    return valores[lista].map((item, posicao) => (
      <LinhaDeCampos key={`${lista}-${posicao}`}>
        <Column sm={3} md={7} lg={15}>
          <TextInput
          id={`cardapio-${lista}-${posicao}`}
          data-modal-primary-focus={lista === 'proteinas' && posicao === 0 ? true : undefined}
          labelText={`${rotulo} ${posicao + 1}`}
          placeholder={posicao === 0 ? exemplo : undefined}
          maxLength={60}
          value={item}
          onChange={(evento) => mudarItem(lista, posicao, evento.target.value)}
          invalid={lista === 'proteinas' && posicao === 0 && Boolean(erroDasProteinas)}
          invalidText={erroDasProteinas}
          />
        </Column>
        <Column sm={1} md={1} lg={1}>
          <IconButton kind="ghost" size="md" label={`Tirar ${item || rotulo.toLowerCase()}`} onClick={() => tirarItem(lista, posicao)}>
            <TrashCan />
          </IconButton>
        </Column>
      </LinhaDeCampos>
    ))
  }

  return (
    <Modal
      open={aberto}
      onRequestClose={aoFechar}
      modalHeading={cardapio ? 'Alterar o cardápio do dia' : 'Montar cardápio do dia'}
      closeButtonLabel="Fechar"
      passiveModal
      size="md"
    >
      <Form autoComplete="off" onSubmit={enviar}>
        <Stack gap={5}>
          {recusa && (
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <InlineNotification kind="error" title="O cardápio foi recusado." subtitle={recusa} hideCloseButton />
              </Column>
            </Grid>
          )}
          <Stack gap={3}>
            {linhas('proteinas', 'Proteína', 'Frango ao molho')}
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <Button kind="ghost" size="md" renderIcon={Add} onClick={() => adicionarItem('proteinas')}>
                  Adicionar proteína
                </Button>
              </Column>
            </Grid>
          </Stack>
          <Stack gap={3}>
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <p className="cds--form__helper-text">
                  {sugestao || cardapio
                    ? 'Os acompanhamentos vêm do último cardápio. Adicione ou tire o que mudou: a lista fica salva para os próximos dias.'
                    : 'Cadastre os acompanhamentos de sempre. Eles ficam salvos e aparecem já preenchidos nos próximos dias.'}
                </p>
              </Column>
            </Grid>
            {linhas('acompanhamentos', 'Acompanhamento', 'Arroz')}
            <Grid>
              <Column sm={4} md={8} lg={16}>
                <Button kind="ghost" size="md" renderIcon={Add} onClick={() => adicionarItem('acompanhamentos')}>
                  Adicionar acompanhamento
                </Button>
              </Column>
            </Grid>
          </Stack>
          <Grid>
            <Column sm={4} md={4} lg={8}>
              <Select
                id="cardapio-fecha-as"
                labelText="Fechar os pedidos às"
                helperText="Nessa hora o link para de aceitar pedidos e o PDF fica pronto."
                value={valores.fechaAs}
                onChange={(evento) => setValores((atuais) => ({ ...atuais, fechaAs: evento.target.value }))}
              >
                {HORARIOS.map((hora) => (
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
                  {cardapio ? (enviando ? 'Salvando…' : 'Salvar') : enviando ? 'Publicando…' : 'Publicar cardápio'}
                </Button>
              </Acoes>
            </Column>
          </Grid>
        </Stack>
      </Form>
    </Modal>
  )
}
