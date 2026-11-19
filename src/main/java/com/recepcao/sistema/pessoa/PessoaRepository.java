package com.recepcao.sistema.pessoa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    List<Pessoa> findByAtivoTrueOrderByNomeAsc();

    /** Quem está ativo com este ramal: o mesmo ramal não pode ficar com duas pessoas. */
    Optional<Pessoa> findFirstByRamalAndAtivoTrue(String ramal);
}
