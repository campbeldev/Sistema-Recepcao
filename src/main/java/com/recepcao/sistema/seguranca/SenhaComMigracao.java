package com.recepcao.sistema.seguranca;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Grava sempre em BCrypt, mas ainda aceita as senhas antigas em texto puro.
 * Quando alguém entra com uma senha antiga, {@link #upgradeEncoding} avisa o Spring Security,
 * e o {@link UsuarioDetailsService} regrava a senha em BCrypt. Com o tempo, o texto puro some do banco.
 */
class SenhaComMigracao implements PasswordEncoder {

    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence senha) {
        return bcrypt.encode(senha);
    }

    @Override
    public boolean matches(CharSequence senha, String gravada) {
        if (gravada == null || gravada.isEmpty()) {
            return false;
        }
        if (ehBcrypt(gravada)) {
            return bcrypt.matches(senha, gravada);
        }
        return MessageDigest.isEqual(
                senha.toString().getBytes(StandardCharsets.UTF_8),
                gravada.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public boolean upgradeEncoding(String gravada) {
        return gravada != null && !ehBcrypt(gravada);
    }

    private static boolean ehBcrypt(String gravada) {
        // Um hash BCrypt começa com $2a$, $2b$ ou $2y$.
        return gravada.startsWith("$2a$") || gravada.startsWith("$2b$") || gravada.startsWith("$2y$");
    }
}
