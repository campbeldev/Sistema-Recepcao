function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ===== FUNÇÃO PARA OBTER INÍCIO E FIM DA SEMANA ATUAL (SEGUNDA A DOMINGO) =====
function obterSemanaAtual() {
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

    // Calcula a Segunda-feira da semana atual
    let inicio = new Date(hoje);
    if (diaSemana === 0) {
        // Se for domingo, volta 6 dias para segunda
        inicio.setDate(hoje.getDate() - 6);
    } else {
        // Se for segunda a sábado, volta (diaSemana - 1) dias
        inicio.setDate(hoje.getDate() - (diaSemana - 1));
    }
    inicio.setHours(0, 0, 0, 0);

    // Calcula o Domingo da semana atual
    let fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    fim.setHours(23, 59, 59, 999);

    console.log(`📅 Semana atual: ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`);

    return { inicio, fim };
}

// DASHBOARD
async function carregarDashboard() {
    try {
        const contatos = await fetch('/contatos').then(r => r.json());
        const reunioes = await fetch('/reunioes').then(r => r.json());

        document.getElementById('totalContatos').textContent = contatos.length;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const reunioesHoje = reunioes.filter(r => {
            const data = new Date(r.datahoraReuniao);
            data.setHours(0, 0, 0, 0);
            return data.getTime() === hoje.getTime();
        }).length;

        // ===== CORREÇÃO: REUNIÕES DA SEMANA ATUAL (SEGUNDA A DOMINGO) =====
        const { inicio, fim } = obterSemanaAtual();

        const reunioesSemana = reunioes.filter(r => {
            const data = new Date(r.datahoraReuniao);
            return data >= inicio && data <= fim;
        }).length;

        const realizadas = reunioes.filter(r => r.status === 'FINALIZADA').length;
        const canceladas = reunioes.filter(r => r.status === 'CANCELADA').length;

        document.getElementById('reunioesHoje').textContent = reunioesHoje;
        document.getElementById('reunioesSemana').textContent = reunioesSemana;
        document.getElementById('reunioesRealizadas').textContent = realizadas;
        document.getElementById('reunioesCanceladas').textContent = canceladas;

        console.log(`📊 Dashboard: Hoje=${reunioesHoje}, Semana=${reunioesSemana}, Realizadas=${realizadas}, Canceladas=${canceladas}`);

    } catch (error) {
        console.error('Erro dashboard:', error);
    }
}

// ===== FUNÇÃO PARA FORMATAR LISTA DE ANFITRIÕES SEM DUPLICATAS =====
function formatarAnfitrioes(reuniao) {
    if (reuniao.anfitrioes && reuniao.anfitrioes.length > 0) {
        // Usa Set para remover duplicatas
        const idsUnicos = new Set();
        const nomesUnicos = [];

        reuniao.anfitrioes.forEach(ra => {
            const id = ra.contato?.id;
            const nome = ra.contato?.nomeParticipante;
            if (id && !idsUnicos.has(id)) {
                idsUnicos.add(id);
                nomesUnicos.push(nome);
            }
        });

        if (nomesUnicos.length > 0) {
            return nomesUnicos.join(', ');
        }
    }
    return 'Não definido';
}

