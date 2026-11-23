import { Button } from '@carbon/react'
import './Almoco.css'

type Props = {
  id: string
  opcoes: string[]
  escolhidos: string[]
  aoMudar: (escolhidos: string[]) => void
  erro?: string
}

// Os acompanhamentos como botões que marcam e desmarcam: o kit não tem caixa de marcar,
// e no celular um toque num botão grande é mais fácil. Marcado fica azul.
// A ordem dos escolhidos segue a do cardápio.
export function EscolhaDeAcompanhamentos({ id, opcoes, escolhidos, aoMudar, erro }: Props) {
  function alternar(nome: string) {
    const marcados = escolhidos.includes(nome) ? escolhidos.filter((outro) => outro !== nome) : [...escolhidos, nome]
    aoMudar(opcoes.filter((opcao) => marcados.includes(opcao)))
  }

  return (
    <fieldset className="cds--fieldset" id={id}>
      <legend className="cds--label">Acompanhamentos</legend>
      {opcoes.length === 0 ? (
        <p>Hoje não há acompanhamentos para escolher.</p>
      ) : (
        <div className="recepcao-escolhas">
          {opcoes.map((nome) => {
            const marcado = escolhidos.includes(nome)
            return (
              <Button
                key={nome}
                kind={marcado ? 'primary' : 'tertiary'}
                size="md"
                aria-pressed={marcado}
                onClick={() => alternar(nome)}
              >
                {nome}
              </Button>
            )
          })}
        </div>
      )}
      <div className={erro ? 'recepcao-escolhas__erro' : 'cds--form__helper-text'}>
        {erro || 'Toque para marcar ou desmarcar.'}
      </div>
    </fieldset>
  )
}
