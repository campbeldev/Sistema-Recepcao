// agenda.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Agenda carregada');
    carregarContatos();
});

// Função para mostrar mensagens
function showMessage(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.toolbar'));
    setTimeout(() => alertDiv.remove(), 3000);
}

// Função para expandir/recolher
window.toggleContato = function(id) {
    const detalhes = document.getElementById(`detalhes-${id}`);
    const icon = document.getElementById(`icon-${id}`);

    if (detalhes.classList.contains('expanded')) {
        detalhes.classList.remove('expanded');
        icon.classList.remove('expanded');
        icon.textContent = '▼';
    } else {
        // Fecha outros abertos (opcional)
        document.querySelectorAll('.contato-detalhes.expanded').forEach(el => {
            el.classList.remove('expanded');
            const oldIcon = document.getElementById(el.id.replace('detalhes-', 'icon-'));
            if (oldIcon) {
                oldIcon.classList.remove('expanded');
                oldIcon.textContent = '▼';
            }
        });

        detalhes.classList.add('expanded');
        icon.classList.add('expanded');
        icon.textContent = '▲';
    }
};

// Carregar contatos
async function carregarContatos() {
    try {
        console.log('📡 Buscando contatos...');
        const response = await fetch('/contatos');

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const contatos = await response.json();
        console.log('📋 Contatos recebidos:', contatos);

        const lista = document.getElementById('agendaLista');
        const totalSpan = document.getElementById('totalContatos');

        if (!lista) {
            console.error('❌ Elemento agendaLista não encontrado');
            return;
        }

        if (contatos.length === 0) {
            lista.innerHTML = '<div class="empty-message">📭 Nenhum contato cadastrado</div>';
            if (totalSpan) totalSpan.textContent = '0';
            return;
        }

        // Atualiza contador
        if (totalSpan) totalSpan.textContent = contatos.length;

        // Ordena por nome
        contatos.sort((a, b) => a.nomeParticipante.localeCompare(b.nomeParticipante));

        // Monta a lista
        lista.innerHTML = contatos.map(contato => `
            <div class="contato-card" data-id="${contato.id}">
                <!-- Cabeçalho (sempre visível) -->
                <div class="contato-cabecalho" onclick="toggleContato(${contato.id})">
                    <div class="cabecalho-info">
                        <span class="contato-nome">${contato.nomeParticipante || 'Sem nome'}</span>
                        ${contato.nomeEmpresa ?
            `<span class="contato-empresa-badge">🏢 ${contato.nomeEmpresa}</span>`
            : ''}
                    </div>
                    <span class="toggle-icon" id="icon-${contato.id}">▼</span>
                </div>
                
                <!-- Detalhes (expansível) -->
                <div class="contato-detalhes" id="detalhes-${contato.id}">
                    <div class="detalhes-conteudo">
                        <div class="info-grid">
                            <!-- Email -->
                            <div class="info-item">
                                <div class="info-icon">📧</div>
                                <div class="info-text">
                                    <div class="info-label">E-MAIL</div>
                                    <div class="info-value">
                                        <a href="mailto:${contato.email}">${contato.email}</a>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Telefone Pessoal -->
                            ${contato.telefone ? `
                                <div class="info-item">
                                    <div class="info-icon">📱</div>
                                    <div class="info-text">
                                        <div class="info-label">TELEFONE PESSOAL</div>
                                        <div class="info-value">${contato.telefone}</div>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <!-- Telefone de whatsapp -->
      <!-- WHATSAPP (COM ÍCONE!) -->
${contato.whatsapp ? `
    <div class="info-item">
        <div class="info-icon">📱💬</div>
        <div class="info-text">
            <div class="info-label">WHATSAPP</div>
            <div class="info-value">
                <a href="https://wa.me/55${contato.whatsapp.replace(/\D/g, '')}" 
                   target="_blank" 
                   style="color: #25D366; text-decoration: none;">
                    ${contato.whatsapp} 💬
                </a>
            </div>
        </div>
    </div>
` : ''}
                            
                            <!-- Telefone Empresarial -->
                            ${contato.telefoneEmpresarial ? `
                                <div class="info-item">
                                    <div class="info-icon">🏢</div>
                                    <div class="info-text">
                                        <div class="info-label">TELEFONE EMPRESARIAL</div>
                                        <div class="info-value">${contato.telefoneEmpresarial}</div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Ações -->
                        <div class="card-acoes">
                            <button class="btn-acao" onclick="editarContato(${contato.id})">
                                ✏️ Editar
                            </button>
                            <button class="btn-acao" onclick="agendarReuniao(${contato.id})">
                                📅 Agendar
                            </button>
                            <button class="btn-acao delete" onclick="deletarContato(event, ${contato.id})">🗑️ Excluir</button>
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Configura busca após carregar
        setupBusca();

    } catch (error) {
        console.error('❌ Erro ao carregar contatos:', error);
        const lista = document.getElementById('agendaLista');
        if (lista) {
            lista.innerHTML = '<div class="empty-message">❌ Erro ao carregar contatos</div>';
        }
    }
}

// Funções de ação
window.editarContato = function(id) {
    window.location.href = `/paginas/editar_contato?id=${id}`;
};

window.agendarReuniao = function(contatoId) {
    window.location.href = `/paginas/reuniao?contatoId=${contatoId}`;
};

// Função de deletar contato com tooltip embaixo (SEM ÍCONE EXTRA)
window.deletarContato = async function(event, id) {
    try {
        // Previne o comportamento padrão
        event.preventDefault();
        event.stopPropagation();

        console.log('🔍 Verificando vínculos do contato ID:', id);

        // Pega a posição do botão clicado
        const botao = event.currentTarget;
        const rect = botao.getBoundingClientRect();

        // Busca as reuniões
        const responseReunioes = await fetch('/reunioes');
        const reunioes = await responseReunioes.json();

        // Verifica vínculos
        const reunioesVinculadas = reunioes.filter(r =>
            r.contato?.id === id ||
            r.participantes?.some(p => p.contato?.id === id)
        );

        // Se tiver vínculos, mostra tooltip embaixo (SEM ÍCONE EXTRA)
        if (reunioesVinculadas.length > 0) {
            const comoPrincipal = reunioesVinculadas.filter(r => r.contato?.id === id).length;
            const comoParticipante = reunioesVinculadas.filter(r =>
                r.participantes?.some(p => p.contato?.id === id)
            ).length;

            let mensagem = `❌ CONTATO NÃO PODE SER EXCLUÍDO\n`;
            mensagem += `Vinculado a ${reunioesVinculadas.length} reunião(ões):\n`;
            mensagem += `📌 Principal: ${comoPrincipal}\n`;
            mensagem += `👥 Adicional: ${comoParticipante}\n`;
            mensagem += `Remova os vínculos primeiro.`; // ← REMOVIDO O ÍCONE 🗑️

            // Mostra tooltip embaixo do botão
            mostrarTooltip(mensagem, rect.left, rect.bottom + 5, 'error');
            return;
        }

        // Se não tiver vínculos, pergunta
        if (!confirm(`Tem certeza que deseja excluir este contato?`)) return; // ← REMOVIDO ÍCONE

        const response = await fetch(`/contatos/${id}`, { method: 'DELETE' });

        if (response.ok) {
            mostrarTooltip('✅ Contato excluído com sucesso!', rect.left, rect.bottom + 5, 'success');
            setTimeout(() => carregarContatos(), 1500);
        } else {
            mostrarTooltip('❌ Erro ao excluir contato', rect.left, rect.bottom + 5, 'error');
        }
    } catch (error) {
        console.error('❌ Erro:', error);
        mostrarTooltip('❌ Erro ao excluir contato', rect.left, rect.bottom + 5, 'error');
    }
};

// Função para mostrar tooltip (EMBAIXO)
function mostrarTooltip(mensagem, x, y, tipo = 'error') {
    // Remove tooltips anteriores
    const tooltipAnterior = document.querySelector('.custom-tooltip');
    if (tooltipAnterior) tooltipAnterior.remove();

    // Cria o tooltip
    const tooltip = document.createElement('div');
    tooltip.className = `custom-tooltip tooltip-${tipo}`;
    tooltip.innerHTML = mensagem.replace(/\n/g, '<br>');

    // Posiciona embaixo
    tooltip.style.position = 'fixed';
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.style.zIndex = '9999';

    document.body.appendChild(tooltip);

    // Remove após 4 segundos
    setTimeout(() => {
        tooltip.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => tooltip.remove(), 300);
    }, 4000);
}

// Função de busca
function setupBusca() {
    const buscaInput = document.getElementById('buscaContato');
    if (!buscaInput) return;

    buscaInput.addEventListener('input', function() {
        const termo = this.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.contato-card');

        cards.forEach(card => {
            const textoCard = card.textContent.toLowerCase();
            if (termo === '' || textoCard.includes(termo)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Função para exportar (futura implementação)
window.exportarContatos = function() {
    showMessage('Funcionalidade de exportação em desenvolvimento', 'success');
};