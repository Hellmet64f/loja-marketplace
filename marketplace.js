/*
  marketplace.js
  Interatividade básica para o marketplace de assinaturas.
  Funcionalidades:
    - Renderização de cards a partir de dados mockados
    - Busca, filtros por categoria/chips e ordenação
    - Modal de detalhes com simulação de compra
    - Comentários explicativos no código
*/

// ----------------------------- Dados Mockados -----------------------------
// Em um projeto real, estes dados viriam de uma API.
const ANUNCIOS = [
  {
    id: 'netflix-premium',
    titulo: 'Netflix Premium 4 telas',
    categoria: 'Streaming',
    preco: 24.90,
    avaliacao: 4.8,
    vendedor: 'Loja Stream Plus',
    descricao: 'Acesso a Netflix Premium com suporte 4K e 4 telas simultâneas.',
    chips: ['entrega-imediata', '4k', 'garantia'],
    emoji: '🎬'
  },
  {
    id: 'hbo-max',
    titulo: 'HBO Max Plano Padrão',
    categoria: 'Streaming',
    preco: 19.90,
    avaliacao: 4.6,
    vendedor: 'HBO Store BR',
    descricao: 'Catálogo HBO com filmes e séries exclusivas. Perfil privado disponível.',
    chips: ['entrega-imediata', 'perfil-privado'],
    emoji: '📺'
  },
  {
    id: 'prime-video',
    titulo: 'Prime Video + Frete Grátis',
    categoria: 'Streaming',
    preco: 14.90,
    avaliacao: 4.4,
    vendedor: 'Amazon Deals',
    descricao: 'Assinatura Prime Video com benefícios do Amazon Prime.',
    chips: ['entrega-imediata', 'garantia'],
    emoji: '🚚'
  },
  {
    id: 'premiere',
    titulo: 'Premiere Futebol - Times do Brasil',
    categoria: 'Esportes',
    preco: 29.90,
    avaliacao: 4.2,
    vendedor: 'FC Sports',
    descricao: 'Assista aos jogos do Brasileirão com qualidade HD.',
    chips: ['garantia'],
    emoji: '⚽'
  },
  {
    id: 'spotify-familiar',
    titulo: 'Spotify Premium Familiar',
    categoria: 'Música',
    preco: 21.90,
    avaliacao: 4.7,
    vendedor: 'Music Pro',
    descricao: 'Plano familiar com até 6 contas individuais.',
    chips: ['perfil-privado', 'garantia'],
    emoji: '🎵'
  },
  {
    id: 'alura',
    titulo: 'Alura - Cursos de Tecnologia',
    categoria: 'Educação',
    preco: 39.90,
    avaliacao: 4.9,
    vendedor: 'Alura Partner',
    descricao: 'Acesso a centenas de cursos de tecnologia, design e negócios.',
    chips: ['garantia'],
    emoji: '💻'
  }
];

// ------------------------------- Estado UI -------------------------------
const state = {
  q: '',
  categoria: '',
  ordem: 'relevancia',
  chipsAtivos: new Set(),
  carrinho: []
};

// ------------------------------- Utilidades ------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function formatarPreco(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Ordenações simples
const sorters = {
  relevancia: (a, b) => b.avaliacao - a.avaliacao,
  'menor-preco': (a, b) => a.preco - b.preco,
  'maior-preco': (a, b) => b.preco - a.preco,
  'melhor-avaliacao': (a, b) => b.avaliacao - a.avaliacao
};

