package com.recepcao.sistema.comum.erro;

import java.util.Map;

/**
 * O pedido é válido, mas uma regra do sistema o recusa (sala ocupada, contato com reuniões...). Vira 409.
 * Quando a regra é de um campo só (o ramal que já tem dono), o erro vai também para esse campo.
 */
public class RegraDeNegocioException extends RuntimeException {

    private final Map<String, String> campos;

    public RegraDeNegocioException(String mensagem) {
        super(mensagem);
        this.campos = Map.of();
    }

    public RegraDeNegocioException(String mensagem, String campo, String erroDoCampo) {
        super(mensagem);
        this.campos = Map.of(campo, erroDoCampo);
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
