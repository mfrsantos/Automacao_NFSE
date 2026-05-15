// ui.js - Funções de interface
import { fmtMoeda, mostrarErro, mostrarSucesso, parseCSV, parseMoeda, validarValor, validarData } from './utils.js';
import { salvarItem, atualizarItem, removerItem, obterItem } from './data.js';
import { listaMeses, emails } from './config.js';
import { login, logout } from './auth.js';

let dadosCarregados = {};

const getMesAtualSistema = () => {
    const now = new Date();
    return listaMeses[now.getMonth()];
};

const setFiltroMesAtual = () => {
    const filtro = document.getElementById('mesFiltro');
    if (!filtro) return;
    const mesAtual = getMesAtualSistema();
    if (listaMeses.includes(mesAtual)) {
        filtro.value = mesAtual;
    }
};

export const initUI = () => {
    setFiltroMesAtual();

    // Event listeners
    document.getElementById('btnLogin').addEventListener('click', handleLogin);
    document.getElementById('btnLogout').addEventListener('click', handleLogout);
    document.getElementById('btnSalvarManual').addEventListener('click', handleSalvarManual);
    document.getElementById('csvInput').addEventListener('change', handleCSVImport);
    document.getElementById('btnCleanup').addEventListener('click', handleCleanupImport);
    document.getElementById('mesFiltro').addEventListener('change', renderizarDados);
    document.getElementById('filtroLocal').addEventListener('change', renderizarDados);
    document.getElementById('inputBusca').addEventListener('input', renderizarDados);
};

export const onLogin = () => {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appContent').style.display = 'block';
    showLoading();
    renderizarDados();
    hideLoading();
};

export const onLogout = () => {
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('appContent').style.display = 'none';
};

const handleLogin = async () => {
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginPass').value;
    try {
        await login(email, senha);
    } catch (error) {
        mostrarErro(error.message);
    }
};

const handleLogout = async () => {
    try {
        await logout();
    } catch (error) {
        mostrarErro('Erro ao fazer logout');
    }
};

const handleSalvarManual = async () => {
    const item = {
        tipo: document.getElementById('mTipo').value,
        local: document.getElementById('mLocal').value,
        pedido: document.getElementById('mPedido').value,
        codFor: document.getElementById('mCodFor').value,
        fornecedor: document.getElementById('mFornecedor').value.toUpperCase(),
        cc: document.getElementById('mCC').value,
        valor: parseMoeda(document.getElementById('mValor').value),
        vencimento: document.getElementById('mVenc').value,
        pagamento: document.getElementById('mPagamento').value,
        status: "Pendente",
        mes: document.getElementById('mesFiltro').value
    };

    // Validação básica
    if (!item.fornecedor) {
        mostrarErro('Fornecedor é obrigatório');
        return;
    }
    if (!validarValor(item.valor)) {
        mostrarErro('Valor inválido');
        return;
    }
    if (item.vencimento && !validarData(item.vencimento)) {
        mostrarErro('Data de vencimento inválida (formato DD/MM/AAAA)');
        return;
    }

    try {
        await salvarItem(item);
        mostrarSucesso('Item salvo com sucesso');
        // Limpar campos
        ["mPedido", "mCodFor", "mFornecedor", "mCC", "mValor", "mVenc"].forEach(id => document.getElementById(id).value = "");
    } catch (error) {
        mostrarErro(error.message);
    }
};

