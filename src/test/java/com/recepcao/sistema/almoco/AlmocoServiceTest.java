package com.recepcao.sistema.almoco;

import com.recepcao.sistema.almoco.AlmocoDados.PedidoComChave;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoDados;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoEntrada;
import com.recepcao.sistema.comum.erro.NaoEncontradoException;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** As regras de horário, do link do dia e da chave do pedido, com o relógio parado e sem banco. */
class AlmocoServiceTest {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    private static final LocalDate HOJE = LocalDate.of(2026, 11, 19);

    private final CardapioRepository cardapios = mock(CardapioRepository.class);
    private final PedidoDeAlmocoRepository pedidos = mock(PedidoDeAlmocoRepository.class);

    private AlmocoService servicoAs(int hora, int minuto) {
        return servicoEm(HOJE, hora, minuto);
    }

    private AlmocoService servicoEm(LocalDate dia, int hora, int minuto) {
        Clock relogio = Clock.fixed(LocalDateTime.of(dia, LocalTime.of(hora, minuto)).atZone(FUSO).toInstant(), FUSO);
        return new AlmocoService(cardapios, pedidos, relogio);
    }

    private Cardapio cardapioDeHoje(LocalTime fechaAs) {
        Cardapio cardapio = new Cardapio(HOJE, "talita", LocalDateTime.of(HOJE, LocalTime.of(8, 0)));
        ReflectionTestUtils.setField(cardapio, "id", 1L);
        cardapio.setProteinas(List.of("Frango ao molho", "Lasanha", "Isca de carne"));
        cardapio.setAcompanhamentos(List.of("Arroz", "Feijão de caldo", "Salada"));
        cardapio.setFechaAs(fechaAs);
        when(cardapios.findByDia(HOJE)).thenReturn(Optional.of(cardapio));
        when(cardapios.findByCodigoDoLink(anyString())).thenReturn(Optional.empty());
        when(cardapios.findByCodigoDoLink(cardapio.getCodigoDoLink())).thenReturn(Optional.of(cardapio));
        when(pedidos.save(any())).thenAnswer(chamada -> chamada.getArgument(0));
        return cardapio;
    }

    private static PedidoEntrada pedido(String nome, String proteina, String... acompanhamentos) {
        return new PedidoEntrada(nome, proteina, List.of(acompanhamentos), null);
    }

