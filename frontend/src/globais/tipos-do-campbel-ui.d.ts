// As peças do campbel-ui (ui/src/index.ts), como a plataforma as importa:
//   import { Casca, Situacao, CampoDeBusca } from 'campbel-ui'
// O resto vem direto do @carbon/react 1.117.0 e do @carbon/icons-react 11.89.0.
// No bundle deste kit, os mesmos componentes do Carbon estão em CampbelUI.Carbon e os ícones em CampbelUI.Icones.

import type { ComponentProps, ReactNode } from 'react'
import type { NumberInput } from '@carbon/react'

export type ItemDoMenu = {
  nome: string
  endereco: string
  descricao?: string
  paginas?: ItemDoMenu[]
}

export type GrupoDoMenu = {
  titulo: string
  itens: ItemDoMenu[]
}

export type AvisoDoSino = {
  chave: string
  gravidade: 'erro' | 'alerta' | 'pendente' | 'sucesso'
  titulo: string
  descricao: string
  momento: string
  endereco: string
  dispensavel: boolean
}

export interface CascaProps {
  menu?: GrupoDoMenu[]
  conta?: ItemDoMenu[]
  conectado?: string
  avisos?: AvisoDoSino[]
  atual?: string
  acimaDoMenu?: ReactNode
  aoSair?: () => void
  aoDispensar?: (chaves: string[]) => void
  children: ReactNode
}
export declare function Casca(props: CascaProps): JSX.Element

export interface SituacaoProps {
  valor: 'ativo' | 'inativo' | 'ativa' | 'encerrada' | 'pausada' | string
}
export declare function Situacao(props: SituacaoProps): JSX.Element

export interface SituacaoDoSaldoProps {
  valor: 'ok' | 'baixo' | 'esgotado'
}
export declare function SituacaoDoSaldo(props: SituacaoDoSaldoProps): JSX.Element

export type SituacaoDePedido =
  | 'pendente'
  | 'aprovado'
  | 'pronto-para-entrega'
  | 'em-compra'
  | 'enviado'
  | 'recebido'
  | 'entregue'
  | 'faltou'
  | 'recusado'
  | 'cancelado'

export interface SituacaoDoPedidoProps {
  valor: SituacaoDePedido
}
export declare function SituacaoDoPedido(props: SituacaoDoPedidoProps): JSX.Element
export declare function nomeDaSituacao(valor: SituacaoDePedido): string

export type SituacaoDeCompra = 'aguardando' | 'autorizada' | 'recebida' | 'recusada' | 'cancelada'

export interface SituacaoDaCompraProps {
  valor: SituacaoDeCompra
}
export declare function SituacaoDaCompra(props: SituacaoDaCompraProps): JSX.Element
export declare function nomeDaSituacaoDaCompra(valor: SituacaoDeCompra): string

export interface EtiquetaProps {
  children: ReactNode
}
export declare function Etiqueta(props: EtiquetaProps): JSX.Element

export interface CodigoProps {
  children: ReactNode
}
export declare function Codigo(props: CodigoProps): JSX.Element

export interface MarcaDeNovoProps {}
export declare function MarcaDeNovo(props: MarcaDeNovoProps): JSX.Element

export interface CampoDeBuscaProps {
  texto: string
  inicial?: string
  aoBuscar: (busca: string) => void
}
export declare function CampoDeBusca(props: CampoDeBuscaProps): JSX.Element

export type OpcaoDoFiltro = {
  valor: string
  nome: string
}

export interface FiltroDaTabelaProps {
  id: string
  titulo: string
  opcoes: OpcaoDoFiltro[]
  valor: string
  aoEscolher: (valor: string) => void
}
export declare function FiltroDaTabela(props: FiltroDaTabelaProps): JSX.Element

export interface LinhaQueAbreProps {
  aoAbrir: () => void
  children: ReactNode
}
export declare function LinhaQueAbre(props: LinhaQueAbreProps): JSX.Element

export interface SegundaLinhaProps {
  children: ReactNode
}
export declare function SegundaLinha(props: SegundaLinhaProps): JSX.Element

export interface AcoesProps {
  children: ReactNode
}
export declare function Acoes(props: AcoesProps): JSX.Element

export interface LinhaDeCamposProps {
  children: ReactNode
}
export declare function LinhaDeCampos(props: LinhaDeCamposProps): JSX.Element

export type CampoDeNumeroProps = Omit<ComponentProps<typeof NumberInput>, 'type' | 'locale' | 'pattern' | 'onKeyDown'>
export declare function CampoDeNumero(props: CampoDeNumeroProps): JSX.Element

export interface QuadroDeAssinaturaProps {
  rotulo: string
  tracos: string
  aoMudar: (tracos: string) => void
}
export declare function QuadroDeAssinatura(props: QuadroDeAssinaturaProps): JSX.Element
export declare function Assinatura(props: { tracos: string; nome: string }): JSX.Element

export interface ConfirmacaoProps {
  texto: string
  aoFechar: () => void
}
export declare function Confirmacao(props: ConfirmacaoProps): JSX.Element

export interface EtapasProps {
  etapas: string[]
  atual: number
  concluir: string
  enviando: boolean
  aoCancelar: () => void
  aoVoltar: () => void
  aoAvancar: () => void
  children: ReactNode
}
export declare function Etapas(props: EtapasProps): JSX.Element

export interface CartaoProps {
  children: ReactNode
}
export declare function Cartao(props: CartaoProps): JSX.Element

export interface BlocoProps {
  children: ReactNode
}
export declare function Bloco(props: BlocoProps): JSX.Element

export interface NumeroProps {
  rotulo: string
  valor: string
  detalhe?: string
}
export declare function Numero(props: NumeroProps): JSX.Element
export declare function Numeros(props: { children: ReactNode }): JSX.Element

export declare function combinaComBusca(busca: string, ...valores: string[]): boolean
