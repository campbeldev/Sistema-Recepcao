package com.recepcao.sistema.repository;

import com.recepcao.sistema.model.ReuniaoAnfitriao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReuniaoAnfitriaoRepository extends JpaRepository<ReuniaoAnfitriao,Long> {

    boolean existsByContatoId(Long contatoId);

    void deleteByReuniaoId(Long reuniaoId);
}
