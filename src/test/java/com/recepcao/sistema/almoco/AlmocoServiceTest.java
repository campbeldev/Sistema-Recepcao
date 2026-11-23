package com.recepcao.sistema.almoco;

import com.recepcao.sistema.almoco.AlmocoDados.PedidoDados;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoEntrada;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
import com.recepcao.sistema.pessoa.Pessoa;
import com.recepcao.sistema.pessoa.PessoaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** As regras de horário e de pedido do almoço, com o relógio parado e sem banco. */
class AlmocoServiceTest {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    private static final LocalDate HOJE = LocalDate.of(2026, 11, 19);

    private final CardapioRepository cardapios = mock(CardapioRepository.class);
    private final PedidoDeAlmocoRepository pedidos = mock(PedidoDeAlmocoRepository.class);
    private final PessoaRepository pessoas = mock(PessoaRepository.class);

    private AlmocoService servicoAs(int hora, int minuto) {
        Clock relogio = Clock.fixed(LocalDateTime.of(HOJE, LocalTime.of(hora, minuto)).atZone(FUSO).toInstant(), FUSO);
        return new AlmocoService(cardapios, pedidos, pessoas, relogio);
    }

    private Cardapio cardapioDeHoje(LocalTime fechaAs) {
        Cardapio cardapio = new Cardapio(HOJE, "talita", LocalDateTime.of(HOJE, LocalTime.of(8, 0)));
        ReflectionTestUtils.setField(cardapio, "id", 1L);
        cardapio.setProteinas(List.of("Frango ao molho", "Lasanha", "Isca de carne"));
        cardapio.setAcompanhamentos(List.of("Arroz", "Feijão de caldo", "Salada"));
        cardapio.setFechaAs(fechaAs);
        when(cardapios.findByDia(HOJE)).thenReturn(Optional.of(cardapio));
        return cardapio;
    }

    private void pessoaAtiva(long id, String nome) {
        Pessoa pessoa = new Pessoa();
        ReflectionTestUtils.setField(pessoa, "id", id);
        pessoa.setNome(nome);
        pessoa.setSetor("Financeiro");
        when(pessoas.findById(id)).thenReturn(Optional.of(pessoa));
        when(pedidos.findByCardapioIdAndPessoaId(1L, id)).thenReturn(Optional.empty());
        when(pedidos.save(any())).thenAnswer(chamada -> chamada.getArgument(0));
    }

    @Test
    void oLinkAceitaAteAHoraDeFecharERecusaDepois() {
        cardapioDeHoje(LocalTime.of(10, 0));
        pessoaAtiva(7, "Juliana Costa");
        PedidoEntrada frango = new PedidoEntrada("Frango ao molho", List.of("Arroz"), null);

        assertEquals("Frango ao molho", servicoAs(9, 59).pedirPeloLink(7L, frango).proteina());

        RegraDeNegocioException recusa = assertThrows(RegraDeNegocioException.class,
                () -> servicoAs(10, 0).pedirPeloLink(7L, frango));
        assertTrue(recusa.getMessage().startsWith("Os pedidos de hoje fecharam às 10:00."));
    }

    @Test
    void depoisDeFecharARecepcaoAindaLancaPedido() {
        cardapioDeHoje(LocalTime.of(10, 0));
        pessoaAtiva(7, "Juliana Costa");

        PedidoDados lancado = servicoAs(11, 15).lancar(7L, new PedidoEntrada("Lasanha", List.of(), null), "talita");

        assertEquals("talita", lancado.lancadoPor());
    }

    @Test
    void fecharAntesDaHoraBloqueiaOLink() {
        cardapioDeHoje(LocalTime.of(10, 0));
        pessoaAtiva(7, "Juliana Costa");
        AlmocoService servico = servicoAs(9, 30);

        servico.fechar();

        assertThrows(RegraDeNegocioException.class,
                () -> servico.pedirPeloLink(7L, new PedidoEntrada("Lasanha", List.of(), null)));
    }

    @Test
    void reabrirDepoisDaHoraEmpurraOFechamentoParaAProximaMeiaHora() {
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));
        cardapio.setEncerrado(true);

        assertTrue(servicoAs(10, 7).reabrir().aberto());
        assertEquals(LocalTime.of(10, 30), cardapio.getFechaAs());
    }

    @Test
    void reabrirAntesDaHoraMantemOHorario() {
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));
        cardapio.setEncerrado(true);

        servicoAs(9, 0).reabrir();

        assertEquals(LocalTime.of(10, 0), cardapio.getFechaAs());
    }

    @Test
    void proximaMeiaHoraDaPeloMenosQuinzeMinutos() {
        assertEquals(LocalTime.of(10, 30), AlmocoService.proximaMeiaHora(LocalTime.of(10, 22)));
        assertEquals(LocalTime.of(11, 0), AlmocoService.proximaMeiaHora(LocalTime.of(10, 35)));
        assertEquals(LocalTime.of(10, 30), AlmocoService.proximaMeiaHora(LocalTime.of(10, 30)));
        assertEquals(LocalTime.of(23, 30), AlmocoService.proximaMeiaHora(LocalTime.of(23, 50)));
    }

    @Test
    void acompanhamentosFicamNaOrdemDoCardapio() {
        cardapioDeHoje(LocalTime.of(10, 0));
        pessoaAtiva(7, "Juliana Costa");

        PedidoDados pedido = servicoAs(9, 0).pedirPeloLink(7L,
                new PedidoEntrada("Frango ao molho", List.of("Salada", "Arroz", "arroz "), "  "));

        assertEquals(List.of("Arroz", "Salada"), pedido.acompanhamentos());
        assertNull(pedido.observacao());
    }

    @Test
    void naoTiraProteinaQueAlguemJaPediu() {
        cardapioDeHoje(LocalTime.of(10, 0));
        when(pedidos.existsByCardapioIdAndProteina(1L, "Frango ao molho")).thenReturn(true);

        RegraDeNegocioException recusa = assertThrows(RegraDeNegocioException.class,
                () -> servicoAs(9, 0).publicarCardapio(new AlmocoDados.CardapioEntrada(
                        List.of("Lasanha", "Isca de carne"), List.of("Arroz"), LocalTime.of(10, 0)), "talita"));
        assertTrue(recusa.getMessage().startsWith("Há pedidos de Frango ao molho."));
    }

    @Test
    void cardapioSoComLinhasEmBrancoERecusado() {
        when(cardapios.findByDia(HOJE)).thenReturn(Optional.empty());

        RegraDeNegocioException recusa = assertThrows(RegraDeNegocioException.class,
                () -> servicoAs(8, 0).publicarCardapio(new AlmocoDados.CardapioEntrada(
                        List.of(" ", ""), List.of(), LocalTime.of(10, 0)), "talita"));
        assertEquals("Informe ao menos uma proteína.", recusa.getCampos().get("proteinas"));
    }
}
