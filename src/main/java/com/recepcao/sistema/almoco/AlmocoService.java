package com.recepcao.sistema.almoco;

import com.recepcao.sistema.almoco.AlmocoDados.CardapioDados;
import com.recepcao.sistema.almoco.AlmocoDados.CardapioEntrada;
import com.recepcao.sistema.almoco.AlmocoDados.Painel;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoDados;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoEntrada;
import com.recepcao.sistema.almoco.AlmocoDados.PessoaDoAlmoco;
import com.recepcao.sistema.almoco.AlmocoDados.Publico;
import com.recepcao.sistema.almoco.AlmocoDados.Sugestao;
import com.recepcao.sistema.comum.erro.NaoEncontradoException;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
import com.recepcao.sistema.pessoa.Pessoa;
import com.recepcao.sistema.pessoa.PessoaRepository;
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
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * O pedido de almoço do dia: a recepção publica o cardápio, cada pessoa pede pelo link até a hora de
 * fechar, e a recepção acompanha, lança o pedido de quem não conseguiu e gera o PDF para o restaurante.
 */
@Service
public class AlmocoService {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final CardapioRepository cardapioRepository;
    private final PedidoDeAlmocoRepository pedidoRepository;
    private final PessoaRepository pessoaRepository;
    private final Clock relogio;

    @Autowired
    public AlmocoService(CardapioRepository cardapioRepository,
                         PedidoDeAlmocoRepository pedidoRepository,
                         PessoaRepository pessoaRepository) {
        this(cardapioRepository, pedidoRepository, pessoaRepository, Clock.systemDefaultZone());
    }

    /** Com o relógio parado, para os testes. */
    AlmocoService(CardapioRepository cardapioRepository,
                  PedidoDeAlmocoRepository pedidoRepository,
                  PessoaRepository pessoaRepository,
                  Clock relogio) {
        this.cardapioRepository = cardapioRepository;
        this.pedidoRepository = pedidoRepository;
        this.pessoaRepository = pessoaRepository;
        this.relogio = relogio;
    }

    private LocalDateTime agora() {
        return LocalDateTime.now(relogio).truncatedTo(ChronoUnit.SECONDS);
    }

    private LocalDate hoje() {
        return agora().toLocalDate();
    }

    // ---------- a tela da recepção ----------

