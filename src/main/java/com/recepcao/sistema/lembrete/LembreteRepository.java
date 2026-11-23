package com.recepcao.sistema.lembrete;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface LembreteRepository extends JpaRepository<Lembrete, Long> {

    /** Os lembretes de um período: de {@code inicio} (incluído) até {@code fim} (excluído). */
    List<Lembrete> findByDiaGreaterThanEqualAndDiaLessThan(LocalDate inicio, LocalDate fim);
}
