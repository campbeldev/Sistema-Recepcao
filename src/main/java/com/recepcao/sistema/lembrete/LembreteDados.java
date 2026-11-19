package com.recepcao.sistema.lembrete;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** O lembrete como a API devolve. */
public record LembreteDados(
        Long id,
        String descricao,
        String paraQuem,
        LocalDate dia,
        LocalTime hora,
        boolean feito,
        String criadoPor,
        LocalDateTime criadoEm
) {

    public static LembreteDados de(Lembrete lembrete) {
        return new LembreteDados(
                lembrete.getId(),
                lembrete.getDescricao(),
                lembrete.getParaQuem(),
                lembrete.getDia(),
                lembrete.getHora(),
                lembrete.isFeito(),
                lembrete.getCriadoPor(),
                lembrete.getCriadoEm()
        );
    }
}