    @Transactional(readOnly = true)
    public Painel painelDeHoje() {
        var cardapio = cardapioRepository.findByDia(hoje()).orElse(null);
        if (cardapio == null) {
            Sugestao sugestao = cardapioRepository.findFirstByDiaBeforeOrderByDiaDesc(hoje())
                    .map(anterior -> new Sugestao(
                            List.copyOf(anterior.getProteinas()),
                            List.copyOf(anterior.getAcompanhamentos()),
                            anterior.getFechaAs()))
                    .orElse(null);
            return new Painel(null, List.of(), List.of(), sugestao);
        }

        List<PedidoDados> pedidos = pedidoRepository.findByCardapioIdOrderByFeitoEmAsc(cardapio.getId())
                .stream().map(PedidoDados::de).toList();
        Set<Long> jaPediram = pedidos.stream().map(PedidoDados::pessoaId).collect(Collectors.toSet());
        List<PessoaDoAlmoco> semPedido = pessoaRepository.findByAtivoTrueOrderByNomeAsc().stream()
                .filter(pessoa -> !jaPediram.contains(pessoa.getId()))
                .map(PessoaDoAlmoco::de)
                .toList();
        return new Painel(CardapioDados.de(cardapio, agora()), pedidos, semPedido, null);
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

    /** A recepção lança ou altera o pedido de alguém, mesmo depois de fechar. */
    @Transactional
    public PedidoDados lancar(Long pessoaId, PedidoEntrada entrada, String quem) {
        return gravar(cardapioDeHoje(), pessoaId, entrada, quem);
    }

    @Transactional
    public void cancelarPelaRecepcao(Long pessoaId) {
        Cardapio cardapio = cardapioDeHoje();
        pedidoRepository.delete(pedidoDe(cardapio, pessoaId));
    }

    @Transactional(readOnly = true)
    public byte[] pdfDeHoje() {
        Cardapio cardapio = cardapioDeHoje();
        List<PedidoDados> pedidos = pedidoRepository.findByCardapioIdOrderByFeitoEmAsc(cardapio.getId())
                .stream().map(PedidoDados::de).toList();
        return PdfDoAlmoco.gerar(CardapioDados.de(cardapio, agora()), pedidos, agora());
    }

    // ---------- o link público ----------

    @Transactional(readOnly = true)
    public Publico publico() {
        CardapioDados cardapio = cardapioRepository.findByDia(hoje())
                .map(encontrado -> CardapioDados.de(encontrado, agora()))
                .orElse(null);
        List<PessoaDoAlmoco> pessoas = pessoaRepository.findByAtivoTrueOrderByNomeAsc().stream()
                .map(PessoaDoAlmoco::de).toList();
        return new Publico(cardapio, pessoas);
    }

    @Transactional(readOnly = true)
    public PedidoDados pedidoPublico(Long pessoaId) {
        Cardapio cardapio = cardapioDeHoje();
        return pedidoRepository.findByCardapioIdAndPessoaId(cardapio.getId(), pessoaId)
                .map(PedidoDados::de)
                .orElse(null);
    }

    @Transactional
    public PedidoDados pedirPeloLink(Long pessoaId, PedidoEntrada entrada) {
        Cardapio cardapio = cardapioDeHoje();
        exigirAberto(cardapio);
        return gravar(cardapio, pessoaId, entrada, null);
    }

    @Transactional
    public void cancelarPeloLink(Long pessoaId) {
        Cardapio cardapio = cardapioDeHoje();
        exigirAberto(cardapio);
        pedidoRepository.delete(pedidoDe(cardapio, pessoaId));
    }

    // ---------- regras comuns ----------

    private Cardapio cardapioDeHoje() {
        return cardapioRepository.findByDia(hoje())
                .orElseThrow(() -> new NaoEncontradoException("O cardápio de hoje ainda não foi publicado."));
    }

    private void exigirAberto(Cardapio cardapio) {
        if (!cardapio.aberto(agora())) {
            throw new RegraDeNegocioException(
                    "Os pedidos de hoje fecharam às " + cardapio.getFechaAs().format(HORA)
                            + ". Para mudar alguma coisa, fale com a recepção.");
        }
    }

    private PedidoDeAlmoco pedidoDe(Cardapio cardapio, Long pessoaId) {
        return pedidoRepository.findByCardapioIdAndPessoaId(cardapio.getId(), pessoaId)
                .orElseThrow(() -> new NaoEncontradoException("Essa pessoa não fez pedido hoje."));
    }

    private PedidoDados gravar(Cardapio cardapio, Long pessoaId, PedidoEntrada entrada, String lancadoPor) {
        Pessoa pessoa = pessoaRepository.findById(pessoaId)
                .filter(Pessoa::isAtivo)
                .orElseThrow(() -> new NaoEncontradoException("Pessoa não encontrada."));

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

        PedidoDeAlmoco pedido = pedidoRepository.findByCardapioIdAndPessoaId(cardapio.getId(), pessoaId)
                .orElseGet(() -> new PedidoDeAlmoco(cardapio, pessoa));
        pedido.preencher(proteina, acompanhamentos, observacao, agora(), lancadoPor);
        return PedidoDados.de(pedidoRepository.save(pedido));
    }

    /** Sem espaços nas pontas, sem vazios e sem o mesmo nome duas vezes (maiúsculas não contam). */
    static List<String> semRepetir(List<String> nomes) {
        List<String> limpos = new ArrayList<>();
        Set<String> vistos = new java.util.HashSet<>();
        if (nomes == null) return limpos;
        for (String nome : nomes) {
            if (nome == null || nome.isBlank()) continue;
            String limpo = nome.trim();
            if (vistos.add(limpo.toLowerCase(Locale.ROOT))) limpos.add(limpo);
        }
        return limpos;
    }
}
