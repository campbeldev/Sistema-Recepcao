package com.recepcao.sistema.reuniao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReuniaoRepository extends JpaRepository<Reuniao, Long> {

    List<Reuniao> findBySalaAndDatahoraReuniao(String sala, LocalDateTime datahora);

    List<Reuniao> findByStatusAndDatahoraReuniaoBefore(StatusReuniao status, LocalDateTime data);

    List<Reuniao> findByDatahoraReuniaoGreaterThanEqualAndDatahoraReuniaoLessThanOrderByDatahoraReuniao(
            LocalDateTime inicio, LocalDateTime fim);

    @Query("""
            select r from Reuniao r
            where r.status = :status
              and r.datahoraReuniao between :inicio and :fim
              and (r.lembreteEnviado is null or r.lembreteEnviado = false)
            """)
    List<Reuniao> semLembreteEntre(@Param("status") StatusReuniao status,
                                   @Param("inicio") LocalDateTime inicio,
                                   @Param("fim") LocalDateTime fim);
}
