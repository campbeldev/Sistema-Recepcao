package com.recepcao.sistema.reuniao;

import com.recepcao.sistema.comum.erro.NaoEncontradoException;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
import com.recepcao.sistema.contato.ContatoService;
import com.recepcao.sistema.reuniao.dto.ReuniaoEntrada;
import com.recepcao.sistema.reuniao.dto.ReuniaoResposta;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

@Service
public class ReuniaoService {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final ReuniaoRepository reuniaoRepository;
    private final ContatoService contatoService;
    private final ApplicationEventPublisher eventos;

    public ReuniaoService(ReuniaoRepository reuniaoRepository,
                          ContatoService contatoService,
                          ApplicationEventPublisher eventos) {
        this.reuniaoRepository = reuniaoRepository;
        this.contatoService = contatoService;
        this.eventos = eventos;
    }

    @Transactional(readOnly = true)
    public List<ReuniaoResposta> listarTodos() {
        return reuniaoRepository.findAll().stream().map(ReuniaoResposta::de).toList();
    }

    @Transactional(readOnly = true)
    public ReuniaoResposta buscar(Long id) {
        return ReuniaoResposta.de(buscarEntidade(id));
    }

    @Transactional
    public ReuniaoResposta criar(ReuniaoEntrada entrada) {
        Reuniao reuniao = new Reuniao();
        reuniao.setStatus(StatusReuniao.AGENDADA);
        preencher(reuniao, entrada);
        exigirSalaLivre(reuniao);

        reuniaoRepository.save(reuniao);
        avisarParticipantes(reuniao);
        return ReuniaoResposta.de(reuniao);
    }

    @Transactional
    public ReuniaoResposta atualizar(Long id, ReuniaoEntrada entrada) {
        Reuniao reuniao = buscarEntidade(id);
        preencher(reuniao, entrada);
        exigirSalaLivre(reuniao);

        avisarParticipantes(reuniao);
        return ReuniaoResposta.de(reuniao);
    }

    @Transactional
    public ReuniaoResposta cancelar(Long id) {
        Reuniao reuniao = buscarEntidade(id);
        if (reuniao.getStatus() != StatusReuniao.AGENDADA) {
            throw new RegraDeNegocioException("Só uma reunião agendada pode ser cancelada.");
        }
        reuniao.setStatus(StatusReuniao.CANCELADA);
        return ReuniaoResposta.de(reuniao);
    }

    /**
     * Desfaz o cancelamento: a reunião volta a ser agendada, desde que a sala ainda esteja livre
     * nesse horário. Os participantes recebem a confirmação de novo, como ao agendar.
     */
    @Transactional
    public ReuniaoResposta reagendar(Long id) {
        Reuniao reuniao = buscarEntidade(id);
        if (reuniao.getStatus() != StatusReuniao.CANCELADA) {
            throw new RegraDeNegocioException("Só uma reunião cancelada pode voltar a ser agendada.");
        }
        reuniao.setStatus(StatusReuniao.AGENDADA);
        exigirSalaLivre(reuniao);

        avisarParticipantes(reuniao);
        return ReuniaoResposta.de(reuniao);
    }

    @Transactional
    public void apagar(Long id) {
        reuniaoRepository.delete(buscarEntidade(id));
    }

    private Reuniao buscarEntidade(Long id) {
        return reuniaoRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Reunião não encontrada."));
    }

    private void preencher(Reuniao reuniao, ReuniaoEntrada entrada) {
        reuniao.setTitulo(entrada.titulo());
        reuniao.setEmpresaReuniao(entrada.empresaReuniao());
        // A sala é opcional: vazia vira nula.
        reuniao.setSala(entrada.sala() == null || entrada.sala().isBlank() ? null : entrada.sala());
        reuniao.setMotivo(entrada.motivo());
        reuniao.remarcar(entrada.datahoraReuniao());
        if (entrada.status() != null) {
            reuniao.setStatus(entrada.status());
        }
        reuniao.definirAnfitrioes(entrada.idsDosAnfitrioes().stream().map(contatoService::buscarEntidade).toList());
        reuniao.definirParticipantes(entrada.idsDosParticipantes().stream().map(contatoService::buscarEntidade).toList());
    }

    /** Duas reuniões não canceladas não podem ocupar a mesma sala no mesmo horário. Sem sala, não há o que conferir. */
    private void exigirSalaLivre(Reuniao reuniao) {
        if (reuniao.getStatus() == StatusReuniao.CANCELADA || reuniao.getSala() == null) {
            return;
        }
        boolean ocupada = reuniaoRepository
                .findBySalaAndDatahoraReuniao(reuniao.getSala(), reuniao.getDatahoraReuniao())
                .stream()
                .anyMatch(outra -> !Objects.equals(outra.getId(), reuniao.getId())
                        && outra.getStatus() != StatusReuniao.CANCELADA);

        if (ocupada) {
            throw new RegraDeNegocioException("Já existe uma reunião agendada na sala " + reuniao.getSala()
                    + " às " + reuniao.getDatahoraReuniao().format(HORA) + ".");
        }
    }

    /** O e-mail de confirmação só sai para reunião agendada, e só depois de gravada (ver ConfirmacaoPorEmail). */
    private void avisarParticipantes(Reuniao reuniao) {
        if (reuniao.getStatus() == StatusReuniao.AGENDADA) {
            eventos.publishEvent(new ReuniaoAgendada(reuniao.getId()));
        }
    }
}
