package com.recepcao.sistema.pessoa;

import com.recepcao.sistema.comum.erro.NaoEncontradoException;
import com.recepcao.sistema.comum.erro.RegraDeNegocioException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** As regras do cadastro de pessoas que a validação dos campos não cobre. Sem banco: o repositório é simulado. */
class PessoaServiceTest {

    private PessoaRepository repositorio;
    private PessoaService servico;

    @BeforeEach
    void preparar() {
        repositorio = mock(PessoaRepository.class);
        servico = new PessoaService(repositorio);
        when(repositorio.save(any())).thenAnswer(chamada -> chamada.getArgument(0));
        when(repositorio.findFirstByRamalAndAtivoTrue(any())).thenReturn(Optional.empty());
    }

    private static PessoaEntrada entrada(String ramal, Integer dia, Integer mes) {
        return new PessoaEntrada(" Juliana Costa ", "Financeiro", " ", ramal, null, "(31) 98603-2245", dia, mes, true);
    }

    private static Pessoa pessoaComId(long id, String nome, String ramal) {
        Pessoa pessoa = new Pessoa();
        ReflectionTestUtils.setField(pessoa, "id", id);
        pessoa.setNome(nome);
        pessoa.setSetor("TI");
        pessoa.setRamal(ramal);
        return pessoa;
    }

    @Test
    void cadastraLimpandoOsEspacosEOsCamposVazios() {
        PessoaDados gravada = servico.criar(entrada("2107", 19, 11));

        assertEquals("Juliana Costa", gravada.nome());
        assertNull(gravada.cargo());
        assertEquals("2107", gravada.ramal());
        assertEquals(19, gravada.diaAniversario());
        assertEquals(11, gravada.mesAniversario());
    }

    @Test
    void recusaRamalQueJaEDeOutraPessoaNoCampoDoRamal() {
        when(repositorio.findFirstByRamalAndAtivoTrue("2401"))
                .thenReturn(Optional.of(pessoaComId(7, "Pedro Fernandes", "2401")));

        RegraDeNegocioException recusa = assertThrows(RegraDeNegocioException.class,
                () -> servico.criar(entrada("2401", null, null)));

        assertEquals("O ramal 2401 já é de Pedro Fernandes.", recusa.getMessage());
        assertEquals("O ramal 2401 já é de Pedro Fernandes.", recusa.getCampos().get("ramal"));
        verify(repositorio, never()).save(any());
    }

    @Test
    void aceitaQueAPessoaMantenhaOProprioRamalAoAlterar() {
        Pessoa juliana = pessoaComId(3, "Juliana Costa", "2107");
        when(repositorio.findById(3L)).thenReturn(Optional.of(juliana));
        when(repositorio.findFirstByRamalAndAtivoTrue("2107")).thenReturn(Optional.of(juliana));

        PessoaDados alterada = servico.atualizar(3L, entrada("2107", 19, 11));

        assertEquals("2107", alterada.ramal());
    }

    @Test
    void recusaAniversarioPelaMetade() {
        RegraDeNegocioException semMes = assertThrows(RegraDeNegocioException.class,
                () -> servico.criar(entrada(null, 19, null)));
        assertTrue(semMes.getCampos().containsKey("mesAniversario"));

        RegraDeNegocioException semDia = assertThrows(RegraDeNegocioException.class,
                () -> servico.criar(entrada(null, null, 11)));
        assertTrue(semDia.getCampos().containsKey("diaAniversario"));
    }

    @Test
    void recusaDiaQueNaoExisteNoMesMasAceita29DeFevereiro() {
        RegraDeNegocioException recusa = assertThrows(RegraDeNegocioException.class,
                () -> servico.criar(entrada(null, 31, 4)));
        assertTrue(recusa.getCampos().containsKey("diaAniversario"));

        assertEquals(29, servico.criar(entrada(null, 29, 2)).diaAniversario());
    }

    @Test
    void desativadaNaoPodeSerAlteradaNemDesativadaDeNovo() {
        Pessoa saiu = pessoaComId(9, "Roberto Alves", "2318");
        saiu.desativar();
        when(repositorio.findById(9L)).thenReturn(Optional.of(saiu));

        assertThrows(NaoEncontradoException.class, () -> servico.atualizar(9L, entrada("2318", null, null)));
        assertThrows(NaoEncontradoException.class, () -> servico.desativar(9L));
    }

    @Test
    void desativarTiraAPessoaDosAtivos() {
        Pessoa carlos = pessoaComId(4, "Carlos Mendes", "2231");
        when(repositorio.findById(4L)).thenReturn(Optional.of(carlos));

        servico.desativar(4L);

        assertFalse(carlos.isAtivo());
    }
}
