package com.recepcao.sistema.repository;

import com.recepcao.sistema.model.Reuniao;
import com.recepcao.sistema.model.StatusReuniao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ReuniaoRepository extends JpaRepository<Reuniao, Long> {

    // NADA DE FETCH! Apenas métodos simples

    List<Reuniao> findBySalaAndDatahoraReuniao(String sala, LocalDateTime datahora);

    List<Reuniao> findBySalaAndDatahoraReuniaoBetween(String sala, LocalDateTime inicio, LocalDateTime fim);

    List<Reuniao> findByStatusAndDatahoraReuniaoBefore(StatusReuniao status, LocalDateTime data);

    List<Reuniao> findByDatahoraReuniaoBetween(LocalDateTime inicio, LocalDateTime fim);
}