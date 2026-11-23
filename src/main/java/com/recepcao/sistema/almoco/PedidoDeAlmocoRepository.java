package com.recepcao.sistema.almoco;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PedidoDeAlmocoRepository extends JpaRepository<PedidoDeAlmoco, Long> {

    List<PedidoDeAlmoco> findByCardapioIdOrderByFeitoEmAsc(Long cardapioId);

    Optional<PedidoDeAlmoco> findByCardapioIdAndPessoaId(Long cardapioId, Long pessoaId);

    boolean existsByCardapioIdAndProteina(Long cardapioId, String proteina);
}
