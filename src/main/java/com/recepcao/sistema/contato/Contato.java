package com.recepcao.sistema.contato;

import jakarta.persistence.*;


@Entity
@Table(name = "contato")
public class Contato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nomeParticipante;
    private String nomeEmpresa;
    private String email;
    private String telefone;
    private String telefoneEmpresarial;
    private String whatsapp;

    public Contato() {
    }

    public Contato(Long id, String nomeParticipante, String email, String telefone, String telefoneEmpresarial, String nomeEmpresa, String whatsapp) {
        this.id = id;
        this.nomeParticipante = nomeParticipante;
        this.email = email;
        this.telefone = telefone;
        this.nomeEmpresa = nomeEmpresa;
        this.telefoneEmpresarial = telefoneEmpresarial;
        this.whatsapp = whatsapp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNomeParticipante() {
        return nomeParticipante;
    }

    public void setNomeParticipante(String nomeParticipante) {
        this.nomeParticipante = nomeParticipante;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getNomeEmpresa() {
        return nomeEmpresa;
    }

    public void setNomeEmpresa(String nomeEmpresa) {
        this.nomeEmpresa = nomeEmpresa;
    }

    public String getTelefoneEmpresarial() {
        return telefoneEmpresarial;
    }

    public void setTelefoneEmpresarial(String telefoneEmpresarial) {
        this.telefoneEmpresarial = telefoneEmpresarial;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(String whatsapp) {
        this.whatsapp = whatsapp;
    }
}
