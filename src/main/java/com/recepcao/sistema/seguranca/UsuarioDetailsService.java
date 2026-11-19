package com.recepcao.sistema.seguranca;

import com.recepcao.sistema.usuario.Usuario;
import com.recepcao.sistema.usuario.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Carrega o usuário para o Spring Security e regrava em BCrypt as senhas antigas.
 */
@Service
public class UsuarioDetailsService implements UserDetailsService, UserDetailsPasswordService {

    private static final Logger log = LoggerFactory.getLogger(UsuarioDetailsService.class);

    private final UsuarioRepository usuarioRepository;

    public UsuarioDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPassword())
                .roles(usuario.getRole().name())
                .disabled(!usuario.isAtivo())
                .build();
    }

    @Override
    @Transactional
    public UserDetails updatePassword(UserDetails user, String novaSenha) {
        usuarioRepository.findByUsername(user.getUsername()).ifPresent(usuario -> {
            usuario.setPassword(novaSenha);
            log.info("Senha do usuário {} convertida para BCrypt", usuario.getUsername());
        });
        return User.withUserDetails(user).password(novaSenha).build();
    }
}
