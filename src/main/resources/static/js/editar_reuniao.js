// editar_reuniao.js - VERSÃO COMPLETA COM PROTEÇÃO CONTRA DUPLICATAS

let todosContatos = [];
let participantesAtuais = [];
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

    setTimeout(() => {
        if (msgDiv.parentNode) msgDiv.remove();
    }, 5000);
}

// ===== FUNÇÃO PARA REMOVER DUPLICATAS ANTES DE ENVIAR =====
function removerDuplicatasParticipantes() {
    console.log('🔍 Verificando duplicatas nos participantes (edição)...');

    const idsUnicos = new Set();
    const participantesUnicos = [];
    let duplicatasRemovidas = 0;

    participantesAtuais.forEach(p => {
        if (!idsUnicos.has(p.id)) {
            idsUnicos.add(p.id);
            participantesUnicos.push(p);
        } else {
            duplicatasRemovidas++;
            console.warn(`⚠️ Duplicata removida: ${p.nome} (ID: ${p.id})`);
        }
    });

    if (duplicatasRemovidas > 0) {
        participantesAtuais = participantesUnicos;
        atualizarListaParticipantes();
        mostrarMensagemRodape(`⚠️ ${duplicatasRemovidas} participante(s) duplicado(s) removido(s)`, 'atencao');
    }

    return duplicatasRemovidas;
}

