package com.recepcao.sistema.service;

import com.recepcao.sistema.model.*;
import com.recepcao.sistema.repository.ReuniaoRepository;
import com.recepcao.sistema.repository.ContatoRepository;
import com.recepcao.sistema.repository.ReuniaoParticipanteRepository;
import com.recepcao.sistema.repository.ReuniaoAnfitriaoRepository;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReuniaoService {

    private final ReuniaoRepository reuniaoRepository;
    private final ContatoRepository contatoRepository;
    private final ReuniaoParticipanteRepository participanteRepository;
    private final ReuniaoAnfitriaoRepository anfitriaoRepository;
    private final EmailService emailService;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    public ReuniaoService(ReuniaoRepository reuniaoRepository,
                          ContatoRepository contatoRepository,
                          ReuniaoParticipanteRepository participanteRepository,
                          ReuniaoAnfitriaoRepository anfitriaoRepository,
                          EmailService emailService) {
        this.reuniaoRepository = reuniaoRepository;
        this.contatoRepository = contatoRepository;
        this.participanteRepository = participanteRepository;
        this.anfitriaoRepository = anfitriaoRepository;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<Reuniao> listarTodos() {
        List<Reuniao> reunioes = reuniaoRepository.findAll();
        // Força o carregamento das listas LAZY
        reunioes.forEach(r -> {
            Hibernate.initialize(r.getAnfitrioes());
            Hibernate.initialize(r.getParticipantes());
            r.getAnfitrioes().forEach(a -> Hibernate.initialize(a.getContato()));
            r.getParticipantes().forEach(p -> Hibernate.initialize(p.getContato()));
        });
        return reunioes;
    }

    @Transactional(readOnly = true)
    public Reuniao buscarPorId(Long id) {
        Reuniao reuniao = reuniaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reunião não encontrada!"));
        System.out.println("🔍 Reunião encontrada - Empresa: " + reuniao.getEmpresaReuniao());
        System.out.println("🔍 Anfitriões: " + reuniao.getAnfitrioes().size());
        return reuniao;
    }

    private void verificarConflitoHorario(Reuniao reuniao) {
        LocalDateTime dataHora = reuniao.getDatahoraReuniao();

        List<Reuniao> conflitos = reuniaoRepository.findBySalaAndDatahoraReuniao(
                reuniao.getSala(),
                dataHora
        );

        if (reuniao.getId() != null) {
            conflitos = conflitos.stream()
                    .filter(r -> !r.getId().equals(reuniao.getId()))
                    .collect(Collectors.toList());
        }

        if (!conflitos.isEmpty()) {
            Reuniao conflito = conflitos.get(0);
            String horaFormatada = conflito.getDatahoraReuniao().getHour() + ":" +
                    String.format("%02d", conflito.getDatahoraReuniao().getMinute());
            throw new RuntimeException("Já existe uma reunião agendada na sala " +
                    reuniao.getSala() + " às " + horaFormatada);
        }
    }

    @Transactional
    public Reuniao salvar(Reuniao reuniao) {

        // ===== LOG ANTES DE SALVAR =====
        System.out.println("🚀 ANTES DO SAVE - Empresa: '" + reuniao.getEmpresaReuniao() + "'");
        System.out.println("🚀 ANTES DO SAVE - Título: " + reuniao.getTitulo());

        verificarConflitoHorario(reuniao);

        System.out.println("\n🚀 ===== INICIANDO SALVAMENTO DA REUNIÃO =====");

        // ===== 1. PRIMEIRO: Salva a reunião principal =====
        Reuniao reuniaoSalva = reuniaoRepository.save(reuniao);
        System.out.println("📌 Reunião salva com ID: " + reuniaoSalva.getId());

        // ===== 2. APENAS PARA ATUALIZAÇÃO: Limpa registros antigos =====
        boolean isAtualizacao = reuniao.getId() != null;
        if (isAtualizacao) {
            System.out.println("🔄 ATUALIZAÇÃO: Limpando registros antigos da reunião ID: " + reuniao.getId());

            // USA O ID DA REUNIÃO SALVA, NÃO O ID DO OBJETO ORIGINAL
            anfitriaoRepository.deleteByReuniaoId(reuniaoSalva.getId());
            participanteRepository.deleteByReuniaoId(reuniaoSalva.getId());

            anfitriaoRepository.flush();
            participanteRepository.flush();
            System.out.println("✅ Registros antigos removidos");
        }

        // ===== 3. USA SET PARA CONTROLAR DUPLICAÇÃO =====
        Set<Long> idsAnfitrioesProcessados = new HashSet<>();
        Set<Long> idsParticipantesProcessados = new HashSet<>();

        // ===== 4. Processa os ANFITRIÕES =====
        if (reuniao.getAnfitrioes() != null && !reuniao.getAnfitrioes().isEmpty()) {
            System.out.println("👥 Processando anfitriões recebidos: " + reuniao.getAnfitrioes().size());

            for (ReuniaoAnfitriao ra : reuniao.getAnfitrioes()) {
                if (ra.getContato() != null && ra.getContato().getId() != null) {
                    Long contatoId = ra.getContato().getId();

                    if (!idsAnfitrioesProcessados.contains(contatoId)) {
                        idsAnfitrioesProcessados.add(contatoId);

                        Contato contato = contatoRepository.findById(contatoId)
                                .orElseThrow(() -> new RuntimeException("Contato anfitrião não encontrado: " + contatoId));

                        ReuniaoAnfitriao novoRa = new ReuniaoAnfitriao(reuniaoSalva, contato);
                        anfitriaoRepository.save(novoRa);
                        System.out.println("   ✅ Anfitrião adicionado: " + contato.getNomeParticipante() + " (ID: " + contatoId + ")");
                    } else {
                        System.out.println("   ⚠️ Anfitrião duplicado ignorado: ID " + contatoId);
                    }
                }
            }
        } else {
            System.out.println("📭 Nenhum anfitrião para processar");
        }

        // ===== 5. Processa os PARTICIPANTES =====
        if (reuniao.getParticipantes() != null && !reuniao.getParticipantes().isEmpty()) {
            System.out.println("👥 Processando participantes recebidos: " + reuniao.getParticipantes().size());

            for (ReuniaoParticipante rp : reuniao.getParticipantes()) {
                if (rp.getContato() != null && rp.getContato().getId() != null) {
                    Long contatoId = rp.getContato().getId();

                    if (!idsParticipantesProcessados.contains(contatoId)) {
                        idsParticipantesProcessados.add(contatoId);

                        Contato contato = contatoRepository.findById(contatoId)
                                .orElseThrow(() -> new RuntimeException("Contato participante não encontrado: " + contatoId));

                        ReuniaoParticipante novoRp = new ReuniaoParticipante(reuniaoSalva, contato);
                        participanteRepository.save(novoRp);
                        System.out.println("   ✅ Participante adicionado: " + contato.getNomeParticipante() + " (ID: " + contatoId + ")");
                    } else {
                        System.out.println("   ⚠️ Participante duplicado ignorado: ID " + contatoId);
                    }
                }
            }
        } else {
            System.out.println("📭 Nenhum participante para processar");
        }

        // ===== 6. Força flush =====
        reuniaoRepository.flush();
        anfitriaoRepository.flush();
        participanteRepository.flush();

        // ===== 7. Limpa o cache do Hibernate =====
        entityManager.clear();

        // ===== 8. Busca reunião com todos os dados =====
        Reuniao dadosCompletos = reuniaoRepository.findById(reuniaoSalva.getId())
                .orElseThrow(() -> new RuntimeException("Erro ao recuperar dados completos da reunião"));

        // ===== 9. LOG DO RESULTADO FINAL =====
        System.out.println("\n📊 ===== RESULTADO FINAL =====");
        System.out.println("📊 Anfitriões no banco: " +
                (dadosCompletos.getAnfitrioes() != null ? dadosCompletos.getAnfitrioes().size() : 0));

        if (dadosCompletos.getAnfitrioes() != null) {
            // USA SET PARA GARANTIR QUE NÃO TEM DUPLICATAS NO LOG
            Set<Long> idsUnicos = new HashSet<>();
            for (ReuniaoAnfitriao ra : dadosCompletos.getAnfitrioes()) {
                if (!idsUnicos.contains(ra.getContato().getId())) {
                    idsUnicos.add(ra.getContato().getId());
                    System.out.println("   - " + ra.getContato().getNomeParticipante() +
                            " (ID: " + ra.getContato().getId() + ")");
                } else {
                    System.out.println("   ⚠️ DUPLICATA ENCONTRADA NO BANCO: " + ra.getContato().getNomeParticipante());
                }
            }
        }

        System.out.println("📊 Participantes no banco: " +
                (dadosCompletos.getParticipantes() != null ? dadosCompletos.getParticipantes().size() : 0));

        if (dadosCompletos.getParticipantes() != null) {
            Set<Long> idsUnicos = new HashSet<>();
            for (ReuniaoParticipante rp : dadosCompletos.getParticipantes()) {
                if (!idsUnicos.contains(rp.getContato().getId())) {
                    idsUnicos.add(rp.getContato().getId());
                    System.out.println("   - " + rp.getContato().getNomeParticipante() +
                            " (ID: " + rp.getContato().getId() + ")");
                } else {
                    System.out.println("   ⚠️ DUPLICATA ENCONTRADA NO BANCO: " + rp.getContato().getNomeParticipante());
                }
            }
        }
        System.out.println("📊 ===== FIM =====\n");

        // ===== 10. Envia e-mail =====
        try {
            emailService.enviarConfirmacaoReuniao(dadosCompletos);
        } catch (Exception e) {
            System.err.println("⚠️ Erro ao enviar e-mail: " + e.getMessage());
        }

        return reuniaoSalva;
    }

    @Scheduled(fixedRate = 60000)
    public void verificarLembretes() {
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime daqui30Min = agora.plusMinutes(30);

        List<Reuniao> reunioesProximas = reuniaoRepository.findByDatahoraReuniaoBetween(agora, daqui30Min);

        for (Reuniao r : reunioesProximas) {
            if (r.getStatus() == StatusReuniao.AGENDADA) {
                try {
                    emailService.enviarLembreteReuniao(r);
                    System.out.println("✅ Lembrete enviado para reunião: " + r.getTitulo());
                } catch (Exception e) {
                    System.err.println("❌ Erro ao enviar lembrete: " + e.getMessage());
                }
            }
        }
    }

    @Transactional
    public void delete(Long id) {
        System.out.println("🗑️ Deletando reunião ID: " + id);

        participanteRepository.deleteByReuniaoId(id);
        anfitriaoRepository.deleteByReuniaoId(id);
        reuniaoRepository.deleteById(id);

        System.out.println("✅ Reunião deletada com sucesso");
    }
}