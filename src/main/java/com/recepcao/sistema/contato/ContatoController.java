package com.recepcao.sistema.contato;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contatos")
public class ContatoController {

    private final ContatoService contatoService;

    public ContatoController(ContatoService contatoService) {
        this.contatoService = contatoService;
    }

    @GetMapping
    public List<ContatoDados> listar() {
        return contatoService.listarTodos();
    }

    @GetMapping("/{id}")
    public ContatoDados buscar(@PathVariable Long id) {
        return contatoService.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContatoDados criar(@RequestBody @Valid ContatoDados dados) {
        return contatoService.criar(dados);
    }

    @PutMapping("/{id}")
    public ContatoDados atualizar(@PathVariable Long id, @RequestBody @Valid ContatoDados dados) {
        return contatoService.atualizar(id, dados);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        contatoService.deletar(id);
    }
}
