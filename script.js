const STORAGE_KEY = "relatos_saneamento_natal";
let relatos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

document.addEventListener("DOMContentLoaded", () => {
  initBairros();
  initNav();
  initForm();
  initAdmin();
  renderTabela();
  if (window.dashboardRefresh) window.dashboardRefresh();
});

async function initBairros() {
  const select = document.getElementById("bairro");
  let bairros = ["Alecrim", "Capim Macio", "Lagoa Nova", "Ponta Negra", "Tirol", "Quintas", "Rocas", "Neópolis"];
  
  try {
    const res = await fetch("js/bairros.json");
    if (res.ok) bairros = await res.json();
  } catch (e) {}

  bairros.sort().forEach(b => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    select.appendChild(opt);
  });
}

function initNav() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".nav-btn, .tab-content").forEach(el => el.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
      if (btn.dataset.tab === "dashboard" && window.dashboardRefresh) window.dashboardRefresh();
    };
  });
}

function initForm() {
  const form = document.getElementById("form-relato");
  const desc = document.getElementById("descricao");
  const feedback = document.getElementById("form-feedback");

  desc.oninput = () => document.getElementById("char-count").textContent = desc.value.length;

  form.onsubmit = (e) => {
    e.preventDefault();
    const bairro = document.getElementById("bairro").value;
    const categoria = document.getElementById("categoria").value;
    const texto = desc.value.trim();

    if (!bairro || !categoria || texto.length < 10) {
      feedback.className = "feedback error";
      feedback.textContent = "Preencha todos os campos. A descrição precisa ter ao menos 10 caracteres.";
      return;
    }

    relatos.push({
      id: Date.now().toString(),
      bairro,
      categoria,
      descricao: texto,
      anonimo: document.getElementById("anonimo").checked,
      data: new Date().toISOString()
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(relatos));
    
    feedback.className = "feedback success";
    feedback.textContent = "Relato registrado com sucesso.";
    form.reset();
    document.getElementById("char-count").textContent = "0";
    
    renderTabela();
    if (window.dashboardRefresh) window.dashboardRefresh();
    setTimeout(() => feedback.className = "feedback", 4000);
  };
}

function initAdmin() {
  document.getElementById("btn-export-json").onclick = () => baixarArquivo(JSON.stringify(relatos, null, 2), "relatos.json", "application/json");
  
  document.getElementById("btn-export-csv").onclick = () => {
    const header = ["id", "data", "bairro", "categoria", "descricao", "anonimo"];
    const linhas = relatos.map(r => header.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
    baixarArquivo([header.join(","), ...linhas].join("\n"), "relatos.csv", "text/csv");
  };

  document.getElementById("btn-seed").onclick = () => {
    if (!confirm("Adicionar dados de exemplo?")) return;
    const hoje = Date.now();
    const b = ["Alecrim", "Capim Macio", "Lagoa Nova", "Ponta Negra", "Quintas", "Rocas", "Tirol", "Neópolis"];
    const c = ["Esgoto a céu aberto", "Falta de água", "Acúmulo de lixo", "Problema de drenagem / alagamento", "Baixa pressão de água", "Vazamento de água"];
    
    for (let i = 0; i < 60; i++) {
      relatos.push({
        id: "seed-" + i,
        bairro: b[Math.floor(Math.random() * b.length)],
        categoria: c[Math.floor(Math.random() * c.length)],
        descricao: "Relato de exemplo gerado para demonstração do painel.",
        anonimo: true,
        data: new Date(hoje - Math.random() * 15552000000).toISOString()
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(relatos));
    renderTabela();
    if (window.dashboardRefresh) window.dashboardRefresh();
  };

  document.getElementById("btn-clear").onclick = () => {
    if (!confirm("Tem certeza que deseja apagar todos os relatos?")) return;
    relatos = [];
    localStorage.removeItem(STORAGE_KEY);
    renderTabela();
    if (window.dashboardRefresh) window.dashboardRefresh();
  };
}

function renderTabela() {
  document.getElementById("total-relatos").textContent = relatos.length;
  const tbody = document.querySelector("#tabela-relatos tbody");
  
  tbody.innerHTML = [...relatos].reverse().map(r => `
    <tr>
      <td data-label="Data">${new Date(r.data).toLocaleString("pt-BR")}</td>
      <td data-label="Bairro">${r.bairro}</td>
      <td data-label="Categoria">${r.categoria}</td>
      <td data-label="Descrição" class="desc" title="${r.descricao}">${r.descricao}</td>
    </tr>
  `).join("");
}

function baixarArquivo(conteudo, nome, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}