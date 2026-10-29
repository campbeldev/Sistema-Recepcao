package com.recepcao.sistema.controller;

import com.recepcao.sistema.model.Contato;
import com.recepcao.sistema.service.ContatoService;
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
    public List<Contato> listar(){
        return contatoService.listarTodos();
    }

    @GetMapping("/{id}")
    public Contato buscar(@PathVariable Long id){
        return contatoService.buscarporId(id);
    }

    @PostMapping
    public Contato salvar(@RequestBody Contato contato){
        return contatoService.salvar(contato);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id){
        contatoService.deletar(id);
    }

    @PutMapping("/{id}")
    public Contato atualizar(@PathVariable Long id, @RequestBody Contato contato) {
        contato.setId(id);
        return contatoService.salvar(contato);
    }

}
