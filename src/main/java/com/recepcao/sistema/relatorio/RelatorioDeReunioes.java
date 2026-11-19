package com.recepcao.sistema.relatorio;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
import com.recepcao.sistema.contato.Contato;
import com.recepcao.sistema.contato.ContatoRepository;
import com.recepcao.sistema.reuniao.Reuniao;
import com.recepcao.sistema.reuniao.ReuniaoRepository;
import com.recepcao.sistema.reuniao.StatusReuniao;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * O relatório mensal de reuniões, em planilha (CSV separado por ponto e vírgula, que o Excel abre direto) ou em PDF.
 */
@Service
public class RelatorioDeReunioes {

    private static final DateTimeFormatter DATA_E_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

    // Quebra de linha do Windows, que o Excel lê sem surpresa.
    private static final String LINHA = "\r\n";
    // Marca de UTF-8 no começo do arquivo: sem ela o Excel lê os acentos errado ("RELATÃ“RIO").
    private static final String MARCA_UTF8 = "﻿";

    private static final String[] CABECALHO = {"DATA", "TÍTULO", "SALA", "STATUS", "ANFITRIÃO", "PARTICIPANTES"};

    private final ReuniaoRepository reuniaoRepository;
    private final ContatoRepository contatoRepository;

    public RelatorioDeReunioes(ReuniaoRepository reuniaoRepository, ContatoRepository contatoRepository) {
        this.reuniaoRepository = reuniaoRepository;
        this.contatoRepository = contatoRepository;
    }

    public static String nomeDoMes(int mes) {
        return YearMonth.of(2000, mes).getMonth().getDisplayName(TextStyle.FULL, PT_BR);
    }

    /** Em que papel o contato escolhido precisa estar na reunião para ela entrar no relatório. */
    public enum Papel {
        QUALQUER, ANFITRIAO, PARTICIPANTE
    }

    @Transactional(readOnly = true)
    public byte[] gerar(int mes, int ano, boolean excluirCanceladas, Long contatoId, Papel papel, boolean emPdf) {
        if (mes < 1 || mes > 12) {
            throw new RegraDeNegocioException("O mês precisa estar entre 1 e 12.");
        }

        YearMonth periodo = YearMonth.of(ano, mes);
        List<Reuniao> reunioes = reuniaoRepository
                .findByDatahoraReuniaoGreaterThanEqualAndDatahoraReuniaoLessThanOrderByDatahoraReuniao(
                        periodo.atDay(1).atStartOfDay(), periodo.plusMonths(1).atDay(1).atStartOfDay())
                .stream()
                .filter(r -> !excluirCanceladas || r.getStatus() != StatusReuniao.CANCELADA)
                .filter(r -> contatoId == null || temContato(r, contatoId, papel))
                .toList();

        String titulo = "RELATÓRIO DE REUNIÕES - " + nomeDoMes(mes).toUpperCase(PT_BR) + ' ' + ano;
        if (contatoId != null) {
            String nome = contatoRepository.findById(contatoId)
                    .map(Contato::getNomeParticipante)
                    .orElseThrow(() -> new RegraDeNegocioException("Contato não encontrado."));
            titulo += " - " + nome + switch (papel) {
                case ANFITRIAO -> " (como anfitrião)";
                case PARTICIPANTE -> " (como participante)";
                case QUALQUER -> "";
            };
        }
        List<String[]> resumo = List.of(
                new String[]{"Gerado em", LocalDateTime.now().format(DATA_E_HORA)},
                new String[]{"Total de reuniões", String.valueOf(reunioes.size())},
                new String[]{"Realizadas", String.valueOf(contar(reunioes, StatusReuniao.FINALIZADA))},
                new String[]{"Canceladas", String.valueOf(contar(reunioes, StatusReuniao.CANCELADA))},
                new String[]{"Agendadas", String.valueOf(contar(reunioes, StatusReuniao.AGENDADA))});
        List<String[]> linhas = reunioes.stream().map(RelatorioDeReunioes::colunas).toList();

        return emPdf
                ? emPdf(titulo, resumo, linhas)
                : emPlanilha(titulo, resumo, linhas).getBytes(StandardCharsets.UTF_8);
    }

    private static String[] colunas(Reuniao r) {
        String anfitrioes = nomes(r.getAnfitrioes().stream().map(a -> a.getContato().getNomeParticipante()));
        String participantes = nomes(r.getParticipantes().stream().map(p -> p.getContato().getNomeParticipante()));
        return new String[]{
                r.getDatahoraReuniao().format(DATA_E_HORA),
                r.getTitulo() == null ? "" : r.getTitulo(),
                r.getSala() == null ? "" : r.getSala(),
                r.getStatus() == null ? "" : r.getStatus().getNome(),
                anfitrioes.isEmpty() ? "Não definido" : anfitrioes,
                participantes};
    }

