
async function carregarContatos() {
    try {
        const response = await fetch('/contatos');
        const contatos = await response.json();

        const lista = document.getElementById('agendaLista');
        const totalSpan = document.getElementById('totalContatos');

        totalSpan.textContent = contatos.length;

        if (contatos.length === 0) {
            lista.innerHTML = '<div class="empty-message">Nenhum contato cadastrado</div>';
            return;
        }

        contatos.sort((a, b) => a.nomeParticipante.localeCompare(b.nomeParticipante));

        lista.innerHTML = contatos.map(contato => `
            <div class="contato-card">
                <div class="contato-header">
                    <span class="contato-nome">${contato.nomeParticipante}</span>
                    ${contato.nomeEmpresa ? `<span class="contato-empresa">${contato.nomeEmpresa}</span>` : ''}
                </div>
                <div class="contato-info">
                    <p><strong>Email:</strong> ${contato.email}</p>
                    ${contato.telefone ? `<p><strong>Tel:</strong> ${contato.telefone}</p>` : ''}
                    ${contato.telefoneEmpresarial ? `<p><strong>Tel Emp:</strong> ${contato.telefoneEmpresarial}</p>` : ''}
                </div>
                <div class="contato-acoes">
                    <a href="/paginas/editar_contato?id=${contato.id}" class="btn-pequeno">✏️</a>
                    <a href="/paginas/reuniao?contatoId=${contato.id}" class="btn-pequeno">📅</a>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro:', error);
    }
}

document.addEventListener('DOMContentLoaded', carregarContatos);