/* ======new features====================================================

   1. API product fetch (FakeStoreAPI)
   2. Pagination
   3. Search + Price +rating filter
   4. Add to Cart (LocalStorage)
   5. Product Detail dynamic load
   6. Dynamic Cart with qty, remove, total
   ========================================================== */
'use strict';

/* ── CONFIG ─────────────────────────────────────────────── */
const API_BASE      = 'https://fakestoreapi.com/products';
const CART_KEY      = 'brand_cart';
const PID_KEY       = 'brand_pid';
const SEARCH_KEY    = 'brand_search';
const ITEMS_PER_PAGE = 6;

/* ── GLOBAL STATE ────────────────────────────────────────── */
let allProducts   = [];
let filteredProds = [];
let currentPage   = 1;
let itemsPerPage  = ITEMS_PER_PAGE;

/* ==========================================================
   BOOT
  ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  bindHeaderSearch();

  /* Page detection — works with file:// and http:// */
  const path = location.pathname + location.search;
  const page = location.pathname.split('/').pop() || 'index.html';

  if (page === 'grid-listing.html') {
    initGridPage();
  } else if (page === 'listing.html') {
    initListingPage();
  } else if (page === 'product-detail.html') {
    initDetailPage();
  } else if (page === 'cart.html') {
    initCartPage();
  } else {
    /* index.html or root */
    initHomePage();
  }
});

/*==========================================================
   TOAST
  ========================================================== */
function toast(msg, type = 'success') {
  let el = document.getElementById('brand-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'brand-toast';
    Object.assign(el.style, {
      position:'fixed', bottom:'24px', right:'24px', zIndex:'9999',
      padding:'12px 20px', borderRadius:'8px', fontSize:'14px',
      fontWeight:'600', color:'#fff', maxWidth:'320px',
      boxShadow:'0 4px 16px rgba(0,0,0,.18)', transition:'opacity .3s',
      opacity:'0', pointerEvents:'none', fontFamily:'inherit'
    });
    document.body.appendChild(el);
  }
  el.style.background = type === 'error' ? '#EF4444' : type === 'info' ? '#2563EB' : '#16A34A';
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 2800);
}

/*==========================================================
   SKELETON
  ========================================================== */
function skeletonGrid(n = 6) {
  const card = `
    <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;animation:skPulse 1.4s ease-in-out infinite;">
      <div style="height:180px;background:#F3F4F6;"></div>
      <div style="padding:14px;">
        <div style="height:13px;background:#E5E7EB;border-radius:4px;margin-bottom:8px;"></div>
        <div style="height:13px;background:#E5E7EB;border-radius:4px;width:55%;margin-bottom:12px;"></div>
        <div style="height:34px;background:#E5E7EB;border-radius:8px;"></div>
      </div>
    </div>`;
  return `<style>@keyframes skPulse{0%,100%{opacity:1}50%{opacity:.45}}</style>` + card.repeat(n);
}

function skeletonList(n = 5) {
  const row = `
    <div style="display:flex;gap:16px;padding:16px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:12px;animation:skPulse 1.4s ease-in-out infinite;">
      <div style="width:140px;height:140px;background:#F3F4F6;border-radius:8px;flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="height:14px;background:#E5E7EB;border-radius:4px;margin-bottom:10px;"></div>
        <div style="height:14px;background:#E5E7EB;border-radius:4px;width:40%;margin-bottom:10px;"></div>
        <div style="height:12px;background:#E5E7EB;border-radius:4px;margin-bottom:6px;"></div>
        <div style="height:12px;background:#E5E7EB;border-radius:4px;width:70%;"></div>
      </div>
    </div>`;
  return `<style>@keyframes skPulse{0%,100%{opacity:1}50%{opacity:.45}}</style>` + row.repeat(n);
}

/*==========================================================
   API
  ========================================================== */
async function fetchProducts() {
  if (allProducts.length) return allProducts;
  const r = await fetch(API_BASE);
  if (!r.ok) throw new Error('API ' + r.status);
  allProducts = await r.json();
  return allProducts;
}

/*==========================================================
   CART  (LocalStorage)
  ========================================================== */
