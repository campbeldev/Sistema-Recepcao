package com.recepcao.sistema.relatorio;

import com.recepcao.sistema.contato.Contato;
import com.recepcao.sistema.contato.ContatoRepository;
import com.recepcao.sistema.lembrete.Lembrete;
import com.recepcao.sistema.lembrete.LembreteRepository;
import com.recepcao.sistema.reuniao.Reuniao;
import com.recepcao.sistema.reuniao.ReuniaoRepository;
import com.recepcao.sistema.reuniao.StatusReuniao;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** A planilha do relatório: um .xlsx de verdade, numa aba só, com o layout do PDF. */
class RelatorioDeReunioesTest {

    private final ReuniaoRepository reunioes = mock(ReuniaoRepository.class);
    private final ContatoRepository contatos = mock(ContatoRepository.class);
    private final LembreteRepository lembretes = mock(LembreteRepository.class);
    private final RelatorioDeReunioes relatorio = new RelatorioDeReunioes(reunioes, contatos, lembretes);

    private static Reuniao reuniao(LocalDateTime quando, String titulo, StatusReuniao status) {
        Reuniao reuniao = new Reuniao();
        reuniao.remarcar(quando);
        reuniao.setTitulo(titulo);
        reuniao.setSala("Sala 1");
        reuniao.setStatus(status);
        reuniao.definirAnfitrioes(List.of(new Contato(1L, "Ana", null, null, null, null, null)));
        reuniao.definirParticipantes(List.of(
                new Contato(2L, "Bruno", null, null, null, null, null),
                new Contato(3L, "Carla", null, null, null, null, null)),
                // Alguém de fora, que não está nos contatos; o nome repetido entra uma vez só.
                List.of("Diego", " diego "));
        return reuniao;
    }

    private static Lembrete lembrete(LocalDate dia, LocalTime hora, String descricao, boolean feito) {
        Lembrete lembrete = new Lembrete("talita");
        lembrete.setDia(dia);
        lembrete.setHora(hora);
        lembrete.setDescricao(descricao);
        lembrete.setParaQuem("Diretoria");
        lembrete.setFeito(feito);
        return lembrete;
    }

    private XSSFSheet planilha(List<Reuniao> lista) throws IOException {
        return planilha(lista, null);
    }

    /** Com {@code listaDeLembretes} nula, o relatório sai sem lembretes. */
    private XSSFSheet planilha(List<Reuniao> lista, List<Lembrete> listaDeLembretes) throws IOException {
        when(reunioes.findByDatahoraReuniaoGreaterThanEqualAndDatahoraReuniaoLessThanOrderByDatahoraReuniao(any(), any()))
                .thenReturn(lista);
        when(lembretes.findByDiaGreaterThanEqualAndDiaLessThan(any(), any()))
                .thenReturn(listaDeLembretes == null ? List.of() : listaDeLembretes);
        byte[] arquivo = relatorio.gerar(11, 2026, false, null, RelatorioDeReunioes.Papel.QUALQUER,
                listaDeLembretes != null, false);
        XSSFWorkbook livro = new XSSFWorkbook(new ByteArrayInputStream(arquivo));
        assertEquals(1, livro.getNumberOfSheets(), "tudo na mesma aba");
        return livro.getSheetAt(0);
    }

    private static List<String> textos(Row linha) {
        List<String> valores = new ArrayList<>();
        linha.forEach(celula -> valores.add(celula.getStringCellValue()));
        return valores;
    }

    @Test
    void geraXlsxComTituloResumoETabelaSeparados() throws IOException {
        XSSFSheet aba = planilha(List.of(
                reuniao(LocalDateTime.of(2026, 11, 3, 9, 0), "Kickoff", StatusReuniao.FINALIZADA),
                reuniao(LocalDateTime.of(2026, 11, 10, 14, 30), "=1+1", StatusReuniao.CANCELADA)));

        // Título grande, mesclado na largura da tabela.
        assertEquals("RELATÓRIO DE REUNIÕES - NOVEMBRO 2026", aba.getRow(0).getCell(0).getStringCellValue());
        assertEquals(16, aba.getRow(0).getCell(0).getCellStyle().getFont().getFontHeightInPoints());
        assertTrue(aba.getMergedRegions().contains(new CellRangeAddress(0, 0, 0, 5)));

        // Resumo: rótulo e valor em células separadas.
        assertEquals(List.of("TOTAL DE REUNIÕES", "2"), textos(aba.getRow(3)));
        assertEquals(List.of("REALIZADAS", "1"), textos(aba.getRow(4)));
        assertEquals(List.of("CANCELADAS", "1"), textos(aba.getRow(5)));
        assertTrue(aba.isDisplayGridlines());
        assertTrue(aba.getRow(3).getCell(1).getCellStyle().getFont().getBold());

        // Tabela: cabeçalho e uma reunião por linha, cada campo na sua coluna.
        assertEquals(List.of("DATA", "TÍTULO", "SALA", "STATUS", "ANFITRIÃO", "PARTICIPANTES"), textos(aba.getRow(8)));
        assertTrue(aba.getRow(8).getCell(0).getCellStyle().getFont().getBold());
        Row primeira = aba.getRow(9);
        assertEquals("03/11/2026 09:00", primeira.getCell(0).getStringCellValue());
        assertEquals("Kickoff", primeira.getCell(1).getStringCellValue());
        assertEquals("Ana", primeira.getCell(4).getStringCellValue());
        assertEquals("Bruno, Carla, Diego", primeira.getCell(5).getStringCellValue());

        // Texto que parece fórmula continua texto.
        assertEquals(CellType.STRING, aba.getRow(10).getCell(1).getCellType());
        assertEquals("=1+1", aba.getRow(10).getCell(1).getStringCellValue());
    }

