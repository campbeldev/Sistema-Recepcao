package com.recepcao.sistema.reuniao;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReuniaoParticipanteRepository extends JpaRepository<ReuniaoParticipante, Long> {

    boolean existsByContatoId(Long contatoId);
}
