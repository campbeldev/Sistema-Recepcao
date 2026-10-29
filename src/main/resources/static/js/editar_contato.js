// Função para mostrar mensagens
function showMessage(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.card'));
    setTimeout(() => alertDiv.remove(), 5000);
}

// Máscara de telefone
function mascaraTelefone(input) {
    if (!input) return;

    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 11) {
            value = value.slice(0, 11);
        }

        if (value.length <= 2) {
            value = value.replace(/^(\d{0,2})/, '($1');
        } else if (value.length <= 6) {
            value = value.replace(/^(\d{2})(\d{0,4})/, '($1) $2');
        } else if (value.length <= 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        } else {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }

        e.target.value = value;
    });
}

// Carregar dados do contato para edição
async function carregarContato(id) {
    try {
        const response = await fetch(`/contatos/${id}`);
        if (!response.ok) {
            throw new Error('Contato não encontrado');
        }

        const contato = await response.json();

        // Preenche o formulário
        document.getElementById('nomeParticipante').value = contato.nomeParticipante || '';
        document.getElementById('nomeEmpresa').value = contato.nomeEmpresa || '';
        document.getElementById('email').value = contato.email || '';
        document.getElementById('telefone').value = contato.telefone || '';
        document.getElementById('whatsapp').value = contato.whatsapp || '';
        document.getElementById('telefoneEmpresarial').value = contato.telefoneEmpresarial || '';


    } catch (error) {
        console.error('Erro ao carregar contato:', error);
        showMessage('Erro ao carregar dados do contato', 'error');
    }
}

// Salvar alterações
document.getElementById('formEditarContato').addEventListener('submit', async (e) => {
    e.preventDefault();

    const contatoId = document.getElementById('contatoId').value;

    const contato = {
        id: parseInt(contatoId),
        nomeParticipante: document.getElementById('nomeParticipante').value,
        nomeEmpresa: document.getElementById('nomeEmpresa').value || null,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value || null,
        whatsapp: document.getElementById('whatsapp').value || null,
        telefoneEmpresarial: document.getElementById('telefoneEmpresarial').value || null
    };

    try {
        const response = await fetch(`/contatos/${contatoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contato)
        });

        if (response.ok) {
            showMessage('Contato atualizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = '/agenda';
            }, 1500);
        } else {
            showMessage('Erro ao atualizar contato', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro ao salvar alterações', 'error');
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Aplicar máscaras nos telefones
    mascaraTelefone(document.getElementById('telefone'));
    mascaraTelefone(document.getElementById('whatsapp'));
    mascaraTelefone(document.getElementById('telefoneEmpresarial'));

    // Carregar dados do contato se for edição
    const contatoId = document.getElementById('contatoId').value;
    if (contatoId) {
        carregarContato(contatoId);
    }
});