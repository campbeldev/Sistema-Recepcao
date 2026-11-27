package com.recepcao.sistema.almoco;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Os códigos que ninguém consegue adivinhar: o do link do dia e a chave de cada pedido.
 * 16 bytes sorteados viram 22 letras e números que cabem num endereço.
 */
final class ChaveAleatoria {

    private static final SecureRandom SORTEIO = new SecureRandom();

    private ChaveAleatoria() {}

    static String nova() {
        byte[] bytes = new byte[16];
        SORTEIO.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** O banco guarda só o resumo da chave: quem lê o banco não consegue alterar o pedido de ninguém. */
    static String resumo(String chave) {
        try {
            byte[] resumo = MessageDigest.getInstance("SHA-256").digest(chave.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(resumo);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 não disponível", e);
        }
    }
}
