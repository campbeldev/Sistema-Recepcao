package com.recepcao.sistema.almoco;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * O cardápio de um dia: as proteínas e os acompanhamentos que o restaurante oferece e a hora em que
 * os pedidos fecham. Um por dia. Os pedidos fecham sozinhos na hora marcada, ou antes, pela recepção.
 */
@Entity
@Table(name = "cardapio", uniqueConstraints = @UniqueConstraint(name = "uk_cardapio_dia", columnNames = "dia"))
public class Cardapio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dia;

    @ElementCollection
    @CollectionTable(name = "cardapio_proteina", joinColumns = @JoinColumn(name = "cardapio_id"))
    @OrderColumn(name = "posicao")
    @Column(name = "nome", nullable = false, length = 60)
    private List<String> proteinas = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "cardapio_acompanhamento", joinColumns = @JoinColumn(name = "cardapio_id"))
    @OrderColumn(name = "posicao")
    @Column(name = "nome", nullable = false, length = 60)
    private List<String> acompanhamentos = new ArrayList<>();

    @Column(name = "fecha_as", nullable = false)
    private LocalTime fechaAs;

    /** A recepção fechou os pedidos antes da hora. */
    @Column(nullable = false)
    private boolean encerrado;

    @Column(name = "criado_por", nullable = false, length = 60)
    private String criadoPor;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    /** O código no fim do link do dia (/almoco/{código}). Cada dia tem o seu: o link de ontem não abre o de hoje. */
    @Column(name = "codigo_do_link", length = 32)
    private String codigoDoLink;

    protected Cardapio() {}

    public Cardapio(LocalDate dia, String criadoPor, LocalDateTime criadoEm) {
        this.dia = dia;
        this.criadoPor = criadoPor;
        this.criadoEm = criadoEm;
        this.codigoDoLink = ChaveAleatoria.nova();
    }

    /** Os cardápios de antes do link com código ganham um na primeira vez que a recepção abre a tela. */
    public void garantirCodigoDoLink() {
        if (codigoDoLink == null) codigoDoLink = ChaveAleatoria.nova();
    }

    public String getCodigoDoLink() { return codigoDoLink; }

    /** Aberto até a hora de fechar, no próprio dia, se a recepção não fechou antes. */
    public boolean aberto(LocalDateTime agora) {
        return !encerrado && agora.toLocalDate().equals(dia) && agora.toLocalTime().isBefore(fechaAs);
    }

    public Long getId() { return id; }
    public LocalDate getDia() { return dia; }

    public List<String> getProteinas() { return proteinas; }
    public void setProteinas(List<String> proteinas) {
        this.proteinas.clear();
        this.proteinas.addAll(proteinas);
    }

    public List<String> getAcompanhamentos() { return acompanhamentos; }
    public void setAcompanhamentos(List<String> acompanhamentos) {
        this.acompanhamentos.clear();
        this.acompanhamentos.addAll(acompanhamentos);
    }

    public LocalTime getFechaAs() { return fechaAs; }
    public void setFechaAs(LocalTime fechaAs) { this.fechaAs = fechaAs; }

    public boolean isEncerrado() { return encerrado; }
    public void setEncerrado(boolean encerrado) { this.encerrado = encerrado; }
}
