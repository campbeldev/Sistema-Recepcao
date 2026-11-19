package com.recepcao.sistema.reuniao;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReuniaoAnfitriaoRepository extends JpaRepository<ReuniaoAnfitriao, Long> {

    boolean existsByContatoId(Long contatoId);
}
