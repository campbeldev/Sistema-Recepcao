package com.recepcao.sistema.almoco;

import com.recepcao.sistema.pessoa.Pessoa;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/** O que a API do almoço recebe e devolve. */
public final class AlmocoDados {

    private AlmocoDados() {}

    /** O cardápio que a recepção publica. Linhas em branco são ignoradas. */
    public record CardapioEntrada(
            @NotEmpty(message = "Informe ao menos uma proteína.")
            List<@Size(max = 60, message = "Até 60 letras.") String> proteinas,
            List<@Size(max = 60, message = "Até 60 letras.") String> acompanhamentos,
            @NotNull(message = "Informe a hora de fechar.") LocalTime fechaAs
    ) {}

    /** O pedido de uma pessoa, feito por ela pelo link ou lançado pela recepção. */
    public record PedidoEntrada(
            @NotBlank(message = "Escolha a proteína.") String proteina,
            List<String> acompanhamentos,
            @Size(max = 200, message = "A observação tem no máximo 200 letras.") String observacao
    ) {}

    public record CardapioDados(
            Long id,
            LocalDate dia,
            List<String> proteinas,
            List<String> acompanhamentos,
            LocalTime fechaAs,
            boolean aberto,
            boolean encerrado
    ) {
        static CardapioDados de(Cardapio cardapio, LocalDateTime agora) {
            return new CardapioDados(
                    cardapio.getId(),
                    cardapio.getDia(),
                    List.copyOf(cardapio.getProteinas()),
                    List.copyOf(cardapio.getAcompanhamentos()),
                    cardapio.getFechaAs(),
                    cardapio.aberto(agora),
                    cardapio.isEncerrado()
            );
        }
    }

    public record PedidoDados(
            Long id,
            Long pessoaId,
            String nome,
            String setor,
            String proteina,
            List<String> acompanhamentos,
            String observacao,
            LocalDateTime feitoEm,
            String lancadoPor
    ) {
        static PedidoDados de(PedidoDeAlmoco pedido) {
            return new PedidoDados(
                    pedido.getId(),
                    pedido.getPessoa().getId(),
                    pedido.getPessoa().getNome(),
                    pedido.getPessoa().getSetor(),
                    pedido.getProteina(),
                    List.copyOf(pedido.getAcompanhamentos()),
                    pedido.getObservacao(),
                    pedido.getFeitoEm(),
                    pedido.getLancadoPor()
            );
        }
    }

    /** Só o que o link público precisa mostrar de cada pessoa. */
    public record PessoaDoAlmoco(Long id, String nome, String setor) {
        static PessoaDoAlmoco de(Pessoa pessoa) {
            return new PessoaDoAlmoco(pessoa.getId(), pessoa.getNome(), pessoa.getSetor());
        }
    }

    /** As listas do último cardápio, para a recepção não digitar tudo de novo. */
    public record Sugestao(List<String> proteinas, List<String> acompanhamentos, LocalTime fechaAs) {}

    /** A tela Almoço da recepção: o cardápio de hoje (ou nulo), os pedidos e quem ainda não pediu. */
    public record Painel(
            CardapioDados cardapio,
            List<PedidoDados> pedidos,
            List<PessoaDoAlmoco> semPedido,
            Sugestao sugestao
    ) {}

    /** O que o link público recebe: o cardápio de hoje (ou nulo) e os nomes para escolher. */
    public record Publico(CardapioDados cardapio, List<PessoaDoAlmoco> pessoas) {}
}
