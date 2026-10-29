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

// Salvar contato
document.getElementById('formContato')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nomeParticipante = document.getElementById('nomeParticipante')?.value;
    const nomeEmpresa = document.getElementById('nomeEmpresa')?.value;
    const email = document.getElementById('email')?.value;
    const telefone = document.getElementById('telefone')?.value;
    const whatsapp = document.getElementById('whatsapp')?.value;          // ← NOVO!
    const telefoneEmpresarial = document.getElementById('telefoneEmpresarial')?.value;

    if (!nomeParticipante) {
        showMessage('Nome do participante é obrigatório!', 'error');
        return;
    }

    const contato = {
        nomeParticipante: nomeParticipante,
        nomeEmpresa: nomeEmpresa || null,
        email: email,
        telefone: telefone || null,
        whatsapp: whatsapp || null,                                       // ← NOVO!
        telefoneEmpresarial: telefoneEmpresarial || null
    };

    try {
        const response = await fetch('/contatos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contato)
        });

        if (response.ok) {
            showMessage('Contato salvo com sucesso!', 'success');
            document.getElementById('formContato').reset();

            setTimeout(() => {
                if (confirm('Contato salvo! Deseja ir para a agenda?')) {
                    window.location.href = '/agenda';
                }
            }, 1500);
        } else {
            showMessage('Erro ao salvar contato', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro ao salvar contato', 'error');
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    mascaraTelefone(document.getElementById('telefone'));
    mascaraTelefone(document.getElementById('whatsapp'));
    mascaraTelefone(document.getElementById('telefoneEmpresarial'));
});