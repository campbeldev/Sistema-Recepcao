package com.recepcao.sistema.reuniao;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A cada hora, marca como finalizadas as reuniões agendadas cujo horário já passou.
 */
@Component
class FinalizacaoDeReunioes {

    private static final Logger log = LoggerFactory.getLogger(FinalizacaoDeReunioes.class);

    private final ReuniaoRepository reuniaoRepository;

    FinalizacaoDeReunioes(ReuniaoRepository reuniaoRepository) {
        this.reuniaoRepository = reuniaoRepository;
    }

    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void finalizarReunioesPassadas() {
        List<Reuniao> passadas = reuniaoRepository
                .findByStatusAndDatahoraReuniaoBefore(StatusReuniao.AGENDADA, LocalDateTime.now());

        passadas.forEach(reuniao -> reuniao.setStatus(StatusReuniao.FINALIZADA));

        if (!passadas.isEmpty()) {
            log.info("{} reuniões passadas marcadas como finalizadas", passadas.size());
        }
    }
}
