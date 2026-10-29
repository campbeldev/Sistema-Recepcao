function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function traduzirStatus(status) {
    const map = {
        'AGENDADA': '⏳ Agendada',
        'FINALIZADA': '✅ Finalizada',
        'CANCELADA': '❌ Cancelada'
    };
    return map[status] || status;
}

async function carregarReunioes() {
    try {
        const response = await fetch('/reunioes');
        const todasReunioes = await response.json();

        const statusFiltro = document.getElementById('statusFiltro').value;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        let reunioesFiltradas = [];

        if (statusFiltro === 'HOJE') {
            reunioesFiltradas = todasReunioes.filter(r => {
                const dataReuniao = new Date(r.datahoraReuniao);
                dataReuniao.setHours(0, 0, 0, 0);
                return dataReuniao.getTime() === hoje.getTime();
            });
        } else if (statusFiltro === 'SEMANA') {
            const fimSemana = new Date(hoje);
            fimSemana.setDate(hoje.getDate() + 7);
            reunioesFiltradas = todasReunioes.filter(r => {
                const dataReuniao = new Date(r.datahoraReuniao);
                return dataReuniao >= hoje && dataReuniao <= fimSemana;
            });
        } else {
            reunioesFiltradas = todasReunioes.filter(r => r.status === statusFiltro);
        }

        reunioesFiltradas.sort((a, b) => new Date(a.datahoraReuniao) - new Date(b.datahoraReuniao));

        const lista = document.getElementById('reunioesList');

        if (reunioesFiltradas.length === 0) {
            lista.innerHTML = '<div class="empty-message">Nenhuma reunião encontrada</div>';
            return;
        }

        lista.innerHTML = reunioesFiltradas.map(r => {
            let participantes = '';
            if (r.participantes?.length > 0) {
                const nomes = r.participantes.map(p => p.contato.nomeParticipante);
                participantes = `<p><strong>Participantes:</strong> ${nomes.join(', ')}</p>`;
            } else if (r.contato) {
                participantes = `<p><strong>Participante:</strong> ${r.contato.nomeParticipante}</p>`;
            }

            return `
                <div class="reuniao-card status-${r.status || 'AGENDADA'}" 
                     onclick="window.location.href='/reuniao/detalhes_reuniao?id=${r.id}'"
                     style="cursor: pointer;">
                    <div class="reuniao-header">
                        <span class="reuniao-titulo">${r.titulo || 'Sem título'}</span>
                        <span class="reuniao-status status-${r.status || 'AGENDADA'}">
                            ${traduzirStatus(r.status)}
                        </span>
                    </div>
                    <div class="reuniao-info">
                        <p><strong>Data:</strong> ${formatarData(r.datahoraReuniao)}</p>
                        <p><strong>Sala:</strong> ${r.sala || 'Não definida'}</p>
                        ${r.motivo ? `<p><strong>Motivo:</strong> ${r.motivo}</p>` : ''}
                        <p><strong>Anfitrião:</strong> ${r.nomeAnfitriao || 'Não definido'}</p>
                        ${participantes}
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro:', error);
    }
}

document.addEventListener('DOMContentLoaded', carregarReunioes);