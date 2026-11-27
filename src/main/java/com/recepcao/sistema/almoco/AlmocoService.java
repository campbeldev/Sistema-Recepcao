package com.recepcao.sistema.almoco;

import com.recepcao.sistema.almoco.AlmocoDados.CardapioDados;
import com.recepcao.sistema.almoco.AlmocoDados.CardapioEntrada;
import com.recepcao.sistema.almoco.AlmocoDados.Painel;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoComChave;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoDados;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoEntrada;
import com.recepcao.sistema.almoco.AlmocoDados.Sugestao;
import com.recepcao.sistema.comum.erro.NaoEncontradoException;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * O pedido de almoço do dia: a recepção publica o cardápio, cada pessoa pede pelo link até a hora de
 * fechar, e a recepção acompanha, lança o pedido de quem não conseguiu e gera o PDF para o restaurante.
 *
 * O link do dia leva um código sorteado e só funciona no próprio dia, enquanto os pedidos estão abertos.
 * Quem pede pelo link digita o nome e recebe uma chave que fica no celular: só ela altera ou cancela o pedido.
 */
@Service
public class AlmocoService {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final CardapioRepository cardapioRepository;
    private final PedidoDeAlmocoRepository pedidoRepository;
    private final Clock relogio;

    @Autowired
    public AlmocoService(CardapioRepository cardapioRepository, PedidoDeAlmocoRepository pedidoRepository) {
        this(cardapioRepository, pedidoRepository, Clock.systemDefaultZone());
    }

    /** Com o relógio parado, para os testes. */
    AlmocoService(CardapioRepository cardapioRepository, PedidoDeAlmocoRepository pedidoRepository, Clock relogio) {
        this.cardapioRepository = cardapioRepository;
        this.pedidoRepository = pedidoRepository;
        this.relogio = relogio;
    }

    private LocalDateTime agora() {
        return LocalDateTime.now(relogio).truncatedTo(ChronoUnit.SECONDS);
    }

    private LocalDate hoje() {
        return agora().toLocalDate();
    }

    // ---------- a tela da recepção ----------

    @Transactional
    public Painel painelDeHoje() {
        var cardapio = cardapioRepository.findByDia(hoje()).orElse(null);
        if (cardapio == null) {
            Sugestao sugestao = cardapioRepository.findFirstByDiaBeforeOrderByDiaDesc(hoje())
                    .map(anterior -> new Sugestao(
                            List.copyOf(anterior.getProteinas()),
                            List.copyOf(anterior.getAcompanhamentos()),
                            anterior.getFechaAs()))
                    .orElse(null);
            return new Painel(null, List.of(), sugestao);
        }

        cardapio.garantirCodigoDoLink();
        List<PedidoDados> pedidos = pedidoRepository.findByCardapioIdOrderByFeitoEmAsc(cardapio.getId())
                .stream().map(PedidoDados::de).toList();
        return new Painel(CardapioDados.de(cardapio, agora()), pedidos, null);
    }

    @Transactional
    public CardapioDados publicarCardapio(CardapioEntrada entrada, String quem) {
        List<String> proteinas = semRepetir(entrada.proteinas());
        List<String> acompanhamentos = semRepetir(entrada.acompanhamentos());
        if (proteinas.isEmpty()) {
            throw new RegraDeNegocioException("Informe ao menos uma proteína.", "proteinas", "Informe ao menos uma proteína.");
        }
        Cardapio cardapio = cardapioRepository.findByDia(hoje())
                .orElseGet(() -> new Cardapio(hoje(), quem, agora()));

        // Tirar uma proteína que alguém já pediu deixaria esse pedido sem prato.
        if (cardapio.getId() != null) {
            for (String antiga : cardapio.getProteinas()) {
                if (!proteinas.contains(antiga) && pedidoRepository.existsByCardapioIdAndProteina(cardapio.getId(), antiga)) {
                    throw new RegraDeNegocioException(
                            "Há pedidos de " + antiga + ". Altere ou cancele esses pedidos antes de tirar a proteína do cardápio.");
                }
            }
        }

        cardapio.garantirCodigoDoLink();
        cardapio.setProteinas(proteinas);
        cardapio.setAcompanhamentos(acompanhamentos);
        cardapio.setFechaAs(entrada.fechaAs());
        return CardapioDados.de(cardapioRepository.save(cardapio), agora());
    }

