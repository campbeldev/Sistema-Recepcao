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
import com.recepcao.sistema.lembrete.Lembrete;
import com.recepcao.sistema.lembrete.LembreteRepository;
import com.recepcao.sistema.reuniao.Reuniao;
import com.recepcao.sistema.reuniao.ReuniaoParticipante;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * O relatório mensal de reuniões (e, se pedido, dos lembretes do mês), em planilha do Excel (.xlsx)
 * ou em PDF, os dois com o mesmo layout.
 */
@Service
public class RelatorioDeReunioes {

    private static final DateTimeFormatter DATA_E_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

    // Larguras das colunas na planilha (em caracteres). Valem para todas as tabelas da aba.
    // A coluna A é larga o bastante para os rótulos do resumo em maiúsculas (ex.: "LEMBRETES PENDENTES") caberem numa linha.
    private static final int[] LARGURAS = {28, 34, 18, 16, 30, 50};
    private static final int COLUNAS = LARGURAS.length;

    /** Uma tabela do relatório. O título só aparece quando o relatório tem mais de uma. */
    record Tabela(String titulo, String[] cabecalho, float[] pesosNoPdf, List<String[]> linhas, String vazia) {}

    private final ReuniaoRepository reuniaoRepository;
    private final ContatoRepository contatoRepository;
    private final LembreteRepository lembreteRepository;

    public RelatorioDeReunioes(ReuniaoRepository reuniaoRepository, ContatoRepository contatoRepository,
                               LembreteRepository lembreteRepository) {
        this.reuniaoRepository = reuniaoRepository;
        this.contatoRepository = contatoRepository;
        this.lembreteRepository = lembreteRepository;
    }

    public static String nomeDoMes(int mes) {
        return YearMonth.of(2000, mes).getMonth().getDisplayName(TextStyle.FULL, PT_BR);
    }

    /** Em que papel o contato escolhido precisa estar na reunião para ela entrar no relatório. */
    public enum Papel {
        QUALQUER, ANFITRIAO, PARTICIPANTE
    }

    @Transactional(readOnly = true)
    public byte[] gerar(int mes, int ano, boolean excluirCanceladas, Long contatoId, Papel papel,
                        boolean incluirLembretes, boolean emPdf) {
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

        String titulo = (incluirLembretes ? "RELATÓRIO DE REUNIÕES E LEMBRETES - " : "RELATÓRIO DE REUNIÕES - ")
                + nomeDoMes(mes).toUpperCase(PT_BR) + ' ' + ano;
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

        List<String[]> resumo = new ArrayList<>(List.of(
                new String[]{"GERADO EM", LocalDateTime.now().format(DATA_E_HORA)},
                new String[]{"TOTAL DE REUNIÕES", String.valueOf(reunioes.size())},
                new String[]{"REALIZADAS", String.valueOf(contar(reunioes, StatusReuniao.FINALIZADA))},
                new String[]{"CANCELADAS", String.valueOf(contar(reunioes, StatusReuniao.CANCELADA))},
                new String[]{"AGENDADAS", String.valueOf(contar(reunioes, StatusReuniao.AGENDADA))}));

        List<Tabela> tabelas = new ArrayList<>();
        tabelas.add(new Tabela("REUNIÕES",
                new String[]{"DATA", "TÍTULO", "SALA", "STATUS", "ANFITRIÃO", "PARTICIPANTES"},
                new float[]{1.3f, 2.4f, 1.2f, 1.1f, 2f, 3f},
                reunioes.stream().map(RelatorioDeReunioes::colunas).toList(),
                "Nenhuma reunião neste mês."));

        if (incluirLembretes) {
            LocalDate hoje = LocalDate.now();
            List<Lembrete> lembretes = lembreteRepository
                    .findByDiaGreaterThanEqualAndDiaLessThan(periodo.atDay(1), periodo.plusMonths(1).atDay(1))
                    .stream()
                    // Por dia; no mesmo dia, o que não tem hora vem antes (vale o dia todo).
                    .sorted(Comparator.comparing(Lembrete::getDia)
                            .thenComparing(Lembrete::getHora, Comparator.nullsFirst(Comparator.naturalOrder())))
                    .toList();
            long feitos = lembretes.stream().filter(Lembrete::isFeito).count();
            resumo.add(new String[]{"TOTAL DE LEMBRETES", String.valueOf(lembretes.size())});
            resumo.add(new String[]{"LEMBRETES FEITOS", String.valueOf(feitos)});
            resumo.add(new String[]{"LEMBRETES PENDENTES", String.valueOf(lembretes.size() - feitos)});
            tabelas.add(new Tabela("LEMBRETES",
                    new String[]{"DIA", "DESCRIÇÃO", "PARA QUEM", "SITUAÇÃO", "CRIADO POR"},
                    new float[]{1.3f, 4.4f, 1.6f, 1.1f, 1.6f},
                    lembretes.stream().map(l -> colunas(l, hoje)).toList(),
                    "Nenhum lembrete neste mês."));
        }

        return emPdf ? emPdf(titulo, resumo, tabelas) : emPlanilha(titulo, resumo, tabelas);
    }

