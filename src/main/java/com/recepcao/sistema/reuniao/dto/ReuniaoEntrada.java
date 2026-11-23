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
 * O participante que não está nos contatos chega só com o nome: { "nome": "Fulano" }.
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

    public record Vinculo(@Valid ContatoRef contato, @Size(max = 255) String nome) {}

    public record ContatoRef(@NotNull Long id) {}

    public List<Long> idsDosAnfitrioes() {
        return ids(anfitrioes);
    }

    public List<Long> idsDosParticipantes() {
        return ids(participantes);
    }

    /** Os nomes dos participantes que não estão nos contatos. Anfitrião sempre é contato. */
    public List<String> participantesDeFora() {
        return participantes == null ? List.of() : participantes.stream()
                .filter(v -> v.contato() == null && v.nome() != null && !v.nome().isBlank())
                .map(Vinculo::nome)
                .toList();
    }

    private static List<Long> ids(List<Vinculo> vinculos) {
        return vinculos == null ? List.of() : vinculos.stream()
                .filter(v -> v.contato() != null)
                .map(v -> v.contato().id())
                .toList();
    }
}
