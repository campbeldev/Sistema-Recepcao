package com.recepcao.sistema.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.exceptions.TemplateEngineException;

import java.util.Map;

/**
 * Monta um e-mail a partir de um template Thymeleaf e envia. Não sabe nada de reunião.
 */
@Component
public class EnvioDeEmail {

    private static final Logger log = LoggerFactory.getLogger(EnvioDeEmail.class);
    private static final ClassPathResource LOGO = new ClassPathResource("static/images/logo-campbel.png");

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String remetente;

    public EnvioDeEmail(JavaMailSender mailSender,
                        TemplateEngine templateEngine,
                        @Value("${spring.mail.username}") String remetente) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.remetente = remetente;
    }

    /**
     * @return se o e-mail saiu. Uma falha fica no log e não interrompe os outros envios.
     */
    public boolean enviar(String para, String assunto, String template, Map<String, Object> variaveis) {
        try {
            String html = templateEngine.process(template, new Context(null, variaveis));

            MimeMessage mensagem = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");
            helper.setFrom(remetente);
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(html, true);
            if (LOGO.exists()) {
                helper.addInline("logoCampbel", LOGO);
            }

            mailSender.send(mensagem);
            return true;
        } catch (MessagingException | MailException | TemplateEngineException e) {
            log.warn("Não foi possível enviar o e-mail \"{}\": {}", assunto, e.getMessage());
            return false;
        }
    }
}
