package com.recepcao.sistema.lembrete;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Algo que a recepção precisa lembrar de fazer (buscar um exame, ligar para alguém),
 * sem precisar marcar uma reunião de mentira. Não é excluído: sai da frente quando é marcado como feito.
 */
@Entity
@Table(name = "lembrete")
public class Lembrete {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String descricao;

    /** Para quem é o lembrete (o chefe, um setor). Opcional. */
    @Column(name = "para_quem", length = 120)
    private String paraQuem;

    @Column(nullable = false)
    private LocalDate dia;

    /** Opcional: muitos lembretes são só "neste dia". */
    private LocalTime hora;

    private boolean feito;

    @Column(name = "criado_por", nullable = false, length = 60)
    private String criadoPor;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Lembrete() {}

    public Lembrete(String criadoPor) {
        this.criadoPor = criadoPor;
        this.criadoEm = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getParaQuem() { return paraQuem; }
    public void setParaQuem(String paraQuem) { this.paraQuem = paraQuem; }

    public LocalDate getDia() { return dia; }
    public void setDia(LocalDate dia) { this.dia = dia; }

    public LocalTime getHora() { return hora; }
    public void setHora(LocalTime hora) { this.hora = hora; }

    public boolean isFeito() { return feito; }
    public void setFeito(boolean feito) { this.feito = feito; }

    public String getCriadoPor() { return criadoPor; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
