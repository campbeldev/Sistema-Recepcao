package com.recepcao.sistema.usuario;

/**
 * O usuário como a API devolve, sem a senha.
 */
public record UsuarioDados(Long id, String username, String nome, String email, Perfil perfil, boolean ativo) {

    public static UsuarioDados de(Usuario usuario) {
        return new UsuarioDados(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole(),
                usuario.isAtivo()
        );
    }
}
