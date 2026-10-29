package com.recepcao.sistema.controller;

import com.recepcao.sistema.model.Contato;
import com.recepcao.sistema.model.Reuniao;
import com.recepcao.sistema.model.ReuniaoAnfitriao;
import com.recepcao.sistema.model.Usuario;
import com.recepcao.sistema.service.ContatoService;
import com.recepcao.sistema.service.ReuniaoService;
import com.recepcao.sistema.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reunioes")
public class ReuniaoController {

    private final ReuniaoService reuniaoService;
    private final UsuarioService usuarioService;
    private final ContatoService contatoService;

    public ReuniaoController(ReuniaoService reuniaoService, UsuarioService usuarioService, ContatoService contatoService) {
        this.reuniaoService = reuniaoService;
        this.usuarioService = usuarioService;
        this.contatoService = contatoService;
    }

    @GetMapping
    public List<Reuniao> listar() {
        return reuniaoService.listarTodos();
    }

    @GetMapping("/{id}")
    public Reuniao buscar(@PathVariable Long id) {
        return reuniaoService.buscarPorId(id);
    }

    @PostMapping
    public Reuniao criar(@RequestBody Reuniao reuniao) {
        // ===== LOG PARA DEBUG =====
        System.out.println("📝 ===== CRIANDO REUNIÃO =====");
        System.out.println("Título: " + reuniao.getTitulo());
        System.out.println("Data/Hora: " + reuniao.getDatahoraReuniao());
        System.out.println("🏢 EMPRESA RECEBIDA: '" + reuniao.getEmpresaReuniao() + "'");  // ← ADICIONE
        System.out.println("Sala: " + reuniao.getSala());

        // Processa anfitriões
        if (reuniao.getAnfitrioes() != null && !reuniao.getAnfitrioes().isEmpty()) {
            System.out.println("👥 Anfitriões recebidos: " + reuniao.getAnfitrioes().size());

            for (ReuniaoAnfitriao ra : reuniao.getAnfitrioes()) {
                if (ra.getContato() != null && ra.getContato().getId() != null) {
                    // Busca o contato completo do banco
                    Contato contatoCompleto = contatoService.buscarporId(ra.getContato().getId());
                    ra.setContato(contatoCompleto);
                    ra.setReuniao(reuniao); // Garante o vínculo bidirecional
                    System.out.println("   ✅ Anfitrião: " + contatoCompleto.getNomeParticipante() +
                            " (ID: " + contatoCompleto.getId() + ")");
                }
            }
        } else {
            System.out.println("⚠️ Nenhum anfitrião recebido!");
        }

        // Processa participantes
        if (reuniao.getParticipantes() != null && !reuniao.getParticipantes().isEmpty()) {
            System.out.println("👥 Participantes recebidos: " + reuniao.getParticipantes().size());

            for (var participante : reuniao.getParticipantes()) {
                if (participante.getContato() != null && participante.getContato().getId() != null) {
                    // Busca o contato completo do banco
                    Contato contatoCompleto = contatoService.buscarporId(participante.getContato().getId());
                    participante.setContato(contatoCompleto);
                    participante.setReuniao(reuniao); // Garante o vínculo bidirecional
                    System.out.println("   ✅ Participante: " + contatoCompleto.getNomeParticipante() +
                            " (ID: " + contatoCompleto.getId() + ")");
                }
            }
        } else {
            System.out.println("⚠️ Nenhum participante recebido!");
        }

        System.out.println("📝 ===== FIM DEBUG =====\n");

        return reuniaoService.salvar(reuniao);
    }

    @PutMapping("/{id}")
    public Reuniao atualizar(@PathVariable Long id, @RequestBody Reuniao reuniao) {
        reuniao.setId(id);

        // ===== LOG PARA DEBUG =====
        System.out.println("📝 ===== ATUALIZANDO REUNIÃO ID: " + id + " =====");

        // Processa anfitriões
        if (reuniao.getAnfitrioes() != null && !reuniao.getAnfitrioes().isEmpty()) {
            for (ReuniaoAnfitriao ra : reuniao.getAnfitrioes()) {
                if (ra.getContato() != null && ra.getContato().getId() != null) {
                    Contato contatoCompleto = contatoService.buscarporId(ra.getContato().getId());
                    ra.setContato(contatoCompleto);
                    ra.setReuniao(reuniao);
                }
            }
        }

        // Processa participantes
        if (reuniao.getParticipantes() != null && !reuniao.getParticipantes().isEmpty()) {
            for (var participante : reuniao.getParticipantes()) {
                if (participante.getContato() != null && participante.getContato().getId() != null) {
                    Contato contatoCompleto = contatoService.buscarporId(participante.getContato().getId());
                    participante.setContato(contatoCompleto);
                    participante.setReuniao(reuniao);
                }
            }
        }

        System.out.println("📝 ===== FIM DEBUG =====\n");

        return reuniaoService.salvar(reuniao);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable long id, HttpSession session) {
        // Pega o usuário logado
        Usuario usuario = (Usuario) session.getAttribute("usuarioLogado");

        // Verifica se é ADMIN
        if (usuario == null || !"ADMIN".equals(usuario.getRole())) {
            throw new RuntimeException("Acesso negado! Apenas administradores podem excluir reuniões.");
        }

        System.out.println("🗑️ Deletando reunião ID: " + id + " pelo usuário: " + usuario.getNome());
        reuniaoService.delete(id);
    }
}