package com.recepcao.sistema.reuniao.dto;

import com.recepcao.sistema.contato.ContatoDados;
import com.recepcao.sistema.reuniao.Reuniao;
import com.recepcao.sistema.reuniao.StatusReuniao;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A reunião como a API devolve. Mantém os nomes de campo que as telas já usam.
 */
public record ReuniaoResposta(
        Long id,
        LocalDateTime datahoraReuniao,
        String titulo,
        String motivo,
        String sala,
        String empresaReuniao,
        StatusReuniao status,
        List<Pessoa> anfitrioes,
        List<Pessoa> participantes
) {

    /**
     * Um anfitrião ou participante: o id do vínculo e o contato. O participante de fora vem
     * com um contato sem id, só com o nome, para as telas mostrarem do mesmo jeito.
     */
    public record Pessoa(Long id, ContatoDados contato) {}

    public static ReuniaoResposta de(Reuniao reuniao) {
        return new ReuniaoResposta(
                reuniao.getId(),
                reuniao.getDatahoraReuniao(),
                reuniao.getTitulo(),
                reuniao.getMotivo(),
                reuniao.getSala(),
                reuniao.getEmpresaReuniao(),
                reuniao.getStatus(),
                reuniao.getAnfitrioes().stream()
                        .map(a -> new Pessoa(a.getId(), ContatoDados.de(a.getContato())))
                        .toList(),
                reuniao.getParticipantes().stream()
                        .map(p -> new Pessoa(p.getId(), p.getContato() != null
                                ? ContatoDados.de(p.getContato())
                                : new ContatoDados(null, p.getNomeExterno(), null, null, null, null)))
                        .toList()
        );
    }
}
