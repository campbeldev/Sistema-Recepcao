package com.recepcao.sistema.reuniao;

import com.recepcao.sistema.email.EmailDaReuniao;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * A cada minuto, avisa por e-mail as reuniões que começam nos próximos 30 minutos.
 * Cada reunião recebe um lembrete só: depois de enviado, ela fica marcada.
 */
@Component
class LembreteDeReunioes {

    private final ReuniaoRepository reuniaoRepository;
    private final EmailDaReuniao emailDaReuniao;

    LembreteDeReunioes(ReuniaoRepository reuniaoRepository, EmailDaReuniao emailDaReuniao) {
        this.reuniaoRepository = reuniaoRepository;
        this.emailDaReuniao = emailDaReuniao;
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void lembrarProximas() {
        LocalDateTime agora = LocalDateTime.now();

        for (Reuniao reuniao : reuniaoRepository.semLembreteEntre(StatusReuniao.AGENDADA, agora, agora.plusMinutes(30))) {
            emailDaReuniao.enviarLembrete(reuniao);
            reuniao.marcarLembreteEnviado();
        }
    }
}
