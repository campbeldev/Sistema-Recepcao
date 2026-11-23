package com.recepcao.sistema.reuniao;

import com.recepcao.sistema.contato.Contato;
import jakarta.persistence.*;

@Entity
@Table(name = "reuniao_participante")
public class ReuniaoParticipante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "reuniao_id")
    private Reuniao reuniao;

    /** O contato da agenda. Nulo quando o participante é alguém de fora, que só tem o nome. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contato_id")
    private Contato contato;

    /** O nome de quem vem e não está nos contatos (digitado na hora de agendar). */
    @Column(name = "nome_externo")
    private String nomeExterno;

    public ReuniaoParticipante() {}

    public ReuniaoParticipante(Reuniao reuniao, Contato contato) {
        this.reuniao = reuniao;
        this.contato = contato;
    }

    public ReuniaoParticipante(Reuniao reuniao, String nomeExterno) {
        this.reuniao = reuniao;
        this.nomeExterno = nomeExterno;
    }

    /** O nome que aparece: o do contato ou, para quem é de fora, o que foi digitado. */
    public String getNome() {
        return contato != null ? contato.getNomeParticipante() : nomeExterno;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Reuniao getReuniao() { return reuniao; }
    public void setReuniao(Reuniao reuniao) { this.reuniao = reuniao; }

    public Contato getContato() { return contato; }
    public void setContato(Contato contato) { this.contato = contato; }

    public String getNomeExterno() { return nomeExterno; }
    public void setNomeExterno(String nomeExterno) { this.nomeExterno = nomeExterno; }
}
