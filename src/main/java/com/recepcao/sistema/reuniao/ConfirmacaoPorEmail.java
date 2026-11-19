package com.recepcao.sistema.reuniao;

import com.recepcao.sistema.email.EmailDaReuniao;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Manda a confirmação por e-mail depois que a reunião foi gravada, fora da requisição:
 * a tela não espera o servidor de e-mail, e nada sai se a gravação falhar.
 */
@Component
class ConfirmacaoPorEmail {

    private final ReuniaoRepository reuniaoRepository;
    private final EmailDaReuniao emailDaReuniao;

    ConfirmacaoPorEmail(ReuniaoRepository reuniaoRepository, EmailDaReuniao emailDaReuniao) {
        this.reuniaoRepository = reuniaoRepository;
        this.emailDaReuniao = emailDaReuniao;
    }

    @Async
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void enviar(ReuniaoAgendada evento) {
        reuniaoRepository.findById(evento.reuniaoId()).ifPresent(emailDaReuniao::enviarConfirmacao);
    }
}
