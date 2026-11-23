package com.recepcao.sistema.almoco;

import com.recepcao.sistema.pessoa.Pessoa;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** O prato de uma pessoa num dia: uma proteína e os acompanhamentos. Um pedido por pessoa e por cardápio. */
@Entity
@Table(name = "pedido_de_almoco", uniqueConstraints = @UniqueConstraint(
        name = "uk_pedido_cardapio_pessoa", columnNames = {"cardapio_id", "pessoa_id"}))
public class PedidoDeAlmoco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "cardapio_id")
    private Cardapio cardapio;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id")
    private Pessoa pessoa;

    @Column(nullable = false, length = 60)
    private String proteina;

    @ElementCollection
    @CollectionTable(name = "pedido_de_almoco_acompanhamento", joinColumns = @JoinColumn(name = "pedido_id"))
    @OrderColumn(name = "posicao")
    @Column(name = "nome", nullable = false, length = 60)
    private List<String> acompanhamentos = new ArrayList<>();

    @Column(length = 200)
    private String observacao;

    @Column(name = "feito_em", nullable = false)
    private LocalDateTime feitoEm;

    /** O login de quem lançou pela recepção; nulo quando a própria pessoa pediu pelo link. */
    @Column(name = "lancado_por", length = 60)
    private String lancadoPor;

    protected PedidoDeAlmoco() {}

    public PedidoDeAlmoco(Cardapio cardapio, Pessoa pessoa) {
        this.cardapio = cardapio;
        this.pessoa = pessoa;
    }

    public Long getId() { return id; }
    public Cardapio getCardapio() { return cardapio; }
    public Pessoa getPessoa() { return pessoa; }

    public String getProteina() { return proteina; }
    public List<String> getAcompanhamentos() { return acompanhamentos; }
    public String getObservacao() { return observacao; }
    public LocalDateTime getFeitoEm() { return feitoEm; }
    public String getLancadoPor() { return lancadoPor; }

    public void preencher(String proteina, List<String> acompanhamentos, String observacao,
                          LocalDateTime quando, String lancadoPor) {
        this.proteina = proteina;
        this.acompanhamentos.clear();
        this.acompanhamentos.addAll(acompanhamentos);
        this.observacao = observacao;
        this.feitoEm = quando;
        this.lancadoPor = lancadoPor;
    }
}
