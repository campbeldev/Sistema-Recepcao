package com.recepcao.sistema.seguranca;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * As telas moram na Plataforma (React, em /plataforma/). Estas rotas só levam até ela.
 * O POST de /login é tratado pelo Spring Security.
 */
@Controller
public class EntradaController {

    private static final String PLATAFORMA = "forward:/plataforma/index.html";

    @GetMapping("/")
    public String inicio() {
        return "redirect:/plataforma/";
    }

    @GetMapping({"/plataforma", "/plataforma/"})
    public String plataforma() {
        return PLATAFORMA;
    }

    /**
     * O link que a recepção manda no grupo (/almoco/{código do dia}): a Plataforma mostra a tela de pedir
     * o almoço, sem login. O /almoco sem código é o link antigo: a tela avisa que ele não vale mais.
     */
    @GetMapping({"/almoco", "/almoco/{codigo}"})
    public String almoco() {
        return PLATAFORMA;
    }

    /** A Plataforma lê /login?erro e /login?saiu e mostra a tela de entrada. */
    @GetMapping("/login")
    public String entrada(Authentication authentication) {
        if (authentication != null && !(authentication instanceof AnonymousAuthenticationToken)) {
            return "redirect:/plataforma/";
        }
        return PLATAFORMA;
    }
}
