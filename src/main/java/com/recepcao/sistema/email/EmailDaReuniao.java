package com.recepcao.sistema.email;

import com.recepcao.sistema.contato.Contato;
import com.recepcao.sistema.reuniao.Reuniao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Os e-mails de uma reunião: a confirmação, quando é agendada, e o lembrete, 30 minutos antes.
 * Vão para todos os anfitriões e participantes que têm e-mail.
 */
@Service
public class EmailDaReuniao {

    private static final Logger log = LoggerFactory.getLogger(EmailDaReuniao.class);
    private static final DateTimeFormatter DATA_E_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final EnvioDeEmail envioDeEmail;
    private final String urlPublica;

    public EmailDaReuniao(EnvioDeEmail envioDeEmail, @Value("${app.url-publica}") String urlPublica) {
        this.envioDeEmail = envioDeEmail;
        this.urlPublica = urlPublica;
    }

    public void enviarConfirmacao(Reuniao reuniao) {
        int enviados = 0;
        List<Destinatario> destinatarios = destinatarios(reuniao);

        for (Destinatario destinatario : destinatarios) {
            String assunto = destinatario.anfitriao()
                    ? "📅 Você é anfitrião: " + reuniao.getTitulo()
                    : "📅 Você é participante: " + reuniao.getTitulo();

            Map<String, Object> variaveis = variaveisComuns(reuniao, destinatario);
            variaveis.put("titulo", "Confirmação de Reunião");
            variaveis.put("tipo", destinatario.anfitriao() ? "anfitriao" : "participante");

            if (envioDeEmail.enviar(destinatario.contato().getEmail(), assunto, "confirmacao_email", variaveis)) {
                enviados++;
            }
        }

        log.info("Confirmação da reunião {}: {} de {} e-mails enviados", reuniao.getId(), enviados, destinatarios.size());
    }

    public void enviarLembrete(Reuniao reuniao) {
        int enviados = 0;
        List<Destinatario> destinatarios = destinatarios(reuniao);
        String assunto = "⏰ Lembrete: Reunião em 30 minutos - " + reuniao.getTitulo();

        for (Destinatario destinatario : destinatarios) {
            Map<String, Object> variaveis = variaveisComuns(reuniao, destinatario);
            variaveis.put("titulo", "Lembrete de Reunião");
            variaveis.put("horaReuniao", reuniao.getDatahoraReuniao().format(HORA));
            variaveis.put("anfitrioes", nomesDosAnfitrioes(reuniao));

            if (envioDeEmail.enviar(destinatario.contato().getEmail(), assunto, "lembrete_reuniao", variaveis)) {
                enviados++;
            }
        }

        log.info("Lembrete da reunião {}: {} de {} e-mails enviados", reuniao.getId(), enviados, destinatarios.size());
    }

    private Map<String, Object> variaveisComuns(Reuniao reuniao, Destinatario destinatario) {
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("nomeDestinatario", destinatario.contato().getNomeParticipante());
        variaveis.put("reuniao", reuniao);
        variaveis.put("dataFormatada", reuniao.getDatahoraReuniao().format(DATA_E_HORA));
        variaveis.put("baseUrl", urlPublica);
        return variaveis;
    }

    private static String nomesDosAnfitrioes(Reuniao reuniao) {
        String nomes = reuniao.getAnfitrioes().stream()
                .map(a -> a.getContato().getNomeParticipante())
                .collect(Collectors.joining(", "));
        return nomes.isEmpty() ? "—" : nomes;
    }

    /** Anfitriões primeiro, depois participantes; só quem tem e-mail. */
    private static List<Destinatario> destinatarios(Reuniao reuniao) {
        List<Destinatario> lista = new ArrayList<>();
        reuniao.getAnfitrioes().forEach(a -> adicionarSeTemEmail(lista, a.getContato(), true));
        reuniao.getParticipantes().forEach(p -> adicionarSeTemEmail(lista, p.getContato(), false));
        return lista;
    }

    private static void adicionarSeTemEmail(List<Destinatario> lista, Contato contato, boolean anfitriao) {
        if (contato != null && contato.getEmail() != null && contato.getEmail().contains("@")) {
            lista.add(new Destinatario(contato, anfitriao));
        }
    }

    private record Destinatario(Contato contato, boolean anfitriao) {}
}
