package com.recepcao.sistema.contato;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * O contato como a API recebe e devolve. O id é ignorado na entrada: quem manda é a URL.
 * O telefone é um só, fixo ou celular. O antigo "telefone da empresa" aparece no lugar dele
 * enquanto o contato não tiver telefone, e é absorvido na próxima vez que o contato for salvo.
 */
public record ContatoDados(
        Long id,
        @NotBlank(message = "Informe o nome.") @Size(max = 255) String nomeParticipante,
        @Size(max = 255) String nomeEmpresa,
        @Email(message = "Informe um e-mail válido.") @Size(max = 255) String email,
        @Size(max = 30) String telefone,
        @Size(max = 30) String whatsapp
) {

    public static ContatoDados de(Contato contato) {
        return new ContatoDados(
                contato.getId(),
                contato.getNomeParticipante(),
                contato.getNomeEmpresa(),
                contato.getEmail(),
                preenchido(contato.getTelefone()) ? contato.getTelefone() : contato.getTelefoneEmpresarial(),
                contato.getWhatsapp()
        );
    }

    /** O sistema antigo às vezes gravava texto vazio em vez de nulo. */
    private static boolean preenchido(String valor) {
        return valor != null && !valor.isBlank();
    }

    void copiarPara(Contato contato) {
        contato.setNomeParticipante(nomeParticipante);
        contato.setNomeEmpresa(nomeEmpresa);
        contato.setEmail(email);
        contato.setTelefone(telefone);
        contato.setTelefoneEmpresarial(null);
        contato.setWhatsapp(whatsapp);
    }
}
