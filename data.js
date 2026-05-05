// data.js - Operações de dados com Firebase
import { getDatabase, ref, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const contasRef = ref(db, 'contas');

export const carregarDados = (callback) => {
    onValue(contasRef, (snap) => {
        const data = snap.val();
        callback(data);
    }, (error) => {
        console.error("Erro ao carregar dados:", error);
    });
};

export const salvarItem = async (item) => {
    try {
        await push(contasRef, item);
    } catch (error) {
        throw new Error('Erro ao salvar item');
    }
};

export const atualizarItem = async (id, campo, valor) => {
    try {
        const dataRef = ref(db, `contas/${id}`);
        const dados = (typeof campo === 'object' && campo !== null) ? campo : { [campo]: valor };
        await update(dataRef, dados);
    } catch (error) {
        throw new Error('Erro ao atualizar item');
    }
};

export const removerItem = async (id) => {
    try {
        await remove(ref(db, `contas/${id}`));
    } catch (error) {
        throw new Error('Erro ao remover item');
    }
};

export const obterItem = async (id) => {
    try {
        const snap = await get(ref(db, `contas/${id}`));
        return snap.val();
    } catch (error) {
        throw new Error('Erro ao obter item');
    }
};