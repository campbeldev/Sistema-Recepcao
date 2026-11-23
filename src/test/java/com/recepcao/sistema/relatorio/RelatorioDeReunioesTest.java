package com.recepcao.sistema.relatorio;

import com.recepcao.sistema.contato.Contato;
import com.recepcao.sistema.contato.ContatoRepository;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** A planilha do relatório: um .xlsx de verdade, numa aba só, com o layout do PDF. */
class RelatorioDeReunioesTest {

    private final ReuniaoRepository reunioes = mock(ReuniaoRepository.class);
    private final ContatoRepository contatos = mock(ContatoRepository.class);
    private final RelatorioDeReunioes relatorio = new RelatorioDeReunioes(reunioes, contatos);

    private static Reuniao reuniao(LocalDateTime quando, String titulo, StatusReuniao status) {
        Reuniao reuniao = new Reuniao();
        reuniao.remarcar(quando);
        reuniao.setTitulo(titulo);
        reuniao.setSala("Sala 1");
        reuniao.setStatus(status);
        reuniao.definirAnfitrioes(List.of(new Contato(1L, "Ana", null, null, null, null, null)));
        reuniao.definirParticipantes(List.of(
                new Contato(2L, "Bruno", null, null, null, null, null),
                new Contato(3L, "Carla", null, null, null, null, null)));
        return reuniao;
    }

    private XSSFSheet planilha(List<Reuniao> lista) throws IOException {
        when(reunioes.findByDatahoraReuniaoGreaterThanEqualAndDatahoraReuniaoLessThanOrderByDatahoraReuniao(any(), any()))
                .thenReturn(lista);
        byte[] arquivo = relatorio.gerar(11, 2026, false, null, RelatorioDeReunioes.Papel.QUALQUER, false);
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
        assertEquals(List.of("Total de reuniões", "2"), textos(aba.getRow(3)));
        assertEquals(List.of("Realizadas", "1"), textos(aba.getRow(4)));
        assertEquals(List.of("Canceladas", "1"), textos(aba.getRow(5)));

        // Tabela: cabeçalho e uma reunião por linha, cada campo na sua coluna.
        assertEquals(List.of("DATA", "TÍTULO", "SALA", "STATUS", "ANFITRIÃO", "PARTICIPANTES"), textos(aba.getRow(8)));
        assertTrue(aba.getRow(8).getCell(0).getCellStyle().getFont().getBold());
        Row primeira = aba.getRow(9);
        assertEquals("03/11/2026 09:00", primeira.getCell(0).getStringCellValue());
        assertEquals("Kickoff", primeira.getCell(1).getStringCellValue());
        assertEquals("Ana", primeira.getCell(4).getStringCellValue());
        assertEquals("Bruno, Carla", primeira.getCell(5).getStringCellValue());

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
}
