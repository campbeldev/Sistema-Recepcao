package com.recepcao.sistema.service;

import com.recepcao.sistema.model.Reuniao;
import com.recepcao.sistema.model.StatusReuniao;
import com.recepcao.sistema.repository.ReuniaoRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReuniaoAgendamentoService {

    private final ReuniaoRepository reuniaoRepository;

    public ReuniaoAgendamentoService(ReuniaoRepository reuniaoRepository) {
        this.reuniaoRepository = reuniaoRepository;
    }

    // Executa a cada 1 hora
    @Scheduled(fixedRate = 3600000) // 3600000 ms = 1 hora
    @Transactional
    public void finalizarReunioesPassadas() {
        LocalDateTime agora = LocalDateTime.now();

        // Busca reuniões AGENDADA que já passaram
        List<Reuniao> reunioesPassadas = reuniaoRepository
                .findByStatusAndDatahoraReuniaoBefore(StatusReuniao.AGENDADA, agora);

        if (!reunioesPassadas.isEmpty()) {
            System.out.println("📅 Finalizando " + reunioesPassadas.size() + " reuniões passadas...");

            for (Reuniao r : reunioesPassadas) {
                r.setStatus(StatusReuniao.FINALIZADA);
                System.out.println("   ✅ " + r.getTitulo() + " - " + r.getDatahoraReuniao());
            }

            reuniaoRepository.saveAll(reunioesPassadas);
        }
    }
}