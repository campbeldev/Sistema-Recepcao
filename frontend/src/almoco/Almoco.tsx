import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  DataTableSkeleton,
  InlineNotification,
  OverflowMenu,
  OverflowMenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  Tile,
} from '@carbon/react'
import { Add } from '@carbon/icons-react'
import { Acoes, CampoDeBusca, Confirmacao, Etiqueta, Numero, Numeros, SegundaLinha, combinaComBusca } from 'campbel-ui'
import { api, mensagemDe } from '../comum/api'
import { VAZIO, emHora, emNumero } from '../comum/formato'
import { CancelamentoDePedido } from './CancelamentoDePedido'
import { CardapioDoDia } from './CardapioDoDia'
import { LancamentoDePedido } from './LancamentoDePedido'
import { MensagemDoGrupo } from './MensagemDoGrupo'
import {
  acompanhamentosDo,
  emLista,
  nomesRepetidos,
  normalizado,
  quantosDe,
  situacaoDo,
  type Cardapio,
  type Painel,
  type Pedido,
} from './tipos'
import './Almoco.css'

const COLUNAS = 6

export function Almoco() {
  const [painel, setPainel] = useState<Painel>()
  const [falha, setFalha] = useState<string>()
  const [busca, setBusca] = useState('')
  const [montando, setMontando] = useState(false)
  const [mensagem, setMensagem] = useState(false)
  const [lancando, setLancando] = useState(false)
  const [alterando, setAlterando] = useState<Pedido | null>(null)
  const [cancelando, setCancelando] = useState<Pedido | null>(null)
  const [aviso, setAviso] = useState<string>()
  const [recusa, setRecusa] = useState<string>()

  const carregar = useCallback(() => {
    api
      .ler<Painel>('/api/almoco/hoje')
      .then((lido) => {
        setPainel(lido)
        setFalha(undefined)
      })
      .catch((erro) => setFalha(mensagemDe(erro)))
  }, [])

  useEffect(carregar, [carregar])

  // O link fecha sozinho na hora marcada: a tela confere de minuto em minuto, e os pedidos novos aparecem.
  useEffect(() => {
    const relogio = window.setInterval(carregar, 60_000)
    return () => window.clearInterval(relogio)
  }, [carregar])

  function feito(texto: string) {
    setAviso(texto)
    setRecusa(undefined)
    carregar()
  }

  async function fecharOuReabrir(cardapio: Cardapio) {
    setRecusa(undefined)
    try {
      if (cardapio.aberto) {
        await api.gravar<Cardapio>('/api/almoco/hoje/fechar')
        feito('Pedidos fechados.')
      } else {
        const reaberto = await api.gravar<Cardapio>('/api/almoco/hoje/reabrir')
        feito(`Pedidos reabertos até ${reaberto.fechaAs.slice(0, 5)}.`)
      }
    } catch (erro) {
      setRecusa(mensagemDe(erro))
    }
  }

  if (falha) {
    return <InlineNotification kind="error" title="Não foi possível carregar o almoço." subtitle={falha} hideCloseButton />
  }

  if (!painel) {
    return <DataTableSkeleton columnCount={COLUNAS} showHeader={false} showToolbar={false} />
  }

  const { cardapio, pedidos } = painel
  const repetidos = nomesRepetidos(pedidos)
  const encontrados = pedidos.filter((pedido) =>
    combinaComBusca(busca, pedido.nome, pedido.proteina, pedido.acompanhamentos.join(' '), pedido.observacao ?? ''),
  )

  return (
    <Stack gap={5}>
      {aviso && <Confirmacao texto={aviso} aoFechar={() => setAviso(undefined)} />}
      {recusa && (
        <InlineNotification
          kind="error"
          title="A mudança foi recusada."
          subtitle={recusa}
          onClose={() => setRecusa(undefined)}
        />
      )}

      {!cardapio ? (
        <Tile>
          <Stack gap={5}>
            <p>O cardápio de hoje ainda não foi montado. Monte com as proteínas que o restaurante mandou e depois cole a mensagem no grupo.</p>
            <div>
              <Button renderIcon={Add} onClick={() => setMontando(true)}>
                Montar cardápio do dia
              </Button>
            </div>
          </Stack>
        </Tile>
      ) : (
        <>
          <Numeros>
            <Numero rotulo="Pratos" valor={emNumero(pedidos.length)} detalhe={situacaoDo(cardapio)} />
            {cardapio.proteinas.map((proteina) => (
              <Numero key={proteina} rotulo={proteina} valor={emNumero(quantosDe(pedidos, proteina))} />
            ))}
          </Numeros>

          <Tile>
            <div className="recepcao-cardapio">
              <div className="recepcao-cardapio__linha">
                <span className="recepcao-cardapio__rotulo">Proteínas</span>
                <span>{emLista(cardapio.proteinas)}</span>
              </div>
              <div className="recepcao-cardapio__linha">
                <span className="recepcao-cardapio__rotulo">Acompanhamentos</span>
                <span>{cardapio.acompanhamentos.length ? cardapio.acompanhamentos.join(', ') : VAZIO}</span>
              </div>
              <Acoes>
                <Button kind="secondary" size="md" onClick={() => setMontando(true)}>
                  Alterar cardápio
                </Button>
                <Button kind="secondary" size="md" onClick={() => fecharOuReabrir(cardapio)}>
                  {cardapio.aberto ? 'Fechar pedidos' : 'Reabrir pedidos'}
                </Button>
                <Button kind="secondary" size="md" onClick={() => setMensagem(true)}>
                  Mensagem do grupo
                </Button>
                <Button size="md" onClick={() => window.location.assign('/api/almoco/hoje/pdf')}>
                  Baixar PDF
                </Button>
              </Acoes>
            </div>
          </Tile>

          <TableContainer>
            <TableToolbar>
              <TableToolbarContent>
                <CampoDeBusca texto="Buscar por nome, proteína ou acompanhamento" aoBuscar={setBusca} />
                <Button renderIcon={Add} onClick={() => setLancando(true)}>
                  Lançar pedido
                </Button>
              </TableToolbarContent>
            </TableToolbar>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Nome</TableHeader>
                  <TableHeader>Proteína</TableHeader>
                  <TableHeader className="campbel-so-no-computador">Acompanhamentos</TableHeader>
                  <TableHeader className="campbel-so-no-computador">Observação</TableHeader>
                  <TableHeader className="campbel-so-no-computador">Pedido às</TableHeader>
                  <TableHeader aria-label="Ações" />
                </TableRow>
              </TableHead>
              <TableBody>
                {encontrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={COLUNAS}>
                      {busca ? 'Nenhum pedido encontrado nessa busca.' : 'Nenhum pedido feito hoje.'}
                    </TableCell>
                  </TableRow>
                )}
                {encontrados.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell>
                      {pedido.nome}
                      {repetidos.has(normalizado(pedido.nome)) && (
                        <SegundaLinha>Nome repetido: confira se é a mesma pessoa</SegundaLinha>
                      )}
                    </TableCell>
                    <TableCell>
                      <Etiqueta>{pedido.proteina}</Etiqueta>
                    </TableCell>
                    <TableCell className="campbel-so-no-computador">{acompanhamentosDo(pedido)}</TableCell>
                    <TableCell className="campbel-so-no-computador">{pedido.observacao ?? VAZIO}</TableCell>
                    <TableCell className="campbel-so-no-computador">
                      {emHora(pedido.feitoEm)}
                      {pedido.lancadoPor && <SegundaLinha>Lançado pela recepção</SegundaLinha>}
                    </TableCell>
                    <TableCell className="cds--table-column-menu">
                      <OverflowMenu aria-label={`Ações do pedido de ${pedido.nome}`} flipped size="sm">
                        <OverflowMenuItem itemText="Alterar" onClick={() => setAlterando(pedido)} />
                        <OverflowMenuItem itemText="Cancelar pedido" onClick={() => setCancelando(pedido)} />
                      </OverflowMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <CardapioDoDia
        aberto={montando}
        cardapio={cardapio}
        sugestao={painel.sugestao}
        aoFechar={() => setMontando(false)}
        aoPublicar={(_, novo) => {
          setMontando(false)
          feito(novo ? 'Cardápio publicado.' : 'Cardápio alterado.')
          if (novo) setMensagem(true)
        }}
      />
      {cardapio && (
        <LancamentoDePedido
          aberto={lancando || alterando !== null}
          cardapio={cardapio}
          pedido={alterando}
          aoFechar={() => {
            setLancando(false)
            setAlterando(null)
          }}
          aoGravar={(_, novo) => {
            setLancando(false)
            setAlterando(null)
            feito(novo ? 'Pedido lançado.' : 'Pedido alterado.')
          }}
        />
      )}
      <CancelamentoDePedido
        pedido={cancelando}
        aoFechar={() => setCancelando(null)}
        aoCancelar={() => {
          setCancelando(null)
          feito('Pedido cancelado.')
        }}
      />
      <MensagemDoGrupo
        cardapio={mensagem ? cardapio : null}
        aoFechar={() => setMensagem(false)}
        aoCopiar={() => {
          setMensagem(false)
          setAviso('Mensagem copiada.')
        }}
      />
    </Stack>
  )
}