const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const csvText = e.target.result;
        const dados = parseCSV(csvText);
        const mesAtual = document.getElementById('mesFiltro').value;
        const localSelecionado = document.getElementById('filtroLocal').value;

        let atualizados = 0;
        let ignorados = 0;

        const itensMes = Object.entries(dadosCarregados)
            .map(([id, item]) => ({ id, ...item }))
            .filter(item => item.mes === mesAtual);

        for (const linha of dados) {
            const pedido = (linha.Pedido || linha['Nº PC'] || linha['NC PC'] || linha['Numero PC'] || '').trim();
            const codFor = (linha.CodFornecedor || linha['CodFornecedor'] || linha['Cod. Fornecedor'] || '').trim();
            const valor = parseMoeda(linha.Valor);
            const vencimento = (linha.Vencimento || '').trim();
            const localCsv = linha.Filial ? linha.Filial.trim() : '';
            const local = localCsv || (localSelecionado !== 'TODOS' ? localSelecionado : '');

            if (!codFor || !pedido) {
                ignorados++;
                console.warn('Linha ignorada por falta de código ou pedido:', linha);
                continue;
            }

            const registroExistente = itensMes.find(item => {
                const mesmoCodigo = item.codFor && item.codFor.trim() === codFor;
                const mesmaFilial = !local || !item.local || item.local.trim() === local;
                return mesmoCodigo && mesmaFilial;
            });

            if (!registroExistente) {
                ignorados++;
                console.warn('Nenhum registro existente encontrado para atualizar:', linha);
                continue;
            }

            const camposParaAtualizar = {};
            if (pedido) camposParaAtualizar.pedido = pedido;
            if (!isNaN(valor) && valor > 0) camposParaAtualizar.valor = valor;
            if (vencimento) camposParaAtualizar.vencimento = vencimento;
            if (local && !registroExistente.local) camposParaAtualizar.local = local;
            if (codFor && !registroExistente.codFor) camposParaAtualizar.codFor = codFor;

            if (Object.keys(camposParaAtualizar).length > 0) {
                try {
                    await atualizarItem(registroExistente.id, camposParaAtualizar);
                    atualizados++;
                } catch (error) {
                    console.error('Erro ao atualizar registro:', registroExistente.id, linha, error);
                }
            } else {
                ignorados++;
            }
        }

        if (atualizados > 0) {
            mostrarSucesso(`${atualizados} registros atualizados com sucesso.`);
        }
        if (ignorados > 0) {
            console.warn(`${ignorados} linhas foram ignoradas durante a importação.`);
        }
    };
    reader.readAsText(file);
};

const handleCleanupImport = async () => {
    const mesAtual = document.getElementById('mesFiltro').value;
    if (!confirm(`Remover lançamentos CSV importados incorretamente para ${mesAtual}?`)) return;

    const itensParaRemover = Object.entries(dadosCarregados)
        .map(([id, item]) => ({ id, ...item }))
        .filter(item => item.mes === mesAtual && item.status === 'Pendente' && item.tipo === 'SERVICO' && item.codFor && item.fornecedor === item.codFor);

    let removidos = 0;
    for (const item of itensParaRemover) {
        try {
            await removerItem(item.id);
            removidos++;
        } catch (error) {
            console.error('Erro ao remover item de limpeza:', item.id, error);
        }
    }

    if (removidos > 0) {
        mostrarSucesso(`${removidos} lançamentos importados incorretamente removidos.`);
    } else {
        mostrarErro('Nenhum lançamento CSV errado encontrado para remover.');
    }
};

const getGrupoExibicao = (item) => {
    if (item.status === 'Enviado ao CSC') return 3;
    if (item.pedido && String(item.pedido).trim() !== '') return 1;
    return 2;
};

const getTextoGrupo = (group) => {
    if (group === 1) return 'Notas com Nº PC';
    if (group === 2) return 'Notas Pendentes';
    return 'Notas enviadas ao CSC';
};

const criarLinhaGrupo = (texto, colSpan = 10) => {
    const tr = document.createElement('tr');
    tr.className = 'table-group-row';
    tr.innerHTML = `<td colspan="${colSpan}">${texto}</td>`;
    return tr;
};

