package com.recepcao.sistema.reuniao;

import com.recepcao.sistema.reuniao.dto.ReuniaoEntrada;
import com.recepcao.sistema.reuniao.dto.ReuniaoResposta;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API de reuniões. Excluir é só para ADMIN (regra no SecurityConfig).
 */
@RestController
@RequestMapping("/reunioes")
public class ReuniaoController {

    private final ReuniaoService reuniaoService;

    public ReuniaoController(ReuniaoService reuniaoService) {
        this.reuniaoService = reuniaoService;
    }

    @GetMapping
    public List<ReuniaoResposta> listar() {
        return reuniaoService.listarTodos();
    }

    @GetMapping("/{id}")
    public ReuniaoResposta buscar(@PathVariable Long id) {
        return reuniaoService.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReuniaoResposta criar(@RequestBody @Valid ReuniaoEntrada entrada) {
        return reuniaoService.criar(entrada);
    }

    @PutMapping("/{id}")
    public ReuniaoResposta atualizar(@PathVariable Long id, @RequestBody @Valid ReuniaoEntrada entrada) {
        return reuniaoService.atualizar(id, entrada);
    }

    @PostMapping("/{id}/cancelar")
    public ReuniaoResposta cancelar(@PathVariable Long id) {
        return reuniaoService.cancelar(id);
    }

    @PostMapping("/{id}/reagendar")
    public ReuniaoResposta reagendar(@PathVariable Long id) {
        return reuniaoService.reagendar(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void apagar(@PathVariable Long id) {
        reuniaoService.apagar(id);
    }
}
