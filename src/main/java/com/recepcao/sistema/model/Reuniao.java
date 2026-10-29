package com.recepcao.sistema.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reuniao")
public class Reuniao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime datahoraReuniao;
    private String titulo;
    private String motivo;
    private String sala;

    @Column(name = "empresa_reuniao")
    private String empresaReuniao;

    @Enumerated(EnumType.STRING)
    private StatusReuniao status;

    @OneToMany(mappedBy = "reuniao", fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ReuniaoAnfitriao> anfitrioes = new ArrayList<>();

    @OneToMany(mappedBy = "reuniao", fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ReuniaoParticipante> participantes = new ArrayList<>();

    public Reuniao() {}

    public Reuniao(Long id, LocalDateTime datahoraReuniao, String titulo, String motivo, String sala, String empresaReuniao) {
        this.id = id;
        this.datahoraReuniao = datahoraReuniao;
        this.titulo = titulo;
        this.motivo = motivo;
        this.sala = sala;
        this.empresaReuniao = empresaReuniao;
    }

    // Getters e Setters existentes
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getDatahoraReuniao() {
        return datahoraReuniao;
    }

    public void setDatahoraReuniao(LocalDateTime datahoraReuniao) {
        this.datahoraReuniao = datahoraReuniao;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public String getSala() {
        return sala;
    }

    public void setSala(String sala) {
        this.sala = sala;
    }

    public StatusReuniao getStatus() {
        return status;
    }

    public void setStatus(StatusReuniao status) {
        this.status = status;
    }

    public String getEmpresaReuniao() {
        return empresaReuniao;
    }

    public void setEmpresaReuniao(String empresaReuniao) {
        this.empresaReuniao = empresaReuniao;
    }

    public List<ReuniaoParticipante> getParticipantes() {
        return participantes;
    }

    public void setParticipantes(List<ReuniaoParticipante> participantes) {
        this.participantes = participantes;
    }

    // Métodos auxiliares
    public void adicionarParticipante(Contato contato) {
        ReuniaoParticipante rp = new ReuniaoParticipante(this, contato);
        this.participantes.add(rp);
    }

    public void removerParticipante(Contato contato) {
        this.participantes.removeIf(rp -> rp.getContato().equals(contato));
    }

    public List<ReuniaoAnfitriao> getAnfitrioes() {
        return anfitrioes;
    }

    public void setAnfitrioes(List<ReuniaoAnfitriao> anfitrioes) {
        this.anfitrioes = anfitrioes;
    }
}