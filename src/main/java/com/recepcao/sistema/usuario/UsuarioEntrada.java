package com.recepcao.sistema.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * O que a tela manda para cadastrar ou alterar um usuário.
 * Na alteração, o login não muda e a senha só muda quando vem preenchida. O e-mail é opcional.
 */
public record UsuarioEntrada(
        @Size(max = 60) String username,
        @NotBlank(message = "Informe o nome.") @Size(max = 120) String nome,
        @Email(message = "Informe um e-mail válido.") @Size(max = 120) String email,
        String senha,
        @NotNull(message = "Escolha o perfil.") Perfil perfil
) {}
