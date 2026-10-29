// reuniao.js - VERSÃO CORRIGIDA COM LOGS PARA DEPURAR EMPRESA

let todosContatos = [];
let participantesSelecionados = [];
let anfitrioesSelecionados = [];

// ===== FUNÇÕES AUXILIARES =====
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

function mostrarMensagemRodape(mensagem, tipo = 'erro') {
    const mensagemAnterior = document.querySelector('.rodape-mensagem');
    if (mensagemAnterior) mensagemAnterior.remove();

    const botaoSubmit = document.querySelector('button[type="submit"]');
    if (!botaoSubmit) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `rodape-mensagem ${tipo}`;
    msgDiv.textContent = mensagem;

    botaoSubmit.parentNode.insertBefore(msgDiv, botaoSubmit);
    msgDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => { if (msgDiv.parentNode) msgDiv.remove(); }, 5000);
}

// ===== VALIDAÇÃO DO CAMPO DATETIME-LOCAL =====
function validarAno(input) {
    const valor = input.value;
    const erroData = document.getElementById('erroData');
    if (!erroData) return;

    if (valor) {
        const ano = parseInt(valor.split('-')[0]);
        if (ano < 2024 || ano > 2030) {
            erroData.style.display = 'block';
            input.setCustomValidity('Ano deve estar entre 2024 e 2030');
        } else {
            erroData.style.display = 'none';
            input.setCustomValidity('');
        }
    } else {
        erroData.style.display = 'none';
        input.setCustomValidity('');
    }
}

// Configurar validação quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    const horarioInput = document.getElementById('horario');
    if (horarioInput) {
        horarioInput.addEventListener('change', validarAno.bind(null, horarioInput));
        horarioInput.addEventListener('input', validarAno.bind(null, horarioInput));
    }
});

function limitarAno(event, input) {
    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab' || event.key === 'Arrow' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        return true;
    }

    const valorAtual = input.value;
    if (valorAtual.length >= 10) {
        event.preventDefault();
        return false;
    }
    return true;
}

// ===== FUNÇÃO PARA MOSTRAR ERRO NO CAMPO DE PARTICIPANTE =====
function mostrarErroNoCampoParticipante(mensagem) {
    const erroAnterior = document.querySelector('.erro-campo.participante-erro');
    if (erroAnterior) erroAnterior.remove();

    const campoParticipante = document.getElementById('novoParticipanteInput');
    if (!campoParticipante) return;

    campoParticipante.classList.remove('campo-com-erro');

    const erroDiv = document.createElement('div');
    erroDiv.className = 'erro-campo participante-erro';
    erroDiv.innerHTML = `⚠️ ${mensagem}`;

    const container = document.querySelector('.participantes-container');
    if (container) {
        container.appendChild(erroDiv);
    }

    campoParticipante.classList.add('campo-com-erro');

    setTimeout(() => {
        if (erroDiv.parentNode) {
            erroDiv.remove();
            campoParticipante.classList.remove('campo-com-erro');
        }
    }, 3000);
}

// ===== FUNÇÃO PARA REMOVER DUPLICATAS =====
function removerDuplicatasParticipantes() {
    console.log('🔍 Verificando duplicatas nos participantes...');

    const idsUnicos = new Set();
    const participantesUnicos = [];
    let duplicatasRemovidas = 0;

    participantesSelecionados.forEach(p => {
        if (!idsUnicos.has(p.id)) {
            idsUnicos.add(p.id);
            participantesUnicos.push(p);
        } else {
            duplicatasRemovidas++;
            console.warn(`⚠️ Duplicata removida: ${p.nome} (ID: ${p.id})`);
        }
    });

    if (duplicatasRemovidas > 0) {
        participantesSelecionados = participantesUnicos;
        atualizarListaParticipantes();
        mostrarMensagemRodape(`⚠️ ${duplicatasRemovidas} participante(s) duplicado(s) removido(s)`, 'atencao');
    }

    return duplicatasRemovidas;
}

function removerDuplicatasAnfitrioes() {
    console.log('🔍 Verificando duplicatas nos anfitriões...');

    const idsUnicos = new Set();
    const anfitrioesUnicos = [];
    let duplicatasRemovidas = 0;

    anfitrioesSelecionados.forEach(a => {
        if (!idsUnicos.has(a.id)) {
            idsUnicos.add(a.id);
            anfitrioesUnicos.push(a);
        } else {
            duplicatasRemovidas++;
            console.warn(`⚠️ Duplicata removida: ${a.nome} (ID: ${a.id})`);
        }
    });

    if (duplicatasRemovidas > 0) {
        anfitrioesSelecionados = anfitrioesUnicos;
        atualizarListaAnfitrioes();
        mostrarMensagemRodape(`⚠️ ${duplicatasRemovidas} anfitrião(ões) duplicado(s) removido(s)`, 'atencao');
    }

    return duplicatasRemovidas;
}

