/*
  marketplace.js (modernizado)
  Interatividade para marketplace de assinaturas com dados mockados normalizados,
  renderização eficiente, filtros dinâmicos, modal de detalhes/compra e comentários
  com dicas de evolução (API, layouts, responsividade, SEO, auth, pagamentos).

  Requisitos implementados:
    1) Dados mockados refatorados e prontos para futura API
    2) Renderização de cards otimizada (template + DocumentFragment)
    3) Filtros dinâmicos por categoria e chips
    4) Modal de detalhes, simulação de compra e carrinho (em memória)
    5) Comentários com sugestões de evolução
*/

// ----------------------------- Utilitários ------------------------------
/** Formata preço como BRL */
const formatBRL = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
/** Cria elemento com classes e atributos */
function h(tag, { className, attrs, html } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (html != null) el.innerHTML = html;
  return el;
}

// --------------------------- Dados (Mock/API) --------------------------
/**
  Modelo normalizado de Anúncio (base p/ futura API):
  {
    id: string,
    titulo: string,
    categoria: 'Streaming' | 'Games' | 'Música' | string,
    preco: number,
    avaliacao: number (0-5),
    vendedor: { id: string, nome: string, reputacao?: number },
    descricao: string,
    chips: string[], // etiquetas para filtro (ex: 'entrega-imediata', 'garantia')
    media: { emoji?: string, imagemUrl?: string }
  }
*/
const DataSource = {
  // No futuro, trocar para fetch('/api/anuncios')
  async listarAnuncios() {
    // Simula latência mínima
    await new Promise(r => setTimeout(r, 50));
    /** @type {Array} */
    const anuncios = [
      {
        id: 'netflix-premium',
        titulo: 'Netflix Premium 4 telas',
        categoria: 'Streaming',
        preco: 24.9,
        avaliacao: 4.8,
        vendedor: { id: 'v1', nome: 'Loja Stream Plus', reputacao: 4.7 },
        descricao: 'Acesso a Netflix Premium com suporte 4K e 4 telas simultâneas.',
        chips: ['entrega-imediata', '4k', 'garantia'],
        media: { emoji: '🎬' }
      },
      {
        id: 'hbo-max',
        titulo: 'HBO Max Plano Padrão',
        categoria: 'Streaming',
        preco: 19.9,
        avaliacao: 4.6,
        vendedor: { id: 'v2', nome: 'HBO Store BR', reputacao: 4.6 },
        descricao: 'Catálogo HBO com filmes e séries exclusivas. Perfil privado disponível.',
        chips: ['entrega-imediata', 'perfil-privado'],
        media: { emoji: '📺' }
      },
      {
        id: 'prime-video',
        titulo: 'Prime Video + Frete Grátis',
        categoria: 'Streaming',
        preco: 14.9,
        avaliacao: 4.4,
        vendedor: { id: 'v3', nome: 'Amazon Deals', reputacao: 4.8 },
        descricao: 'Assinatura Prime Video com benefícios do Amazon Prime.',
        chips: ['entrega-imediata', 'garantia'],
        media: { emoji: '🚚' }
      },
      {
        id: 'spotify-family',
        titulo: 'Spotify Family 6 Perfis',
        categoria: 'Música',
        preco: 21.9,
        avaliacao: 4.5,
        vendedor: { id: 'v4', nome: 'Music Plans', reputacao: 4.5 },
        descricao: 'Plano familiar com até 6 contas Premium.',
        chips: ['garantia', 'perfil-privado'],
        media: { emoji: '🎵' }
      },
      {
        id: 'xbox-game-pass',
        titulo: 'Xbox Game Pass Ultimate',
        categoria: 'Games',
        preco: 39.9,
        avaliacao: 4.9,
        vendedor: { id: 'v5', nome: 'Gaming Vault', reputacao: 4.9 },
        descricao: 'Acesso a centenas de jogos, EA Play incluso.',
        chips: ['entrega-imediata', 'garantia'],
        media: { emoji: '🎮' }
      }
    ];
    return anuncios;
  },
};

// --------------------------- Estado e Seletores -------------------------
const state = {
  anuncios: [],
  filtroBusca: '',
  filtroCategoria: 'todas',
  chipsAtivos: new Set(),
  ordenacao: 'relevancia', // 'preco-asc' | 'preco-desc' | 'avaliacao-desc'
  carrinho: [],
};

