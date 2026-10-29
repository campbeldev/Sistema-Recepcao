// notificacao.js - Versão corrigida

console.log("🚀 notificacao.js carregado");

async function verificarReunioesDoDia() {
    console.log("🔍 Verificando reuniões do dia...");

    // ===== VERIFICA SE JÁ MOSTROU NESTA SESSÃO DO NAVEGADOR =====
    // Usamos sessionStorage que persiste enquanto a aba estiver aberta
    const jaMostrouNestaSessao = sessionStorage.getItem('modalJaMostrado');

    if (jaMostrouNestaSessao) {
        console.log("ℹ️ Modal já foi mostrado nesta sessão do navegador");
        return;
    }
    // ============================================================

    try {
        const response = await fetch('/reunioes');
        if (!response.ok) return;

        const reunioes = await response.json();

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);

        const reunioesHoje = reunioes.filter(r => {
            if (r.status !== 'AGENDADA') return false;
            if (!r.datahoraReuniao) return false;

            const dataReuniao = new Date(r.datahoraReuniao);
            return dataReuniao >= hoje && dataReuniao < amanha;
        });

        if (reunioesHoje.length > 0) {
            console.log("🎯 Mostrando modal!");
            mostrarModalReunioesDoDia(reunioesHoje);

            // ===== MARCA QUE JÁ MOSTROU NESTA SESSÃO =====
            sessionStorage.setItem('modalJaMostrado', 'true');
            // ============================================
        } else {
            console.log("ℹ️ Nenhuma reunião hoje");
            // Mesmo sem reuniões, marca como já verificado para não ficar tentando
            sessionStorage.setItem('modalJaMostrado', 'true');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// Função para resetar o modal (chamada no logout)
window.resetarModalParaLogout = function() {
    sessionStorage.removeItem('modalJaMostrado');
    console.log("🧹 Flag do modal removida - próximo login mostrará o modal");
};

function mostrarModalReunioesDoDia(reunioes) {
    // Remove modal antigo se existir
    const modalAntigo = document.getElementById('modalReunioesDoDia');
    if (modalAntigo) modalAntigo.remove();

    // Formata a data atual
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Capitaliza a primeira letra
    const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

    // Cria o modal
    const modal = document.createElement('div');
    modal.id = 'modalReunioesDoDia';
    modal.className = 'modal-notificacao';
    modal.innerHTML = `
        <div class="modal-notificacao-content">
            <div class="modal-notificacao-header">
                <h2>👋 Bom dia!</h2>
                <span class="modal-notificacao-data">${dataCapitalizada}</span>
                <button class="modal-notificacao-close" onclick="fecharModalReunioes()">&times;</button>
            </div>
            <div class="modal-notificacao-body">
                <p class="modal-notificacao-subtitulo">📅 Você tem <strong>${reunioes.length}</strong> reunião(ões) agendada(s) para hoje:</p>
                
                <div class="modal-notificacao-lista">
                    ${reunioes.map(r => {
        const hora = new Date(r.datahoraReuniao).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Formata os anfitriões
        let anfitrioesText = 'Não definido';
        if (r.anfitrioes && r.anfitrioes.length > 0) {
            anfitrioesText = r.anfitrioes
                .map(ra => ra.contato?.nomeParticipante)
                .filter(nome => nome)
                .join(', ');
        }

        return `
                            <div class="modal-notificacao-item" onclick="window.location.href='/reuniao/detalhes_reuniao?id=${r.id}'">
                                <div class="modal-notificacao-item-horario">${hora}</div>
                                <div class="modal-notificacao-item-info">
                                    <div class="modal-notificacao-item-titulo">${r.titulo || 'Sem título'}</div>
                                    <div class="modal-notificacao-item-detalhes">
                                        <span>📍 ${r.sala || 'Sala não definida'}</span>
                                        <span>👤 ${anfitrioesText}</span>
                                    </div>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
            <div class="modal-notificacao-footer">
                <button class="btn-notificacao" onclick="fecharModalReunioes()">OK, entendi</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto-fecha após 30 segundos
    setTimeout(fecharModalReunioes, 30000);
}

window.fecharModalReunioes = function() {
    const modal = document.getElementById('modalReunioesDoDia');
    if (modal) {
        modal.remove();
    }
};

// ===== MODIFICAÇÃO NO LOGOUT =====
// Adicione isso para capturar o clique no botão de logout
document.addEventListener('DOMContentLoaded', function() {
    // Procura pelo botão de logout
    const logoutBtn = document.querySelector('.logout-btn, a[href*="logout"]');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Remove a flag do modal
            sessionStorage.removeItem('modalJaMostrado');
            console.log("🚪 Logout detectado - flag do modal removida");
        });
    }

    // Chama a verificação inicial
    verificarReunioesDoDia();
});