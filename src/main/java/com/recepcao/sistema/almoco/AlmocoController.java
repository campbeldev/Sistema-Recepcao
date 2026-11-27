package com.recepcao.sistema.almoco;

import com.recepcao.sistema.almoco.AlmocoDados.CardapioDados;
import com.recepcao.sistema.almoco.AlmocoDados.CardapioEntrada;
import com.recepcao.sistema.almoco.AlmocoDados.Painel;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoComChave;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoDados;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoEntrada;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * As rotas do almoço. As de /api/almoco/publico ficam abertas sem login (ver SecurityConfig):
 * são as que o link do grupo usa, sempre com o código do dia. As outras são da recepção.
 */
@RestController
@RequestMapping("/api/almoco")
public class AlmocoController {

    /** O cabeçalho em que o celular manda a chave do pedido que ele fez. */
    static final String CHAVE = "X-Chave-Do-Pedido";

    private final AlmocoService almocoService;
    private final LimiteDoLink limite;

    public AlmocoController(AlmocoService almocoService, LimiteDoLink limite) {
        this.almocoService = almocoService;
        this.limite = limite;
    }

    // ---------- recepção ----------

    @GetMapping("/hoje")
    public Painel painel() {
        return almocoService.painelDeHoje();
    }

    @PutMapping("/hoje/cardapio")
    public CardapioDados publicarCardapio(@RequestBody @Valid CardapioEntrada entrada, Authentication quem) {
        return almocoService.publicarCardapio(entrada, quem.getName());
    }

    @PostMapping("/hoje/fechar")
    public CardapioDados fechar() {
        return almocoService.fechar();
    }

    @PostMapping("/hoje/reabrir")
    public CardapioDados reabrir() {
        return almocoService.reabrir();
    }

    @PostMapping("/hoje/pedidos")
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoDados lancar(@RequestBody @Valid PedidoEntrada entrada, Authentication quem) {
        return almocoService.lancar(entrada, quem.getName());
    }

    @PutMapping("/hoje/pedidos/{pedidoId}")
    public PedidoDados alterar(@PathVariable Long pedidoId, @RequestBody @Valid PedidoEntrada entrada,
                               Authentication quem) {
        return almocoService.alterarPelaRecepcao(pedidoId, entrada, quem.getName());
    }

    @DeleteMapping("/hoje/pedidos/{pedidoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelar(@PathVariable Long pedidoId) {
        almocoService.cancelarPelaRecepcao(pedidoId);
    }

    @GetMapping("/hoje/pdf")
    public ResponseEntity<byte[]> pdf() {
        String arquivo = "ALMOÇO-" + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(arquivo, StandardCharsets.UTF_8).build().toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(almocoService.pdfDeHoje());
    }

    // ---------- link público ----------

    @GetMapping("/publico/{codigo}")
    public CardapioDados publico(@PathVariable String codigo) {
        return almocoService.publico(codigo);
    }

    @GetMapping("/publico/{codigo}/pedidos/meu")
    public ResponseEntity<PedidoDados> meuPedido(@PathVariable String codigo,
                                                 @RequestHeader(value = CHAVE, required = false) String chave) {
        PedidoDados pedido = almocoService.meuPedido(codigo, chave);
        return pedido == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(pedido);
    }

    @PostMapping("/publico/{codigo}/pedidos")
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoComChave pedir(@PathVariable String codigo, @RequestBody @Valid PedidoEntrada entrada,
                                HttpServletRequest requisicao) {
        limite.registrar(requisicao.getRemoteAddr());
        return almocoService.pedirPeloLink(codigo, entrada);
    }

    @PutMapping("/publico/{codigo}/pedidos/meu")
    public PedidoDados alterarMeuPedido(@PathVariable String codigo,
                                        @RequestHeader(value = CHAVE, required = false) String chave,
                                        @RequestBody @Valid PedidoEntrada entrada,
                                        HttpServletRequest requisicao) {
        limite.registrar(requisicao.getRemoteAddr());
        return almocoService.alterarPeloLink(codigo, chave, entrada);
    }

    @DeleteMapping("/publico/{codigo}/pedidos/meu")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelarMeuPedido(@PathVariable String codigo,
                                  @RequestHeader(value = CHAVE, required = false) String chave,
                                  HttpServletRequest requisicao) {
        limite.registrar(requisicao.getRemoteAddr());
        almocoService.cancelarPeloLink(codigo, chave);
    }
}
