package com.recepcao.sistema.almoco;

import com.recepcao.sistema.comum.erro.MuitasTentativasException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

/**
 * Quantos pedidos, alterações e cancelamentos o link aceita de um mesmo endereço por minuto.
 * Segura quem tentar encher a lista de pedidos falsos. O padrão é folgado porque no escritório
 * todo mundo sai pelo mesmo endereço de internet.
 */
@Component
public class LimiteDoLink {

    private static final long UM_MINUTO = 60_000_000_000L;

    private final int porMinuto;
    private final Map<String, Deque<Long>> tentativas = new HashMap<>();

    public LimiteDoLink(@Value("${almoco.link.limite-por-minuto:30}") int porMinuto) {
        this.porMinuto = porMinuto;
    }

    public synchronized void registrar(String endereco) {
        long agora = System.nanoTime();
        if (tentativas.size() > 10_000) {
            tentativas.values().removeIf(vezes -> vezes.isEmpty() || agora - vezes.peekLast() > UM_MINUTO);
        }
        Deque<Long> vezes = tentativas.computeIfAbsent(endereco, chave -> new ArrayDeque<>());
        while (!vezes.isEmpty() && agora - vezes.peekFirst() > UM_MINUTO) {
            vezes.pollFirst();
        }
        if (vezes.size() >= porMinuto) {
            throw new MuitasTentativasException("Muitos pedidos seguidos. Espere um minuto e tente de novo.");
        }
        vezes.addLast(agora);
    }
}