    @Test
    void oLinkAceitaAteAHoraDeFecharERecusaDepois() {
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));
        String link = cardapio.getCodigoDoLink();
        PedidoEntrada frango = pedido("Juliana Costa", "Frango ao molho", "Arroz");

        assertEquals("Frango ao molho", servicoAs(9, 59).pedirPeloLink(link, frango).pedido().proteina());

        RegraDeNegocioException recusa = assertThrows(RegraDeNegocioException.class,
                () -> servicoAs(10, 0).pedirPeloLink(link, frango));
        assertTrue(recusa.getMessage().startsWith("Os pedidos de hoje fecharam às 10:00."));
    }

    @Test
    void depoisDeFecharOLinkNaoMostraNemOCardapio() {
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));

        assertThrows(RegraDeNegocioException.class, () -> servicoAs(10, 5).publico(cardapio.getCodigoDoLink()));
    }

    @Test
    void oLinkDeOntemNaoAbreHoje() {
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));

        assertThrows(NaoEncontradoException.class,
                () -> servicoEm(HOJE.plusDays(1), 9, 0).publico(cardapio.getCodigoDoLink()));
    }

    @Test
    void codigoInventadoNaoAbreNada() {
        cardapioDeHoje(LocalTime.of(10, 0));

        assertThrows(NaoEncontradoException.class, () -> servicoAs(9, 0).publico("qualquer-coisa"));
        assertThrows(NaoEncontradoException.class, () -> servicoAs(9, 0).publico(""));
    }

    @Test
    void cadaCardapioTemUmCodigoDiferente() {
        Cardapio um = new Cardapio(HOJE, "talita", LocalDateTime.of(HOJE, LocalTime.of(8, 0)));
        Cardapio outro = new Cardapio(HOJE.plusDays(1), "talita", LocalDateTime.of(HOJE, LocalTime.of(8, 0)));

        assertEquals(22, um.getCodigoDoLink().length());
        assertNotEquals(um.getCodigoDoLink(), outro.getCodigoDoLink());
    }

    @Test
    void oBancoGuardaSoOResumoDaChave() {
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));

        PedidoComChave feito = servicoAs(9, 0).pedirPeloLink(cardapio.getCodigoDoLink(),
                pedido("  Juliana   Costa ", "Lasanha"));

        assertEquals("Juliana Costa", feito.pedido().nome());
        verify(pedidos).save(argThat(salvo ->
                salvo.getChaveHash().equals(ChaveAleatoria.resumo(feito.chave()))
                        && !salvo.getChaveHash().equals(feito.chave())));
    }

    @Test
    void semAChaveCertaNinguemAlteraOPedido() {
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));
        when(pedidos.findByCardapioIdAndChaveHash(eq(1L), anyString())).thenReturn(Optional.empty());
        AlmocoService servico = servicoAs(9, 0);
        String link = cardapio.getCodigoDoLink();

        assertThrows(NaoEncontradoException.class,
                () -> servico.alterarPeloLink(link, "chave-de-outra-pessoa", pedido("Juliana Costa", "Lasanha")));
        assertThrows(NaoEncontradoException.class, () -> servico.cancelarPeloLink(link, null));
        assertNull(servico.meuPedido(link, ""));
        verify(pedidos, never()).delete(any());
    }

    @Test
    void comAChaveCertaAPessoaAlteraOProprioPedido() {
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));
        PedidoDeAlmoco existente = new PedidoDeAlmoco(cardapio);
        existente.preencher("Juliana Costa", "Lasanha", List.of(), null, LocalDateTime.of(HOJE, LocalTime.of(8, 30)), null);
        when(pedidos.findByCardapioIdAndChaveHash(1L, ChaveAleatoria.resumo("minha-chave")))
                .thenReturn(Optional.of(existente));

        PedidoDados alterado = servicoAs(9, 0).alterarPeloLink(cardapio.getCodigoDoLink(), "minha-chave",
                pedido("Juliana Costa", "Isca de carne", "Arroz"));

        assertEquals("Isca de carne", alterado.proteina());
        assertNull(alterado.lancadoPor());
    }

    @Test
    void depoisDeFecharARecepcaoAindaLancaPedido() {
        cardapioDeHoje(LocalTime.of(10, 0));

        PedidoDados lancado = servicoAs(11, 15).lancar(pedido("Juliana Costa", "Lasanha"), "talita");

        assertEquals("talita", lancado.lancadoPor());
        assertEquals("Juliana Costa", lancado.nome());
    }

    @Test
    void aRecepcaoSoMexeEmPedidoDoCardapioDeHoje() {
        cardapioDeHoje(LocalTime.of(10, 0));
        when(pedidos.findByIdAndCardapioId(anyLong(), eq(1L))).thenReturn(Optional.empty());

        assertThrows(NaoEncontradoException.class, () -> servicoAs(9, 0).cancelarPelaRecepcao(99L));
    }

    @Test
    void fecharAntesDaHoraBloqueiaOLink() {
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));
        AlmocoService servico = servicoAs(9, 30);

        servico.fechar();

        RegraDeNegocioException recusa = assertThrows(RegraDeNegocioException.class,
                () -> servico.pedirPeloLink(cardapio.getCodigoDoLink(), pedido("Juliana Costa", "Lasanha")));
        assertTrue(recusa.getMessage().startsWith("Os pedidos de hoje foram fechados pela recepção."));
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
        Cardapio cardapio = cardapioDeHoje(LocalTime.of(10, 0));

        PedidoDados feito = servicoAs(9, 0).pedirPeloLink(cardapio.getCodigoDoLink(),
                new PedidoEntrada("Juliana Costa", "Frango ao molho", List.of("Salada", "Arroz", "arroz "), "  ")).pedido();

        assertEquals(List.of("Arroz", "Salada"), feito.acompanhamentos());
        assertNull(feito.observacao());
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
