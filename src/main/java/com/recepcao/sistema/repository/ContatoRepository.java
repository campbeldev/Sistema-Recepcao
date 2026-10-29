package com.recepcao.sistema.repository;

import com.recepcao.sistema.model.Contato;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ContatoRepository extends JpaRepository<Contato, Long> {


}
