// As peças do campbel-ui, vindas do bundle do kit (window.CampbelUI). Os tipos estão em tipos-do-campbel-ui.d.ts,
// copiado sem mudança do components/index.d.ts do kit.
type ModuloCampbel = typeof import('campbel-ui')

const C = (window as unknown as { CampbelUI: ModuloCampbel }).CampbelUI

export const {
  Acoes,
  Assinatura,
  Bloco,
  CampoDeBusca,
  CampoDeNumero,
  Cartao,
  Casca,
  Codigo,
  Confirmacao,
  Etapas,
  Etiqueta,
  FiltroDaTabela,
  LinhaDeCampos,
  LinhaQueAbre,
  MarcaDeNovo,
  Numero,
  Numeros,
  QuadroDeAssinatura,
  SegundaLinha,
  Situacao,
  SituacaoDaCompra,
  SituacaoDoPedido,
  SituacaoDoSaldo,
  combinaComBusca,
  nomeDaSituacao,
  nomeDaSituacaoDaCompra,
} = C