export const renderizarDados = () => {
    if (!dadosCarregados) return;

    const mesAtu = document.getElementById('mesFiltro').value;
    const localF = document.getElementById('filtroLocal').value;
    const busca = document.getElementById('inputBusca').value.toLowerCase();

    const itens = Object.keys(dadosCarregados).map(id => ({ id, ...dadosCarregados[id] }))
        .filter(i => {
            const termo = String((i.pedido || "") + (i.fornecedor || "") + (i.codFor || "")).toLowerCase();
            return i.mes === mesAtu && (localF === "TODOS" || i.local === localF) && termo.includes(busca);
        })
        .sort((a, b) => {
            const ga = getGrupoExibicao(a);
            const gb = getGrupoExibicao(b);
            if (ga !== gb) return ga - gb;
            if (ga === 1) {
                return String(a.pedido || '').localeCompare(String(b.pedido || ''), undefined, { numeric: true, sensitivity: 'base' }) || String(a.fornecedor || '').localeCompare(String(b.fornecedor || ''), undefined, { sensitivity: 'base' });
            }
            return String(a.fornecedor || '').localeCompare(String(b.fornecedor || ''), undefined, { sensitivity: 'base' });
        });

    const tServ = document.getElementById('tabelaServico');
    const tProd = document.getElementById('tabelaProduto');
    tServ.innerHTML = ""; tProd.innerHTML = "";

    const servicos = itens.filter(item => item.tipo === "SERVICO");
    const produtos = itens.filter(item => item.tipo === "PRODUTO");

    let pVal = 0, eVal = 0, pCount = 0, eCount = 0;

    const renderGrupo = (lista, container) => {
        let ultimoGrupo = null;
        lista.forEach(item => {
            const grupo = getGrupoExibicao(item);
            if (grupo !== ultimoGrupo) {
                container.appendChild(criarLinhaGrupo(getTextoGrupo(grupo), 10));
                ultimoGrupo = grupo;
            }

            const isEnv = item.status === "Enviado ao CSC";
            if (!isEnv) {
                pVal += item.valor;
                pCount++;
            } else {
                eVal += item.valor;
                eCount++;
            }
            const tr = document.createElement('tr');
            tr.classList.add(`row-grupo-${grupo}`);
            if (isEnv) tr.classList.add('row-enviada');

            const tdPedido = `<td><input type="text" value="${item.pedido || ''}" class="input-tabela" onblur="atualizarCampo('${item.id}', 'pedido', this.value)"></td>`;
            const tdValor = `<td class="col-valor">R$ <input type="text" value="${fmtMoeda(item.valor)}" class="input-tabela col-valor" onblur="atualizarCampo('${item.id}', 'valor', this.value)"></td>`;

            const htmlBase = `
                <td>${item.local}</td>
                ${tdPedido}
                <td>${item.codFor || ''}</td>
                <td>${item.fornecedor}</td>
                <td>${item.cc || ''}</td>
                ${tdValor}
                <td><input type="text" value="${item.vencimento || ''}" class="input-tabela" onblur="atualizarCampo('${item.id}', 'vencimento', this.value)"></td>
                <td>${item.pagamento}</td>
                <td><span class="status-badge ${isEnv ? 'status-enviado' : 'status-pendente'}">${item.status}</span></td>`;

            const acoes = `<td>
                <button onclick="abrirModalItem('${item.id}')" class="btn-acao">
                    <i class="fas ${item.tipo === 'SERVICO' ? 'fa-paper-plane' : 'fa-copy'}"></i>
                </button>
                <button onclick="removerItemUI('${item.id}')" class="btn-acao-del"><i class="fas fa-trash"></i></button>
            </td>`;

            tr.innerHTML = htmlBase + acoes;
            container.appendChild(tr);
        });
    };

    renderGrupo(servicos, tServ);
    renderGrupo(produtos, tProd);

    document.getElementById('totalPendente').innerText = "R$ " + fmtMoeda(pVal);
    document.getElementById('totalEnviado').innerText = "R$ " + fmtMoeda(eVal);
    document.getElementById('countPendente').innerText = pCount + " notas";
    document.getElementById('countEnviado').innerText = eCount + " notas";

    // Botão replicar
    document.getElementById('btnReplicar').onclick = async () => {
        const idx = listaMeses.indexOf(mesAtu);
        if (idx === 11) return;
        const proxMes = listaMeses[idx + 1];
        const servicos = itens.filter(i => i.tipo === "SERVICO");
        if (confirm(`Replicar ${servicos.length} itens para ${proxMes}?`)) {
            for (const s of servicos) {
                await salvarItem({
                    tipo: "SERVICO", local: s.local, fornecedor: s.fornecedor, codFor: s.codFor || "",
                    cc: s.cc || "", pedido: "", valor: 0, vencimento: "", pagamento: s.pagamento, status: "Pendente", mes: proxMes
                });
            }
            mostrarSucesso("Itens replicados!");
        }
    };

    // Botão aprovação
    document.getElementById('btnAprovacao').onclick = () => {
        const alto = itens.filter(i => i.valor >= 10000 && i.status === "Pendente");
        if (alto.length === 0) return mostrarErro("Nenhuma nota > 10k pendente.");
        
        let corpoEmail = "Juliana, tudo bem?\n\nSegue abaixo os pedidos aguardando aprovação:\n\n";
        
        alto.forEach(i => {
            corpoEmail += `${i.local} - Pedido: ${i.pedido || ''} - Fornecedor: ${i.codFor || ''} - ${i.fornecedor} - Valor: R$ ${fmtMoeda(i.valor)} - C/C: ${i.cc || ''} - Venc.: ${i.vencimento || ''}.\n`;
        });

        window.location.href = `mailto:${emails.aprovacao}?cc=${emails.ccAprovacao}&subject=Pedidos aguardando aprovação&body=${encodeURIComponent(corpoEmail)}`;
    };
};

