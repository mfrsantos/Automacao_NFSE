// app.js - Ponto de entrada da aplicação
import { initAuth } from './auth.js';
import { carregarDados } from './data.js';
import { initUI, onLogin, onLogout, setDados } from './ui.js';

// Inicializar autenticação
initAuth(onLogin, onLogout);

// Inicializar interface
initUI();

// Carregar dados quando logado
carregarDados(setDados);
