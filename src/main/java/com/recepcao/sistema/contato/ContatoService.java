package com.recepcao.sistema.contato;

import com.recepcao.sistema.comum.erro.NaoEncontradoException;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
import com.recepcao.sistema.reuniao.ReuniaoAnfitriaoRepository;
import com.recepcao.sistema.reuniao.ReuniaoParticipanteRepository;
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

    public List<ContatoDados> listarTodos() {
        return contatoRepository.findAll().stream().map(ContatoDados::de).toList();
    }

    public ContatoDados buscar(Long id) {
        return ContatoDados.de(buscarEntidade(id));
    }

    /** Usado pela reunião para ligar anfitriões e participantes. */
    public Contato buscarEntidade(Long id) {
        return contatoRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Contato não encontrado."));
    }

    @Transactional
    public ContatoDados criar(ContatoDados dados) {
        Contato contato = new Contato();
        dados.copiarPara(contato);
        return ContatoDados.de(contatoRepository.save(contato));
    }

    @Transactional
    public ContatoDados atualizar(Long id, ContatoDados dados) {
        Contato contato = buscarEntidade(id);
        dados.copiarPara(contato);
        return ContatoDados.de(contato);
    }

    @Transactional
    public void deletar(Long id) {
        Contato contato = buscarEntidade(id);

        if (anfitriaoRepository.existsByContatoId(id) || participanteRepository.existsByContatoId(id)) {
            throw new RegraDeNegocioException(
                    "Não é possível excluir contato com reuniões associadas. Remova os vínculos primeiro.");
        }

        contatoRepository.delete(contato);
    }
}
