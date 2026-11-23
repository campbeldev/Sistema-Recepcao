package com.recepcao.sistema.almoco;

import com.recepcao.sistema.almoco.AlmocoDados.CardapioDados;
import com.recepcao.sistema.almoco.AlmocoDados.CardapioEntrada;
import com.recepcao.sistema.almoco.AlmocoDados.Painel;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoDados;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoEntrada;
import com.recepcao.sistema.almoco.AlmocoDados.Publico;
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
 * são as que o link do grupo usa. As outras são da recepção.
 */
@RestController
@RequestMapping("/api/almoco")
public class AlmocoController {

    private final AlmocoService almocoService;

    public AlmocoController(AlmocoService almocoService) {
        this.almocoService = almocoService;
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

    @PutMapping("/hoje/pedidos/{pessoaId}")
    public PedidoDados lancar(@PathVariable Long pessoaId, @RequestBody @Valid PedidoEntrada entrada,
                              Authentication quem) {
        return almocoService.lancar(pessoaId, entrada, quem.getName());
    }

    @DeleteMapping("/hoje/pedidos/{pessoaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelar(@PathVariable Long pessoaId) {
        almocoService.cancelarPelaRecepcao(pessoaId);
    }

    @GetMapping("/hoje/pdf")
    public ResponseEntity<byte[]> pdf() {
        String arquivo = "almoco-" + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(arquivo, StandardCharsets.UTF_8).build().toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(almocoService.pdfDeHoje());
    }

    // ---------- link público ----------

    @GetMapping("/publico")
    public Publico publico() {
        return almocoService.publico();
    }

    @GetMapping("/publico/pedidos/{pessoaId}")
    public ResponseEntity<PedidoDados> pedidoPublico(@PathVariable Long pessoaId) {
        PedidoDados pedido = almocoService.pedidoPublico(pessoaId);
        return pedido == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(pedido);
    }

    @PutMapping("/publico/pedidos/{pessoaId}")
    public PedidoDados pedir(@PathVariable Long pessoaId, @RequestBody @Valid PedidoEntrada entrada) {
        return almocoService.pedirPeloLink(pessoaId, entrada);
    }

    @DeleteMapping("/publico/pedidos/{pessoaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelarPeloLink(@PathVariable Long pessoaId) {
        almocoService.cancelarPeloLink(pessoaId);
    }
}
