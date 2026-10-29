package com.recepcao.sistema.repository;

import com.recepcao.sistema.model.ReuniaoParticipante;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReuniaoParticipanteRepository extends JpaRepository<ReuniaoParticipante, Long> {
    void deleteByReuniaoId(Long reuniaoId);

    // ✅ ADICIONE ESTE MÉTODO
    boolean existsByContatoId(Long contatoId);

}