// ===== LÓGICA DE SELEÇÃO E BUSCA =====
async function carregarContatos() {
    try {
        const response = await fetch('/contatos');
        todosContatos = await response.json();
        todosContatos.sort((a, b) => a.nomeParticipante.localeCompare(b.nomeParticipante));
        configurarCampos();
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
    }
}

function configurarCampos() {
    configurarCampoLista('novoAnfitriaoInput', 'listaNovoAnfitriao');
    configurarCampoLista('novoParticipanteInput', 'listaNovoParticipante');
}

function configurarCampoLista(inputId, listaId) {
    const input = document.getElementById(inputId);
    const lista = document.getElementById(listaId);
    if (!input || !lista) return;

    input.addEventListener('focus', () => {
        atualizarListaFlutuante(listaId, inputId, input.value);
        lista.classList.add('visivel');
    });

    input.addEventListener('input', (e) => {
        atualizarListaFlutuante(listaId, inputId, e.target.value);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !lista.contains(e.target)) {
            lista.classList.remove('visivel');
        }
    });
}

function atualizarListaFlutuante(listaId, inputId, termo) {
    const lista = document.getElementById(listaId);
    const termoLower = termo.toLowerCase().trim();

    const anfitrioesIds = anfitrioesSelecionados.map(a => a.id);
    const participantesIds = participantesSelecionados.map(p => p.id);

    let filtrados = todosContatos.filter(c => {
        if (inputId === 'novoAnfitriaoInput') {
            return !anfitrioesIds.includes(c.id);
        } else {
            return !participantesIds.includes(c.id) && !anfitrioesIds.includes(c.id);
        }
    });

    if (termoLower !== '') {
        filtrados = filtrados.filter(c =>
            c.nomeParticipante.toLowerCase().includes(termoLower) ||
            c.email.toLowerCase().includes(termoLower)
        );
    }

    lista.innerHTML = filtrados.length === 0 ?
        '<div class="item-lista vazio">Nenhum contato disponível</div>' :
        filtrados.map(c => `
            <div class="item-lista" onclick="selecionarItem('${inputId}', ${c.id}, '${c.nomeParticipante.replace(/'/g, "\\'")}')">
                <div class="item-nome">${c.nomeParticipante}</div>
                <div class="item-email">${c.email}</div>
            </div>
        `).join('');
}

window.selecionarItem = function(inputId, id, nome) {
    if (inputId === 'novoAnfitriaoInput') {
        adicionarAnfitriao(id, nome);
    } else {
        adicionarParticipante(id, nome);
    }
    document.getElementById(inputId).value = '';
    document.getElementById(inputId === 'novoAnfitriaoInput' ? 'listaNovoAnfitriao' : 'listaNovoParticipante').classList.remove('visivel');
};

// ===== FUNÇÕES PARA ANFITRIÕES =====
function adicionarAnfitriao(id, nome) {
    if (anfitrioesSelecionados.some(a => a.id === id)) {
        showMessage('❌ Este anfitrião já foi adicionado!', 'error');
        return;
    }

    anfitrioesSelecionados.push({ id, nome });
    atualizarListaAnfitrioes();
}

function removerAnfitriao(id) {
    anfitrioesSelecionados = anfitrioesSelecionados.filter(a => a.id !== id);
    atualizarListaAnfitrioes();
}

function atualizarListaAnfitrioes() {
    const container = document.getElementById('listaAnfitrioesSelecionados');

    if (anfitrioesSelecionados.length === 0) {
        container.innerHTML = '<div class="anfitrioes-placeholder">Nenhum anfitrião adicionado</div>';
        return;
    }

    container.innerHTML = anfitrioesSelecionados.map(a => `
        <div class="anfitriao-tag">
            <span>${a.nome}</span>
            <button type="button" class="anfitriao-remover" onclick="removerAnfitriao(${a.id})">×</button>
        </div>
    `).join('');
}