// Cache de seletores para evitar querySelector repetido
const $ = {
  grid: () => document.getElementById('grid'),
  categorias: () => document.getElementById('categorias'),
  chips: () => document.getElementById('chips'),
  busca: () => document.getElementById('busca'),
  ordenacao: () => document.getElementById('ordenacao'),
  modal: () => document.getElementById('modalDetalhes'),
};

// ----------------------------- Renderização -----------------------------
/** Cria HTML do chip (etiqueta) */
function renderChip(chip) {
  return `<span class="chip" data-chip="${chip}" title="${chip}">#${chip}</span>`;
}

/**
  Renderiza um card de anúncio. Usamos template string + fragment para performance
  e marcadores semânticos básicos (aria/role) para acessibilidade e SEO básico.
*/
function createCard(anuncio) {
  const { id, titulo, categoria, preco, avaliacao, vendedor, descricao, chips, media } = anuncio;
  const card = h('article', { className: 'card', attrs: { role: 'article', 'data-id': id } });
  card.innerHTML = `
    <div class="card-media" aria-hidden="true">${media?.emoji ?? '🛒'}</div>
    <div class="card-body">
      <header class="card-header">
        <h3 class="card-title">${titulo}</h3>
        <div class="card-subtitle">${categoria} • ⭐ ${avaliacao.toFixed(1)}</div>
      </header>
      <p class="card-desc">${descricao}</p>
      <div class="card-chips">${chips.map(renderChip).join('')}</div>
      <footer class="card-footer">
        <div class="card-price" aria-label="Preço">${formatBRL(preco)}</div>
        <button class="btn btn-primary" data-acao="detalhes" data-id="${id}" aria-label="Ver detalhes de ${titulo}">Ver detalhes</button>
      </footer>
      <div class="card-seller" aria-label="Vendedor">Vendedor: ${vendedor.nome}</div>
    </div>
  `;
  return card;
}

/** Renderiza lista de cards no grid usando DocumentFragment */
function renderGrid(lista) {
  const grid = $.grid();
  if (!grid) return;
  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  lista.forEach(item => frag.appendChild(createCard(item)));
  grid.appendChild(frag);
}

/** Renderiza categorias dinâmicas com base nos dados */
function renderCategorias(anuncios) {
  const el = $.categorias();
  if (!el) return;
  const categorias = Array.from(new Set(anuncios.map(a => a.categoria)));
  el.innerHTML = ['todas', ...categorias].map(cat => `<option value="${cat}">${cat[0].toUpperCase()}${cat.slice(1)}</option>`).join('');
}

/** Renderiza chips dinâmicos com base nos dados */
function renderChips(anuncios) {
  const el = $.chips();
  if (!el) return;
  const chips = Array.from(new Set(anuncios.flatMap(a => a.chips)));
  el.innerHTML = chips.map(c => `<button type="button" class="chip-filter" data-chip="${c}">#${c}</button>`).join('');
}

// ----------------------------- Filtros/Busca ----------------------------
const sorters = {
  relevancia: (a, b) => b.avaliacao - a.avaliacao,
  'preco-asc': (a, b) => a.preco - b.preco,
  'preco-desc': (a, b) => b.preco - a.preco,
  'avaliacao-desc': (a, b) => b.avaliacao - a.avaliacao,
};

function aplicarFiltros() {
  let lista = [...state.anuncios];
  // busca (titulo/descricao)
  if (state.filtroBusca) {
    const q = state.filtroBusca.toLowerCase();
    lista = lista.filter(a => a.titulo.toLowerCase().includes(q) || a.descricao.toLowerCase().includes(q));
  }
  // categoria
  if (state.filtroCategoria && state.filtroCategoria !== 'todas') {
    lista = lista.filter(a => a.categoria === state.filtroCategoria);
  }
  // chips (AND entre chips ativos)
  if (state.chipsAtivos.size > 0) {
    lista = lista.filter(a => [...state.chipsAtivos].every(c => a.chips.includes(c)));
  }
  // ordenação
  lista.sort(sorters[state.ordenacao] || sorters.relevancia);
  renderGrid(lista);
}

