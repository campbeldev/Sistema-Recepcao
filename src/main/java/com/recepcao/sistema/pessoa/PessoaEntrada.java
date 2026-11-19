package com.recepcao.sistema.pessoa;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** O que a tela manda para cadastrar ou alterar uma pessoa. Campo vazio chega como nulo. */
public record PessoaEntrada(
        @NotBlank(message = "Informe o nome.") @Size(max = 120, message = "O nome tem no máximo 120 letras.") String nome,
        @NotBlank(message = "Informe o setor.") @Size(max = 60, message = "O setor tem no máximo 60 letras.") String setor,
        @Size(max = 80, message = "O cargo tem no máximo 80 letras.") String cargo,
        @Pattern(regexp = "\\d{1,6}", message = "O ramal tem só números, até 6.") String ramal,
        @Email(message = "Informe um e-mail válido.") @Size(max = 255) String email,
        @Size(max = 30) String celular,
        @Min(value = 1, message = "Escolha o dia.") @Max(value = 31, message = "Escolha o dia.") Integer diaAniversario,
        @Min(value = 1, message = "Escolha o mês.") @Max(value = 12, message = "Escolha o mês.") Integer mesAniversario,
        boolean mostrarAniversario
) {

    void copiarPara(Pessoa pessoa) {
        pessoa.setNome(nome.trim());
        pessoa.setSetor(setor.trim());
        pessoa.setCargo(limpo(cargo));
        pessoa.setRamal(limpo(ramal));
        pessoa.setEmail(limpo(email));
        pessoa.setCelular(limpo(celular));
        pessoa.setAniversario(diaAniversario, mesAniversario);
        pessoa.setMostrarAniversario(mostrarAniversario);
    }

    static String limpo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