// REUNIÕES
async function carregarReunioes() {
    try {
        const reunioes = await fetch('/reunioes').then(r => r.json());
        const ativas = reunioes.filter(r => r.status === 'AGENDADA' || !r.status);

        ativas.sort((a, b) => new Date(a.datahoraReuniao) - new Date(b.datahoraReuniao));

        const lista = document.getElementById('reunioesList');
        if (!lista) return;

        if (ativas.length === 0) {
            lista.innerHTML = '<div class="empty-message">Nenhuma reunião agendada</div>';
            return;
        }

        lista.innerHTML = ativas.map(r => {
            // Formata anfitriões
            let anfitrioesText = '';
            if (r.anfitrioes && r.anfitrioes.length > 0) {
                const idsUnicos = new Set();
                const nomesUnicos = [];
                r.anfitrioes.forEach(a => {
                    const id = a.contato?.id;
                    const nome = a.contato?.nomeParticipante;
                    if (id && !idsUnicos.has(id)) {
                        idsUnicos.add(id);
                        nomesUnicos.push(nome);
                    }
                });
                anfitrioesText = nomesUnicos.join(', ');
            } else {
                anfitrioesText = 'Não definido';
            }

            // Formata participantes
            let participantesHtml = '';
            if (r.participantes?.length > 0) {
                const idsUnicos = new Set();
                const nomesUnicos = [];
                r.participantes.forEach(p => {
                    const id = p.contato?.id;
                    const nome = p.contato?.nomeParticipante;
                    if (id && !idsUnicos.has(id)) {
                        idsUnicos.add(id);
                        nomesUnicos.push(nome);
                    }
                });
                if (nomesUnicos.length > 0) {
                    participantesHtml = `<p><strong>Participantes:</strong> ${nomesUnicos.join(', ')}</p>`;
                }
            } else if (r.contato) {
                participantesHtml = `<p><strong>Participante:</strong> ${r.contato.nomeParticipante}</p>`;
            }

            return `
                <div class="reuniao-card" onclick="window.location.href='/reuniao/detalhes_reuniao?id=${r.id}'" style="cursor: pointer;">
                    <div class="reuniao-header">
                        <span class="reuniao-titulo">${r.titulo || 'Sem título'}</span>
                        <span class="reuniao-status">${r.status || 'AGENDADA'}</span>
                    </div>
                    <div class="reuniao-info">
                        <p><strong>Data:</strong> ${formatarData(r.datahoraReuniao)}</p>
                        <p><strong>Sala:</strong> ${r.sala || 'Não definida'}</p>
                        ${r.motivo ? `<p><strong>Motivo:</strong> ${r.motivo}</p>` : ''}
                        ${r.empresaReuniao ? `<p><strong>Empresa:</strong> ${r.empresaReuniao}</p>` : ''}
                        <p><strong>Anfitrião(ões):</strong> ${anfitrioesText}</p>
                        ${participantesHtml}
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro reuniões:', error);
    }
}

// CONTATOS
async function carregarContatos() {
    try {
        const contatos = await fetch('/contatos').then(r => r.json());
        const lista = document.getElementById('contatosList');
        if (!lista) return;

        const ultimos = contatos.slice(-5).reverse();

        if (ultimos.length === 0) {
            lista.innerHTML = '<div class="empty-message">Nenhum contato</div>';
            return;
        }

        lista.innerHTML = ultimos.map(c => `
            <div class="contato-item">
                <div class="contato-info">
                    <h4>${c.nomeParticipante}</h4>
                    ${c.nomeEmpresa ? `<p>${c.nomeEmpresa}</p>` : ''}
                </div>
                <a href="/paginas/reuniao?contatoId=${c.id}" class="btn-marcar-reuniao">📅</a>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro contatos:', error);
    }
}

// ===== FUNÇÕES DO MODAL DE RELATÓRIO =====
function abrirModalRelatorio() {
    console.log('Abrindo modal...');
    const modal = document.getElementById('modalRelatorio');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        alert('Erro: Modal não encontrado!');
    }
}

function fecharModalRelatorio() {
    const modal = document.getElementById('modalRelatorio');
    if (modal) {
        modal.style.display = 'none';
    }
}

function gerarRelatorio() {
    const mes = document.getElementById('mesRelatorio')?.value;
    const ano = document.getElementById('anoRelatorio')?.value;
    const tipo = document.querySelector('input[name="tipoRelatorio"]:checked')?.value;
    const incluirCanceladas = document.getElementById('incluirCanceladas')?.checked;

    if (!mes || !ano || !tipo) {
        alert('Selecione todas as opções!');
        return;
    }

    fecharModalRelatorio();

    let url = `/api/relatorio/exportar?mes=${mes}&ano=${ano}&tipo=${tipo}`;
    if (!incluirCanceladas) {
        url += '&excluirCanceladas=true';
    }

    console.log('Baixando:', url);
    window.location.href = url;
}

function setupPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
        });
    });
}

// Fechar modal clicando fora
window.onclick = function(event) {
    const modal = document.getElementById('modalRelatorio');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// INICIALIZAR
document.addEventListener('DOMContentLoaded', () => {
    carregarDashboard();
    carregarReunioes();
    carregarContatos();
    setupPasswordToggle();

    setInterval(() => {
        carregarDashboard();
        carregarReunioes();
        carregarContatos();
    }, 30000);
});