function getCart()       { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(c)     { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartBadge(); }

function updateCartBadge() {
  const n = getCart().reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cart-counter').forEach(el => el.textContent = `My cart (${n})`);
}

window.addToCart = function(id, title, price, image, category) {
  const cart = getCart();
  const hit  = cart.find(i => i.id === id);
  if (hit) { hit.qty++; } else { cart.push({ id, title, price: +price, image, category: category || '', qty: 1 }); }
  saveCart(cart);
  toast(`"${title.substring(0, 30)}…" added to cart! 🛒`);
};

window.goToDetail = function(id) {
  localStorage.setItem(PID_KEY, id);
  location.href = 'product-detail.html';
};

window.viewCart = function() { location.href = 'cart.html'; };

/*==========================================================
   HEADER SEARCH  (all pages)
  ========================================================== */
function bindHeaderSearch() {
  const inp = document.getElementById('searchInput') || document.querySelector('.search-bar input');
  const btn = document.querySelector('.search-btn, .search-bar button');
  if (!inp || !btn) return;

  const go = () => {
    const q = inp.value.trim();
    if (!q) return;
    localStorage.setItem(SEARCH_KEY, q);
    location.href = 'grid-listing.html';
  };
  btn.addEventListener('click', go);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}

/*==========================================================
   STAR HELPER
  ========================================================== */
function stars(rate) {
  const r = Math.round(+rate || 4);
  return Array.from({length:5}, (_,i) => `<span style="color:${i<r?'#F59E0B':'#D1D5DB'}">★</span>`).join('');
}

/*==========================================================
   HOME PAGE
  ========================================================== */
async function initHomePage() {
  const grid = document.querySelector('.rec-grid');
  if (!grid) return;
  grid.innerHTML = skeletonGrid(10);

  try {
    const prods = await fetchProducts();
    grid.innerHTML = '';
    prods.slice(0, 10).forEach(p => grid.insertAdjacentHTML('beforeend', homeCard(p)));
    startCountdown();
  } catch(e) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:#EF4444;">Failed to load products. Check your connection.</p>`;
  }
}

function homeCard(p) {
  const t = esc(p.title), img = esc(p.image), cat = esc(p.category || '');
  return `
    <div class="rec-card" style="display:flex;flex-direction:column;height:100%;">
      <div onclick="goToDetail(${p.id})" style="cursor:pointer;flex:1;">
        <img src="${p.image}" alt="${p.title}" loading="lazy"
             style="width:100%;height:160px;object-fit:contain;padding:14px;background:#F9FAFB;">
        <div class="rec-card-info">
          <p class="rec-price">$${p.price.toFixed(2)}</p>
          <p class="rec-name" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.title}</p>
          <div style="margin-top:5px;font-size:12px;">${stars(p.rating?.rate)}
            <span style="color:#9CA3AF;margin-left:3px;">(${p.rating?.count||0})</span>
          </div>
        </div>
      </div>
      <div style="padding:10px;border-top:1px solid #F3F4F6;">
        <button onclick="addToCart(${p.id},'${t}',${p.price},'${img}','${cat}')"
                class="btn-blue" style="width:100%;padding:7px;font-size:12px;border-radius:6px;">
          🛒 Add to Cart
        </button>
      </div>
    </div>`;
}

function startCountdown() {
  const boxes = document.querySelectorAll('.tbox');
  if (!boxes.length) return;
  const labels = ['Days','Hour','Min','Sec'];
  let secs = 4*86400 + 13*3600 + 34*60 + 56;
  function tick() {
    secs = Math.max(0, secs - 1);
    const v = [Math.floor(secs/86400), Math.floor(secs%86400/3600), Math.floor(secs%3600/60), secs%60];
    boxes.forEach((b,i) => b.innerHTML = `<span class="tv">${String(v[i]).padStart(2,'0')}</span><span class="tl">${labels[i]}</span>`);
  }
  tick(); setInterval(tick, 1000);
}

/*==========================================================
   LISTING PAGE  (list view — listing.html)
  ========================================================== */
async function initListingPage() {
  const wrap = document.querySelector('.product-list');
  if (!wrap) return;
  wrap.innerHTML = skeletonList(5);

  try {
    await fetchProducts();
    filteredProds = [...allProducts];
    bindListingFilters();
    applySort();
    renderListPage();
  } catch(e) {
    wrap.innerHTML = `<p style="text-align:center;padding:40px;color:#EF4444;">Failed to load products.</p>`;
  }
}

function renderListPage() {
  const wrap = document.querySelector('.product-list');
  if (!wrap) return;
  const page = paginate(filteredProds);

  if (!page.length) {
    wrap.innerHTML = emptyHTML();
    buildPagination('.pagination-wrap', filteredProds.length, renderListPage);
    return;
  }
  wrap.innerHTML = page.map(listCard).join('');
  updateToolbarCount();
  buildPagination('.pagination-wrap', filteredProds.length, renderListPage);
}

