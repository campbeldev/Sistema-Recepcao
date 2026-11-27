package com.recepcao.sistema.almoco;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * O que o ddl-auto=update não faz sozinho: o pedido deixou de ser ligado a uma pessoa do Ramal
 * (agora a pessoa digita o nome), então pessoa_id passa a aceitar vazio. Rodar de novo não muda nada.
 */
@Component
class AjusteDoBancoDoAlmoco implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AjusteDoBancoDoAlmoco.class);

    private final JdbcTemplate jdbc;

    AjusteDoBancoDoAlmoco(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbc.execute("ALTER TABLE pedido_de_almoco ALTER COLUMN pessoa_id DROP NOT NULL");
        } catch (DataAccessException e) {
            log.warn("Não foi possível deixar pedido_de_almoco.pessoa_id opcional. Rode à mão: "
                    + "ALTER TABLE pedido_de_almoco ALTER COLUMN pessoa_id DROP NOT NULL;", e);
        }
    }
}
