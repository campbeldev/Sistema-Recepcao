package com.recepcao.sistema.usuario;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API das contas de acesso. Só ADMIN chega aqui (regra no SecurityConfig).
 */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public List<UsuarioDados> listar() {
        return usuarioService.listarTodos();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioDados criar(@RequestBody @Valid UsuarioEntrada entrada) {
        return usuarioService.criar(entrada);
    }

    @PutMapping("/{id}")
    public UsuarioDados atualizar(@PathVariable Long id, @RequestBody @Valid UsuarioEntrada entrada,
                                  Authentication quem) {
        return usuarioService.atualizar(id, entrada, quem.getName());
    }

    @PostMapping("/{id}/ativar")
    public UsuarioDados ativar(@PathVariable Long id) {
        return usuarioService.ativar(id);
    }

    @PostMapping("/{id}/desativar")
    public UsuarioDados desativar(@PathVariable Long id, Authentication quem) {
        return usuarioService.desativar(id, quem.getName());
    }
}
