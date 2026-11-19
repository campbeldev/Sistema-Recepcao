package com.recepcao.sistema.pessoa;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pessoas")
public class PessoaController {

    private final PessoaService pessoaService;

    public PessoaController(PessoaService pessoaService) {
        this.pessoaService = pessoaService;
    }

    @GetMapping
    public List<PessoaDados> listar() {
        return pessoaService.listarAtivas();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PessoaDados criar(@RequestBody @Valid PessoaEntrada entrada) {
        return pessoaService.criar(entrada);
    }

    @PutMapping("/{id}")
    public PessoaDados atualizar(@PathVariable Long id, @RequestBody @Valid PessoaEntrada entrada) {
        return pessoaService.atualizar(id, entrada);
    }

    @PostMapping("/{id}/desativar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativar(@PathVariable Long id) {
        pessoaService.desativar(id);
    }
}
