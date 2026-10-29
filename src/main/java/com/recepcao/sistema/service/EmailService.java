package com.recepcao.sistema.service;

import com.recepcao.sistema.model.Reuniao;
import com.recepcao.sistema.model.Contato;
import com.recepcao.sistema.model.ReuniaoAnfitriao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${server.address:localhost}")
    private String serverAddress;

    @Value("${server.port:8080}")
    private String serverPort;

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private String getBaseUrl() {
        return "http://" + serverAddress + ":" + serverPort;
    }

    /**
     * Método auxiliar para validar email de forma segura
     */
    private boolean temEmailValido(String email) {
        return email != null && !email.trim().isEmpty() && email.contains("@");
    }

    public void enviarConfirmacaoReuniao(Reuniao reuniao) {
        System.out.println("📧 ===== ENVIANDO E-MAILS =====");
        System.out.println("📧 Reunião: " + reuniao.getTitulo());
        System.out.println("📧 ID da Reunião: " + reuniao.getId());

        // ===== CONTADORES PARA RESUMO FINAL =====
        int totalAnfitrioes = 0;
        int anfitrioesComEmail = 0;
        int totalParticipantes = 0;
        int participantesComEmail = 0;

        // 🔍 LOGS DETALHADOS PARA DIAGNÓSTICO
        System.out.println("🔍 ===== DADOS COMPLETOS DA REUNIÃO =====");

        // ===== ANFITRIÕES =====
        System.out.println("🔍 ANFITRIÕES (múltiplos):");
        if (reuniao.getAnfitrioes() != null && !reuniao.getAnfitrioes().isEmpty()) {
            totalAnfitrioes = reuniao.getAnfitrioes().size();
            int i = 1;
            for (ReuniaoAnfitriao ra : reuniao.getAnfitrioes()) {
                Contato anfitriao = ra.getContato();
                System.out.println("🔍 ANFITRIÃO #" + i + ":");
                if (anfitriao != null) {
                    boolean temEmail = temEmailValido(anfitriao.getEmail());
                    System.out.println("  - ID: " + anfitriao.getId());
                    System.out.println("  - Nome: " + anfitriao.getNomeParticipante());
                    System.out.println("  - Email: '" + anfitriao.getEmail() + "'");
                    System.out.println("  - Email válido? " + temEmail);

                    if (temEmail) anfitrioesComEmail++;
                } else {
                    System.out.println("  - contato null");
                }
                i++;
            }
        } else {
            System.out.println("🔍 ANFITRIÕES: nenhum");
        }

        // ===== PARTICIPANTES =====
        if (reuniao.getParticipantes() != null && !reuniao.getParticipantes().isEmpty()) {
            totalParticipantes = reuniao.getParticipantes().size();
            System.out.println("🔍 PARTICIPANTES: " + totalParticipantes);
            int i = 1;
            for (var participante : reuniao.getParticipantes()) {
                Contato contato = participante.getContato();
                System.out.println("🔍 PARTICIPANTE #" + i + ":");
                if (contato != null) {
                    boolean temEmail = temEmailValido(contato.getEmail());
                    System.out.println("  - ID: " + contato.getId());
                    System.out.println("  - Nome: " + contato.getNomeParticipante());
                    System.out.println("  - Email: '" + contato.getEmail() + "'");
                    System.out.println("  - Email válido? " + temEmail);

                    if (temEmail) participantesComEmail++;
                } else {
                    System.out.println("  - contato null");
                }
                i++;
            }
        } else {
            System.out.println("🔍 PARTICIPANTES: nenhum");
        }

        System.out.println("🔍 ===== FIM DOS DADOS =====\n");

        // ===== ENVIAR PARA TODOS OS ANFITRIÕES =====
        if (reuniao.getAnfitrioes() != null && !reuniao.getAnfitrioes().isEmpty()) {
            System.out.println("📧 Processando anfitriões: " + reuniao.getAnfitrioes().size());

            for (ReuniaoAnfitriao ra : reuniao.getAnfitrioes()) {
                Contato anfitriao = ra.getContato();

                if (anfitriao != null && temEmailValido(anfitriao.getEmail())) {
                    try {
                        enviarEmailTemplate(
                                anfitriao.getEmail(),
                                anfitriao.getNomeParticipante(),
                                reuniao,
                                "📅 Você é anfitrião: " + reuniao.getTitulo(),
                                "anfitriao"
                        );
                        System.out.println("✅ E-mail enviado para anfitrião: " + anfitriao.getEmail());
                    } catch (Exception e) {
                        System.err.println("❌ Erro ao enviar e-mail para anfitrião " + anfitriao.getEmail() + ": " + e.getMessage());
                    }
                } else {
                    String nome = anfitriao != null ? anfitriao.getNomeParticipante() : "desconhecido";
                    System.out.println("⚠️ Anfitrião sem e-mail cadastrado: " + nome);
                }
            }
        } else {
            System.out.println("⚠️ Nenhum anfitrião cadastrado");
        }

        // ===== ENVIAR PARA OS PARTICIPANTES =====
        if (reuniao.getParticipantes() != null && !reuniao.getParticipantes().isEmpty()) {
            System.out.println("📧 Processando participantes: " + reuniao.getParticipantes().size());

            for (var participante : reuniao.getParticipantes()) {
                Contato contato = participante.getContato();

                if (contato != null && temEmailValido(contato.getEmail())) {
                    try {
                        enviarEmailTemplate(
                                contato.getEmail(),
                                contato.getNomeParticipante(),
                                reuniao,
                                "📅 Você é participante: " + reuniao.getTitulo(),
                                "participante"
                        );
                        System.out.println("✅ E-mail enviado para participante: " + contato.getEmail());
                    } catch (Exception e) {
                        System.err.println("❌ Erro ao enviar e-mail para participante " + contato.getEmail() + ": " + e.getMessage());
                    }
                } else {
                    String nome = contato != null ? contato.getNomeParticipante() : "desconhecido";
                    System.out.println("⚠️ Participante sem e-mail: " + nome);
                }
            }
        } else {
            System.out.println("📧 Nenhum participante cadastrado");
        }

        // ===== RESUMO FINAL =====
        System.out.println("\n📊 ===== RESUMO DE ENVIO =====");
        System.out.println("📊 Anfitriões: " + anfitrioesComEmail + "/" + totalAnfitrioes + " emails enviados");
        System.out.println("📊 Participantes: " + participantesComEmail + "/" + totalParticipantes + " emails enviados");
        System.out.println("📊 Total: " + (anfitrioesComEmail + participantesComEmail) + "/" +
                (totalAnfitrioes + totalParticipantes) + " emails enviados");
        System.out.println("📊 ===== FIM DO ENVIO =====\n");
    }

    private void enviarEmailTemplate(String para, String nomeDestinatario,
                                     Reuniao reuniao, String assunto, String tipo) {
        try {
            Context context = new Context();
            context.setVariable("nomeDestinatario", nomeDestinatario);
            context.setVariable("reuniao", reuniao);
            context.setVariable("titulo", "Confirmação de Reunião");
            context.setVariable("dataFormatada", reuniao.getDatahoraReuniao().format(formatter));
            context.setVariable("tipo", tipo);
            context.setVariable("baseUrl", getBaseUrl());

            String conteudoHtml = templateEngine.process("confirmacao_email", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(conteudoHtml, true);

            // Logo Campbel
            try {
                helper.addInline("logoCampbel", new ClassPathResource("static/images/logo-campbel.png"));
            } catch (Exception e) {
                System.err.println("⚠️ Logo não encontrada: " + e.getMessage());
                // Continua mesmo sem a logo
            }

            mailSender.send(message);
            System.out.println("✅ E-mail enviado para: " + para);

        } catch (MessagingException e) {
            System.err.println("❌ Erro ao enviar e-mail: " + e.getMessage());
        }
    }

    public void enviarLembreteReuniao(Reuniao reuniao) {
        System.out.println("⏰ ===== ENVIANDO LEMBRETES =====");
        System.out.println("⏰ Reunião: " + reuniao.getTitulo());

        // ===== CONTADORES PARA RESUMO FINAL =====
        int totalAnfitrioes = 0;
        int anfitrioesComEmail = 0;
        int totalParticipantes = 0;
        int participantesComEmail = 0;

        String assunto = "⏰ Lembrete: Reunião em 30 minutos - " + reuniao.getTitulo();
        String horaReuniao = reuniao.getDatahoraReuniao().format(DateTimeFormatter.ofPattern("HH:mm"));

        // ===== LEMBRETE PARA TODOS OS ANFITRIÕES =====
        if (reuniao.getAnfitrioes() != null && !reuniao.getAnfitrioes().isEmpty()) {
            totalAnfitrioes = reuniao.getAnfitrioes().size();
            System.out.println("⏰ Anfitriões: " + totalAnfitrioes);

            for (ReuniaoAnfitriao ra : reuniao.getAnfitrioes()) {
                Contato anfitriao = ra.getContato();

                if (anfitriao != null && temEmailValido(anfitriao.getEmail())) {
                    boolean enviado = enviarEmailLembrete(
                            anfitriao.getEmail(),
                            anfitriao.getNomeParticipante(),
                            reuniao,
                            assunto,
                            horaReuniao
                    );
                    if (enviado) anfitrioesComEmail++;
                } else {
                    String nome = anfitriao != null ? anfitriao.getNomeParticipante() : "desconhecido";
                    System.out.println("⚠️ Anfitrião sem e-mail para lembrete: " + nome);
                }
            }
        } else {
            System.out.println("⚠️ Nenhum anfitrião para lembrete");
        }

        // ===== LEMBRETES PARA PARTICIPANTES =====
        if (reuniao.getParticipantes() != null && !reuniao.getParticipantes().isEmpty()) {
            totalParticipantes = reuniao.getParticipantes().size();
            System.out.println("⏰ Participantes: " + totalParticipantes);

            for (var participante : reuniao.getParticipantes()) {
                Contato contato = participante.getContato();

                if (contato != null && temEmailValido(contato.getEmail())) {
                    boolean enviado = enviarEmailLembrete(
                            contato.getEmail(),
                            contato.getNomeParticipante(),
                            reuniao,
                            assunto,
                            horaReuniao
                    );
                    if (enviado) participantesComEmail++;
                } else {
                    String nome = contato != null ? contato.getNomeParticipante() : "desconhecido";
                    System.out.println("⚠️ Participante sem e-mail: " + nome);
                }
            }
        } else {
            System.out.println("⏰ Nenhum participante para lembrete");
        }

        // ===== RESUMO FINAL =====
        System.out.println("\n📊 ===== RESUMO DE LEMBRETES =====");
        System.out.println("📊 Anfitriões: " + anfitrioesComEmail + "/" + totalAnfitrioes + " lembretes enviados");
        System.out.println("📊 Participantes: " + participantesComEmail + "/" + totalParticipantes + " lembretes enviados");
        System.out.println("📊 Total: " + (anfitrioesComEmail + participantesComEmail) + "/" +
                (totalAnfitrioes + totalParticipantes) + " lembretes enviados");
        System.out.println("📊 ===== FIM DOS LEMBRETES =====\n");
    }

    private boolean enviarEmailLembrete(String para, String nomeDestinatario,
                                        Reuniao reuniao, String assunto, String horaReuniao) {
        try {
            Context context = new Context();
            context.setVariable("nomeDestinatario", nomeDestinatario);
            context.setVariable("reuniao", reuniao);
            context.setVariable("titulo", "Lembrete de Reunião");
            context.setVariable("dataFormatada", reuniao.getDatahoraReuniao().format(formatter));
            context.setVariable("horaReuniao", horaReuniao);
            context.setVariable("baseUrl", getBaseUrl());

            String conteudoHtml = templateEngine.process("email/lembrete_reuniao", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(conteudoHtml, true);

            mailSender.send(message);
            System.out.println("✅ Lembrete enviado para: " + para);
            return true;

        } catch (MessagingException e) {
            System.err.println("❌ Erro ao enviar lembrete para " + para + ": " + e.getMessage());
            return false;
        }
    }
}