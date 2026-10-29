// calendario.js - VERSÃO CORRIGIDA (ACEITA HORÁRIOS QUEBRADOS)

function formatarDataCurta(dataString) {
    const [ano, mes, dia] = dataString.split('T')[0].split('-');
    return `${dia}/${mes}`;
}

function getDiaSemana(dataString) {
    const [ano, mes, dia] = dataString.split('T')[0].split('-');
    const data = new Date(ano, mes-1, dia);
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[data.getDay()];
}

function getStatusClass(status) {
    switch(status) {
        case 'FINALIZADA': return 'status-finalizada';
        case 'CANCELADA': return 'status-cancelada';
        default: return 'status-agendada';
    }
}

function traduzirStatus(status) {
    const map = {
        'AGENDADA': 'Agendada',
        'FINALIZADA': 'Finalizada',
        'CANCELADA': 'Cancelada'
    };
    return map[status] || status;
}

// ===== FUNÇÃO AUXILIAR PARA ARREDONDAR MINUTO PARA O SLOT MAIS PRÓXIMO =====
function arredondarMinutoParaSlot(minuto) {
    if (minuto === 0) return 0;
    if (minuto <= 30) return 30;
    return 0; // Se for > 30, vai para a próxima hora (00)
}

// ===== FUNÇÃO PARA FORMATAR ANFITRIÕES SEM DUPLICATAS =====
function formatarAnfitrioes(reuniao) {
    if (reuniao.anfitrioes && reuniao.anfitrioes.length > 0) {
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

// ===== GERAR HORÁRIOS DE 30 EM 30 MINUTOS =====
function gerarHorarios() {
    const horarios = [];
    // Manhã: 8:00 às 12:00 (de 30 em 30)
    for (let hora = 8; hora <= 11; hora++) {
        horarios.push(`${hora}:00`);
        horarios.push(`${hora}:30`);
    }
    horarios.push(`12:00`); // 12:00

    // Tarde: 13:00 às 18:00 (de 30 em 30)
    for (let hora = 13; hora <= 17; hora++) {
        horarios.push(`${hora}:00`);
        horarios.push(`${hora}:30`);
    }
    horarios.push(`18:00`); // 18:00

    return horarios;
}

// ===== CONVERTER HORA:MINUTO PARA ÍNDICE =====
function horaParaIndice(hora, minuto) {
    if (hora < 8 || hora > 18) return -1;
    if (hora === 12) return 8; // 12:00 é o índice 8 (depois de 11:30)

    let indice = 0;
    // Manhã
    for (let h = 8; h < hora; h++) {
        indice += 2; // cada hora tem 2 slots (00 e 30)
    }
    // Adicionar o minuto
    indice += minuto === 30 ? 1 : 0;

    // Ajustar para tarde (depois das 12:00)
    if (hora > 12) {
        indice += 1; // +1 por causa do 12:00
    }

    return indice;
}

async function carregarCalendario() {
    try {
        const response = await fetch('/reunioes');
        const todasReunioes = await response.json();

        const tipo = document.getElementById('tipoCalendario').value;
        const container = document.getElementById('calendarioContainer');

        if (tipo === 'dia') {
            container.innerHTML = gerarVisaoDia(todasReunioes);
        } else {
            container.innerHTML = gerarVisaoSemana(todasReunioes);
        }

    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('calendarioContainer').innerHTML =
            '<div class="empty-message">Erro ao carregar calendário</div>';
    }
}

function gerarVisaoSemana(reunioes) {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1);

    const dias = [];
    for (let i = 0; i < 5; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        dias.push({
            data: dia,
            nome: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][i],
            dataStr: `${dia.getDate().toString().padStart(2,'0')}/${(dia.getMonth()+1).toString().padStart(2,'0')}`
        });
    }

    const horarios = gerarHorarios();

    // Organizar reuniões por dia
    const reunioesPorDia = {};
    reunioes.forEach(r => {
        const dataStr = r.datahoraReuniao.split('T')[0];
        const [ano, mes, dia] = dataStr.split('-');
        const dataObj = new Date(ano, mes-1, dia);

        const diaIdx = dias.findIndex(d =>
            d.data.getDate() === dataObj.getDate() &&
            d.data.getMonth() === dataObj.getMonth() &&
            d.data.getFullYear() === dataObj.getFullYear()
        );

        if (diaIdx !== -1) {
            if (!reunioesPorDia[diaIdx]) reunioesPorDia[diaIdx] = [];
            reunioesPorDia[diaIdx].push(r);
        }
    });

    return `
        <div class="visao-semana">
            <h2 class="visao-titulo">Reuniões da Semana</h2>
            <div class="calendario-tabela">
                <!-- Linha de cabeçalho -->
                <div class="calendario-linha">
                    <div class="calendario-celula cabecalho-hora">HORA</div>
                    ${dias.map(d => `
                        <div class="calendario-celula cabecalho-dia">
                            ${d.nome}<br>
                            <small>${d.dataStr}</small>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Linhas de horário (30 em 30 minutos) -->
                ${horarios.map((horario, idx) => {
        const [hora, minutoSlot] = horario.split(':').map(Number);

        return `
                        <div class="calendario-linha">
                            <div class="calendario-celula horario">${horario}</div>
                            ${dias.map((_, diaIdx) => {
            const reunioesDia = reunioesPorDia[diaIdx] || [];

            // CORREÇÃO: Filtrar reuniões que se encaixam neste slot (arredondando)
            const reunioesNesteHorario = reunioesDia.filter(r => {
                const data = new Date(r.datahoraReuniao);
                const rHora = data.getHours();
                const rMinuto = data.getMinutes();

                // Arredonda o minuto da reunião para o slot mais próximo
                const rMinutoArredondado = arredondarMinutoParaSlot(rMinuto);

                // Se o minuto arredondado for 0, a reunião vai para a próxima hora
                let slotHora = rHora;
                let slotMinuto = rMinutoArredondado;

                if (rMinutoArredondado === 0 && rMinuto > 30) {
                    slotHora = rHora + 1;
                    slotMinuto = 0;
                }

                // Se a reunião estourar o horário limite, ignorar
                if (slotHora > 18) return false;
                if (slotHora === 18 && slotMinuto > 0) return false;

                // Compara com o slot atual
                return slotHora === hora && slotMinuto === minutoSlot;
            });

            return `
                                    <div class="calendario-celula conteudo">
                                        ${reunioesNesteHorario.map(r => {
                const data = new Date(r.datahoraReuniao);
                const horaOriginal = data.getHours();
                const minutoOriginal = data.getMinutes();
                const horaMinutoOriginal = `${horaOriginal.toString().padStart(2,'0')}:${minutoOriginal.toString().padStart(2,'0')}`;

                const anfitrioesText = formatarAnfitrioes(r);

                return `
                                                <div class="reuniao-card ${getStatusClass(r.status)}"
                                                     onclick="window.location.href='/reuniao/detalhes_reuniao?id=${r.id}'">
                                                    <strong>${r.titulo || 'Reunião'}</strong>
                                                    <small>${r.sala || 'Sem sala'} - ${horaMinutoOriginal}</small>
                                                    <small class="status-text">${traduzirStatus(r.status)}</small>
                                                </div>
                                            `;
            }).join('')}
                                    </div>
                                `;
        }).join('')}
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

function gerarVisaoDia(reunioes) {
    const hoje = new Date();
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaNome = diasSemana[hoje.getDay()];
    const diaMes = `${hoje.getDate().toString().padStart(2,'0')}/${(hoje.getMonth()+1).toString().padStart(2,'0')}/${hoje.getFullYear()}`;

    // Filtrar reuniões de hoje
    const reunioesHoje = reunioes.filter(r => {
        const [ano, mes, dia] = r.datahoraReuniao.split('T')[0].split('-');
        return parseInt(dia) === hoje.getDate() &&
            parseInt(mes) === hoje.getMonth() + 1 &&
            parseInt(ano) === hoje.getFullYear();
    });

    const horarios = gerarHorarios();

    return `
        <div class="visao-dia">
            <h2 class="visao-titulo">${diaNome}, ${diaMes}</h2>
            <div class="calendario-tabela">
                <!-- Linha de cabeçalho -->
                <div class="calendario-linha">
                    <div class="calendario-celula cabecalho-hora">HORA</div>
                    <div class="calendario-celula cabecalho-dia">REUNIÕES</div>
                </div>
                
                <!-- Linhas de horário (30 em 30 minutos) -->
                ${horarios.map(horario => {
        const [hora, minutoSlot] = horario.split(':').map(Number);

        // CORREÇÃO: Filtrar reuniões que se encaixam neste slot (arredondando)
        const reunioesNesteHorario = reunioesHoje.filter(r => {
            const data = new Date(r.datahoraReuniao);
            const rHora = data.getHours();
            const rMinuto = data.getMinutes();

            // Arredonda o minuto da reunião para o slot mais próximo
            const rMinutoArredondado = arredondarMinutoParaSlot(rMinuto);

            // Se o minuto arredondado for 0, a reunião vai para a próxima hora
            let slotHora = rHora;
            let slotMinuto = rMinutoArredondado;

            if (rMinutoArredondado === 0 && rMinuto > 30) {
                slotHora = rHora + 1;
                slotMinuto = 0;
            }

            // Se a reunião estourar o horário limite, ignorar
            if (slotHora > 18) return false;
            if (slotHora === 18 && slotMinuto > 0) return false;

            // Compara com o slot atual
            return slotHora === hora && slotMinuto === minutoSlot;
        });

        return `
                        <div class="calendario-linha">
                            <div class="calendario-celula horario">${horario}</div>
                            <div class="calendario-celula conteudo">
                                ${reunioesNesteHorario.map(r => {
            const data = new Date(r.datahoraReuniao);
            const horaOriginal = data.getHours();
            const minutoOriginal = data.getMinutes();
            const horaMinutoOriginal = `${horaOriginal.toString().padStart(2,'0')}:${minutoOriginal.toString().padStart(2,'0')}`;

            const anfitrioesText = formatarAnfitrioes(r);

            return `
                                        <div class="reuniao-card ${getStatusClass(r.status)}"
                                             onclick="window.location.href='/reuniao/detalhes_reuniao?id=${r.id}'">
                                            <strong>${r.titulo || 'Reunião'}</strong>
                                            <small>${r.sala || 'Sem sala'} - ${horaMinutoOriginal}</small>
                                            <small class="status-text">${traduzirStatus(r.status)}</small>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', carregarCalendario);