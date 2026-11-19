package com.recepcao.sistema.reuniao.dto;

import com.recepcao.sistema.reuniao.StatusReuniao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/**
 * O que a tela manda para criar ou alterar uma reunião.
 * Anfitriões e participantes chegam só com o id do contato: { "contato": { "id": 3 } }.
 */
public record ReuniaoEntrada(
        @NotBlank(message = "Informe o título.") @Size(max = 255) String titulo,
        @Size(max = 255) String empresaReuniao,
        @NotNull(message = "Informe a data e a hora.") LocalDateTime datahoraReuniao,
        @Size(max = 255) String sala,
        @Size(max = 255) String motivo,
        StatusReuniao status,
        List<@Valid Vinculo> anfitrioes,
        List<@Valid Vinculo> participantes
) {

    public record Vinculo(@NotNull @Valid ContatoRef contato) {}

    public record ContatoRef(@NotNull Long id) {}

    public List<Long> idsDosAnfitrioes() {
        return ids(anfitrioes);
    }

    public List<Long> idsDosParticipantes() {
        return ids(participantes);
    }

    private static List<Long> ids(List<Vinculo> vinculos) {
        return vinculos == null ? List.of() : vinculos.stream().map(v -> v.contato().id()).toList();
    }
}
