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
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.PrintSetup;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * O relatório mensal de reuniões, em planilha do Excel (.xlsx) ou em PDF, os dois com o mesmo layout.
 */
@Service
public class RelatorioDeReunioes {

    private static final DateTimeFormatter DATA_E_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

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

        return emPdf ? emPdf(titulo, resumo, linhas) : emPlanilha(titulo, resumo, linhas);
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

    // Larguras das colunas na planilha (em caracteres), na mesma proporção da tabela do PDF.
    private static final int[] LARGURAS = {18, 34, 18, 16, 30, 50};

    /**
     * Planilha: uma aba só, com o mesmo layout do PDF. Título grande no topo, o resumo com rótulo e valor
     * em células separadas e depois a tabela, com o cabeçalho escuro, linhas listradas e bordas.
     * Os textos entram como texto (setCellValue), então nada que o usuário digitou vira fórmula.
     */
    private static byte[] emPlanilha(String titulo, List<String[]> resumo, List<String[]> linhas) {
        try (XSSFWorkbook planilha = new XSSFWorkbook(); ByteArrayOutputStream saida = new ByteArrayOutputStream()) {
            XSSFSheet aba = planilha.createSheet("Relatório");
            aba.setDisplayGridlines(false);
            for (int i = 0; i < LARGURAS.length; i++) {
                aba.setColumnWidth(i, LARGURAS[i] * 256);
            }

            CellStyle estiloTitulo = estilo(planilha, true, 16, null, null, false);
            CellStyle estiloRotulo = estilo(planilha, true, 10, null, null, false);
            CellStyle estiloValor = estilo(planilha, false, 10, null, null, false);
            estiloValor.setAlignment(HorizontalAlignment.LEFT);
            CellStyle estiloCabecalho = estilo(planilha, true, 10, new byte[]{(byte) 0xFF, (byte) 0xFF, (byte) 0xFF},
                    new byte[]{0x16, 0x16, 0x16}, true);
            CellStyle estiloCelula = estilo(planilha, false, 10, null, null, true);
            CellStyle estiloListrada = estilo(planilha, false, 10, null,
                    new byte[]{(byte) 0xF4, (byte) 0xF4, (byte) 0xF4}, true);
            CellStyle estiloVazia = estilo(planilha, false, 10, null, null, true);
            estiloVazia.setAlignment(HorizontalAlignment.CENTER);

            int ultimaColuna = CABECALHO.length - 1;
            int linha = 0;

            // Título, mesclado na largura da tabela.
            Row linhaTitulo = aba.createRow(linha);
            linhaTitulo.setHeightInPoints(28);
            escrever(linhaTitulo, 0, titulo, estiloTitulo);
            aba.addMergedRegion(new CellRangeAddress(linha, linha, 0, ultimaColuna));
            linha += 2;

            // Resumo: rótulo na coluna A, valor na B.
            for (String[] item : resumo) {
                Row linhaResumo = aba.createRow(linha++);
                escrever(linhaResumo, 0, item[0], estiloRotulo);
                escrever(linhaResumo, 1, item[1], estiloValor);
            }
            linha++;

            // Tabela.
            int linhaDoCabecalho = linha;
            Row cabecalho = aba.createRow(linha++);
            cabecalho.setHeightInPoints(20);
            for (int i = 0; i < CABECALHO.length; i++) {
                escrever(cabecalho, i, CABECALHO[i], estiloCabecalho);
            }

            if (linhas.isEmpty()) {
                Row vazia = aba.createRow(linha);
                for (int i = 0; i <= ultimaColuna; i++) {
                    escrever(vazia, i, i == 0 ? "Nenhuma reunião neste mês." : "", estiloVazia);
                }
                aba.addMergedRegion(new CellRangeAddress(linha, linha, 0, ultimaColuna));
                linha++;
            }
            for (int i = 0; i < linhas.size(); i++) {
                Row reuniao = aba.createRow(linha++);
                CellStyle estiloDaLinha = i % 2 == 1 ? estiloListrada : estiloCelula;
                String[] valores = linhas.get(i);
                for (int c = 0; c < valores.length; c++) {
                    escrever(reuniao, c, valores[c], estiloDaLinha);
                }
            }

            if (!linhas.isEmpty()) {
                aba.setAutoFilter(new CellRangeAddress(linhaDoCabecalho, linha - 1, 0, ultimaColuna));
            }
            // O cabeçalho da tabela fica fixo ao rolar e se repete em cada página impressa.
            aba.createFreezePane(0, linhaDoCabecalho + 1);
            aba.setRepeatingRows(new CellRangeAddress(linhaDoCabecalho, linhaDoCabecalho, -1, -1));

            // Impressão igual ao PDF: A4 deitado, cabendo na largura da página.
            PrintSetup impressao = aba.getPrintSetup();
            impressao.setPaperSize(PrintSetup.A4_PAPERSIZE);
            impressao.setLandscape(true);
            impressao.setFitWidth((short) 1);
            impressao.setFitHeight((short) 0);
            aba.setFitToPage(true);

            planilha.write(saida);
            return saida.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível gerar a planilha.", e);
        }
    }

    private static void escrever(Row linha, int coluna, String valor, CellStyle estilo) {
        Cell celula = linha.createCell(coluna);
        celula.setCellValue(valor == null ? "" : valor);
        celula.setCellStyle(estilo);
    }

    private static CellStyle estilo(XSSFWorkbook planilha, boolean negrito, int tamanho,
                                    byte[] corDaFonte, byte[] fundo, boolean comBorda) {
        XSSFFont fonte = planilha.createFont();
        fonte.setFontName("Arial");
        fonte.setBold(negrito);
        fonte.setFontHeightInPoints((short) tamanho);
        if (corDaFonte != null) {
            fonte.setColor(new XSSFColor(corDaFonte, null));
        }

        XSSFCellStyle estilo = planilha.createCellStyle();
        estilo.setFont(fonte);
        estilo.setVerticalAlignment(VerticalAlignment.CENTER);
        if (fundo != null) {
            estilo.setFillForegroundColor(new XSSFColor(fundo, null));
            estilo.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
        if (comBorda) {
            estilo.setWrapText(true);
            estilo.setBorderTop(BorderStyle.THIN);
            estilo.setBorderBottom(BorderStyle.THIN);
            estilo.setBorderLeft(BorderStyle.THIN);
            estilo.setBorderRight(BorderStyle.THIN);
            XSSFColor cinza = new XSSFColor(new byte[]{(byte) 0xBF, (byte) 0xBF, (byte) 0xBF}, null);
            estilo.setTopBorderColor(cinza);
            estilo.setBottomBorderColor(cinza);
            estilo.setLeftBorderColor(cinza);
            estilo.setRightBorderColor(cinza);
        }
        return estilo;
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
}
