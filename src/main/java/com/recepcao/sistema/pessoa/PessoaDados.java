package com.recepcao.sistema.pessoa;

/** A pessoa como a API devolve. */
public record PessoaDados(
        Long id,
        String nome,
        String setor,
        String cargo,
        String ramal,
        String email,
        String celular,
        Integer diaAniversario,
        Integer mesAniversario,
        boolean mostrarAniversario
) {

    public static PessoaDados de(Pessoa pessoa) {
        return new PessoaDados(
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getSetor(),
                pessoa.getCargo(),
                pessoa.getRamal(),
                pessoa.getEmail(),
                pessoa.getCelular(),
                pessoa.getDiaAniversario(),
                pessoa.getMesAniversario(),
                pessoa.isMostrarAniversario()
        );
    }
}
