// utils.js - Funções utilitárias
export const fmtMoeda = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

export const parseMoeda = (s) => {
    if (typeof s === 'number') return s;
    if (s == null) return 0;
    
    let limpo = String(s).trim();
    
    // Se tem vírgula e ponto, determinar qual é o separador decimal
    // Baseado na posição do último separador
    if (limpo.includes(',') && limpo.includes('.')) {
        const ultimoVirgula = limpo.lastIndexOf(',');
        const ultimoPonto = limpo.lastIndexOf('.');
        
        if (ultimoVirgula > ultimoPonto) {
            // Formato brasileiro: 1.234,56
            limpo = limpo.replace(/\./g, '').replace(',', '.');
        } else {
            // Formato internacional: 1,234.56
            limpo = limpo.replace(/,/g, '');
        }
    } else if (limpo.includes(',')) {
        // Só vírgula - formato brasileiro
        limpo = limpo.replace(',', '.');
    }
    // Se só tem ponto, deixar como está (formato internacional)
    
    limpo = limpo.replace(/[^\d.-]/g, '');
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
    
    // Parse header
    const cabecalhos = linhas[0].split(';').map(h => 
        h.trim().replace(/\ufeff/g, '').replace(/^"|"$/g, '')
    );
    
    // Parse data rows
    const dados = linhas.slice(1).map(linha => {
        // Handle quoted values with semicolons inside
        const valores = [];
        let valor = '';
        let dentro_aspas = false;
        
        for (let i = 0; i < linha.length; i++) {
            const char = linha[i];
            
            if (char === '"') {
                dentro_aspas = !dentro_aspas;
            } else if (char === ';' && !dentro_aspas) {
                valores.push(valor.trim().replace(/^"|"$/g, ''));
                valor = '';
            } else {
                valor += char;
            }
        }
        valores.push(valor.trim().replace(/^"|"$/g, ''));
        
        const obj = {};
        cabecalhos.forEach((h, i) => obj[h] = valores[i] || '');
        return obj;
    });
    return dados;
};