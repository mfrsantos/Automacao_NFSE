// auth.js - Gerenciamento de autenticação
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const initAuth = (onLogin, onLogout) => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onLogin();
        } else {
            onLogout();
        }
    });
};

export const login = async (email, senha) => {
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
        throw new Error('Credenciais inválidas');
    }
};

export const logout = async () => {
    await signOut(auth);
};