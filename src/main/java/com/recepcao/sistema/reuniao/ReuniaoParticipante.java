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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contato_id")
    private Contato contato;

    public ReuniaoParticipante() {}

    public ReuniaoParticipante(Reuniao reuniao, Contato contato) {
        this.reuniao = reuniao;
        this.contato = contato;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Reuniao getReuniao() { return reuniao; }
    public void setReuniao(Reuniao reuniao) { this.reuniao = reuniao; }

    public Contato getContato() { return contato; }
    public void setContato(Contato contato) { this.contato = contato; }
}
