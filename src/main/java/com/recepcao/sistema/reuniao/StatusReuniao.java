package com.recepcao.sistema.reuniao;

/** O valor gravado continua FINALIZADA; para quem lê, a reunião foi realizada. */
public enum StatusReuniao {
    AGENDADA("Agendada"),
    FINALIZADA("Realizada"),
    CANCELADA("Cancelada");

    private final String nome;

    StatusReuniao(String nome) {
        this.nome = nome;
    }

    public String getNome() {
        return nome;
    }
}
