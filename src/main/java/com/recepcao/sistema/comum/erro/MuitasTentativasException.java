package com.recepcao.sistema.comum.erro;

/**
 * O mesmo endereço mandou pedidos demais em pouco tempo. Vira 429.
 */
public class MuitasTentativasException extends RuntimeException {

    public MuitasTentativasException(String mensagem) {
        super(mensagem);
    }
}