    // Planilha: cada rótulo do resumo na coluna A e o valor na B; depois a tabela, uma reunião por linha.
    private static String emPlanilha(String titulo, List<String[]> resumo, List<String[]> linhas) {
        StringBuilder csv = new StringBuilder(MARCA_UTF8);
        csv.append(celula(titulo)).append(LINHA);
        for (String[] item : resumo) {
            csv.append(celula(item[0])).append(';').append(celula(item[1])).append(LINHA);
        }
        csv.append(LINHA);
        csv.append(String.join(";", CABECALHO)).append(LINHA);
        for (String[] linha : linhas) {
            csv.append(Stream.of(linha).map(RelatorioDeReunioes::celula).collect(Collectors.joining(";"))).append(LINHA);
        }
        return csv.toString();
    }

    // PDF: A4 deitado, título, resumo e a tabela com o cabeçalho repetido em cada página.
    private static byte[] emPdf(String titulo, List<String[]> resumo, List<String[]> linhas) {
        Font fonteTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Font fonteResumo = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font fonteCabecalho = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        Font fonteCelula = FontFactory.getFont(FontFactory.HELVETICA, 9);

        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.A4.rotate(), 30, 30, 30, 30);
        PdfWriter.getInstance(documento, saida);
        documento.open();

        documento.add(new Paragraph(titulo, fonteTitulo));
        for (String[] item : resumo) {
            documento.add(new Paragraph(item[0] + ": " + item[1], fonteResumo));
        }

        PdfPTable tabela = new PdfPTable(new float[]{1.3f, 2.4f, 1.2f, 1.1f, 2f, 3f});
        tabela.setWidthPercentage(100);
        tabela.setSpacingBefore(12);
        tabela.setHeaderRows(1);

        for (String nome : CABECALHO) {
            PdfPCell cabecalho = new PdfPCell(new Phrase(nome, fonteCabecalho));
            cabecalho.setBackgroundColor(new Color(0x16, 0x16, 0x16));
            cabecalho.setPadding(5);
            tabela.addCell(cabecalho);
        }
        if (linhas.isEmpty()) {
            PdfPCell vazia = new PdfPCell(new Phrase("Nenhuma reunião neste mês.", fonteCelula));
            vazia.setColspan(CABECALHO.length);
            vazia.setHorizontalAlignment(Element.ALIGN_CENTER);
            vazia.setPadding(8);
            tabela.addCell(vazia);
        }
        Color listra = new Color(0xF4, 0xF4, 0xF4);
        for (int i = 0; i < linhas.size(); i++) {
            for (String valor : linhas.get(i)) {
                PdfPCell celula = new PdfPCell(new Phrase(valor, fonteCelula));
                celula.setPadding(4);
                if (i % 2 == 1) {
                    celula.setBackgroundColor(listra);
                }
                tabela.addCell(celula);
            }
        }
        documento.add(tabela);
        documento.close();
        return saida.toByteArray();
    }

    private static boolean temContato(Reuniao r, Long contatoId, Papel papel) {
        boolean anfitriao = r.getAnfitrioes().stream()
                .anyMatch(a -> a.getContato() != null && contatoId.equals(a.getContato().getId()));
        boolean participante = r.getParticipantes().stream()
                .anyMatch(p -> p.getContato() != null && contatoId.equals(p.getContato().getId()));
        return switch (papel) {
            case ANFITRIAO -> anfitriao;
            case PARTICIPANTE -> participante;
            case QUALQUER -> anfitriao || participante;
        };
    }

    private static long contar(List<Reuniao> reunioes, StatusReuniao status) {
        return reunioes.stream().filter(r -> r.getStatus() == status).count();
    }

    private static String nomes(Stream<String> nomes) {
        return nomes.distinct().collect(Collectors.joining(", "));
    }

    /**
     * Uma célula segura: entre aspas (para ";" e quebra de linha não abrirem coluna nova)
     * e com apóstrofo antes de =, +, - e @, para o Excel não executar o texto como fórmula.
     */
    private static String celula(String valor) {
        if (valor == null || valor.isEmpty()) {
            return "";
        }
        String texto = "=+-@".indexOf(valor.charAt(0)) >= 0 ? "'" + valor : valor;
        return '"' + texto.replace("\"", "\"\"") + '"';
    }
}
