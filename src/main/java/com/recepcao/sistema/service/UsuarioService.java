package com.recepcao.sistema.service;

import com.recepcao.sistema.model.Usuario;
import com.recepcao.sistema.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // ===== CRIAR USUÁRIO =====
    public Usuario criarUsuario(String username, String password, String nome, String email, String role) {
        if (usuarioRepository.existsByUsername(username)) {
            throw new RuntimeException("Usuário já existe!");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setPassword(password);
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setRole(role);

        return usuarioRepository.save(usuario);
    }

    // ===== LOGIN =====
    public Usuario login(String username, String password) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado!"));

        if (!usuario.getPassword().equals(password)) {
            throw new RuntimeException("Senha incorreta!");
        }

        if (!usuario.isAtivo()) {
            throw new RuntimeException("Usuário inativo!");
        }

        return usuario;
    }

    // ===== LISTAR TODOS =====
    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    // ===== BUSCAR POR ID =====
    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado!"));
    }

    // ===== ATUALIZAR USUÁRIO (COM SENHA OPCIONAL) =====
    public Usuario atualizarUsuario(Long id, String nome, String email,
                                    String password, String role, Boolean ativo) {
        Usuario usuario = buscarPorId(id);

        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setRole(role);

        // 🔐 SÓ ATUALIZA A SENHA SE FOI INFORMADA
        if (password != null && !password.trim().isEmpty()) {
            usuario.setPassword(password);
        }

        if (ativo != null) {
            usuario.setAtivo(ativo);
        }

        return usuarioRepository.save(usuario);
    }

    // ===== DESATIVAR USUÁRIO =====
    public void desativarUsuario(Long id) {
        Usuario usuario = buscarPorId(id);
        usuario.setAtivo(false);
        usuarioRepository.save(usuario);
    }

    // ===== ATIVAR USUÁRIO =====
    public void ativarUsuario(Long id) {
        Usuario usuario = buscarPorId(id);
        usuario.setAtivo(true);
        usuarioRepository.save(usuario);
    }

    // ===== APAGAR USUÁRIO =====
    public void apagarUsuario(Long id) {
        usuarioRepository.deleteById(id);
    }
}