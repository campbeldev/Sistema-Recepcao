package com.recepcao.sistema.usuario;

import com.recepcao.sistema.comum.erro.NaoEncontradoException;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * As contas de acesso. Ninguém é excluído: a conta sai de uso ao ser desativada.
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioDados> listarTodos() {
        return usuarioRepository.findAll(Sort.by("nome")).stream().map(UsuarioDados::de).toList();
    }

    @Transactional
    public UsuarioDados criar(UsuarioEntrada entrada) {
        String username = entrada.username() == null ? "" : entrada.username().trim();
        if (username.isEmpty()) {
            throw new RegraDeNegocioException("Informe o login.");
        }
        if (usuarioRepository.existsByUsername(username)) {
            throw new RegraDeNegocioException("Já existe um usuário com esse login.");
        }
        exigirSenha(entrada.senha());

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setPassword(passwordEncoder.encode(entrada.senha()));
        usuario.setNome(entrada.nome());
        usuario.setEmail(entrada.email() == null || entrada.email().isBlank() ? null : entrada.email().trim());
        usuario.setRole(entrada.perfil());

        return UsuarioDados.de(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDados atualizar(Long id, UsuarioEntrada entrada, String quemAltera) {
        Usuario usuario = buscar(id);

        if (usuario.getUsername().equals(quemAltera) && entrada.perfil() != Perfil.ADMIN) {
            throw new RegraDeNegocioException("Você não pode tirar de si mesmo o perfil de administrador.");
        }

        usuario.setNome(entrada.nome());
        usuario.setEmail(entrada.email() == null || entrada.email().isBlank() ? null : entrada.email().trim());
        usuario.setRole(entrada.perfil());
        if (entrada.senha() != null && !entrada.senha().isBlank()) {
            exigirSenha(entrada.senha());
            usuario.setPassword(passwordEncoder.encode(entrada.senha()));
        }

        return UsuarioDados.de(usuario);
    }

    @Transactional
    public UsuarioDados ativar(Long id) {
        Usuario usuario = buscar(id);
        usuario.setAtivo(true);
        return UsuarioDados.de(usuario);
    }

    @Transactional
    public UsuarioDados desativar(Long id, String quemDesativa) {
        Usuario usuario = buscar(id);
        if (usuario.getUsername().equals(quemDesativa)) {
            throw new RegraDeNegocioException("Você não pode desativar a própria conta.");
        }
        usuario.setAtivo(false);
        return UsuarioDados.de(usuario);
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado."));
    }

    private void exigirSenha(String senha) {
        if (senha == null || senha.length() < 8) {
            throw new RegraDeNegocioException("A senha precisa ter pelo menos 8 caracteres.");
        }
    }
}
