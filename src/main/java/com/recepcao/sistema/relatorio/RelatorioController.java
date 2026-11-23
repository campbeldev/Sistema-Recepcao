package com.recepcao.sistema.relatorio;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/relatorio")
public class RelatorioController {

    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final RelatorioDeReunioes relatorioDeReunioes;

    public RelatorioController(RelatorioDeReunioes relatorioDeReunioes) {
        this.relatorioDeReunioes = relatorioDeReunioes;
    }

    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportarRelatorio(@RequestParam int mes,
                                                    @RequestParam int ano,
                                                    @RequestParam(defaultValue = "xlsx") String tipo,
                                                    @RequestParam(defaultValue = "false") boolean excluirCanceladas,
                                                    @RequestParam(required = false) Long contato,
                                                    @RequestParam(defaultValue = "QUALQUER") RelatorioDeReunioes.Papel papel,
                                                    @RequestParam(defaultValue = "false") boolean incluirLembretes) {
        boolean pdf = "pdf".equalsIgnoreCase(tipo);
        byte[] conteudo = relatorioDeReunioes.gerar(mes, ano, excluirCanceladas, contato, papel, incluirLembretes, pdf);

        String arquivo = "relatorio_%s_%d.%s".formatted(RelatorioDeReunioes.nomeDoMes(mes), ano, pdf ? "pdf" : "xlsx");
        MediaType formato = pdf ? MediaType.APPLICATION_PDF : XLSX;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(arquivo, StandardCharsets.UTF_8).build().toString())
                .contentType(formato)
                .body(conteudo);
    }
}
