package com.recepcao.sistema.lembrete;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lembretes")
public class LembreteController {

    private final LembreteService lembreteService;

    public LembreteController(LembreteService lembreteService) {
        this.lembreteService = lembreteService;
    }

    @GetMapping
    public List<LembreteDados> listar() {
        return lembreteService.listarTodos();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LembreteDados criar(@RequestBody @Valid LembreteEntrada entrada, Authentication quem) {
        return lembreteService.criar(entrada, quem.getName());
    }

    @PutMapping("/{id}")
    public LembreteDados atualizar(@PathVariable Long id, @RequestBody @Valid LembreteEntrada entrada) {
        return lembreteService.atualizar(id, entrada);
    }

    @PostMapping("/{id}/concluir")
    public LembreteDados concluir(@PathVariable Long id) {
        return lembreteService.marcarFeito(id, true);
    }

    @PostMapping("/{id}/reabrir")
    public LembreteDados reabrir(@PathVariable Long id) {
        return lembreteService.marcarFeito(id, false);
    }
}
