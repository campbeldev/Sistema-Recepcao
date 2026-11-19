package com.recepcao.sistema.lembrete;

import com.recepcao.sistema.comum.erro.NaoEncontradoException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LembreteService {

    private final LembreteRepository lembreteRepository;

    public LembreteService(LembreteRepository lembreteRepository) {
        this.lembreteRepository = lembreteRepository;
    }

    public List<LembreteDados> listarTodos() {
        return lembreteRepository.findAll().stream().map(LembreteDados::de).toList();
    }

    @Transactional
    public LembreteDados criar(LembreteEntrada entrada, String quemCria) {
        Lembrete lembrete = new Lembrete(quemCria);
        entrada.copiarPara(lembrete);
        return LembreteDados.de(lembreteRepository.save(lembrete));
    }

    @Transactional
    public LembreteDados atualizar(Long id, LembreteEntrada entrada) {
        Lembrete lembrete = buscar(id);
        entrada.copiarPara(lembrete);
        return LembreteDados.de(lembrete);
    }

    @Transactional
    public LembreteDados marcarFeito(Long id, boolean feito) {
        Lembrete lembrete = buscar(id);
        lembrete.setFeito(feito);
        return LembreteDados.de(lembrete);
    }

    private Lembrete buscar(Long id) {
        return lembreteRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Lembrete não encontrado."));
    }
}
