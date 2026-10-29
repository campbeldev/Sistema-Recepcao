package com.recepcao.sistema.controller;

import com.recepcao.sistema.model.Usuario;
import com.recepcao.sistema.service.EmailService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class HomeController {

    private final EmailService emailService;

    public HomeController(EmailService emailService) {
        this.emailService = emailService;
    }

    // ===== MÉTODO AUXILIAR PARA VERIFICAR LOGIN =====
    private boolean verificarLogin(HttpSession session) {
        return session.getAttribute("usuarioLogado") != null;
    }

    @GetMapping("/")
    public String home(HttpSession session) {
        // Verifica se tem usuário logado
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        return "home";
    }

    @GetMapping("/agenda")
    public String agenda(HttpSession session) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        return "agenda";
    }

    @GetMapping("/reunioes/finalizadas")
    public String reunioesFinalizadas(HttpSession session, Model model) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        model.addAttribute("titulo", "Reuniões Finalizadas");
        model.addAttribute("status", "FINALIZADA");
        return "lista_reunioes";
    }

    @GetMapping("/reunioes/canceladas")
    public String reunioesCanceladas(HttpSession session, Model model) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        model.addAttribute("titulo", "Reuniões Canceladas");
        model.addAttribute("status", "CANCELADA");
        return "lista_reunioes";
    }

    @GetMapping("/reunioes/hoje")
    public String reunioesHoje(HttpSession session, Model model) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        model.addAttribute("titulo", "Reuniões de Hoje");
        model.addAttribute("tipo", "dia");
        return "calendario_reunioes";
    }

    @GetMapping("/reunioes/semana")
    public String reunioesSemana(HttpSession session, Model model) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        model.addAttribute("titulo", "Reuniões da Semana");
        model.addAttribute("tipo", "semana");
        return "calendario_reunioes";
    }

    @GetMapping("/reuniao/detalhes_reuniao")
    public String detalhesReuniao(HttpSession session, @RequestParam Long id, Model model) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        model.addAttribute("reuniaoId", id);
        return "detalhes_reuniao";
    }

    @GetMapping("/reuniao/editar_reuniao")
    public String editarReuniao(HttpSession session, @RequestParam Long id, Model model) {
        if (!verificarLogin(session)) {
            return "redirect:/login";
        }
        model.addAttribute("reuniaoId", id);
        return "editar_reuniao";
    }


}