package com.recepcao.sistema.seguranca;

import com.recepcao.sistema.usuario.UsuarioRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Quem está conectado e o token CSRF que as telas mandam em todo POST, PUT e DELETE.
 * Aberto sem login: a tela de entrada também precisa do token para enviar o formulário.
 */
@RestController
public class SessaoController {

    public record Conectado(String nome, String username, String perfil) {}

    public record Csrf(String cabecalho, String parametro, String token) {}

    public record Sessao(Conectado usuario, Csrf csrf) {}

    private final UsuarioRepository usuarioRepository;

    public SessaoController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/api/sessao")
    public Sessao sessao(Authentication authentication, CsrfToken csrf) {
        Conectado usuario = null;
        if (authentication != null && !(authentication instanceof AnonymousAuthenticationToken)) {
            usuario = usuarioRepository.findByUsername(authentication.getName())
                    .map(u -> new Conectado(u.getNome(), u.getUsername(), u.getRole().name()))
                    .orElse(null);
        }
        return new Sessao(usuario, new Csrf(csrf.getHeaderName(), csrf.getParameterName(), csrf.getToken()));
    }
}
