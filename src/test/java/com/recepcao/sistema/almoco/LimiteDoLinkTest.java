package com.recepcao.sistema.almoco;

import com.recepcao.sistema.comum.erro.MuitasTentativasException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LimiteDoLinkTest {

    @Test
    void recusaDepoisDoLimiteSoParaOMesmoEndereco() {
        LimiteDoLink limite = new LimiteDoLink(3);

        limite.registrar("10.0.0.1");
        limite.registrar("10.0.0.1");
        limite.registrar("10.0.0.1");

        assertThrows(MuitasTentativasException.class, () -> limite.registrar("10.0.0.1"));
        assertDoesNotThrow(() -> limite.registrar("10.0.0.2"));
    }
}
