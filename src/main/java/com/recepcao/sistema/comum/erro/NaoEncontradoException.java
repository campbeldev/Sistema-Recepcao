package com.recepcao.sistema.comum.erro;

/**
 * O registro pedido não existe. Vira 404.
 */
public class NaoEncontradoException extends RuntimeException {

    public NaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
