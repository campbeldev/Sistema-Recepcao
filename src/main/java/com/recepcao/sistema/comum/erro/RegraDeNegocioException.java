package com.recepcao.sistema.comum.erro;

/**
 * O pedido é válido, mas uma regra do sistema o recusa (sala ocupada, contato com reuniões...). Vira 409.
 */
public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(String mensagem) {
        super(mensagem);
    }
}