// ===== FUNÇÕES PARA PARTICIPANTES =====
function adicionarParticipante(id, nome) {
    console.log(`🔍 Tentando adicionar participante: ${nome} (ID: ${id})`);

    if (participantesSelecionados.some(p => p.id === id)) {
        console.warn(`❌ Participante já existe: ${nome}`);
        mostrarErroNoCampoParticipante(`"${nome}" já está na lista de participantes!`);
        const campoParticipante = document.getElementById('novoParticipanteInput');
        campoParticipante.classList.add('erro-piscar');
        setTimeout(() => {
            campoParticipante.classList.remove('erro-piscar');
        }, 1000);
        return;
    }

    if (anfitrioesSelecionados.some(a => a.id === id)) {
        console.warn(`❌ Pessoa já é anfitrião: ${nome}`);
        mostrarErroNoCampoParticipante(`"${nome}" já é um anfitrião! Remova dos anfitriões primeiro.`);
        const campoParticipante = document.getElementById('novoParticipanteInput');
        campoParticipante.classList.add('erro-piscar');
        setTimeout(() => {
            campoParticipante.classList.remove('erro-piscar');
        }, 1000);
        return;
    }

    participantesSelecionados.push({ id, nome });
    atualizarListaParticipantes();
    console.log(`✅ Participante adicionado com sucesso: ${nome} (ID: ${id})`);
    console.log(`📊 Total de participantes agora: ${participantesSelecionados.length}`);
}

function removerParticipante(id) {
    participantesSelecionados = participantesSelecionados.filter(p => p.id !== id);
    atualizarListaParticipantes();

    const erroAnterior = document.querySelector('.erro-campo.participante-erro');
    if (erroAnterior) erroAnterior.remove();

    const campoParticipante = document.getElementById('novoParticipanteInput');
    if (campoParticipante) {
        campoParticipante.classList.remove('campo-com-erro');
    }
}

function atualizarListaParticipantes() {
    const container = document.getElementById('listaParticipantesSelecionados');

    if (participantesSelecionados.length === 0) {
        container.innerHTML = '<div class="participantes-placeholder">Nenhum participante adicionado</div>';
        return;
    }

    container.innerHTML = participantesSelecionados.map(p => `
        <div class="participante-tag">
            <span>${p.nome}</span>
            <button type="button" onclick="removerParticipante(${p.id})">×</button>
        </div>
    `).join('');
}

// ===== SUBMIT COM PROTEÇÃO CONTRA DUPLICATAS =====
document.getElementById('formReuniao').addEventListener('submit', async (e) => {
    e.preventDefault();

    // ===== REMOVE DUPLICATAS ANTES DE ENVIAR =====
    removerDuplicatasParticipantes();
    removerDuplicatasAnfitrioes();

    // ===== VALIDAÇÕES =====
    if (anfitrioesSelecionados.length === 0) {
        mostrarMensagemRodape('❌ Adicione pelo menos um anfitrião!', 'erro');
        return;
    }

    if (participantesSelecionados.length === 0) {
        mostrarMensagemRodape('❌ Adicione pelo menos um participante!', 'erro');
        return;
    }

    const dataInput = document.getElementById('horario').value;
    if (!dataInput) {
        mostrarMensagemRodape('❌ Selecione uma data e hora!', 'erro');
        return;
    }

    const ano = parseInt(dataInput.split('-')[0]);
    if (ano < 2024 || ano > 2030) {
        mostrarMensagemRodape('❌ Ano deve estar entre 2024 e 2030!', 'erro');
        return;
    }

    const botaoSubmit = e.target.querySelector('button[type="submit"]');
    botaoSubmit.disabled = true;
    botaoSubmit.textContent = 'Agendando...';

    // ===== LOG DO CAMPO EMPRESA (DEBUG) =====
    const empresaInput = document.getElementById('empresaReuniao');
    console.log('🔍 Valor do campo empresa:', empresaInput ? empresaInput.value : 'ELEMENTO NÃO ENCONTRADO!');

    const reuniao = {
        titulo: document.getElementById('titulo').value,
        empresaReuniao: document.getElementById('empresaReuniao').value || null,
        datahoraReuniao: document.getElementById('horario').value,
        sala: document.getElementById('sala').value,
        motivo: document.getElementById('motivo').value || null,
        status: 'AGENDADA',
        anfitrioes: anfitrioesSelecionados.map(a => ({
            contato: { id: a.id }
        })),
        participantes: participantesSelecionados.map(p => ({
            contato: { id: p.id }
        }))
    };

    // ===== LOG DO JSON ENVIADO (DEBUG) =====
    console.log('📦 JSON ENVIADO:', JSON.stringify(reuniao, null, 2));

    try {
        const response = await fetch('/reunioes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reuniao)
        });

        if (response.ok) {
            mostrarMensagemRodape('✅ Reunião agendada com sucesso!', 'sucesso');
            setTimeout(() => window.location.href = '/', 1500);
        } else {
            const erro = await response.text();
            mostrarMensagemRodape(`❌ Erro: ${erro}`, 'erro');
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = 'Agendar Reunião';
        }
    } catch (error) {
        mostrarMensagemRodape('❌ Erro de conexão com o servidor.', 'erro');
        botaoSubmit.disabled = false;
        botaoSubmit.textContent = 'Agendar Reunião';
    }
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', carregarContatos);