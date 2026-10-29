package com.recepcao.sistema.controller;

import com.recepcao.sistema.model.Reuniao;
import com.recepcao.sistema.model.StatusReuniao;
import com.recepcao.sistema.service.ReuniaoService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/relatorio")
public class RelatorioController {

    private final ReuniaoService reuniaoService;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public RelatorioController(ReuniaoService reuniaoService) {
        this.reuniaoService = reuniaoService;
    }

    @GetMapping("/exportar")
    public ResponseEntity<String> exportarRelatorio(
            @RequestParam int mes,
            @RequestParam int ano,
            @RequestParam(defaultValue = "csv") String tipo,
            @RequestParam(required = false) boolean excluirCanceladas) {

        // Buscar todas as reuniões
        List<Reuniao> todas = reuniaoService.listarTodos();

        // Filtrar pelo mês/ano
        List<Reuniao> filtradas = todas.stream()
                .filter(r -> {
                    LocalDateTime data = r.getDatahoraReuniao();
                    return data.getMonthValue() == mes && data.getYear() == ano;
                })
                .collect(Collectors.toList());

        // Se solicitado, excluir canceladas
        if (excluirCanceladas) {
            filtradas = filtradas.stream()
                    .filter(r -> r.getStatus() != StatusReuniao.CANCELADA)
                    .collect(Collectors.toList());
        }

        // Ordenar por data
        filtradas.sort((a, b) -> a.getDatahoraReuniao().compareTo(b.getDatahoraReuniao()));

        // Gerar conteúdo do arquivo
        StringBuilder conteudo = new StringBuilder();

        // Cabeçalho com informações do relatório
        String nomeMes = obterNomeMes(mes);
        conteudo.append("RELATÓRIO DE REUNIÕES - ").append(nomeMes.toUpperCase()).append(" ").append(ano).append("\n");
        conteudo.append("Gerado em: ").append(LocalDateTime.now().format(dateFormatter)).append("\n");
        conteudo.append("Total de reuniões: ").append(filtradas.size()).append("\n");

        // Estatísticas
        long realizadas = filtradas.stream().filter(r -> r.getStatus() == StatusReuniao.FINALIZADA).count();
        long canceladas = filtradas.stream().filter(r -> r.getStatus() == StatusReuniao.CANCELADA).count();
        long agendadas = filtradas.stream().filter(r -> r.getStatus() == StatusReuniao.AGENDADA).count();

        conteudo.append("Realizadas: ").append(realizadas).append("\n");
        conteudo.append("Canceladas: ").append(canceladas).append("\n");
        conteudo.append("Agendadas: ").append(agendadas).append("\n\n");

        // Cabeçalho da tabela
        conteudo.append("DATA;TÍTULO;SALA;STATUS;ANFITRIÃO;PARTICIPANTES\n");

        // Dados
        for (Reuniao r : filtradas) {
            // ===== PEGA OS PARTICIPANTES (SEM USAR getContato) =====
            String participantes = "";
            if (r.getParticipantes() != null && !r.getParticipantes().isEmpty()) {
                participantes = r.getParticipantes().stream()
                        .map(p -> p.getContato().getNomeParticipante())  // p.getContato() existe em ReuniaoParticipante
                        .distinct()  // Remove duplicatas
                        .collect(Collectors.joining(", "));
            }

            // ===== PEGA OS ANFITRIÕES =====
            String anfitrioes = "";
            if (r.getAnfitrioes() != null && !r.getAnfitrioes().isEmpty()) {
                anfitrioes = r.getAnfitrioes().stream()
                        .filter(a -> a.getContato() != null)  // Garante que contato não é null
                        .map(a -> a.getContato().getNomeParticipante())
                        .distinct()  // Remove duplicatas
                        .collect(Collectors.joining(", "));
            }

            // Se não tiver anfitriões, coloca "Não definido"
            if (anfitrioes.isEmpty()) {
                anfitrioes = "Não definido";
            }

            // Se não tiver participantes, coloca vazio
            if (participantes.isEmpty()) {
                participantes = "";
            }

            // Monta a linha com 6 colunas
            conteudo.append(String.format("%s;%s;%s;%s;%s;%s\n",
                    r.getDatahoraReuniao().format(dateFormatter),  // DATA
                    r.getTitulo() != null ? r.getTitulo() : "",     // TÍTULO
                    r.getSala() != null ? r.getSala() : "",         // SALA
                    r.getStatus() != null ? r.getStatus().toString() : "", // STATUS
                    anfitrioes,                                      // ANFITRIÃO
                    participantes                                    // PARTICIPANTES
            ));
        }

        // Configurar headers para download
        String filename = String.format("relatorio_%s_%d.%s", nomeMes.toLowerCase(), ano, tipo);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        headers.add(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");

        return ResponseEntity.ok()
                .headers(headers)
                .body(conteudo.toString());
    }

    private String obterNomeMes(int mes) {
        String[] meses = {
                "janeiro", "fevereiro", "março", "abril", "maio", "junho",
                "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        };
        return meses[mes - 1];
    }
}