function removerDuplicatasAnfitrioes() {
    console.log('🔍 Verificando duplicatas nos anfitriões (edição)...');

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

// ===== FUNÇÕES PARA MOSTRAR ERRO NO CAMPO DE ANFITRIÃO =====
function mostrarErroNoCampoAnfitriao(mensagem) {
    const erroAnterior = document.querySelector('.erro-campo.anfitriao-erro');
    if (erroAnterior) erroAnterior.remove();

    const campoAnfitriao = document.getElementById('novoAnfitriaoInput');
    campoAnfitriao.classList.remove('campo-com-erro');

    const erroDiv = document.createElement('div');
    erroDiv.className = 'erro-campo anfitriao-erro';
    erroDiv.innerHTML = `⚠️ ${mensagem}`;

    const container = document.querySelector('.anfitrioes-container');
    container.appendChild(erroDiv);

    campoAnfitriao.classList.add('campo-com-erro');

    setTimeout(() => {
        if (erroDiv.parentNode) {
            erroDiv.remove();
            campoAnfitriao.classList.remove('campo-com-erro');
        }
    }, 3000);
}

// ===== FUNÇÃO PARA MOSTRAR ERRO NO CAMPO DE PARTICIPANTE =====
function mostrarErroNoCampoParticipante(mensagem) {
    const erroAnterior = document.querySelector('.erro-campo.participante-erro');
    if (erroAnterior) erroAnterior.remove();

    const campoParticipante = document.getElementById('novoParticipanteInput');
    campoParticipante.classList.remove('campo-com-erro');

    const erroDiv = document.createElement('div');
    erroDiv.className = 'erro-campo participante-erro';
    erroDiv.innerHTML = `⚠️ ${mensagem}`;

    const container = document.querySelector('.participantes-container');
    container.appendChild(erroDiv);

    campoParticipante.classList.add('campo-com-erro');

    setTimeout(() => {
        if (erroDiv.parentNode) {
            erroDiv.remove();
            campoParticipante.classList.remove('campo-com-erro');
        }
    }, 3000);
}

// ===== CARREGAR CONTATOS =====
async function carregarContatos() {
    try {
        const response = await fetch('/contatos');
        todosContatos = await response.json();
        todosContatos.sort((a, b) => a.nomeParticipante.localeCompare(b.nomeParticipante));
        console.log('Contatos carregados:', todosContatos.length);
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
    }
}

// ===== VERIFICAÇÃO DE CONFLITO DE HORÁRIO =====
async function verificarConflitoHorario(dataHora, sala, reuniaoId = null) {
    try {
        const response = await fetch('/reunioes');
        const reunioes = await response.json();

        const dataHoraSelecionada = new Date(dataHora);
        const horaSelecionada = dataHoraSelecionada.getHours();

        const conflitos = reunioes.filter(r => {
            if (reuniaoId && r.id === reuniaoId) return false;
            const dataReuniao = new Date(r.datahoraReuniao);
            const mesmoDia = dataReuniao.toDateString() === dataHoraSelecionada.toDateString();
            const mesmaSala = r.sala === sala;
            const mesmoHorario = dataReuniao.getHours() === horaSelecionada;
            return mesmoDia && mesmaSala && mesmoHorario;
        });

        return conflitos;
    } catch (error) {
        console.error('Erro ao verificar conflitos:', error);
        return [];
    }
}

// ===== FUNÇÕES PARA ANFITRIÕES =====
function adicionarAnfitriao(id, nome) {
    if (anfitrioesSelecionados.some(a => a.id === id)) {
        mostrarErroNoCampoAnfitriao('Este anfitrião já foi adicionado!');
        return;
    }

    if (participantesAtuais.some(p => p.id === id)) {
        mostrarErroNoCampoAnfitriao(`"${nome}" já é um participante! Remova dos participantes primeiro.`);
        return;
    }

    anfitrioesSelecionados.push({ id, nome });
    atualizarListaAnfitrioes();
    document.getElementById('novoAnfitriaoInput').value = '';
    document.getElementById('listaNovoAnfitriao').classList.remove('visivel');
}

function removerAnfitriao(id) {
    anfitrioesSelecionados = anfitrioesSelecionados.filter(a => a.id !== id);
    atualizarListaAnfitrioes();

    const erroAnterior = document.querySelector('.erro-campo.anfitriao-erro');
    if (erroAnterior) erroAnterior.remove();

    const campoAnfitriao = document.getElementById('novoAnfitriaoInput');
    campoAnfitriao.classList.remove('campo-com-erro');
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

// ===== GERENCIAR PARTICIPANTES =====
function adicionarParticipante(id, nome) {
    console.log(`🔍 Tentando adicionar participante (edição): ${nome} (ID: ${id})`);

    if (participantesAtuais.some(p => p.id === id)) {
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

    participantesAtuais.push({ id, nome });
    atualizarListaParticipantes();
    document.getElementById('novoParticipanteInput').value = '';
    document.getElementById('listaNovoParticipante').classList.remove('visivel');

    console.log(`✅ Participante adicionado com sucesso: ${nome} (ID: ${id})`);
    console.log(`📊 Total de participantes agora: ${participantesAtuais.length}`);

    if (document.getElementById('listaNovoAnfitriao').classList.contains('visivel')) {
        atualizarListaFlutuante('listaNovoAnfitriao', 'novoAnfitriaoInput', '');
    }
}

function removerParticipante(id) {
    participantesAtuais = participantesAtuais.filter(p => p.id !== id);
    atualizarListaParticipantes();

    const erroAnterior = document.querySelector('.erro-campo.participante-erro');
    if (erroAnterior) erroAnterior.remove();

    const campoParticipante = document.getElementById('novoParticipanteInput');
    campoParticipante.classList.remove('campo-com-erro');
}

function atualizarListaParticipantes() {
    const container = document.getElementById('participantesAtuais');

    if (participantesAtuais.length === 0) {
        container.innerHTML = '<p class="participantes-placeholder">Nenhum participante</p>';
        return;
    }

    container.innerHTML = participantesAtuais.map(p => `
        <div class="participante-tag">
            <span>${p.nome}</span>
            <button type="button" class="participante-remover" onclick="removerParticipante(${p.id})">×</button>
        </div>
    `).join('');
}

// ===== CONFIGURAR CAMPOS COM LISTA =====
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
    const participantesIds = participantesAtuais.map(p => p.id);

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
            c.email.toLowerCase().includes(termoLower) ||
            (c.nomeEmpresa && c.nomeEmpresa.toLowerCase().includes(termoLower))
        );
    }

    if (filtrados.length === 0) {
        lista.innerHTML = '<div class="item-lista vazio">Nenhum contato disponível</div>';
        return;
    }

    lista.innerHTML = filtrados.map(c => `
        <div class="item-lista" 
             onclick="selecionarItem('${inputId}', ${c.id}, '${c.nomeParticipante.replace(/'/g, "\\'")}')">
            <div class="item-nome">${c.nomeParticipante}</div>
            <div class="item-email">${c.email}</div>
            ${c.nomeEmpresa ? `<div class="item-empresa">🏢 ${c.nomeEmpresa}</div>` : ''}
        </div>
    `).join('');
}

window.selecionarItem = function(inputId, id, nome) {
    if (inputId === 'novoAnfitriaoInput') {
        adicionarAnfitriao(id, nome);
    } else if (inputId === 'novoParticipanteInput') {
        adicionarParticipante(id, nome);
    }
};

