package com.recepcao.sistema.almoco;

import com.recepcao.sistema.pessoa.Pessoa;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * O prato de uma pessoa num dia: o nome que ela digitou, uma proteína e os acompanhamentos.
 * Quem pede pelo link recebe uma chave que fica no celular; só com ela dá para alterar ou cancelar.
 */
@Entity
@Table(name = "pedido_de_almoco")
public class PedidoDeAlmoco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "cardapio_id")
    private Cardapio cardapio;

    /** Só nos pedidos de antes do nome digitado, quando a pessoa escolhia o nome na lista de Ramais. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id")
    private Pessoa pessoa;

    @Column(length = 80)
    private String nome;

    /** O resumo SHA-256 da chave que ficou no celular de quem pediu; nulo quando a recepção lançou. */
    @Column(name = "chave_hash", length = 64)
    private String chaveHash;

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

    /** O login de quem lançou ou alterou pela recepção; nulo quando a própria pessoa pediu pelo link. */
    @Column(name = "lancado_por", length = 60)
    private String lancadoPor;

    protected PedidoDeAlmoco() {}

    public PedidoDeAlmoco(Cardapio cardapio) {
        this.cardapio = cardapio;
    }

    public Long getId() { return id; }
    public Cardapio getCardapio() { return cardapio; }

    /** O nome digitado; nos pedidos antigos, o nome da pessoa do Ramal. */
    public String getNome() {
        if (nome != null) return nome;
        return pessoa != null ? pessoa.getNome() : "";
    }

    public String getChaveHash() { return chaveHash; }
    public void setChaveHash(String chaveHash) { this.chaveHash = chaveHash; }

    public String getProteina() { return proteina; }
    public List<String> getAcompanhamentos() { return acompanhamentos; }
    public String getObservacao() { return observacao; }
    public LocalDateTime getFeitoEm() { return feitoEm; }
    public String getLancadoPor() { return lancadoPor; }

    public void preencher(String nome, String proteina, List<String> acompanhamentos, String observacao,
                          LocalDateTime quando, String lancadoPor) {
        this.nome = nome;
        this.proteina = proteina;
        this.acompanhamentos.clear();
        this.acompanhamentos.addAll(acompanhamentos);
        this.observacao = observacao;
        this.feitoEm = quando;
        this.lancadoPor = lancadoPor;
    }
}