    private static String[] colunas(Reuniao r) {
        String anfitrioes = nomes(r.getAnfitrioes().stream().map(a -> a.getContato().getNomeParticipante()));
        String participantes = nomes(r.getParticipantes().stream().map(ReuniaoParticipante::getNome));
        return new String[]{
                r.getDatahoraReuniao().format(DATA_E_HORA),
                r.getTitulo() == null ? "" : r.getTitulo(),
                r.getSala() == null ? "" : r.getSala(),
                r.getStatus() == null ? "" : r.getStatus().getNome(),
                anfitrioes.isEmpty() ? "Não definido" : anfitrioes,
                participantes};
    }

    private static String[] colunas(Lembrete l, LocalDate hoje) {
        LocalTime hora = l.getHora();
        String quando = l.getDia().format(DATA) + (hora == null ? "" : " " + hora.format(HORA));
        // A mesma regra da tela de lembretes.
        String situacao = l.isFeito() ? "Feito" : l.getDia().isBefore(hoje) ? "Atrasado" : "Pendente";
        return new String[]{
                quando,
                l.getDescricao() == null ? "" : l.getDescricao(),
                l.getParaQuem() == null ? "" : l.getParaQuem(),
                situacao,
                l.getCriadoPor() == null ? "" : l.getCriadoPor()};
    }

