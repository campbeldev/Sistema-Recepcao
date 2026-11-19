package com.recepcao.sistema.pessoa;

import com.recepcao.sistema.comum.erro.NaoEncontradoException;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;
import java.util.Objects;

@Service
public class PessoaService {

    /** Um ano bissexto qualquer, para o 29 de fevereiro valer como aniversário. */
    private static final int ANO_BISSEXTO = 2024;

    private final PessoaRepository pessoaRepository;

    public PessoaService(PessoaRepository pessoaRepository) {
        this.pessoaRepository = pessoaRepository;
    }

    /** Só as ativas: quem foi desativado sai da lista, do Início e do sino. */
    public List<PessoaDados> listarAtivas() {
        return pessoaRepository.findByAtivoTrueOrderByNomeAsc().stream().map(PessoaDados::de).toList();
    }

    @Transactional
    public PessoaDados criar(PessoaEntrada entrada) {
        conferir(entrada, null);
        Pessoa pessoa = new Pessoa();
        entrada.copiarPara(pessoa);
        return PessoaDados.de(pessoaRepository.save(pessoa));
    }

    @Transactional
    public PessoaDados atualizar(Long id, PessoaEntrada entrada) {
        Pessoa pessoa = buscarAtiva(id);
        conferir(entrada, id);
        entrada.copiarPara(pessoa);
        return PessoaDados.de(pessoa);
    }

    @Transactional
    public void desativar(Long id) {
        buscarAtiva(id).desativar();
    }

    private Pessoa buscarAtiva(Long id) {
        return pessoaRepository.findById(id)
                .filter(Pessoa::isAtivo)
                .orElseThrow(() -> new NaoEncontradoException("Pessoa não encontrada."));
    }

    // O que a validação de cada campo não cobre: o aniversário completo e o ramal sem outro dono.
    private void conferir(PessoaEntrada entrada, Long id) {
        Integer dia = entrada.diaAniversario();
        Integer mes = entrada.mesAniversario();
        if (dia == null && mes != null) {
            throw new RegraDeNegocioException("Escolha o dia do aniversário.", "diaAniversario", "Escolha o dia.");
        }
        if (dia != null && mes == null) {
            throw new RegraDeNegocioException("Escolha o mês do aniversário.", "mesAniversario", "Escolha o mês.");
        }
        if (dia != null && dia > YearMonth.of(ANO_BISSEXTO, mes).lengthOfMonth()) {
            throw new RegraDeNegocioException(
                    "Esse dia não existe no mês escolhido.", "diaAniversario", "Esse dia não existe no mês.");
        }

        String ramal = PessoaEntrada.limpo(entrada.ramal());
        if (ramal != null) {
            pessoaRepository.findFirstByRamalAndAtivoTrue(ramal)
                    .filter(dono -> !Objects.equals(dono.getId(), id))
                    .ifPresent(dono -> {
                        String recusa = "O ramal " + ramal + " já é de " + dono.getNome() + ".";
                        throw new RegraDeNegocioException(recusa, "ramal", recusa);
                    });
        }
    }
}