function listCard(p) {
  const t = esc(p.title), img = esc(p.image), cat = esc(p.category||'');
  return `
    <div class="product-card" style="display:flex;align-items:flex-start;gap:20px;padding:16px;">
      <img class="product-img" src="${p.image}" alt="${p.title}" loading="lazy"
           onclick="goToDetail(${p.id})" style="cursor:pointer;flex-shrink:0;">
      <div class="product-info" style="flex:1;min-width:0;">
        <div class="product-name" onclick="goToDetail(${p.id})" style="cursor:pointer;">${p.title}</div>
        <div style="display:flex;align-items:center;gap:10px;margin:6px 0;">
          <span style="font-size:19px;font-weight:800;">$${p.price.toFixed(2)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;font-size:13px;">
          <span>${stars(p.rating?.rate)}</span>
          <span style="color:#F59E0B;font-weight:600;">${p.rating?.rate||4}</span>
          <span style="color:#D1D5DB;">•</span>
          <span style="color:#6B7280;">${p.rating?.count||0} orders</span>
          <span style="color:#D1D5DB;">•</span>
          <span style="color:#16A34A;font-weight:500;">Free Shipping</span>
        </div>
        <div class="product-desc">${p.description.substring(0,130)}…</div>
        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
          <button onclick="goToDetail(${p.id})" class="btn-details">View details</button>
          <button onclick="addToCart(${p.id},'${t}',${p.price},'${img}','${cat}')"
                  class="btn-blue" style="padding:6px 14px;font-size:12px;border-radius:6px;">🛒 Add to Cart</button>
        </div>
      </div>
      <button class="btn-wish" onclick="this.classList.toggle('liked');this.querySelector('path').style.fill=this.classList.contains('liked')?'#2563EB':'none'">
        <svg viewBox="0 0 24 24" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      </button>
    </div>`;
}

function bindListingFilters() {
  /* sort */
  const ss = document.querySelector('.sort-select');
  if (ss) ss.addEventListener('change', () => { applySort(); currentPage=1; renderListPage(); });

  /* price apply */
  const ap = document.querySelector('.btn-apply');
  if (ap) ap.addEventListener('click', () => { applyAllFilters(); currentPage=1; renderListPage(); });

  /* any checkbox/radio in sidebar */
  document.querySelectorAll('.sidebar input, .filter-body input').forEach(inp => {
    inp.addEventListener('change', () => { applyAllFilters(); currentPage=1; renderListPage(); });
  });

  /* inline search on listing page (same search bar) */
  const sin = document.getElementById('searchInput') || document.querySelector('.search-bar input');
  const sbt = document.querySelector('.search-btn, .search-bar button');
  if (sin && sbt) {
    const run = () => { applyAllFilters(); currentPage=1; renderListPage(); };
    sbt.addEventListener('click', run);
    sin.addEventListener('keydown', e => { if(e.key==='Enter') run(); });
  }
}

/*==========================================================
   GRID-LISTING PAGE  (grid-listing.html)   ← MAIN FIX
  ========================================================== */
