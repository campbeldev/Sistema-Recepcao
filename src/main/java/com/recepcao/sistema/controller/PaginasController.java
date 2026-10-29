package com.recepcao.sistema.controller;

import com.recepcao.sistema.model.Usuario;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/paginas")
public class PaginasController {

    // ===== MÉTODO AUXILIAR PARA VERIFICAR LOGIN =====
    private boolean verificarLogin(HttpSession session) {
        return session.getAttribute("usuarioLogado") != null;
    }

    @GetMapping("/contato")
    public String paginaContato(HttpSession session) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        return "contato";
    }

    @GetMapping("/reuniao")
    public String paginaReuniao(HttpSession session) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        return "reuniao";
    }

    @GetMapping("/editar_contato")
    public String paginaEditarContato(HttpSession session,
                                      @RequestParam(required = false) Long id,
                                      Model model) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }

        if (id != null) {
            model.addAttribute("contatoId", id);
            model.addAttribute("isEdicao", true);
        } else {
            model.addAttribute("isEdicao", false);
        }
        return "editar_contato";
    }
}