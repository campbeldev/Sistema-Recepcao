package com.recepcao.sistema.service;

import com.recepcao.sistema.model.Contato;
import com.recepcao.sistema.repository.ContatoRepository;
import com.recepcao.sistema.repository.ReuniaoAnfitriaoRepository;
import com.recepcao.sistema.repository.ReuniaoParticipanteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ContatoService {

    private final ContatoRepository contatoRepository;
    private final ReuniaoAnfitriaoRepository anfitriaoRepository;
    private final ReuniaoParticipanteRepository participanteRepository;

    public ContatoService(ContatoRepository contatoRepository,
                          ReuniaoAnfitriaoRepository anfitriaoRepository,
                          ReuniaoParticipanteRepository participanteRepository) {
        this.contatoRepository = contatoRepository;
        this.anfitriaoRepository = anfitriaoRepository;
        this.participanteRepository = participanteRepository;
    }

    public List<Contato> listarTodos() {
        return contatoRepository.findAll();
    }

    public Contato buscarporId(Long id) {
        return contatoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contato não encontrado"));
    }

    public Contato salvar(Contato contato) {
        return contatoRepository.save(contato);
    }

    @Transactional
    public void deletar(Long id) {
        // Verifica se o contato existe
        Contato contato = contatoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contato não encontrado"));

        // Verifica se o contato é anfitrião em alguma reunião
        boolean isAnfitriao = anfitriaoRepository.existsByContatoId(id);

        // Verifica se o contato é participante em alguma reunião
        boolean isParticipante = participanteRepository.existsByContatoId(id);

        if (isAnfitriao || isParticipante) {
            throw new RuntimeException("Não é possível excluir contato com reuniões associadas. " +
                    "Remova os vínculos primeiro.");
        }

        contatoRepository.deleteById(id);
    }
}