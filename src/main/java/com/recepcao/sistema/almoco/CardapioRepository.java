package com.recepcao.sistema.almoco;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface CardapioRepository extends JpaRepository<Cardapio, Long> {

    Optional<Cardapio> findByDia(LocalDate dia);

    Optional<Cardapio> findByCodigoDoLink(String codigoDoLink);

    /** O último cardápio antes de hoje, para a recepção começar o de hoje a partir dele. */
    Optional<Cardapio> findFirstByDiaBeforeOrderByDiaDesc(LocalDate dia);
}
