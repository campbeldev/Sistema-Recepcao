package com.recepcao.sistema.reuniao;

import com.recepcao.sistema.contato.Contato;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.function.Predicate;

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

    /** Marca que o lembrete de 30 minutos já saiu. Nulo nas reuniões antigas, que conta como "não". */
    @Column(name = "lembrete_enviado")
    private Boolean lembreteEnviado;

    @OneToMany(mappedBy = "reuniao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReuniaoAnfitriao> anfitrioes = new ArrayList<>();

    @OneToMany(mappedBy = "reuniao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReuniaoParticipante> participantes = new ArrayList<>();

    public Reuniao() {}

    /** Troca os anfitriões, ignorando contato repetido. */
    public void definirAnfitrioes(List<Contato> contatos) {
        anfitrioes.clear();
        contatos.stream()
                .filter(distintos())
                .forEach(contato -> anfitrioes.add(new ReuniaoAnfitriao(this, contato)));
    }

    /** Troca os participantes, ignorando contato repetido. */
    public void definirParticipantes(List<Contato> contatos) {
        participantes.clear();
        contatos.stream()
                .filter(distintos())
                .forEach(contato -> participantes.add(new ReuniaoParticipante(this, contato)));
    }

    /** Mudar o horário faz o lembrete valer de novo. */
    public void remarcar(LocalDateTime novoHorario) {
        if (!Objects.equals(datahoraReuniao, novoHorario)) {
            lembreteEnviado = false;
        }
        datahoraReuniao = novoHorario;
    }

    public boolean isLembreteEnviado() {
        return Boolean.TRUE.equals(lembreteEnviado);
    }

    public void marcarLembreteEnviado() {
        lembreteEnviado = true;
    }

    private static Predicate<Contato> distintos() {
        Set<Long> vistos = new HashSet<>();
        return contato -> vistos.add(contato.getId());
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getDatahoraReuniao() {
        return datahoraReuniao;
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

    public List<ReuniaoAnfitriao> getAnfitrioes() {
        return anfitrioes;
    }

    public List<ReuniaoParticipante> getParticipantes() {
        return participantes;
    }
}