    @Transactional
    public CardapioDados fechar() {
        Cardapio cardapio = cardapioDeHoje();
        cardapio.setEncerrado(true);
        return CardapioDados.de(cardapio, agora());
    }

    /**
     * Volta a aceitar pedidos. Se a hora de fechar já passou, ela vai para a próxima meia hora
     * cheia que ainda dê pelo menos 15 minutos (10:07 vira 10:30; 10:20 vira 11:00).
     */
    @Transactional
    public CardapioDados reabrir() {
        Cardapio cardapio = cardapioDeHoje();
        cardapio.setEncerrado(false);
        LocalTime agora = agora().toLocalTime();
        if (!agora.isBefore(cardapio.getFechaAs())) {
            cardapio.setFechaAs(proximaMeiaHora(agora.plusMinutes(15)));
        }
        return CardapioDados.de(cardapio, agora());
    }

    static LocalTime proximaMeiaHora(LocalTime depoisDe) {
        int minutos = depoisDe.getHour() * 60 + depoisDe.getMinute();
        int arredondado = Math.min(((minutos + 29) / 30) * 30, 23 * 60 + 30);
        return LocalTime.of(arredondado / 60, arredondado % 60);
    }

    /** A recepção lança o pedido de quem ligou ou falou pessoalmente, mesmo depois de fechar. */
    @Transactional
    public PedidoDados lancar(PedidoEntrada entrada, String quem) {
        Cardapio cardapio = cardapioDeHoje();
        return gravar(cardapio, new PedidoDeAlmoco(cardapio), entrada, quem);
    }

    /** A recepção altera o pedido de alguém, mesmo depois de fechar. */
    @Transactional
    public PedidoDados alterarPelaRecepcao(Long pedidoId, PedidoEntrada entrada, String quem) {
        Cardapio cardapio = cardapioDeHoje();
        return gravar(cardapio, pedidoDe(cardapio, pedidoId), entrada, quem);
    }

    @Transactional
    public void cancelarPelaRecepcao(Long pedidoId) {
        Cardapio cardapio = cardapioDeHoje();
        pedidoRepository.delete(pedidoDe(cardapio, pedidoId));
    }

    @Transactional(readOnly = true)
    public byte[] pdfDeHoje() {
        Cardapio cardapio = cardapioDeHoje();
        List<PedidoDados> pedidos = pedidoRepository.findByCardapioIdOrderByFeitoEmAsc(cardapio.getId())
                .stream().map(PedidoDados::de).toList();
        return PdfDoAlmoco.gerar(CardapioDados.de(cardapio, agora()), pedidos, agora());
    }

    // ---------- o link público ----------

    /** O cardápio do link. Fora do dia ou depois de fechar, o link não mostra nada. */
    @Transactional(readOnly = true)
    public CardapioDados publico(String codigo) {
        return CardapioDados.de(cardapioDoLink(codigo), agora());
    }

    /** O pedido de quem tem a chave; nulo se a chave não abre nenhum pedido de hoje. */
    @Transactional(readOnly = true)
    public PedidoDados meuPedido(String codigo, String chave) {
        Cardapio cardapio = cardapioDoLink(codigo);
        return pedidoDaChave(cardapio, chave).map(PedidoDados::de).orElse(null);
    }

    /** Um pedido novo pelo link. A chave só sai daqui: o banco guarda apenas o resumo dela. */
    @Transactional
    public PedidoComChave pedirPeloLink(String codigo, PedidoEntrada entrada) {
        Cardapio cardapio = cardapioDoLink(codigo);
        String chave = ChaveAleatoria.nova();
        PedidoDeAlmoco pedido = new PedidoDeAlmoco(cardapio);
        pedido.setChaveHash(ChaveAleatoria.resumo(chave));
        return new PedidoComChave(gravar(cardapio, pedido, entrada, null), chave);
    }

    @Transactional
    public PedidoDados alterarPeloLink(String codigo, String chave, PedidoEntrada entrada) {
        Cardapio cardapio = cardapioDoLink(codigo);
        return gravar(cardapio, pedidoDaChaveOuErro(cardapio, chave), entrada, null);
    }

    @Transactional
    public void cancelarPeloLink(String codigo, String chave) {
        Cardapio cardapio = cardapioDoLink(codigo);
        pedidoRepository.delete(pedidoDaChaveOuErro(cardapio, chave));
    }