    /**
     * Planilha: uma aba só, com o mesmo layout do PDF. Título grande no topo, o resumo com rótulo e valor
     * em células separadas e depois as tabelas, com o cabeçalho escuro, linhas listradas e bordas.
     * Os textos entram como texto (setCellValue), então nada que o usuário digitou vira fórmula.
     */
    private static byte[] emPlanilha(String titulo, List<String[]> resumo, List<Tabela> tabelas) {
        try (XSSFWorkbook planilha = new XSSFWorkbook(); ByteArrayOutputStream saida = new ByteArrayOutputStream()) {
            XSSFSheet aba = planilha.createSheet("Relatório");
            for (int i = 0; i < COLUNAS; i++) {
                aba.setColumnWidth(i, LARGURAS[i] * 256);
            }

            CellStyle estiloTitulo = estilo(planilha, true, 16, null, null, false);
            CellStyle estiloSecao = estilo(planilha, true, 12, null, null, false);
            // Resumo num bloco com borda: rótulo em fundo preto, como o cabeçalho das tabelas, e o valor em negrito.
            CellStyle estiloRotulo = estilo(planilha, true, 10, new byte[]{(byte) 0xFF, (byte) 0xFF, (byte) 0xFF},
                    new byte[]{0x16, 0x16, 0x16}, true);
            estiloRotulo.setWrapText(false);
            CellStyle estiloValor = estilo(planilha, true, 10, null, null, true);
            estiloValor.setAlignment(HorizontalAlignment.LEFT);
            CellStyle estiloCabecalho = estilo(planilha, true, 10, new byte[]{(byte) 0xFF, (byte) 0xFF, (byte) 0xFF},
                    new byte[]{0x16, 0x16, 0x16}, true);
            CellStyle estiloCelula = estilo(planilha, false, 10, null, null, true);
            CellStyle estiloListrada = estilo(planilha, false, 10, null,
                    new byte[]{(byte) 0xF4, (byte) 0xF4, (byte) 0xF4}, true);
            CellStyle estiloVazia = estilo(planilha, false, 10, null, null, true);
            estiloVazia.setAlignment(HorizontalAlignment.CENTER);

            int linha = 0;

            // Título, mesclado na largura da aba.
            Row linhaTitulo = aba.createRow(linha);
            linhaTitulo.setHeightInPoints(28);
            escrever(linhaTitulo, 0, titulo, estiloTitulo);
            aba.addMergedRegion(new CellRangeAddress(linha, linha, 0, COLUNAS - 1));
            linha += 2;

            // Resumo: rótulo na coluna A, valor na B.
            for (String[] item : resumo) {
                Row linhaResumo = aba.createRow(linha++);
                linhaResumo.setHeightInPoints(18);
                escrever(linhaResumo, 0, item[0], estiloRotulo);
                escrever(linhaResumo, 1, item[1], estiloValor);
            }

            boolean variasTabelas = tabelas.size() > 1;
            int cabecalhoDaPrimeira = -1;
            int fimDaPrimeira = -1;
            for (Tabela tabela : tabelas) {
                linha++;
                if (variasTabelas) {
                    Row secao = aba.createRow(linha++);
                    secao.setHeightInPoints(20);
                    escrever(secao, 0, tabela.titulo(), estiloSecao);
                }
                int ultimaColuna = tabela.cabecalho().length - 1;

                if (cabecalhoDaPrimeira < 0) {
                    cabecalhoDaPrimeira = linha;
                }
                Row cabecalho = aba.createRow(linha++);
                cabecalho.setHeightInPoints(20);
                for (int i = 0; i <= ultimaColuna; i++) {
                    escrever(cabecalho, i, tabela.cabecalho()[i], estiloCabecalho);
                }

                if (tabela.linhas().isEmpty()) {
                    Row vazia = aba.createRow(linha);
                    for (int i = 0; i <= ultimaColuna; i++) {
                        escrever(vazia, i, i == 0 ? tabela.vazia() : "", estiloVazia);
                    }
                    aba.addMergedRegion(new CellRangeAddress(linha, linha, 0, ultimaColuna));
                    linha++;
                }
                for (int i = 0; i < tabela.linhas().size(); i++) {
                    Row registro = aba.createRow(linha++);
                    CellStyle estiloDaLinha = i % 2 == 1 ? estiloListrada : estiloCelula;
                    String[] valores = tabela.linhas().get(i);
                    for (int c = 0; c < valores.length; c++) {
                        escrever(registro, c, valores[c], estiloDaLinha);
                    }
                }
                if (fimDaPrimeira < 0) {
                    fimDaPrimeira = tabela.linhas().isEmpty() ? -2 : linha - 1;
                }
            }

            // Com uma tabela só, o cabeçalho dela fica fixo ao rolar, tem filtro e se repete em cada página impressa.
            // Com mais de uma, isso confundiria (o cabeçalho das reuniões ficaria por cima dos lembretes).
            if (!variasTabelas) {
                int colunasDaTabela = tabelas.get(0).cabecalho().length - 1;
                if (fimDaPrimeira >= 0) {
                    aba.setAutoFilter(new CellRangeAddress(cabecalhoDaPrimeira, fimDaPrimeira, 0, colunasDaTabela));
                }
                aba.createFreezePane(0, cabecalhoDaPrimeira + 1);
                aba.setRepeatingRows(new CellRangeAddress(cabecalhoDaPrimeira, cabecalhoDaPrimeira, -1, -1));
            }

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

    // PDF: A4 deitado, título, resumo e as tabelas, cada uma com o cabeçalho repetido em cada página.
    private static byte[] emPdf(String titulo, List<String[]> resumo, List<Tabela> tabelas) {
        Font fonteTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Font fonteSecao = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font fonteRotulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
        Font fonteValor = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font fonteCabecalho = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        Font fonteCelula = FontFactory.getFont(FontFactory.HELVETICA, 9);
        Color listra = new Color(0xF4, 0xF4, 0xF4);

        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.A4.rotate(), 30, 30, 30, 30);
        PdfWriter.getInstance(documento, saida);
        documento.open();

        documento.add(new Paragraph(titulo, fonteTitulo));

        // Resumo num bloco: rótulo em fundo preto e valor em negrito, um item embaixo do outro.
        PdfPTable blocoResumo = new PdfPTable(new float[]{1.3f, 2.4f});
        blocoResumo.setWidthPercentage(35);
        blocoResumo.setHorizontalAlignment(Element.ALIGN_LEFT);
        blocoResumo.setSpacingBefore(10);
        for (String[] item : resumo) {
            PdfPCell rotulo = new PdfPCell(new Phrase(item[0], fonteRotulo));
            rotulo.setBackgroundColor(new Color(0x16, 0x16, 0x16));
            rotulo.setPadding(4);
            blocoResumo.addCell(rotulo);
            PdfPCell valor = new PdfPCell(new Phrase(item[1], fonteValor));
            valor.setPadding(4);
            blocoResumo.addCell(valor);
        }
        documento.add(blocoResumo);

        boolean variasTabelas = tabelas.size() > 1;
        for (Tabela dados : tabelas) {
            if (variasTabelas) {
                Paragraph secao = new Paragraph(dados.titulo(), fonteSecao);
                secao.setSpacingBefore(16);
                documento.add(secao);
            }

            PdfPTable tabela = new PdfPTable(dados.pesosNoPdf());
            tabela.setWidthPercentage(100);
            tabela.setSpacingBefore(variasTabelas ? 6 : 12);
            tabela.setHeaderRows(1);

            for (String nome : dados.cabecalho()) {
                PdfPCell cabecalho = new PdfPCell(new Phrase(nome, fonteCabecalho));
                cabecalho.setBackgroundColor(new Color(0x16, 0x16, 0x16));
                cabecalho.setPadding(5);
                tabela.addCell(cabecalho);
            }
            if (dados.linhas().isEmpty()) {
                PdfPCell vazia = new PdfPCell(new Phrase(dados.vazia(), fonteCelula));
                vazia.setColspan(dados.cabecalho().length);
                vazia.setHorizontalAlignment(Element.ALIGN_CENTER);
                vazia.setPadding(8);
                tabela.addCell(vazia);
            }
            for (int i = 0; i < dados.linhas().size(); i++) {
                for (String valor : dados.linhas().get(i)) {
                    PdfPCell celula = new PdfPCell(new Phrase(valor, fonteCelula));
                    celula.setPadding(4);
                    if (i % 2 == 1) {
                        celula.setBackgroundColor(listra);
                    }
                    tabela.addCell(celula);
                }
            }
            documento.add(tabela);
        }

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
