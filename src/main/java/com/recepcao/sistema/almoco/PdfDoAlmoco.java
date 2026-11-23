package com.recepcao.sistema.almoco;

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
import com.recepcao.sistema.almoco.AlmocoDados.CardapioDados;
import com.recepcao.sistema.almoco.AlmocoDados.PedidoDados;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * O PDF que vai para o restaurante: o total de pratos, quantos de cada proteína e, para cada
 * proteína, quem pediu e com quais acompanhamentos. No fim, quantas porções de cada acompanhamento.
 */
final class PdfDoAlmoco {

    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final Color CINZA = new Color(0xF4, 0xF4, 0xF4);
    private static final Color BORDA = new Color(0xC6, 0xC6, 0xC6);

    private PdfDoAlmoco() {}

    static byte[] gerar(CardapioDados cardapio, List<PedidoDados> pedidos, LocalDateTime agora) {
        Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font subtitulo = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(0x52, 0x52, 0x52));
        Font secao = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Font numero = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Font rotulo = FontFactory.getFont(FontFactory.HELVETICA, 9);
        Font cabecalho = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font celula = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font observacao = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9);

        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.A4, 36, 36, 36, 36);
        PdfWriter.getInstance(documento, saida);
        documento.open();

        documento.add(new Paragraph("Pedido de almoço · Campbel", titulo));
        String situacao = cardapio.aberto()
                ? "prévia, os pedidos ainda estão abertos até " + cardapio.fechaAs().format(HORA)
                : "pedidos fechados";
        documento.add(new Paragraph(cardapio.dia().format(DATA) + " · " + pedidos.size()
                + (pedidos.size() == 1 ? " prato" : " pratos") + " · " + situacao, subtitulo));

        // Quantos de cada proteína, numa faixa de quadros.
        PdfPTable resumo = new PdfPTable(Math.max(1, cardapio.proteinas().size()));
        resumo.setWidthPercentage(100);
        resumo.setSpacingBefore(14);
        for (String proteina : cardapio.proteinas()) {
            long quantos = pedidos.stream().filter(p -> p.proteina().equals(proteina)).count();
            Phrase texto = new Phrase();
            texto.add(new Phrase(proteina + "\n", rotulo));
            texto.add(new Phrase(String.valueOf(quantos), numero));
            PdfPCell quadro = new PdfPCell(texto);
            quadro.setBorderColor(BORDA);
            quadro.setPadding(8);
            resumo.addCell(quadro);
        }
        documento.add(resumo);

        // Uma tabela por proteína, com quem pediu.
        for (String proteina : cardapio.proteinas()) {
            List<PedidoDados> daProteina = pedidos.stream()
                    .filter(p -> p.proteina().equals(proteina))
                    .sorted(Comparator.comparing(PedidoDados::nome, String.CASE_INSENSITIVE_ORDER))
                    .toList();
            if (daProteina.isEmpty()) continue;

            Paragraph nome = new Paragraph(proteina + " (" + daProteina.size() + ")", secao);
            nome.setSpacingBefore(16);
            nome.setSpacingAfter(6);
            documento.add(nome);

            PdfPTable tabela = new PdfPTable(new float[]{0.5f, 3f, 6f});
            tabela.setWidthPercentage(100);
            tabela.setHeaderRows(1);
            for (String titulo1 : List.of("#", "Nome", "Acompanhamentos")) {
                PdfPCell topo = new PdfPCell(new Phrase(titulo1, cabecalho));
                topo.setBackgroundColor(CINZA);
                topo.setBorderColor(BORDA);
                topo.setPadding(5);
                tabela.addCell(topo);
            }
            int posicao = 1;
            for (PedidoDados pedido : daProteina) {
                tabela.addCell(celula(String.valueOf(posicao++), celula));
                tabela.addCell(celula(pedido.nome(), celula));
                Phrase acompanhamentos = new Phrase(
                        pedido.acompanhamentos().isEmpty() ? "Sem acompanhamento" : String.join(", ", pedido.acompanhamentos()),
                        celula);
                if (pedido.observacao() != null) {
                    acompanhamentos.add(new Phrase(" · " + pedido.observacao(), observacao));
                }
                PdfPCell detalhe = new PdfPCell(acompanhamentos);
                detalhe.setBorderColor(BORDA);
                detalhe.setPadding(5);
                tabela.addCell(detalhe);
            }
            documento.add(tabela);
        }

        // Quantas porções de cada acompanhamento, na ordem do cardápio.
        Map<String, Integer> porcoes = new LinkedHashMap<>();
        for (String acompanhamento : cardapio.acompanhamentos()) {
            int quantos = (int) pedidos.stream().filter(p -> p.acompanhamentos().contains(acompanhamento)).count();
            if (quantos > 0) porcoes.put(acompanhamento, quantos);
        }
        if (!porcoes.isEmpty()) {
            Paragraph totais = new Paragraph("Total de acompanhamentos", secao);
            totais.setSpacingBefore(16);
            totais.setSpacingAfter(4);
            documento.add(totais);
            StringBuilder linha = new StringBuilder();
            porcoes.forEach((nome, quantos) -> {
                if (!linha.isEmpty()) linha.append("   ·   ");
                linha.append(nome).append(": ").append(quantos);
            });
            documento.add(new Paragraph(linha.toString(), celula));
        }

        if (pedidos.isEmpty()) {
            Paragraph vazio = new Paragraph("Nenhum pedido feito hoje.", celula);
            vazio.setSpacingBefore(16);
            documento.add(vazio);
        }

        Paragraph rodape = new Paragraph("Gerado pelo Sistema de Recepção em "
                + agora.format(DATA) + " às " + agora.format(HORA) + ".", subtitulo);
        rodape.setSpacingBefore(20);
        rodape.setAlignment(Element.ALIGN_LEFT);
        documento.add(rodape);

        documento.close();
        return saida.toByteArray();
    }

    private static PdfPCell celula(String texto, Font fonte) {
        PdfPCell celula = new PdfPCell(new Phrase(texto, fonte));
        celula.setBorderColor(BORDA);
        celula.setPadding(5);
        return celula;
    }
}