// ===== CARREGAR DADOS DA REUNIÃO =====
async function carregarReuniao() {
    try {
        const reuniaoId = document.getElementById('reuniaoId').value;
        const response = await fetch(`/reunioes/${reuniaoId}`);
        const reuniao = await response.json();

        document.getElementById('titulo').value = reuniao.titulo || '';

        document.getElementById('empresaReuniao').value = reuniao.empresaReuniao || ''

        anfitrioesSelecionados = [];
        if (reuniao.anfitrioes && reuniao.anfitrioes.length > 0) {
            anfitrioesSelecionados = reuniao.anfitrioes.map(ra => ({
                id: ra.contato.id,
                nome: ra.contato.nomeParticipante
            }));
        } else if (reuniao.nomeAnfitriao) {
            const anfitriao = todosContatos.find(c => c.nomeParticipante === reuniao.nomeAnfitriao);
            if (anfitriao) {
                anfitrioesSelecionados.push({
                    id: anfitriao.id,
                    nome: anfitriao.nomeParticipante
                });
            }
        }
        atualizarListaAnfitrioes();

        if (reuniao.datahoraReuniao) {
            const data = new Date(reuniao.datahoraReuniao);
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const dia = String(data.getDate()).padStart(2, '0');
            const hora = String(data.getHours()).padStart(2, '0');
            const minuto = String(data.getMinutes()).padStart(2, '0');
            document.getElementById('horario').value = `${ano}-${mes}-${dia}T${hora}:${minuto}`;
        }

        document.getElementById('sala').value = reuniao.sala || '';
        document.getElementById('motivo').value = reuniao.motivo || '';
        document.getElementById('status').value = reuniao.status || 'AGENDADA';

        participantesAtuais = [];
        if (reuniao.participantes && reuniao.participantes.length > 0) {
            participantesAtuais = reuniao.participantes.map(p => ({
                id: p.contato.id,
                nome: p.contato.nomeParticipante
            }));
        }
        atualizarListaParticipantes();

    } catch (error) {
        console.error('Erro ao carregar:', error);
        showMessage('Erro ao carregar dados da reunião', 'error');
    }
}

// ===== SUBMIT DO FORMULÁRIO COM PROTEÇÃO CONTRA DUPLICATAS =====
document.getElementById('formEditarReuniao').addEventListener('submit', async (e) => {
    e.preventDefault();

    // ===== REMOVE DUPLICATAS ANTES DE ENVIAR =====
    removerDuplicatasParticipantes();
    removerDuplicatasAnfitrioes();

    const btnSubmit = document.querySelector('button[type="submit"]');
    if (btnSubmit.disabled) return;

    btnSubmit.disabled = true;
    const textoOriginal = btnSubmit.innerText;
    btnSubmit.innerText = 'Salvando...';

    const reuniaoId = document.getElementById('reuniaoId').value;
    const horario = document.getElementById('horario').value;
    const sala = document.getElementById('sala').value;

    if (!horario || !sala) {
        mostrarMensagemRodape('❌ Preencha todos os campos obrigatórios!', 'erro');
        btnSubmit.disabled = false;
        btnSubmit.innerText = textoOriginal;
        return;
    }

    if (anfitrioesSelecionados.length === 0) {
        mostrarMensagemRodape('❌ Adicione pelo menos um anfitrião!', 'erro');
        btnSubmit.disabled = false;
        btnSubmit.innerText = textoOriginal;
        return;
    }

    // VERIFICA CONFLITO DE HORÁRIO
    const conflitos = await verificarConflitoHorario(horario, sala, parseInt(reuniaoId));

    if (conflitos.length > 0) {
        const conflito = conflitos[0];
        const horaConflito = new Date(conflito.datahoraReuniao).getHours().toString().padStart(2,'0') + ':00';
        mostrarMensagemRodape(`❌ Já existe uma reunião nesta sala às ${horaConflito}!`, 'erro');
        btnSubmit.disabled = false;
        btnSubmit.innerText = textoOriginal;
        return;
    }

    // ===== CONSTRUIR OBJETO DA REUNIÃO =====
    const reuniao = {
        id: parseInt(reuniaoId),
        titulo: document.getElementById('titulo').value,
        empresaReuniao: document.getElementById('empresaReuniao').value || null,
        datahoraReuniao: horario,
        sala: sala,
        motivo: document.getElementById('motivo').value || null,
        status: document.getElementById('status').value,
        anfitrioes: anfitrioesSelecionados.map(a => ({
            contato: { id: a.id }
        })),
        participantes: participantesAtuais.map(p => ({
            contato: { id: p.id }
        }))
    };

    try {
        const response = await fetch(`/reunioes/${reuniaoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reuniao)
        });

        if (response.ok) {
            mostrarMensagemRodape('✅ Reunião atualizada com sucesso!', 'sucesso');
            setTimeout(() => {
                window.location.href = `/reuniao/detalhes_reuniao?id=${reuniaoId}`;
            }, 1500);
        } else {
            const error = await response.text();
            console.error('Erro:', error);
            mostrarMensagemRodape('❌ Erro ao salvar alterações', 'erro');
            btnSubmit.disabled = false;
            btnSubmit.innerText = textoOriginal;
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagemRodape('❌ Erro ao salvar', 'erro');
        btnSubmit.disabled = false;
        btnSubmit.innerText = textoOriginal;
    }
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Página de edição carregada');
    await carregarContatos();
    await carregarReuniao();

    configurarCampoLista('novoAnfitriaoInput', 'listaNovoAnfitriao');
    configurarCampoLista('novoParticipanteInput', 'listaNovoParticipante');
});