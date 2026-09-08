document.getElementById("nomeNegocioAdmin").textContent = NEGOCIO.nome;

const telaLogin = document.getElementById("telaLogin");
const telaPainel = document.getElementById("telaPainel");
const mensagemErro = document.getElementById("mensagemErro");

// ---------- LOGIN ----------
document.getElementById("botaoEntrar").addEventListener("click", fazerLogin);
document.getElementById("campoSenha").addEventListener("keydown", (e) => {
  if (e.key === "Enter") fazerLogin();
});

function fazerLogin() {
  const email = document.getElementById("campoEmail").value.trim();
  const senha = document.getElementById("campoSenha").value;
  mensagemErro.textContent = "";

  auth.signInWithEmailAndPassword(email, senha).catch((erro) => {
    mensagemErro.textContent = "E-mail ou senha incorretos.";
    console.error(erro);
  });
}

document.getElementById("botaoSair").addEventListener("click", () => auth.signOut());

// Mostra o painel só quando o login (Firebase Auth) for confirmado.
// Isso é o que realmente protege o /admin.html — sem estar logado,
// as regras de segurança do Firestore bloqueiam qualquer alteração.
auth.onAuthStateChanged((usuario) => {
  if (usuario) {
    telaLogin.style.display = "none";
    telaPainel.style.display = "block";
    escutarProdutos();
  } else {
    telaLogin.style.display = "block";
    telaPainel.style.display = "none";
  }
});

// ---------- ADICIONAR PRODUTO ----------
document.getElementById("formProduto").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("campoNome").value.trim();
  const preco = parseFloat(document.getElementById("campoPreco").value.replace(",", "."));
  const categoria = document.getElementById("campoCategoria").value.trim();
  const imagemUrl = document.getElementById("campoImagem").value.trim();

  if (!nome || isNaN(preco) || !categoria) return;

  await db.collection("produtos").add({
    nome,
    preco,
    categoria,
    imagemUrl: imagemUrl || null,
    disponivel: true,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
  });

  e.target.reset();
  document.getElementById("campoNome").focus();
});

// ---------- IMPORTAR CARDÁPIO INICIAL ----------
const CARDAPIO_INICIAL = [
  { nome: "Café", preco: 2.0, categoria: "Quentes" },
  { nome: "Chocolate Quente", preco: 7.0, categoria: "Quentes" },
  { nome: "Cuscuz", preco: 7.0, categoria: "Comidas" },
  { nome: "Salgados", preco: 7.0, categoria: "Comidas" },
  { nome: "Caldo", preco: 7.0, categoria: "Comidas", observacao: "300 ml" },
  { nome: "Suco Natural", preco: 4.0, categoria: "Bebidas Geladas", observacao: "200 ml" },
  { nome: "Refrigerante", preco: 4.0, categoria: "Bebidas Geladas" },
];

document.getElementById("botaoImportar").addEventListener("click", async () => {
  const botao = document.getElementById("botaoImportar");
  botao.disabled = true;
  botao.textContent = "Importando...";

  try {
    const lote = db.batch();
    CARDAPIO_INICIAL.forEach((item) => {
      const ref = db.collection("produtos").doc();
      lote.set(ref, {
        ...item,
        disponivel: true,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
    await lote.commit();
    botao.textContent = "Cardápio importado!";
  } catch (erro) {
    console.error(erro);
    botao.textContent = "Erro ao importar";
    botao.disabled = false;
  }
});

// ---------- LISTAR / EDITAR / EXCLUIR ----------
const listaAdmin = document.getElementById("listaAdmin");
let produtosCache = [];
const editandoIds = new Set();

function escutarProdutos() {
  db.collection("produtos")
    .orderBy("criadoEm", "desc")
    .onSnapshot((snapshot) => {
      produtosCache = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderizarLista();
    });
}

function renderizarLista() {
  if (produtosCache.length === 0) {
    listaAdmin.innerHTML = '<div class="vazio">Nenhum produto cadastrado ainda.</div>';
    return;
  }

  listaAdmin.innerHTML = "";
  produtosCache.forEach((p) => {
    const id = p.id;
    listaAdmin.appendChild(
      editandoIds.has(id) ? criarFormEdicao(p) : criarLinhaProduto(p)
    );
  });
}

function criarLinhaProduto(p) {
  const id = p.id;
  const linha = document.createElement("div");
  linha.className = "linha-produto" + (p.disponivel ? "" : " indisponivel");
  linha.innerHTML = `
    <div class="info">
      <strong>${escapeHTML(p.nome)}</strong>
      <span>${escapeHTML(p.categoria || "")}${p.observacao ? ` (${escapeHTML(p.observacao)})` : ""} · ${formatarPreco(p.preco)} · ${p.disponivel ? "Disponível" : "Indisponível"}</span>
    </div>
    <div class="acoes">
      <button class="btn-secundario btn-editar" type="button">Editar</button>
      <button class="btn-secundario btn-toggle" type="button">${p.disponivel ? "Deixar indisponível" : "Deixar disponível"}</button>
      <button class="btn-perigo btn-excluir" type="button">Excluir</button>
    </div>
  `;

  linha.querySelector(".btn-editar").addEventListener("click", () => {
    editandoIds.add(id);
    renderizarLista();
  });

  linha.querySelector(".btn-toggle").addEventListener("click", () => {
    db.collection("produtos").doc(id).update({ disponivel: !p.disponivel });
  });

  linha.querySelector(".btn-excluir").addEventListener("click", () => {
    if (confirm(`Excluir "${p.nome}" definitivamente?`)) {
      db.collection("produtos").doc(id).delete();
    }
  });

  return linha;
}

function criarFormEdicao(p) {
  const id = p.id;
  const form = document.createElement("form");
  form.className = "form-edicao";
  form.innerHTML = `
    <input type="text" class="edit-nome" value="${escapeAttr(p.nome)}" placeholder="Nome do produto" required />
    <input type="text" class="edit-preco" value="${escapeAttr(p.preco)}" placeholder="Preço" required inputmode="decimal" />
    <input type="text" class="edit-categoria" value="${escapeAttr(p.categoria || "")}" placeholder="Categoria" required />
    <input type="text" class="edit-observacao" value="${escapeAttr(p.observacao || "")}" placeholder="Observação (ex: 300 ml, opcional)" />
    <input type="url" class="edit-imagem" value="${escapeAttr(p.imagemUrl || "")}" placeholder="URL da imagem (opcional)" />
    <div class="acoes-edicao">
      <button class="btn-primario" type="submit">Salvar</button>
      <button class="btn-secundario btn-cancelar" type="button">Cancelar</button>
    </div>
  `;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = form.querySelector(".edit-nome").value.trim();
    const preco = parseFloat(form.querySelector(".edit-preco").value.replace(",", "."));
    const categoria = form.querySelector(".edit-categoria").value.trim();
    const observacao = form.querySelector(".edit-observacao").value.trim();
    const imagemUrl = form.querySelector(".edit-imagem").value.trim();

    if (!nome || isNaN(preco) || !categoria) return;

    await db.collection("produtos").doc(id).update({
      nome,
      preco,
      categoria,
      observacao: observacao || firebase.firestore.FieldValue.delete(),
      imagemUrl: imagemUrl || null,
    });

    editandoIds.delete(id);
  });

  form.querySelector(".btn-cancelar").addEventListener("click", () => {
    editandoIds.delete(id);
    renderizarLista();
  });

  return form;
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function escapeAttr(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
