// utils.js - Funções utilitárias
export const fmtMoeda = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

export const parseMoeda = (s) => {
    if (typeof s === 'number') return s;
    if (s == null) return 0;
    let limpo = String(s).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    return parseFloat(limpo) || 0;
};

export const validarData = (dataStr) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dataStr)) return false;
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
};

export const validarValor = (valor) => {
    const num = parseMoeda(valor);
    return !isNaN(num) && num >= 0;
};

export const mostrarErro = (mensagem) => {
    alert(`Erro: ${mensagem}`);
};

export const mostrarSucesso = (mensagem) => {
    alert(mensagem);
};

export const parseCSV = (csvText) => {
    const linhas = csvText.split(/\r?\n/).filter(l => l.trim());
    if (linhas.length < 2) return [];
    const cabecalhos = linhas[0].split(';').map(h => h.trim().replace(/\ufeff/g, ''));
    const dados = linhas.slice(1).map(linha => {
        const valores = linha.split(';').map(v => v.trim());
        const obj = {};
        cabecalhos.forEach((h, i) => obj[h] = valores[i] || '');
        return obj;
    });
    return dados;
};