// ------------------------------- Modal ---------------------------------
const modal = {
  abrir(item) {
    const m = $.modal();
    if (!m) return;
    m.querySelector('#detalhesTitulo').textContent = item.titulo;
    m.querySelector('#detalhesPreco').textContent = formatBRL(item.preco);
    m.querySelector('#detalhesAvaliacao').textContent = `⭐ ${item.avaliacao.toFixed(1)}`;
    m.querySelector('#detalhesVendedor').textContent = item.vendedor?.nome || '-';
    m.querySelector('#detalhesDescricao').textContent = item.descricao;
    m.querySelector('#detalhesMedia').textContent = item.media?.emoji ?? '🛒';
    m.setAttribute('open', 'true');
    m.style.display = 'block';
  },
  fechar() {
    const m = $.modal();
    if (!m) return;
    m.removeAttribute('open');
    m.style.display = 'none';
  },
};

// ------------------------------ Eventos --------------------------------
function registrarEventos() {
  // busca
  const busca = $.busca();
  if (busca) {
    busca.addEventListener('input', (e) => {
      state.filtroBusca = e.target.value.trim();
      aplicarFiltros();
    });
  }

  // categoria
  const categorias = $.categorias();
  if (categorias) {
    categorias.addEventListener('change', (e) => {
      state.filtroCategoria = e.target.value;
      aplicarFiltros();
    });
  }

  // ordenação
  const ordenacao = $.ordenacao();
  if (ordenacao) {
    ordenacao.addEventListener('change', (e) => {
      state.ordenacao = e.target.value;
      aplicarFiltros();
    });
  }

  // chips toggle
  const chipsContainer = $.chips();
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-chip]');
      if (!chip) return;
      const id = chip.getAttribute('data-chip');
      if (state.chipsAtivos.has(id)) {
        state.chipsAtivos.delete(id);
        chip.classList.remove('active');
      } else {
        state.chipsAtivos.add(id);
        chip.classList.add('active');
      }
      aplicarFiltros();
    });
  }

  // Delegação: clique no botão "Ver detalhes" dentro dos cards
  document.getElementById('grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-acao="detalhes"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const item = state.anuncios.find(a => a.id === id);
    if (item) modal.abrir(item);
  });

  // Fechar modal
  document.getElementById('fecharModal')?.addEventListener('click', () => modal.fechar());

  // Simulação de compra
  document.getElementById('btnSimularCompra')?.addEventListener('click', () => {
    const titulo = document.getElementById('detalhesTitulo')?.textContent;
    alert(`Compra simulada com sucesso! Produto: ${titulo}`);
    modal.fechar();
  });

  // Adicionar ao carrinho (simulação)
  document.getElementById('btnAdicionarCarrinho')?.addEventListener('click', () => {
    const titulo = document.getElementById('detalhesTitulo')?.textContent;
    state.carrinho.push(titulo);
    alert(`Adicionado ao carrinho: ${titulo}\nItens no carrinho: ${state.carrinho.length}`);
  });
}

// ------------------------------- Inicialização ---------------------------
async function init() {
  // Carrega dados
  state.anuncios = await DataSource.listarAnuncios();

  // Render dinâmico
  renderCategorias(state.anuncios);
  renderChips(state.anuncios);

  // Estado inicial: ordena por relevância e renderiza
  aplicarFiltros();

  // Registra interações
  registrarEventos();
}

// Aguarda DOM pronto antes de iniciar.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* -------------------------- Dicas de Evolução ---------------------------
- API/Back-end:
  • Substituir DataSource.listarAnuncios por fetch('/api/anuncios') com paginação.
  • Implementar cache (SW/IndexedDB) e fallback offline.
  • Validar dados com Zod/TypeScript para tipagem estática.

- Layout/Responsividade:
  • Usar CSS Grid responsivo no #grid (minmax, auto-fit) e clamp para fontes.
  • Suportar tema claro/escuro via prefers-color-scheme e toggle.

- Performance:
  • Virtualização de lista para catálogos grandes (IntersectionObserver).
  • Debounce na busca (200–300ms) e memoização de filtros.

- SEO/Acessibilidade:
  • Marcup semântico (main, article, header), microdados JSON-LD dos produtos.
  • Foco gerenciado ao abrir modal (aria-modal, role="dialog") e trap de foco.

- Autenticação/Pagamentos:
  • Login (OAuth/email) e perfis; guardar carrinho/log de pedidos.
  • Integração de pagamentos (ex: Stripe/Pagar.me/Pix) com webhooks e antifraude.

- Observabilidade/Qualidade:
  • Telemetria (Vitest + coverage), logs de UI, monitoramento de erros (Sentry).
*/