export const setDados = (dados) => {
    dadosCarregados = dados;
    renderizarDados();
};

// Funções globais para onblur e onclick
window.atualizarCampo = async (id, campo, valor) => {
    try {
        const valorFinal = (campo === 'valor') ? parseMoeda(valor) : valor;
        await atualizarItem(id, campo, valorFinal);
    } catch (error) {
        mostrarErro(error.message);
    }
};

window.abrirModalItem = async (id) => {
    try {
        const item = await obterItem(id);
        const corpoEmail = gerarTextoEmail(item);
        const assunto = `Enc. ${item.local} - Pedido: ${item.pedido || ''} - Fornecedor: ${item.codFor || ''} - ${item.fornecedor} - Valor: R$ ${fmtMoeda(item.valor)} - C/C: ${item.cc || ''} - Venc.: ${item.vencimento || ''}`;

        if (item.tipo === 'SERVICO') {
            abrirModal("Tratar Serviço", corpoEmail, [
                { txt: "ENVIAR E-MAIL", cl: "btn-primary-modal", fn: () => {
                    window.location.href = `mailto:${emails.servicos}?cc=${emails.ccServicos}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoEmail)}`;
                    atualizarItem(id, 'status', 'Enviado ao CSC');
                    fecharModal();
                }},
                { txt: "MARCAR COMO ENVIADO", cl: "btn-secondary-modal", fn: () => {
                    atualizarItem(id, 'status', 'Enviado ao CSC');
                    fecharModal();
                }}
            ]);
        } else {
            const textoCopia = corpoEmail;
            abrirModal("Copiar Dados Produto", textoCopia, [
                { txt: "COPIAR E MARCAR", cl: "btn-primary-modal", fn: () => {
                    navigator.clipboard.writeText(textoCopia).then(() => {
                        mostrarSucesso("Mensagem copiada!");
                        atualizarItem(id, 'status', 'Enviado ao CSC');
                        fecharModal();
                    });
                }}
            ]);
        }
    } catch (error) {
        mostrarErro(error.message);
    }
};

window.removerItemUI = async (id) => {
    if (confirm("Excluir?")) {
        try {
            await removerItem(id);
            mostrarSucesso("Item removido");
        } catch (error) {
            mostrarErro(error.message);
        }
    }
};

const gerarTextoEmail = (c) => {
    const vFmt = fmtMoeda(c.valor);
    return `Bom dia! \n\nSegue Para Lançamento: \n${c.local} - Pedido: ${c.pedido || ''} - Fornecedor: ${c.codFor || ''} - ${c.fornecedor} - Valor: R$ ${vFmt} - C/C: ${c.cc || ''} - Venc.: ${c.vencimento || ''} \n\nPagamento via: ${c.pagamento}.`;
};

const abrirModal = (t, p, btns) => {
    document.getElementById('modalTitle').innerText = t; 
    document.getElementById('modalPreview').innerText = p;
    const c = document.getElementById('modalActions'); c.innerHTML = "";
    btns.forEach(b => {
        const el = document.createElement('button'); el.innerText = b.txt; el.className = `modal-btn ${b.cl}`; el.onclick = b.fn; c.appendChild(el);
    });
    const bc = document.createElement('button'); bc.innerText = "CANCELAR"; bc.className = "modal-btn"; bc.onclick = fecharModal; c.appendChild(bc);
    document.getElementById('modalApp').style.display = 'flex';
};

const fecharModal = () => {
    document.getElementById('modalApp').style.display = 'none';
};

const showLoading = () => {
    document.getElementById('loadingIndicator').style.display = 'block';
};

const hideLoading = () => {
    document.getElementById('loadingIndicator').style.display = 'none';
};
