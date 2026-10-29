// ===== FUNÇÃO PARA FORMATAR DATA =====
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ===== FUNÇÃO SHOWMESSAGE =====
function showMessage(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.querySelector('.detalhes-container').insertBefore(alertDiv, document.querySelector('.detalhes-card'));
    setTimeout(() => alertDiv.remove(), 5000);
}

// ===== CARREGAR DETALHES DA REUNIÃO =====
async function carregarDetalhes() {
    try {
        const reuniaoId = document.getElementById('reuniaoId').value;
        const usuarioRole = document.getElementById('usuarioRole')?.value || '';
        const isAdmin = usuarioRole === 'ADMIN';

        const response = await fetch(`/reunioes/${reuniaoId}`);
        const reuniao = await response.json();

        console.log('📋 Dados da reunião:', reuniao); // Para debug

        const container = document.getElementById('detalhesContainer');

        // ===== PROCESSAR ANFITRIÕES =====
        let anfitrioesText = 'Não definido';
        if (reuniao.anfitrioes && reuniao.anfitrioes.length > 0) {
            // Remove duplicatas
            const idsUnicos = new Set();
            const nomesUnicos = [];
            reuniao.anfitrioes.forEach(a => {
                const id = a.contato?.id;
                const nome = a.contato?.nomeParticipante;
                if (id && !idsUnicos.has(id)) {
                    idsUnicos.add(id);
                    nomesUnicos.push(nome);
                }
            });
            anfitrioesText = nomesUnicos.join(', ');
        }

        // ===== PROCESSAR PARTICIPANTES =====
        let participantesHtml = '';
        if (reuniao.participantes && reuniao.participantes.length > 0) {
            // Remove duplicatas
            const idsUnicos = new Set();
            const participantesUnicos = [];
            reuniao.participantes.forEach(p => {
                const id = p.contato?.id;
                if (id && !idsUnicos.has(id)) {
                    idsUnicos.add(id);
                    participantesUnicos.push(p);
                }
            });

            participantesUnicos.forEach(p => {
                participantesHtml += `
                    <div class="detalhes-participante">
                        <div class="detalhes-participante-label">NOME</div>
                        <div class="detalhes-participante-valor">${p.contato.nomeParticipante || 'Não informado'}</div>
                        
                        <div class="detalhes-participante-label">E-MAIL</div>
                        <div class="detalhes-participante-valor">${p.contato.email || 'Não informado'}</div>
                        
                        ${p.contato.telefone ? `
                            <div class="detalhes-participante-label">TELEFONE</div>
                            <div class="detalhes-participante-valor">${p.contato.telefone}</div>
                        ` : ''}
                        
                        ${p.contato.nomeEmpresa ? `
                            <div class="detalhes-participante-label">EMPRESA</div>
                            <div class="detalhes-participante-valor">${p.contato.nomeEmpresa}</div>
                        ` : ''}
                    </div>
                `;
            });
        } else {
            participantesHtml = '<div class="detalhes-participante">Nenhum participante cadastrado</div>';
        }

        container.innerHTML = `
            <h1 class="detalhes-titulo">${reuniao.titulo || 'Sem título'}</h1>
            
            <div class="detalhes-info">
                <p><strong>Anfitrião(ões):</strong> ${anfitrioesText}</p>
                <p><strong>Empresa:</strong> ${reuniao.empresaReuniao || 'Não informada'}</p>
                <p><strong>Data:</strong> ${formatarData(reuniao.datahoraReuniao)}</p>
                <p><strong>Sala:</strong> ${reuniao.sala || 'Não definida'}</p>
                <p><strong>Motivo:</strong> ${reuniao.motivo || 'Não informado'}</p>
                <p><strong>Status:</strong> ${reuniao.status || 'AGENDADA'}</p>
            </div>
            
            <hr class="detalhes-divider">
            
            <h2 class="detalhes-subtitulo">PARTICIPANTES</h2>
            ${participantesHtml}
            
            <div class="detalhes-acoes">
                <a href="/reuniao/editar_reuniao?id=${reuniao.id}" class="detalhes-btn-editar">Editar</a>
                <button class="detalhes-btn-finalizar" onclick="atualizarStatus(${reuniao.id}, 'FINALIZADA')">Finalizar</button>
                <button class="detalhes-btn-cancelar" onclick="atualizarStatus(${reuniao.id}, 'CANCELADA')">Cancelar</button>
                
                ${isAdmin ? `
                    <button class="detalhes-btn-excluir" onclick="deletarReuniao(${reuniao.id})">Excluir</button>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('detalhesContainer').innerHTML = '<div class="loading">Erro ao carregar detalhes</div>';
    }
}

// ===== ATUALIZAR STATUS =====
async function atualizarStatus(id, novoStatus) {
    try {
        const response = await fetch(`/reunioes/${id}`);
        const reuniao = await response.json();
        reuniao.status = novoStatus;

        await fetch(`/reunioes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reuniao)
        });

        showMessage(`✅ Reunião ${novoStatus === 'FINALIZADA' ? 'finalizada' : 'cancelada'} com sucesso!`, 'success');

        // Recarrega os detalhes após 1 segundo
        setTimeout(() => {
            location.reload();
        }, 1500);
    } catch (error) {
        console.error('Erro:', error);
        showMessage('❌ Erro ao atualizar status', 'error');
    }
}

// ===== DELETAR REUNIÃO =====
async function deletarReuniao(id) {
    if (!confirm('Tem certeza que deseja excluir esta reunião?')) return;

    try {
        const response = await fetch(`/reunioes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('✅ Reunião excluída com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            // Tenta ler a mensagem de erro do backend
            const errorText = await response.text();

            // Verifica se é erro de permissão
            if (errorText.includes('Acesso negado') || errorText.includes('apenas administradores')) {
                showMessage('❌ Apenas administradores podem excluir reuniões!', 'error');
            } else {
                showMessage('❌ Erro ao excluir reunião', 'error');
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('❌ Erro ao excluir reunião', 'error');
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', carregarDetalhes);