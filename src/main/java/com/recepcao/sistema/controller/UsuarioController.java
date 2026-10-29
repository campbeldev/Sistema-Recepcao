package com.recepcao.sistema.controller;

import com.recepcao.sistema.model.Usuario;
import com.recepcao.sistema.service.UsuarioService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

@Controller
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // ===== PÁGINA DE CADASTRO (SÓ ADMIN) =====
    @GetMapping("/cadastro")
    public String paginaCadastro(HttpSession session) {
        Usuario usuario = (Usuario) session.getAttribute("usuarioLogado");
        if (usuario == null || !"ADMIN".equals(usuario.getRole())) {
            return "redirect:/login";
        }
        return "cadastro";
    }

    @PostMapping("/cadastro")
    public String cadastrar(@RequestParam String username,
                            @RequestParam String password,
                            @RequestParam String nome,
                            @RequestParam String email,
                            @RequestParam String role,
                            HttpSession session,
                            Model model) {

        Usuario usuario = (Usuario) session.getAttribute("usuarioLogado");
        if (usuario == null || !"ADMIN".equals(usuario.getRole())) {
            return "redirect:/login";
        }

        try {
            usuarioService.criarUsuario(username, password, nome, email, role);
            return "redirect:/usuarios?sucesso";
        } catch (Exception e) {
            model.addAttribute("erro", e.getMessage());
            return "cadastro";
        }
    }

    // ===== PÁGINA DE LOGIN (PÚBLICA) =====
    @GetMapping("/login")
    public String paginaLogin() {
        return "login";
    }

    @PostMapping("/login")
    public String login(@RequestParam String username,
                        @RequestParam String password,
                        HttpSession session,
                        Model model) {
        try {
            Usuario usuario = usuarioService.login(username, password);
            session.setAttribute("usuarioLogado", usuario);
            return "redirect:/";
        } catch (Exception e) {
            model.addAttribute("erro", e.getMessage());
            return "login";
        }
    }

    // ===== LOGOUT =====
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }

    // ===== LISTAR USUÁRIOS (SÓ ADMIN) =====
    @GetMapping("/usuarios")
    public String listarUsuarios(HttpSession session, Model model) {
        Usuario usuario = (Usuario) session.getAttribute("usuarioLogado");
        if (usuario == null || !"ADMIN".equals(usuario.getRole())) {
            return "redirect:/login";
        }

        model.addAttribute("usuarios", usuarioService.listarTodos());
        return "lista_usuarios";
    }

    @PostMapping("/usuarios/desativar/{id}")
    public String desativarUsuario(@PathVariable Long id, HttpSession session) {
        Usuario admin = (Usuario) session.getAttribute("usuarioLogado");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "redirect:/login";
        }
        usuarioService.desativarUsuario(id);
        return "redirect:/usuarios";
    }

    @PostMapping("/usuarios/ativar/{id}")
    public String ativarUsuario(@PathVariable Long id, HttpSession session) {
        Usuario admin = (Usuario) session.getAttribute("usuarioLogado");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "redirect:/login";
        }
        usuarioService.ativarUsuario(id);
        return "redirect:/usuarios";
    }

    @PostMapping("/usuarios/apagar/{id}")
    public String apagarUsuario(@PathVariable Long id, HttpSession session) {
        Usuario admin = (Usuario) session.getAttribute("usuarioLogado");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "redirect:/login";
        }
        usuarioService.apagarUsuario(id);
        return "redirect:/usuarios";
    }

    // ===== PÁGINA DE EDIÇÃO (SÓ ADMIN) =====
    @GetMapping("/usuarios/editar/{id}")
    public String paginaEditarUsuario(@PathVariable Long id,
                                      HttpSession session,
                                      Model model) {
        // Verifica se é ADMIN
        Usuario admin = (Usuario) session.getAttribute("usuarioLogado");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "redirect:/login";
        }

        try {
            Usuario usuario = usuarioService.buscarPorId(id);
            model.addAttribute("usuario", usuario);
            return "editar_usuario";
        } catch (Exception e) {
            return "redirect:/usuarios";
        }
    }

    // ===== SALVAR ALTERAÇÕES (COM SENHA OPCIONAL) =====
    @PostMapping("/usuarios/editar/{id}")
    public String salvarEdicao(@PathVariable Long id,
                               @RequestParam String nome,
                               @RequestParam String email,
                               @RequestParam(required = false) String password,  // ← NOVO: opcional
                               @RequestParam String role,
                               @RequestParam boolean ativo,
                               HttpSession session,
                               Model model) {

        // Verifica se é ADMIN
        Usuario admin = (Usuario) session.getAttribute("usuarioLogado");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "redirect:/login";
        }

        try {
            usuarioService.atualizarUsuario(id, nome, email, password, role, ativo);
            return "redirect:/usuarios?editado=ok";
        } catch (Exception e) {
            model.addAttribute("erro", e.getMessage());
            model.addAttribute("usuario", usuarioService.buscarPorId(id));
            return "editar_usuario";
        }
    }
}