// --------------------------- Renderização de UI --------------------------
function renderGrid(lista) {
  const grid = $('#grid');
  grid.innerHTML = '';

  if (!lista.length) {
    grid.innerHTML = '<p class="muted">Nenhum anúncio encontrado com os filtros atuais.</p>';
    return;
  }

  for (const item of lista) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb" aria-hidden="true">${item.emoji}</div>
      <div class="body">
        <div class="title">${item.titulo}</div>
        <div class="meta">
          <span class="price">${formatarPreco(item.preco)}</span>
          <span class="rating">⭐ ${item.avaliacao.toFixed(1)}</span>
        </div>
        <div class="muted">${item.vendedor}</div>
        <button class="btn" data-acao="detalhes" data-id="${item.id}">Ver detalhes</button>
      </div>
    `;
    grid.appendChild(card);
  }
}

function aplicarFiltros() {
  const q = state.q.toLowerCase();
  let lista = ANUNCIOS.filter(a =>
    (!q || a.titulo.toLowerCase().includes(q) || a.descricao.toLowerCase().includes(q)) &&
    (!state.categoria || a.categoria === state.categoria)
  );

  // Filtrar pelos chips ativos (todos devem estar presentes)
  if (state.chipsAtivos.size) {
    lista = lista.filter(a => {
      const s = new Set(a.chips);
      for (const chip of state.chipsAtivos) {
        if (!s.has(chip)) return false;
      }
      return true;
    });
  }

  // Ordenar conforme seleção
  const sorter = sorters[state.ordem] || sorters.relevancia;
  lista.sort(sorter);

  renderGrid(lista);
}

// -------------------------- Modal de Detalhes ---------------------------
const modal = {
  el: null,
  aberto: false,
  abrir(item) {
    if (!this.el) this.el = document.getElementById('detalhesModal');
    $('#detalhesTitulo').textContent = item.titulo;
    $('#detalhesThumb').textContent = item.emoji;
    $('#detalhesVendedor').textContent = `Vendedor: ${item.vendedor}`;
    $('#detalhesDescricao').textContent = item.descricao;
    $('#detalhesPreco').textContent = formatarPreco(item.preco);
    $('#detalhesAvaliacao').textContent = `⭐ ${item.avaliacao.toFixed(1)}`;
    this.el.showModal();
    this.aberto = true;
  },
  fechar() {
    if (this.el && this.aberto) {
      this.el.close();
      this.aberto = false;
    }
  }
};

// --------------------------- Eventos da Página --------------------------
function registrarEventos() {
  // Busca e filtros principais
  $('#btnBuscar').addEventListener('click', () => {
    state.q = $('#q').value.trim();
    state.categoria = $('#categoria').value;
    state.ordem = $('#ordem').value;
    aplicarFiltros();
  });

  // Enter no campo de busca
  $('#q').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      state.q = $('#q').value.trim();
      aplicarFiltros();
    }
  });

  // Chips clicáveis de filtros rápidos
  $$('#chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.chip;
      if (state.chipsAtivos.has(id)) {
        state.chipsAtivos.delete(id);
        chip.classList.remove('active');
      } else {
        state.chipsAtivos.add(id);
        chip.classList.add('active');
      }
      aplicarFiltros();
    });
  });

  // Delegação: clique no botão "Ver detalhes" dentro dos cards
  document.getElementById('grid').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-acao="detalhes"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const item = ANUNCIOS.find(a => a.id === id);
    if (item) modal.abrir(item);
  });

  // Fechar modal
  document.getElementById('fecharModal').addEventListener('click', () => modal.fechar());

  // Simulação de compra
  document.getElementById('btnSimularCompra').addEventListener('click', () => {
    const titulo = document.getElementById('detalhesTitulo').textContent;
    alert(`Compra simulada com sucesso! Produto: ${titulo}`);
    modal.fechar();
  });

  // Adicionar ao carrinho (simulação)
  document.getElementById('btnAdicionarCarrinho').addEventListener('click', () => {
    const titulo = document.getElementById('detalhesTitulo').textContent;
    state.carrinho.push(titulo);
    alert(`Adicionado ao carrinho: ${titulo}\nItens no carrinho: ${state.carrinho.length}`);
  });
}

// ------------------------------- Inicialização ---------------------------
function init() {
  renderGrid(ANUNCIOS.slice().sort(sorters.relevancia));
  registrarEventos();
}

// Aguarda DOM pronto antes de iniciar.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