    @Test
    void mesSemReuniaoMostraAvisoNaTabela() throws IOException {
        XSSFSheet aba = planilha(List.of());

        assertEquals("Nenhuma reunião neste mês.", aba.getRow(9).getCell(0).getStringCellValue());
        assertTrue(aba.getMergedRegions().contains(new CellRangeAddress(9, 9, 0, 5)));
    }

    @Test
    void semLembretesNaoConsultaNemMostraLembretes() throws IOException {
        XSSFSheet aba = planilha(List.of());

        verifyNoInteractions(lembretes);
        assertEquals("RELATÓRIO DE REUNIÕES - NOVEMBRO 2026", aba.getRow(0).getCell(0).getStringCellValue());
        for (Row linha : aba) {
            linha.forEach(celula -> assertFalse(celula.getStringCellValue().contains("LEMBRETE")));
        }
    }

    @Test
    void comLembretesMostraTabelaSeparadaDepoisDasReunioes() throws IOException {
        XSSFSheet aba = planilha(
                List.of(reuniao(LocalDateTime.of(2026, 11, 3, 9, 0), "Kickoff", StatusReuniao.FINALIZADA)),
                List.of(
                        lembrete(LocalDate.of(2026, 11, 5), LocalTime.of(14, 0), "Ligar para o contador", false),
                        lembrete(LocalDate.of(2026, 11, 5), null, "Buscar exame", true),
                        lembrete(LocalDate.of(2026, 11, 2), null, "Renovar alvará", false)));

        assertEquals("RELATÓRIO DE REUNIÕES E LEMBRETES - NOVEMBRO 2026", aba.getRow(0).getCell(0).getStringCellValue());

        // Resumo ganha as contas dos lembretes.
        assertEquals(List.of("TOTAL DE LEMBRETES", "3"), textos(aba.getRow(7)));
        assertEquals(List.of("LEMBRETES FEITOS", "1"), textos(aba.getRow(8)));
        assertEquals(List.of("LEMBRETES PENDENTES", "2"), textos(aba.getRow(9)));

        // Cada tabela com o seu título: primeiro as reuniões...
        assertEquals("REUNIÕES", aba.getRow(11).getCell(0).getStringCellValue());
        assertEquals("DATA", aba.getRow(12).getCell(0).getStringCellValue());
        assertEquals("Kickoff", aba.getRow(13).getCell(1).getStringCellValue());

        // ...depois os lembretes, por dia, e no mesmo dia o sem hora antes.
        assertEquals("LEMBRETES", aba.getRow(15).getCell(0).getStringCellValue());
        assertEquals(List.of("DIA", "DESCRIÇÃO", "PARA QUEM", "SITUAÇÃO", "CRIADO POR"), textos(aba.getRow(16)));
        assertEquals("02/11/2026", aba.getRow(17).getCell(0).getStringCellValue());
        assertEquals("Renovar alvará", aba.getRow(17).getCell(1).getStringCellValue());
        assertEquals("Buscar exame", aba.getRow(18).getCell(1).getStringCellValue());
        assertEquals("Feito", aba.getRow(18).getCell(3).getStringCellValue());
        assertEquals("05/11/2026 14:00", aba.getRow(19).getCell(0).getStringCellValue());
        assertEquals("Diretoria", aba.getRow(19).getCell(2).getStringCellValue());
        assertEquals("talita", aba.getRow(19).getCell(4).getStringCellValue());
    }

    @Test
    void mesSemLembreteMostraAvisoNaTabelaDeLembretes() throws IOException {
        XSSFSheet aba = planilha(List.of(), List.of());

        assertEquals("LEMBRETES", aba.getRow(15).getCell(0).getStringCellValue());
        assertEquals("Nenhum lembrete neste mês.", aba.getRow(17).getCell(0).getStringCellValue());
    }

    @Test
    void pdfComLembretesTambemSaiDocumentoValido() {
        when(reunioes.findByDatahoraReuniaoGreaterThanEqualAndDatahoraReuniaoLessThanOrderByDatahoraReuniao(any(), any()))
                .thenReturn(List.of());
        when(lembretes.findByDiaGreaterThanEqualAndDiaLessThan(any(), any()))
                .thenReturn(List.of(lembrete(LocalDate.of(2026, 11, 5), null, "Buscar exame", false)));

        byte[] pdf = relatorio.gerar(11, 2026, false, null, RelatorioDeReunioes.Papel.QUALQUER, true, true);

        assertEquals("%PDF", new String(pdf, 0, 4));
    }
}
