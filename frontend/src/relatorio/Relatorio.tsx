import { useEffect, useState, type FormEvent } from 'react'
import { Button, Column, ComboBox, Form, Grid, RadioButton, RadioButtonGroup, Select, SelectItem, Stack } from '@carbon/react'
import { combinaComBusca } from 'campbel-ui'
import { api } from '../comum/api'
import { porNome, rotuloDo, type Contato } from '../contatos/tipos'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const hoje = new Date()
const ANOS = Array.from({ length: 4 }, (_, i) => hoje.getFullYear() - 2 + i)

// O relatório é um arquivo: o navegador baixa direto de /api/relatorio/exportar, com a sessão de quem está aqui.
export function Relatorio() {
  const [mes, setMes] = useState(String(hoje.getMonth() + 1))
  const [ano, setAno] = useState(String(hoje.getFullYear()))
  const [formato, setFormato] = useState('xlsx')
  const [canceladas, setCanceladas] = useState('incluir')
  const [contatos, setContatos] = useState<Contato[]>([])
  const [contato, setContato] = useState<Contato | null>(null)
  const [papel, setPapel] = useState('QUALQUER')
  const [lembretes, setLembretes] = useState('excluir')

  useEffect(() => {
    api
      .ler<Contato[]>('/contatos')
      .then((lista) => setContatos([...lista].sort(porNome)))
      .catch(() => setContatos([]))
  }, [])

  function baixar(evento: FormEvent) {
    evento.preventDefault()
    const consulta = new URLSearchParams({
      mes,
      ano,
      tipo: formato,
      excluirCanceladas: String(canceladas === 'excluir'),
      incluirLembretes: String(lembretes === 'incluir'),
    })
    if (contato) {
      consulta.set('contato', String(contato.id))
      consulta.set('papel', papel)
    }
    window.location.assign(`/api/relatorio/exportar?${consulta}`)
  }

  return (
    <Form autoComplete="off" onSubmit={baixar}>
      <Stack gap={6}>
        <Grid>
          <Column sm={2} md={2} lg={3}>
            <Select id="relatorio-mes" labelText="Mês" value={mes} onChange={(evento) => setMes(evento.target.value)}>
              {MESES.map((nome, posicao) => (
                <SelectItem key={nome} value={String(posicao + 1)} text={nome} />
              ))}
            </Select>
          </Column>
          <Column sm={2} md={2} lg={3}>
            <Select id="relatorio-ano" labelText="Ano" value={ano} onChange={(evento) => setAno(evento.target.value)}>
              {ANOS.map((valor) => (
                <SelectItem key={valor} value={String(valor)} text={String(valor)} />
              ))}
            </Select>
          </Column>
          <Column sm={4} md={4} lg={10}>
            <ComboBox<Contato>
              id="relatorio-contato"
              titleText="Contato (opcional)"
              placeholder="Todos os contatos"
              helperText="Escolha um contato para ver só as reuniões em que ele esteve."
              items={contatos}
              itemToString={rotuloDo}
              selectedItem={contato}
              shouldFilterItem={({ item, inputValue }) =>
                combinaComBusca(inputValue ?? '', item.nomeParticipante, item.nomeEmpresa ?? '', item.email ?? '')
              }
              onChange={({ selectedItem }) => setContato(selectedItem ?? null)}
            />
          </Column>
        </Grid>
        <Grid>
          <Column sm={4} md={4} lg={5}>
            <RadioButtonGroup
              legendText="Papel do contato na reunião"
              name="relatorio-papel"
              orientation="vertical"
              valueSelected={papel}
              onChange={(valor) => setPapel(String(valor))}
              disabled={!contato}
              helperText={contato ? undefined : 'Vale quando um contato é escolhido.'}
            >
              <RadioButton id="papel-qualquer" value="QUALQUER" labelText="Qualquer papel" />
              <RadioButton id="papel-anfitriao" value="ANFITRIAO" labelText="Só como anfitrião" />
              <RadioButton id="papel-participante" value="PARTICIPANTE" labelText="Só como participante" />
            </RadioButtonGroup>
          </Column>
          <Column sm={4} md={4} lg={4}>
            <RadioButtonGroup
              legendText="Reuniões canceladas"
              name="relatorio-canceladas"
              orientation="vertical"
              valueSelected={canceladas}
              onChange={(valor) => setCanceladas(String(valor))}
            >
              <RadioButton id="canceladas-incluir" value="incluir" labelText="Entram no relatório" />
              <RadioButton id="canceladas-excluir" value="excluir" labelText="Ficam de fora" />
            </RadioButtonGroup>
          </Column>
          <Column sm={4} md={4} lg={4}>
            <RadioButtonGroup
              legendText="Lembretes do mês"
              name="relatorio-lembretes"
              orientation="vertical"
              valueSelected={lembretes}
              onChange={(valor) => setLembretes(String(valor))}
              helperText="Entram numa tabela separada, depois das reuniões."
            >
              <RadioButton id="lembretes-excluir" value="excluir" labelText="Ficam de fora" />
              <RadioButton id="lembretes-incluir" value="incluir" labelText="Entram no relatório" />
            </RadioButtonGroup>
          </Column>
          <Column sm={4} md={4} lg={3}>
            <RadioButtonGroup
              legendText="Formato"
              name="relatorio-formato"
              orientation="vertical"
              valueSelected={formato}
              onChange={(valor) => setFormato(String(valor))}
              helperText="A planilha abre direto no Excel. O PDF é para imprimir ou enviar."
            >
              <RadioButton id="formato-xlsx" value="xlsx" labelText="Planilha (Excel)" />
              <RadioButton id="formato-pdf" value="pdf" labelText="Documento (PDF)" />
            </RadioButtonGroup>
          </Column>
        </Grid>
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <Button type="submit">Baixar relatório</Button>
          </Column>
        </Grid>
      </Stack>
    </Form>
  )
}
