package com.recepcao.sistema.lembrete;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

/** O que a tela manda para criar ou alterar um lembrete. */
public record LembreteEntrada(
        @NotBlank(message = "Informe o que lembrar.") @Size(max = 500) String descricao,
        @Size(max = 120) String paraQuem,
        @NotNull(message = "Informe o dia.") LocalDate dia,
        LocalTime hora
) {

    void copiarPara(Lembrete lembrete) {
        lembrete.setDescricao(descricao.trim());
        lembrete.setParaQuem(paraQuem == null || paraQuem.isBlank() ? null : paraQuem.trim());
        lembrete.setDia(dia);
        lembrete.setHora(hora);
    }
}
