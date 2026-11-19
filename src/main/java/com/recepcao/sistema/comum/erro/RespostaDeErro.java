package com.recepcao.sistema.comum.erro;

import java.util.Map;

/**
 * O corpo de toda recusa da API: a mensagem geral e, quando houver, o erro de cada campo.
 */
public record RespostaDeErro(String mensagem, Map<String, String> campos) {

    public RespostaDeErro(String mensagem) {
        this(mensagem, Map.of());
    }
}