async function initGridPage() {
  /* ── target containers ── */
  const grid = document.getElementById('products-grid-container')
             || document.querySelector('.products-grid');
  const paginationWrap = document.getElementById('grid-pagination')
                       || document.querySelector('.pagination-wrap');

  if (!grid) { console.error('[Grid] .products-grid not found'); return; }

  /* show skeleton */
  grid.innerHTML = skeletonGrid(6);

  try {
    await fetchProducts();
    filteredProds = [...allProducts];

    /* ── restore saved search ── */
    const savedQ = localStorage.getItem(SEARCH_KEY);
    if (savedQ) {
      const inp = document.getElementById('searchInput') || document.querySelector('.search-bar input');
      if (inp) inp.value = savedQ;
      localStorage.removeItem(SEARCH_KEY);
    }

    applyAllFilters();   /* populates filteredProds, then calls renderGridPage() */
    bindGridFilters();

  } catch(e) {
    console.error('[Grid] fetch error:', e);
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
      <h3 style="color:#374151;margin-bottom:8px;">Failed to load products</h3>
      <p style="color:#9CA3AF;">Please check your internet connection and refresh.</p>
    </div>`;
  }
}

function renderGridPage() {
  const grid = document.getElementById('products-grid-container')
             || document.querySelector('.products-grid');
  if (!grid) return;

  const page = paginate(filteredProds);

  if (!page.length) {
    grid.innerHTML = emptyHTML(true);
    buildPaginationGrid();
    return;
  }

  grid.innerHTML = page.map(gridCard).join('');
  updateToolbarCount();
  buildPaginationGrid();
}

function gridCard(p) {
  const t   = esc(p.title);
  const img = esc(p.image);
  const cat = esc(p.category || '');
  const truncTitle = p.title.length > 52 ? p.title.substring(0, 52) + '…' : p.title;
  return `
    <article class="product-card">
      <div class="product-image" onclick="goToDetail(${p.id})" style="cursor:pointer;">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
      </div>
      <div class="product-body">
        <h3 class="product-title" onclick="goToDetail(${p.id})" style="cursor:pointer;" title="${p.title}">
          ${truncTitle}
        </h3>
        <div style="margin-bottom:8px;">
          <span style="font-size:18px;font-weight:800;color:#1F2937;">$${p.price.toFixed(2)}</span>
        </div>
        <div class="product-meta">
          <span>${stars(p.rating?.rate)}</span>
          <span style="color:#F59E0B;font-weight:600;">${p.rating?.rate || 4}</span>
          <span style="color:#16A34A;">• Free Ship</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button onclick="goToDetail(${p.id})"
                  style="flex:1;padding:9px 8px;border:1.5px solid #2563EB;color:#2563EB;background:white;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;transition:all .2s;"
                  onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background='white'">
            👁 View
          </button>
          <button onclick="addToCart(${p.id},'${t}',${p.price},'${img}','${cat}')"
                  class="btn-blue"
                  style="flex:1;padding:9px 8px;font-size:12px;border-radius:8px;border:none;">
            🛒 Add
          </button>
        </div>
      </div>
    </article>`;
}

function bindGridFilters() {
  /* Sort */
  const ss = document.querySelector('.sort-select');
  if (ss) ss.addEventListener('change', () => { applyAllFilters(); currentPage = 1; });

  /* Price apply button */
  const ap = document.querySelector('.btn-apply');
  if (ap) ap.addEventListener('click', () => { applyAllFilters(); currentPage = 1; });

  /* All sidebar checkboxes/radios */
  document.querySelectorAll('.sidebar input, .filter-body input').forEach(inp => {
    inp.addEventListener('change', () => { applyAllFilters(); currentPage = 1; });
  });

  /* Inline search bar on grid page */
  const sin = document.getElementById('searchInput') || document.querySelector('.search-bar input');
  const sbt = document.querySelector('.search-btn, .search-bar button');
  if (sin && sbt) {
    sbt.addEventListener('click', () => { applyAllFilters(); currentPage = 1; });
    sin.addEventListener('keydown', e => { if (e.key === 'Enter') { applyAllFilters(); currentPage = 1; } });
  }
}

/* ── Grid Pagination ── */
function buildPaginationGrid() {
  const wrap = document.getElementById('grid-pagination') || document.querySelector('.pagination-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  const total = Math.ceil(filteredProds.length / itemsPerPage);

  /* Show select */
  const ss = document.createElement('select');
  ss.className = 'show-select';
  [6, 12, 24].forEach(n => {
    const o = document.createElement('option');
    o.value = n;
    o.textContent = `Show ${n}`;
    if (n === itemsPerPage) o.selected = true;
    ss.appendChild(o);
  });
  ss.addEventListener('change', e => { itemsPerPage = +e.target.value; currentPage = 1; renderGridPage(); });
  wrap.appendChild(ss);

  const btnWrap = document.createElement('div');
  btnWrap.className = 'page-btns';
  wrap.appendChild(btnWrap);

  /* Prev */
  addPageBtn(btnWrap, '‹', currentPage === 1, () => { currentPage--; renderGridPage(); scrollTop(); });

  /* Pages */
  const maxShow = 5;
  let lo = Math.max(1, currentPage - 2);
  let hi = Math.min(total, lo + maxShow - 1);
  if (hi - lo < maxShow - 1) lo = Math.max(1, hi - maxShow + 1);

  if (lo > 1) {
    addPageBtn(btnWrap, '1', false, () => { currentPage=1; renderGridPage(); scrollTop(); });
    if (lo > 2) btnWrap.insertAdjacentHTML('beforeend', '<span style="padding:0 4px;color:#9CA3AF;">…</span>');
  }
  for (let i = lo; i <= hi; i++) {
    const active = i === currentPage;
    addPageBtn(btnWrap, String(i), false, () => { currentPage=i; renderGridPage(); scrollTop(); }, active);
  }
  if (hi < total) {
    if (hi < total - 1) btnWrap.insertAdjacentHTML('beforeend', '<span style="padding:0 4px;color:#9CA3AF;">…</span>');
    addPageBtn(btnWrap, String(total), false, () => { currentPage=total; renderGridPage(); scrollTop(); });
  }

  /* Next */
  addPageBtn(btnWrap, '›', currentPage === total, () => { currentPage++; renderGridPage(); scrollTop(); });
}

function addPageBtn(parent, text, disabled, onClick, active = false) {
  const b = document.createElement('button');
  b.className = 'page-btn' + (active ? ' active' : '');
  b.textContent = text;
  b.disabled = disabled;
  if (!disabled) b.addEventListener('click', onClick);
  parent.appendChild(b);
}

/*==========================================================
   SHARED FILTER & SORT
  ========================================================== */
function applyAllFilters() {
  let res = [...allProducts];

  /* 1. Search query */
  const q = (
    (document.getElementById('searchInput') || document.querySelector('.search-bar input'))?.value || ''
  ).toLowerCase().trim();
  if (q) {
    res = res.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  /* 2. Price range */
  const pMin = parseFloat(document.getElementById('pmin')?.value) || 0;
  const pMax = parseFloat(document.getElementById('pmax')?.value) || Infinity;
  if (pMin || pMax < Infinity) res = res.filter(p => p.price >= pMin && p.price <= pMax);

  /* 3. Rating checkboxes */
  const rCBs = [...document.querySelectorAll('.filter-item input[type="checkbox"]')].filter(c => c.checked);
  if (rCBs.length) {
    const minRatings = rCBs.map(c => {
      const filled = c.closest('.filter-item')?.querySelectorAll('.star:not(.empty)').length || 0;
      return filled;
    }).filter(r => r > 0);
    if (minRatings.length) {
      const minR = Math.min(...minRatings);
      res = res.filter(p => (p.rating?.rate || 0) >= minR);
    }
  }

  filteredProds = res;
  applySort();

  /* render on right page */
  const page = location.pathname.split('/').pop();
  if (page === 'grid-listing.html') renderGridPage();
  else if (page === 'listing.html')  renderListPage();
}

function applySort() {
  const v = document.querySelector('.sort-select')?.value || '';
  if (v.includes('Low to High'))  filteredProds.sort((a,b) => a.price - b.price);
  else if (v.includes('High to Low')) filteredProds.sort((a,b) => b.price - a.price);
  else if (v.includes('Newest'))  filteredProds.sort((a,b) => b.id - a.id);
}

/* ── Shared pagination helper for listing page ── */
function buildPagination(selector, total, renderFn) {
  const wrap = document.querySelector(selector);
  if (!wrap) return;
  const pages = Math.ceil(total / itemsPerPage);
  let btnDiv = wrap.querySelector('.page-btns');
  if (!btnDiv) { btnDiv = document.createElement('div'); btnDiv.className = 'page-btns'; wrap.appendChild(btnDiv); }
  btnDiv.innerHTML = '';

  addPageBtn(btnDiv, '‹', currentPage===1, () => { currentPage--; renderFn(); scrollTop(); });
  for (let i = 1; i <= pages; i++) {
    addPageBtn(btnDiv, String(i), false, () => { currentPage=i; renderFn(); scrollTop(); }, i===currentPage);
  }
  addPageBtn(btnDiv, '›', currentPage===pages, () => { currentPage++; renderFn(); scrollTop(); });
}

function paginate(arr) {
  return arr.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
}

function updateToolbarCount() {
  const el = document.querySelector('.toolbar-count');
  if (el) el.innerHTML = `<strong>${filteredProds.length}</strong> products found`;
}

function emptyHTML(isGrid = false) {
  const col = isGrid ? 'grid-column:1/-1;' : '';
  return `<div style="${col}text-align:center;padding:60px 20px;">
    <div style="font-size:48px;margin-bottom:14px;">🔍</div>
    <h3 style="color:#374151;margin-bottom:8px;">No products found</h3>
    <p style="color:#9CA3AF;margin-bottom:20px;">Try adjusting your search or filters.</p>
    <button onclick="clearFilters()" class="btn-blue" style="padding:10px 24px;border-radius:8px;border:none;">
      Clear Filters
    </button>
  </div>`;
}

window.clearFilters = function() {
  document.querySelectorAll('.filter-item input').forEach(i => { i.checked = false; });
  const pmin = document.getElementById('pmin'); if (pmin) pmin.value = '';
  const pmax = document.getElementById('pmax'); if (pmax) pmax.value = '';
  const sin  = document.getElementById('searchInput') || document.querySelector('.search-bar input');
  if (sin) sin.value = '';
  filteredProds = [...allProducts];
  currentPage = 1;
  const page = location.pathname.split('/').pop();
  if (page === 'grid-listing.html') renderGridPage();
  else renderListPage();
};

function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

/*==========================================================
   PRODUCT DETAIL PAGE
  ========================================================== */
async function initDetailPage() {
  const pid = localStorage.getItem(PID_KEY);
  if (!pid) { location.href = 'grid-listing.html'; return; }

  try {
    const r = await fetch(`${API_BASE}/${pid}`);
    const p = await r.json();
    populateDetail(p);
    loadRelated(p.category, p.id);
  } catch(e) {
    toast('Failed to load product.', 'error');
  }
}

function populateDetail(p) {
  document.title = p.title.substring(0,50) + ' — Brand';

  /* main image */
  const mi = document.getElementById('mainImg') || document.querySelector('.gallery-main img');
  if (mi) { mi.src = p.image; mi.alt = p.title; }

  /* thumbs */
  document.querySelectorAll('.gallery-thumbs .thumb').forEach(th => {
    const img = th.querySelector('img');
    if (img) { img.src = p.image; img.alt = p.title; }
    th.onclick = () => changeImg(th, p.image);
  });

  /* name */
  const nm = document.querySelector('.product-name');
  if (nm) nm.textContent = p.title;

  /* rating */
  const rn = document.querySelector('.rating-num');
  if (rn) rn.textContent = p.rating?.rate || '4.5';

  /* reviews */
  const rv = document.querySelector('.reviews-link');
  if (rv) rv.innerHTML = `<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:#9CA3AF;fill:none;"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> ${p.rating?.count||32} reviews`;

  /* price tiers */
  const pts = document.querySelectorAll('.price-tier .pt-price');
  if (pts[0]) pts[0].textContent = `$${(p.price*1.15).toFixed(2)}`;
  if (pts[1]) pts[1].textContent = `$${p.price.toFixed(2)}`;
  if (pts[2]) pts[2].textContent = `$${(p.price*0.88).toFixed(2)}`;

  /* specs */
  const st = document.querySelector('.specs-table');
  if (st) st.innerHTML = `
    <tr><td>Price:</td><td>$${p.price.toFixed(2)}</td></tr>
    <tr><td>Category:</td><td style="text-transform:capitalize;">${p.category}</td></tr>
    <tr><td>Rating:</td><td>${p.rating?.rate||4.5} / 5</td></tr>
    <tr><td>Reviews:</td><td>${p.rating?.count||0}</td></tr>
    <tr><td>Condition:</td><td>Brand New</td></tr>
    <tr><td>Shipping:</td><td>Free Worldwide</td></tr>
    <tr><td>Warranty:</td><td>2 years full warranty</td></tr>`;

  /* description tab */
  const dt = document.querySelector('#tab-desc .desc-text');
  if (dt) dt.textContent = p.description;

  /* Add-to-cart on inquiry button */
  const t = esc(p.title), img = esc(p.image), cat = esc(p.category||'');
  const ib = document.querySelector('.btn-inquiry');
  if (ib) { ib.textContent = '🛒 Add to Cart'; ib.onclick = () => addToCart(p.id,p.title,p.price,p.image,p.category); }

  /* Mobile view */
  const mn = document.querySelector('.mob-product-name'); if (mn) mn.textContent = p.title;
  const mp = document.querySelector('.mob-price-tag');    if (mp) mp.textContent = `$${p.price.toFixed(2)}`;
  const md = document.querySelector('.mob-desc-text');    if (md) md.textContent = p.description;
  const mg = document.querySelector('.mob-gallery img');  if (mg) { mg.src = p.image; mg.alt = p.title; }
  const mi2= document.querySelector('.mob-btn-inquiry');  if (mi2){ mi2.textContent='🛒 Add to Cart'; mi2.onclick=()=>addToCart(p.id,p.title,p.price,p.image,p.category); }
}

async function loadRelated(category, currentId) {
  try {
    const r = await fetch(`${API_BASE}/category/${encodeURIComponent(category)}`);
    const list = (await r.json()).filter(p => p.id !== +currentId).slice(0, 6);

    /* related grid */
    const rg = document.querySelector('.related-grid');
    if (rg) rg.innerHTML = list.map(p => `
      <div class="related-card" onclick="goToDetail(${p.id})" style="cursor:pointer;">
        <div class="rc-img"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>
        <div class="rc-info"><p>${p.title.substring(0,30)}…</p><span>$${p.price.toFixed(2)}</span></div>
      </div>`).join('');

    /* you may like */
    const yl = document.querySelector('.you-like-card');
    if (yl) yl.innerHTML = `<h4>You may like</h4>` + list.slice(0,5).map(p => `
      <div class="like-item" onclick="goToDetail(${p.id})" style="cursor:pointer;">
        <img class="like-img" src="${p.image}" alt="${p.title}" loading="lazy">
        <div class="like-info"><p>${p.title.substring(0,36)}…</p><span>$${p.price.toFixed(2)}</span></div>
      </div>`).join('');

    /* mobile similar */
    const ms = document.querySelector('.mob-similar-scroll');
    if (ms) ms.innerHTML = list.map(p => `
      <div class="mob-similar-card" onclick="goToDetail(${p.id})" style="cursor:pointer;">
        <div class="msc-img"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>
        <div class="msc-info"><div class="msc-price">$${p.price.toFixed(2)}</div><div class="msc-name">${p.title}</div></div>
      </div>`).join('');
  } catch(_) {}
}

/*==========================================================
   CART PAGE
  ========================================================== */
function initCartPage() {
  renderDesktopCart();
  renderMobileCart();
  bindCartEvents();
}

/* ── Desktop Cart ── */
function renderDesktopCart() {
  const card  = document.querySelector('.cart-card');
  const title = document.querySelector('.page-title');
  const cart  = getCart();

  if (title) title.textContent = `My cart (${cart.length})`;
  if (!card) return;

  if (!cart.length) {
    card.innerHTML = emptyCartHTML();
    renderSummary(0,0,0,0,0);
    return;
  }
  card.innerHTML = cart.map(desktopCartItem).join('');
  recalc();
}

function desktopCartItem(item) {
  const opts = Array.from({length:10},(_,i)=>i+1)
    .map(n=>`<option value="${n}" ${n===item.qty?'selected':''}>${n}</option>`).join('');
  return `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-img" src="${item.image}" alt="${item.title}">
      <div class="cart-info">
        <div class="cart-name">${item.title}</div>
        <div class="cart-meta">Category: ${item.category || 'General'} &nbsp;|&nbsp; Unit price: $${item.price.toFixed(2)}</div>
        <div class="cart-seller">Seller: Brand Market</div>
        <div class="cart-actions">
          <button class="btn-remove" onclick="removeItem(${item.id})">Remove</button>
          <button class="btn-save" onclick="toast('Saved for later!','info')">Save for later</button>
        </div>
      </div>
      <div class="cart-right">
        <span class="cart-price">$${(item.price*item.qty).toFixed(2)}</span>
        <select class="qty-select" onchange="setQty(${item.id},+this.value)">
          <option disabled>Qty</option>${opts}
        </select>
      </div>
    </div>`;
}

function emptyCartHTML() {
  return `<div style="text-align:center;padding:60px 20px;">
    <div style="font-size:64px;margin-bottom:16px;">🛒</div>
    <h3 style="margin-bottom:8px;color:#374151;">Your cart is empty</h3>
    <p style="color:#9CA3AF;margin-bottom:20px;">Browse products and add something you like!</p>
    <a href="grid-listing.html" class="btn-blue" style="text-decoration:none;padding:12px 28px;display:inline-block;border-radius:8px;">
      Continue Shopping
    </a>
  </div>`;
}

/* ── Mobile Cart ── */
function renderMobileCart() {
  const sec  = document.querySelector('.mob-cart-section');
  const cart = getCart();
  if (!sec) return;

  if (!cart.length) {
    sec.innerHTML = `<div style="text-align:center;padding:48px 20px;">
      <div style="font-size:52px;margin-bottom:12px;">🛒</div>
      <h3 style="color:#374151;margin-bottom:8px;">Cart is empty</h3>
      <a href="grid-listing.html" style="color:#2563EB;font-weight:600;">Browse products →</a>
    </div>`;
    updateMobileSummary(0,0,0,0,0);
    return;
  }

  sec.innerHTML = cart.map(mobileCartItem).join('');
  const [s,d,t,sh,tot] = calcTotals(cart);
  updateMobileSummary(s,d,t,sh,tot);
}

function mobileCartItem(item) {
  return `
    <div class="mob-cart-item" data-id="${item.id}">
      <img class="mob-item-img" src="${item.image}" alt="${item.title}">
      <div class="mob-item-info">
        <div class="mob-item-name">${item.title.substring(0,46)}…</div>
        <div class="mob-item-meta">Category: ${item.category||'General'}</div>
        <div class="mob-item-seller">$${item.price.toFixed(2)} / unit</div>
        <div class="mob-qty-price">
          <div class="mob-qty-ctrl">
            <button class="mob-qty-btn" onclick="setQty(${item.id},${item.qty-1})">−</button>
            <input class="mob-qty-num" type="number" value="${item.qty}" min="1" max="99"
                   onchange="setQty(${item.id},+this.value||1)">
            <button class="mob-qty-btn" onclick="setQty(${item.id},${item.qty+1})">+</button>
          </div>
          <span class="mob-item-price">$${(item.price*item.qty).toFixed(2)}</span>
        </div>
      </div>
      <button class="mob-dots" onclick="removeItem(${item.id})" title="Remove item"
              style="color:#EF4444;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>`;
}

/* ── Cart actions ── */
window.removeItem = function(id) {
  saveCart(getCart().filter(i => i.id !== id));
  renderDesktopCart(); renderMobileCart();
};
window.setQty = function(id, qty) {
  if (qty < 1) { removeItem(id); return; }
  const c = getCart();
  const h = c.find(i => i.id === id);
  if (h) { h.qty = Math.min(qty,99); saveCart(c); renderDesktopCart(); renderMobileCart(); }
};
window.removeAllItems = function() {
  if (!confirm('Remove all items from cart?')) return;
  saveCart([]); renderDesktopCart(); renderMobileCart();
  toast('Cart cleared.');
};

/* ── Totals ── */
function calcTotals(cart) {
  const sub  = cart.reduce((s,i) => s + i.price*i.qty, 0);
  const disc = sub > 200 ? sub * 0.05 : 0;
  const tax  = (sub - disc) * 0.05;
  const ship = sub > 100 ? 0 : 15;
  return [sub, disc, tax, ship, sub - disc + tax + ship];
}
function recalc() {
  const [s,d,t,sh,tot] = calcTotals(getCart());
  renderSummary(s,d,t,sh,tot);
  updateMobileSummary(s,d,t,sh,tot);
}

function renderSummary(sub, disc, tax, ship, total) {
  const el = document.querySelector('.summary-card');
  if (!el) return;
  el.innerHTML = `
    <div class="summary-row"><span>Subtotal:</span><span>$${sub.toFixed(2)}</span></div>
    ${disc>0?`<div class="summary-row"><span>Discount (5%):</span><span class="discount-val">-$${disc.toFixed(2)}</span></div>`:''}
    <div class="summary-row"><span>Tax (5%):</span><span class="tax-val">+$${tax.toFixed(2)}</span></div>
    <div class="summary-row"><span>Shipping:</span><span>${ship===0?'<span style="color:#16A34A;font-weight:600;">FREE</span>':'$'+ship.toFixed(2)}</span></div>
    <div class="summary-row total"><span>Total:</span><span>$${total.toFixed(2)}</span></div>
    <button class="btn-checkout" onclick="proceedToCheckout()">Checkout</button>
    <div class="payment-icons">
      <div class="pay-badge pay-amex" style="font-size:9px;">AMEX</div>
      <div class="pay-badge"><span style="color:#EB001B;font-size:14px;font-weight:900;">●</span><span style="color:#F79E1B;font-size:14px;font-weight:900;">●</span></div>
      <div class="pay-badge pay-pp" style="font-size:11px;font-weight:900;">P</div>
      <div class="pay-badge pay-visa" style="font-size:11px;font-weight:900;font-style:italic;">VISA</div>
      <div class="pay-badge pay-ap" style="font-size:9px;">🍎Pay</div>
    </div>`;
}

function updateMobileSummary(sub, disc, tax, ship, total) {
  const el = document.querySelector('.mob-summary-section');
  if (!el) return;
  const n = getCart().reduce((s,i)=>s+i.qty,0);
  el.innerHTML = `
    <div class="mob-summary-row"><span>Subtotal:</span><span>$${sub.toFixed(2)}</span></div>
    ${disc>0?`<div class="mob-summary-row"><span>Discount:</span><span style="color:#EF4444;">-$${disc.toFixed(2)}</span></div>`:''}
    <div class="mob-summary-row"><span>Tax (5%):</span><span>$${tax.toFixed(2)}</span></div>
    <div class="mob-summary-row"><span>Shipping:</span><span>${ship===0?'Free':'$'+ship.toFixed(2)}</span></div>
    <div class="mob-summary-row total-mob"><span>Total:</span><span>$${total.toFixed(2)}</span></div>
    <button class="mob-checkout-btn" onclick="proceedToCheckout()">Checkout (${n} items)</button>`;
}

function bindCartEvents() {
  const back = document.querySelector('.btn-back-shop');
  if (back) back.onclick = () => location.href = 'grid-listing.html';

  const rAll = document.querySelector('.btn-remove-all');
  if (rAll) rAll.onclick = window.removeAllItems;

  const couponBtn = document.querySelector('.btn-apply-coupon');
  if (couponBtn) couponBtn.onclick = () => {
    const v = (document.querySelector('.coupon-input')?.value||'').trim().toUpperCase();
    if (v==='SAVE10') toast('Coupon SAVE10 applied! 🎉');
    else toast('Invalid coupon code.','error');
  };

  const mobBack = document.querySelector('.mob-back');
  if (mobBack) mobBack.onclick = () => history.back();
}

window.proceedToCheckout = function() {
  const c = getCart();
  if (!c.length) { toast('Your cart is empty!','error'); return; }
  const [,,,, tot] = calcTotals(c);
  if (confirm(`✅ Order Total: $${tot.toFixed(2)}\n\nProceed to checkout? (Demo)`)) {
    saveCart([]);
    toast('Order placed successfully! 🎉');
    setTimeout(() => location.href = 'index.html', 1500);
  }
};

/*==========================================================
   UTILS
  ========================================================== */
function esc(str) { return String(str).replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

/* Expose for inline HTML use */
window.changeImg = function(thumb, src) {
  const m = document.getElementById('mainImg') || document.querySelector('.gallery-main img');
  if (m) { m.src = src; }
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  if (thumb) thumb.classList.add('active');
};

window.switchTab = function(tab, id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  tab.classList.add('active');
  const tc = document.getElementById('tab-'+id);
  if (tc) tc.classList.add('active');
};

window.handleSearch = function() {
  const inp = document.getElementById('searchInput') || document.querySelector('.search-bar input');
  const q   = inp?.value.trim();
  if (!q) return;
  localStorage.setItem(SEARCH_KEY, q);
  location.href = 'grid-listing.html';
};

/* expose toast globally */
window.toast = toast;