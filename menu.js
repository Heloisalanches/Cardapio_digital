document.getElementById("nomeNegocio").textContent = NEGOCIO.nome;
document.getElementById("slogan").textContent = NEGOCIO.slogan || "";

// WhatsApp
const linkWhatsapp = document.getElementById("linkWhatsapp");
linkWhatsapp.href = `https://wa.me/${NEGOCIO.whatsapp}`;

// Pix
document.getElementById("chavePixTexto").textContent = `Chave Pix: ${NEGOCIO.chavePix}`;
document.getElementById("botaoPix").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(NEGOCIO.chavePix);
    const botao = document.getElementById("botaoPix");
    const textoOriginal = botao.textContent;
    botao.textContent = "Chave copiada!";
    setTimeout(() => (botao.textContent = textoOriginal), 2000);
  } catch (e) {
    alert("Não foi possível copiar. Chave Pix: " + NEGOCIO.chavePix);
  }
});

// Formata número para R$
function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Escuta o Firestore em tempo real, só produtos disponíveis
const listaProdutos = document.getElementById("listaProdutos");

db.collection("produtos")
  .where("disponivel", "==", true)
  .onSnapshot(
    (snapshot) => {
      if (snapshot.empty) {
        listaProdutos.innerHTML = '<div class="vazio">Nenhum produto disponível no momento.</div>';
        return;
      }

      // Agrupa por categoria
      const porCategoria = {};
      snapshot.forEach((doc) => {
        const p = doc.data();
        const cat = p.categoria || "Outros";
        if (!porCategoria[cat]) porCategoria[cat] = [];
        porCategoria[cat].push(p);
      });

      let html = "";
      Object.keys(porCategoria)
        .sort()
        .forEach((categoria) => {
          html += `<div class="categoria">${categoria}</div>`;
          porCategoria[categoria].forEach((p) => {
            const temImagem = !!p.imagemUrl;
            const imgHtml = temImagem
              ? `<img src="${escapeAttr(p.imagemUrl)}" alt="${escapeAttr(p.nome)}" />`
              : `<span>${escapeHTML((p.nome || "?").trim().charAt(0).toUpperCase())}</span>`;

            html += `
              <div class="produto">
                <div class="produto-img-wrap${temImagem ? "" : " placeholder"}">${imgHtml}</div>
                <div class="produto-conteudo">
                  <span class="produto-nome">${escapeHTML(p.nome)}${p.observacao ? ` <small>(${escapeHTML(p.observacao)})</small>` : ""}</span>
                  <span class="produto-linha"></span>
                  <span class="produto-preco">${formatarPreco(p.preco)}</span>
                </div>
              </div>`;
          });
        });

      listaProdutos.innerHTML = html;
    },
    (erro) => {
      console.error(erro);
      listaProdutos.innerHTML = '<div class="vazio">Não foi possível carregar o cardápio agora.</div>';
    }
  );

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
