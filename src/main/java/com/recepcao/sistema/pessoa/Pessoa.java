package com.recepcao.sistema.pessoa;

import jakarta.persistence.*;

/**
 * Uma pessoa da empresa, com o setor, o ramal e o contato. Guarda também o dia do aniversário,
 * só dia e mês, para o Início e o sino. Não é excluída: quem sai da empresa é desativado.
 */
@Entity
@Table(name = "pessoa")
public class Pessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 60)
    private String setor;

    @Column(length = 80)
    private String cargo;

    @Column(length = 6)
    private String ramal;

    private String email;

    @Column(length = 30)
    private String celular;

    @Column(name = "dia_aniversario")
    private Integer diaAniversario;

    @Column(name = "mes_aniversario")
    private Integer mesAniversario;

    @Column(name = "mostrar_aniversario", nullable = false)
    private boolean mostrarAniversario = true;

    @Column(nullable = false)
    private boolean ativo = true;

    public Long getId() { return id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getSetor() { return setor; }
    public void setSetor(String setor) { this.setor = setor; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public String getRamal() { return ramal; }
    public void setRamal(String ramal) { this.ramal = ramal; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCelular() { return celular; }
    public void setCelular(String celular) { this.celular = celular; }

    public Integer getDiaAniversario() { return diaAniversario; }
    public Integer getMesAniversario() { return mesAniversario; }

    public void setAniversario(Integer dia, Integer mes) {
        this.diaAniversario = dia;
        this.mesAniversario = mes;
    }

    public boolean isMostrarAniversario() { return mostrarAniversario; }
    public void setMostrarAniversario(boolean mostrarAniversario) { this.mostrarAniversario = mostrarAniversario; }

    public boolean isAtivo() { return ativo; }

    public void desativar() { this.ativo = false; }
}
