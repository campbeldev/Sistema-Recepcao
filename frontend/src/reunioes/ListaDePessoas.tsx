import { Button, Column, ComboBox, Grid, IconButton } from '@carbon/react'
import { Add, TrashCan } from '@carbon/icons-react'
import { LinhaDeCampos, combinaComBusca } from 'campbel-ui'
import { rotuloDo, type Contato } from '../contatos/tipos'

// Uma linha por pessoa escolhida (anfitrião ou participante), com a lixeira e o botão de adicionar embaixo.
// A linha guarda uma chave própria para o React não confundir as linhas quando uma sai do meio.

export type Linha = { chave: number; contato: Contato | null }

let proximaChave = 1
export function novaLinha(contato: Contato | null = null): Linha {
  return { chave: proximaChave++, contato }
}

// Quem não está nos contatos entra como um contato sem id, só com o nome (é assim que a API também devolve).
export function deFora(nome: string): Contato {
  return { id: 0, nomeParticipante: nome, nomeEmpresa: null, email: null, telefone: null, whatsapp: null }
}

export function ehDeFora(contato: Contato | null): boolean {
  return Boolean(contato && !contato.id)
}

type Props = {
  id: string
  rotulo: string
  adicionar: string
  contatos: Contato[]
  linhas: Linha[]
  invalido?: string
  // Aceita um nome digitado que não está nos contatos (participante de fora).
  aceitaDeFora?: boolean
  aoMudar: (linhas: Linha[]) => void
}

export function ListaDePessoas({ id, rotulo, adicionar, contatos, linhas, invalido, aceitaDeFora, aoMudar }: Props) {
  const escolhidos = new Set(linhas.map((linha) => linha.contato?.id))

  // O ComboBox avisa o nome digitado como texto (ao sair do campo) ou como inputValue (ao apertar Enter).
  function escolhaDe(selecionado: Contato | string | null | undefined, digitado?: string | null): Contato | null {
    if (typeof selecionado === 'string') return aceitaDeFora && selecionado.trim() ? deFora(selecionado.trim()) : null
    if (selecionado) return selecionado
    return aceitaDeFora && digitado?.trim() ? deFora(digitado.trim()) : null
  }

  function trocar(chave: number, contato: Contato | null) {
    aoMudar(linhas.map((linha) => (linha.chave === chave ? { ...linha, contato } : linha)))
  }

  return (
    <>
      {linhas.map((linha, posicao) => (
        <LinhaDeCampos key={linha.chave}>
          <Column sm={3} md={7} lg={15}>
            <ComboBox<Contato>
              id={`${id}-${linha.chave}`}
              titleText={rotulo}
              placeholder={aceitaDeFora ? 'Busque nos contatos ou digite o nome' : 'Busque pelo nome ou pela empresa'}
              allowCustomValue={aceitaDeFora}
              // Quem já está em outra linha não aparece de novo na lista; o de fora desta linha entra para ficar escolhido.
              items={[
                ...(linha.contato && ehDeFora(linha.contato) ? [linha.contato] : []),
                ...contatos.filter((contato) => contato.id === linha.contato?.id || !escolhidos.has(contato.id)),
              ]}
              itemToString={rotuloDo}
              selectedItem={linha.contato}
              shouldFilterItem={({ item, inputValue }) =>
                combinaComBusca(inputValue ?? '', item.nomeParticipante, item.nomeEmpresa ?? '', item.email ?? '')
              }
              onChange={({ selectedItem, inputValue }) =>
                trocar(linha.chave, escolhaDe(selectedItem as Contato | string | null | undefined, inputValue))
              }
              invalid={posicao === 0 && Boolean(invalido)}
              invalidText={invalido}
            />
          </Column>
          <Column sm={1} md={1} lg={1}>
            <IconButton
              kind="ghost"
              size="md"
              label={`Tirar este ${rotulo.toLowerCase()}`}
              disabled={linhas.length === 1}
              onClick={() => aoMudar(linhas.filter((outra) => outra.chave !== linha.chave))}
            >
              <TrashCan />
            </IconButton>
          </Column>
        </LinhaDeCampos>
      ))}
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <Button kind="ghost" size="md" renderIcon={Add} onClick={() => aoMudar([...linhas, novaLinha()])}>
            {adicionar}
          </Button>
        </Column>
      </Grid>
    </>
  )
}
