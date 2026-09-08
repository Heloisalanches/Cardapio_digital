// ============================================================
// CONFIGURAÇÃO DO CARDÁPIO DIGITAL
// Edite os valores abaixo. Não é necessário mexer em mais nada
// neste arquivo para trocar o nome do comércio, WhatsApp ou Pix.
// ============================================================

// Dados do comércio (aparecem no cardápio)
const NEGOCIO = {
  nome: "Heloisa Café",
  slogan: "Sabor que acolhe, carinho que fica!",
  whatsapp: "5561991629-23",       // troque pelo número real, DDI+DDD+número, só números
  chavePix: "004.602.091-83",      // troque pela chave Pix real
};

// Credenciais do Firebase (pegue em: Console Firebase > Configurações
// do projeto > Geral > "Seus apps" > Configuração do SDK)
const firebaseConfig = {
  apiKey: "AIzaSyBHuVkAikYE8cxwinvnSp8p48B5onaNtLg",
  authDomain: "cardapio-da-heloisa.firebaseapp.com",
  projectId: "cardapio-da-heloisa",
  storageBucket: "cardapio-da-heloisa.firebasestorage.app",
  messagingSenderId: "372808440162",
  appId: "1:372808440162:web:a4f6e14d5d3d974a42b43b",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
