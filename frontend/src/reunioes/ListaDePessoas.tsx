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

type Props = {
  id: string
  rotulo: string
  adicionar: string
  contatos: Contato[]
  linhas: Linha[]
  invalido?: string
  aoMudar: (linhas: Linha[]) => void
}

export function ListaDePessoas({ id, rotulo, adicionar, contatos, linhas, invalido, aoMudar }: Props) {
  const escolhidos = new Set(linhas.map((linha) => linha.contato?.id))

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
              placeholder="Busque pelo nome ou pela empresa"
              // Quem já está em outra linha não aparece de novo na lista.
              items={contatos.filter((contato) => contato.id === linha.contato?.id || !escolhidos.has(contato.id))}
              itemToString={rotuloDo}
              selectedItem={linha.contato}
              shouldFilterItem={({ item, inputValue }) =>
                combinaComBusca(inputValue ?? '', item.nomeParticipante, item.nomeEmpresa ?? '', item.email ?? '')
              }
              onChange={({ selectedItem }) => trocar(linha.chave, selectedItem ?? null)}
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