    /** O cardápio de hoje pelo código do link, se os pedidos ainda estão abertos. */
    private Cardapio cardapioDoLink(String codigo) {
        Cardapio cardapio = codigo == null || codigo.isBlank() ? null
                : cardapioRepository.findByCodigoDoLink(codigo).orElse(null);
        if (cardapio == null || !cardapio.getDia().equals(hoje())) {
            throw new NaoEncontradoException(
                    "Este link não vale mais. Use o link de hoje, que a recepção manda no grupo.");
        }
        exigirAberto(cardapio);
        return cardapio;
    }

    private Optional<PedidoDeAlmoco> pedidoDaChave(Cardapio cardapio, String chave) {
        if (chave == null || chave.isBlank()) return Optional.empty();
        return pedidoRepository.findByCardapioIdAndChaveHash(cardapio.getId(), ChaveAleatoria.resumo(chave.trim()));
    }

    private PedidoDeAlmoco pedidoDaChaveOuErro(Cardapio cardapio, String chave) {
        return pedidoDaChave(cardapio, chave).orElseThrow(() -> new NaoEncontradoException(
                "Não encontramos o seu pedido neste celular. Se ele foi feito em outro aparelho, fale com a recepção."));
    }

    // ---------- regras comuns ----------

    private Cardapio cardapioDeHoje() {
        return cardapioRepository.findByDia(hoje())
                .orElseThrow(() -> new NaoEncontradoException("O cardápio de hoje ainda não foi publicado."));
    }

    private void exigirAberto(Cardapio cardapio) {
        if (cardapio.aberto(agora())) return;
        String quando = cardapio.isEncerrado()
                ? "Os pedidos de hoje foram fechados pela recepção."
                : "Os pedidos de hoje fecharam às " + cardapio.getFechaAs().format(HORA) + ".";
        throw new RegraDeNegocioException(quando + " Para mudar alguma coisa, fale com a recepção.");
    }

    private PedidoDeAlmoco pedidoDe(Cardapio cardapio, Long pedidoId) {
        return pedidoRepository.findByIdAndCardapioId(pedidoId, cardapio.getId())
                .orElseThrow(() -> new NaoEncontradoException("Esse pedido não está na lista de hoje."));
    }

    private PedidoDados gravar(Cardapio cardapio, PedidoDeAlmoco pedido, PedidoEntrada entrada, String lancadoPor) {
        String nome = entrada.nome().trim().replaceAll("\\s+", " ");

        String proteina = entrada.proteina().trim();
        if (!cardapio.getProteinas().contains(proteina)) {
            throw new RegraDeNegocioException(
                    proteina + " não está no cardápio de hoje.", "proteina", "Escolha uma proteína do cardápio de hoje.");
        }
        List<String> escolhidos = semRepetir(entrada.acompanhamentos());
        for (String acompanhamento : escolhidos) {
            if (!cardapio.getAcompanhamentos().contains(acompanhamento)) {
                throw new RegraDeNegocioException(acompanhamento + " não está no cardápio de hoje.",
                        "acompanhamentos", acompanhamento + " não está no cardápio de hoje.");
            }
        }
        // Na ordem do cardápio, e não na ordem dos toques: o PDF fica igual para todo mundo.
        List<String> acompanhamentos = cardapio.getAcompanhamentos().stream().filter(escolhidos::contains).toList();
        String observacao = entrada.observacao() == null || entrada.observacao().isBlank()
                ? null : entrada.observacao().trim();

        pedido.preencher(nome, proteina, acompanhamentos, observacao, agora(), lancadoPor);
        return PedidoDados.de(pedidoRepository.save(pedido));
    }

    /** Sem espaços nas pontas, sem vazios e sem o mesmo nome duas vezes (maiúsculas não contam). */
    static List<String> semRepetir(List<String> nomes) {
        List<String> limpos = new ArrayList<>();
        Set<String> vistos = new HashSet<>();
        if (nomes == null) return limpos;
        for (String nome : nomes) {
            if (nome == null || nome.isBlank()) continue;
            String limpo = nome.trim();
            if (vistos.add(limpo.toLowerCase(Locale.ROOT))) limpos.add(limpo);
        }
        return limpos;
    }
}
