

'use strict';

// ─── GLOBAL STATE ───────────────────────────────────────────
const API_BASE   = 'https://fakestoreapi.com/products';
const CART_KEY   = 'brand_cart';
const PID_KEY    = 'brand_pid';

let allProducts    = [];   // full list from API
let filteredProds  = [];   // after search/filter
let currentPage    = 1;
let itemsPerPage   = 6;    // listing/grid pages
let currentSort    = 'default';

// ─── BOOT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  bindHeaderSearch();
  bindMobileDrawer();

  const p = window.location.pathname;

  if (isPage('index.html') || p === '/' || p.endsWith('/')) {
    initHomePage();
  } else if (isPage('listing.html')) {
    initListingPage();
  } else if (isPage('grid-listing.html')) {
    initGridPage();
  } else if (isPage('product-detail.html')) {
    initDetailPage();
  } else if (isPage('cart.html')) {
    initCartPage();
  }
});

function isPage(name) {
  return window.location.pathname.includes(name);
}

// ─── SHOW TOAST NOTIFICATION ────────────────────────────────
function showToast(msg, type = 'success') {
  let toast = document.getElementById('brand-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'brand-toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      padding:12px 20px; border-radius:8px; font-size:14px;
      font-weight:600; color:#fff; max-width:300px;
      box-shadow:0 4px 16px rgba(0,0,0,.18);
      transition:opacity .3s; opacity:0; pointer-events:none;
      font-family:'Plus Jakarta Sans',sans-serif;
    `;
    document.body.appendChild(toast);
  }
  toast.style.background = type === 'success' ? '#16A34A' : type === 'error' ? '#EF4444' : '#2563EB';
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ─── LOADING SKELETON ────────────────────────────────────────
function skeletonHTML(count = 6, card = 'grid') {
  const s = `
    <div style="background:#f3f4f6;border-radius:8px;overflow:hidden;animation:pulse 1.5s infinite;">
      <div style="height:160px;background:#e5e7eb;"></div>
      <div style="padding:12px;">
        <div style="height:12px;background:#e5e7eb;border-radius:4px;margin-bottom:8px;"></div>
        <div style="height:12px;background:#e5e7eb;border-radius:4px;width:60%;"></div>
      </div>
    </div>`;
  const style = `<style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}</style>`;
  return style + Array(count).fill(s).join('');
}

// ─── FETCH ALL PRODUCTS ──────────────────────────────────────
async function fetchAllProducts() {
  if (allProducts.length) return allProducts;
  const r = await fetch(API_BASE);
  if (!r.ok) throw new Error('API error');
  allProducts = await r.json();
  return allProducts;
}

// ─── HEADER SEARCH (all pages) ──────────────────────────────
function bindHeaderSearch() {
  const input = document.querySelector('.search-bar input');
  const btn   = document.querySelector('.search-btn');
  if (!input || !btn) return;

  const go = () => {
    const q = input.value.trim();
    if (!q) return;
    localStorage.setItem('brand_search', q);
    window.location.href = 'grid-listing.html';
  };
  btn.addEventListener('click', go);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}

// ─── MOBILE DRAWER ──────────────────────────────────────────
function bindMobileDrawer() {
  const toggle = document.querySelector('.mobile-nav-toggle');
  const drawer = document.getElementById('mobileDrawer');
  if (!toggle || !drawer) return;
  toggle.addEventListener('click', () => drawer.classList.add('open'));
}
window.closeDrawer = () => {
  const d = document.getElementById('mobileDrawer');
  if (d) d.classList.remove('open');
};

// ─── CART BADGE ─────────────────────────────────────────────
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const cart  = getCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cart-counter').forEach(el => {
    el.textContent = `My cart (${count})`;
  });
  // mobile badge if exists
  document.querySelectorAll('.mob-cart-count').forEach(el => {
    el.textContent = count;
  });
}

// ─── ADD TO CART ─────────────────────────────────────────────
window.addToCart = function(id, title, price, image, category) {
  const cart  = getCart();
  const found = cart.find(i => i.id === id);
  if (found) {
    found.qty += 1;
  } else {
    cart.push({ id, title, price: parseFloat(price), image, category: category || '', qty: 1 });
  }
  saveCart(cart);
  showToast(`"${title.substring(0, 28)}…" added to cart!`);
};

// ─── GO TO DETAIL ────────────────────────────────────────────
window.goToDetail = function(id) {
  localStorage.setItem(PID_KEY, id);
  window.location.href = 'product-detail.html';
};

// ─── VIEW CART ───────────────────────────────────────────────
window.viewCart = function() {
  window.location.href = 'cart.html';
};

/* ===========================================================
   HOME PAGE
   =========================================================== */
async function initHomePage() {
  const grid = document.querySelector('.rec-grid');
  if (!grid) return;
  grid.innerHTML = skeletonHTML(10);

  try {
    const products = await fetchAllProducts();
    // Show first 10 as recommended
    const subset = products.slice(0, 10);
    grid.innerHTML = '';
    subset.forEach(p => {
      grid.insertAdjacentHTML('beforeend', homeCardHTML(p));
    });

    // Countdown timer
    startCountdown();

    // Pre-fill search from saved query
    const savedQ = localStorage.getItem('brand_search');
    if (savedQ) {
      const inp = document.querySelector('.search-bar input');
      if (inp) inp.value = savedQ;
      localStorage.removeItem('brand_search');
    }
  } catch (e) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#EF4444;">Failed to load products. Please try again.</p>`;
  }
}

function homeCardHTML(p) {
  const stars = starHTML(p.rating?.rate || 4);
  const safeTitle = p.title.replace(/'/g, "\\'");
  const safeImg   = p.image.replace(/'/g, "\\'");
  return `
    <div class="rec-card" style="display:flex;flex-direction:column;height:100%;">
      <div onclick="goToDetail(${p.id})" style="cursor:pointer;flex:1;">
        <img src="${p.image}" alt="${p.title}"
             style="width:100%;height:160px;object-fit:contain;padding:12px;background:#f9fafb;"
             loading="lazy">
        <div class="rec-card-info">
          <p class="rec-price">$${p.price.toFixed(2)}</p>
          <p class="rec-name" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.title}</p>
          <div style="margin-top:4px;font-size:11px;color:#F59E0B;">${stars}
            <span style="color:#6B7280;margin-left:4px;">(${p.rating?.count || 0})</span>
          </div>
        </div>
      </div>
      <div style="padding:10px;border-top:1px solid #f3f4f6;">
        <button onclick="addToCart(${p.id},'${safeTitle}',${p.price},'${safeImg}','${p.category}')"
                class="btn-blue" style="width:100%;padding:7px 0;font-size:12px;border-radius:6px;">
          🛒 Add to Cart
        </button>
      </div>
    </div>`;
}

function starHTML(rate) {
  const full  = Math.round(rate);
  let html = '';
  for (let i = 1; i <= 5; i++) html += i <= full ? '★' : '☆';
  return html;
}

function startCountdown() {
  let secs = 4 * 86400 + 13 * 3600 + 34 * 60 + 56;
  const boxes = document.querySelectorAll('.tbox');
  if (!boxes.length) return;
  const labels = ['Days', 'Hour', 'Min', 'Sec'];
  function tick() {
    if (secs <= 0) return;
    secs--;
    const vals = [
      Math.floor(secs / 86400),
      Math.floor((secs % 86400) / 3600),
      Math.floor((secs % 3600) / 60),
      secs % 60
    ];
    boxes.forEach((b, i) => {
      b.innerHTML = `<span class="tv">${String(vals[i]).padStart(2,'0')}</span><span class="tl">${labels[i]}</span>`;
    });
  }
  tick();
  setInterval(tick, 1000);
}

/* ===========================================================
   LISTING PAGE (List view)
   =========================================================== */
async function initListingPage() {
  const container = document.querySelector('.product-list');
  if (!container) return;

  // Add id to container for targeting
  container.id = 'listing-items';

  // Bind sidebar filters
  bindListingFilters();

  // Load products
  container.innerHTML = skeletonHTML(6, 'list');
  try {
    await fetchAllProducts();
    filteredProds = [...allProducts];
    applyListingSort();
    renderListingPage();
    bindPaginationListing();
  } catch (e) {
    container.innerHTML = `<p style="text-align:center;color:#EF4444;padding:40px;">Failed to load products.</p>`;
  }
}

function renderListingPage() {
  const container = document.querySelector('.product-list');
  if (!container) return;

  const start = (currentPage - 1) * itemsPerPage;
  const page  = filteredProds.slice(start, start + itemsPerPage);

  if (page.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="font-size:48px;margin-bottom:16px;">🔍</div>
        <h3 style="color:#374151;margin-bottom:8px;">No products found</h3>
        <p style="color:#9CA3AF;">Try different search or filters.</p>
      </div>`;
    updatePaginationListing();
    return;
  }

  container.innerHTML = page.map(p => listCardHTML(p)).join('');
  updatePaginationListing();

  // update toolbar count
  const tc = document.querySelector('.toolbar-count');
  if (tc) tc.innerHTML = `${filteredProds.length} items in <strong>All Products</strong>`;
}

function listCardHTML(p) {
  const stars    = starHTML(p.rating?.rate || 4);
  const safeT    = p.title.replace(/'/g, "\\'");
  const safeI    = p.image.replace(/'/g, "\\'");
  const safeC    = (p.category || '').replace(/'/g, "\\'");
  return `
    <div class="product-card" style="display:flex;align-items:flex-start;gap:20px;padding:16px;cursor:default;">
      <img class="product-img" src="${p.image}" alt="${p.title}"
           onclick="goToDetail(${p.id})" style="cursor:pointer;flex-shrink:0;"
           loading="lazy">
      <div class="product-info" style="flex:1;min-width:0;">
        <div class="product-name" onclick="goToDetail(${p.id})" style="cursor:pointer;">${p.title}</div>
        <div class="product-price-row" style="display:flex;align-items:center;gap:10px;margin:6px 0;">
          <span class="price-now">$${p.price.toFixed(2)}</span>
        </div>
        <div class="product-meta" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <span style="color:#F59E0B;font-size:13px;">${stars}</span>
          <span style="font-size:13px;color:#F59E0B;font-weight:600;">${p.rating?.rate || 4}</span>
          <span style="color:#D1D5DB;">•</span>
          <span style="font-size:13px;color:#6B7280;">${p.rating?.count || 0} orders</span>
          <span style="color:#D1D5DB;">•</span>
          <span style="font-size:13px;color:#16A34A;font-weight:500;">Free Shipping</span>
        </div>
        <div class="product-desc">${p.description.substring(0, 130)}…</div>
        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
          <button onclick="goToDetail(${p.id})" class="btn-details">View details</button>
          <button onclick="addToCart(${p.id},'${safeT}',${p.price},'${safeI}','${safeC}')"
                  class="btn-blue" style="padding:6px 14px;font-size:12px;border-radius:6px;">
            🛒 Add to Cart
          </button>
        </div>
      </div>
      <button class="btn-wish" onclick="toggleWish(this,${p.id})">
        <svg viewBox="0 0 24 24" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      </button>
    </div>`;
}

// Sidebar filters for listing.html
function bindListingFilters() {
  // Category filter (radio-style items)
  document.querySelectorAll('.filter-item input[type="radio"][name="cond"]').forEach(r => {
    r.addEventListener('change', () => { applyAllFilters(); });
  });

  // Sort select
  const sortSel = document.querySelector('.sort-select');
  if (sortSel) {
    sortSel.addEventListener('change', e => {
      currentSort = e.target.value;
      currentPage = 1;
      applyAllFilters();
    });
  }

  // Price apply button
  const applyBtn = document.querySelector('.btn-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      currentPage = 1;
      applyAllFilters();
    });
  }

  // Rating checkboxes
  document.querySelectorAll('.filter-item input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      currentPage = 1;
      applyAllFilters();
    });
  });
}

function applyAllFilters() {
  let result = [...allProducts];

  // Search query
  const searchQ = (document.querySelector('#searchInput')?.value || '').toLowerCase().trim();
  if (searchQ) {
    result = result.filter(p =>
      p.title.toLowerCase().includes(searchQ) ||
      p.description.toLowerCase().includes(searchQ) ||
      p.category.toLowerCase().includes(searchQ)
    );
  }

  // Price range
  const pMin = parseFloat(document.querySelector('#pmin, [placeholder="0"]')?.value) || 0;
  const pMax = parseFloat(document.querySelector('#pmax, [placeholder="999999"]')?.value) || Infinity;
  result = result.filter(p => p.price >= pMin && p.price <= pMax);

  // Rating filter
  const ratingCBs = [...document.querySelectorAll('.filter-item input[type="checkbox"]')];
  const checkedRatings = ratingCBs.filter(c => c.checked).map(c => {
    const row = c.closest('.filter-item');
    const starsEl = row?.querySelectorAll('.star:not(.empty)');
    return starsEl ? starsEl.length : 0;
  }).filter(r => r > 0);
  if (checkedRatings.length) {
    result = result.filter(p => {
      const r = Math.round(p.rating?.rate || 0);
      return checkedRatings.includes(r);
    });
  }

  filteredProds = result;
  applyListingSort();
  currentPage = 1;

  // Render depending on page
  if (isPage('listing.html')) renderListingPage();
  else if (isPage('grid-listing.html')) renderGridPage();
}

function applyListingSort() {
  const sel = document.querySelector('.sort-select')?.value || 'default';
  if (sel.includes('Low to High') || sel === 'Price: Low to High') {
    filteredProds.sort((a, b) => a.price - b.price);
  } else if (sel.includes('High to Low') || sel === 'Price: High to Low') {
    filteredProds.sort((a, b) => b.price - a.price);
  } else if (sel.includes('Newest')) {
    filteredProds.sort((a, b) => b.id - a.id);
  }
  // 'default' / 'Featured' → keep API order
}

// Pagination for listing.html
function bindPaginationListing() {
  const wrap = document.querySelector('.pagination-wrap');
  if (!wrap) return;
  updatePaginationListing();
}

function updatePaginationListing() {
  const wrap = document.querySelector('.pagination-wrap');
  if (!wrap) return;
  const total = Math.ceil(filteredProds.length / itemsPerPage);
  // Rebuild page-btns
  let btnDiv = wrap.querySelector('.page-btns');
  if (!btnDiv) { btnDiv = document.createElement('div'); btnDiv.className = 'page-btns'; wrap.appendChild(btnDiv); }
  btnDiv.innerHTML = '';

  // prev
  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.innerHTML = `<svg viewBox="0 0 24 24" stroke-width="2" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6"/></svg>`;
  prev.disabled = currentPage === 1;
  prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderListingPage(); } });
  btnDiv.appendChild(prev);

  // pages
  for (let i = 1; i <= total; i++) {
    const b = document.createElement('button');
    b.className = 'page-btn' + (i === currentPage ? ' active' : '');
    b.textContent = i;
    b.addEventListener('click', () => { currentPage = i; renderListingPage(); window.scrollTo({top:0,behavior:'smooth'}); });
    btnDiv.appendChild(b);
  }

  // next
  const next = document.createElement('button');
  next.className = 'page-btn';
  next.innerHTML = `<svg viewBox="0 0 24 24" stroke-width="2" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"/></svg>`;
  next.disabled = currentPage === total;
  next.addEventListener('click', () => { if (currentPage < total) { currentPage++; renderListingPage(); } });
  btnDiv.appendChild(next);

  // show-select
  const showSel = wrap.querySelector('.show-select');
  if (showSel && !showSel.dataset.bound) {
    showSel.dataset.bound = '1';
    showSel.addEventListener('change', e => {
      itemsPerPage = parseInt(e.target.value.replace(/\D/g,'')) || 6;
      currentPage  = 1;
      renderListingPage();
    });
  }
}

/* ===========================================================
   GRID-LISTING PAGE
   =========================================================== */
async function initGridPage() {
  const grid = document.querySelector('.products-grid');
  if (!grid) return;

  bindGridFilters();

  grid.innerHTML = skeletonHTML(6, 'grid');
  try {
    await fetchAllProducts();
    filteredProds = [...allProducts];

    // Check if arrived with a search query
    const savedQ = localStorage.getItem('brand_search');
    if (savedQ) {
      const inp = document.querySelector('.search-bar input, #searchInput');
      if (inp) inp.value = savedQ;
      localStorage.removeItem('brand_search');
      applyAllFilters();
    } else {
      applyListingSort();
      renderGridPage();
    }
    bindPaginationGrid();
  } catch (e) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#EF4444;padding:40px;">Failed to load products.</p>`;
  }
}

function renderGridPage() {
  const grid = document.querySelector('.products-grid');
  if (!grid) return;

  const start = (currentPage - 1) * itemsPerPage;
  const page  = filteredProds.slice(start, start + itemsPerPage);

  if (page.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <div style="font-size:48px;margin-bottom:16px;">🔍</div>
        <h3 style="color:#374151;margin-bottom:8px;">No products found</h3>
        <p style="color:#9CA3AF;">Try different search or filters.</p>
      </div>`;
    updatePaginationGrid();
    return;
  }

  grid.innerHTML = page.map(p => gridCardHTML(p)).join('');
  updatePaginationGrid();

  const tc = document.querySelector('.toolbar-count');
  if (tc) tc.innerHTML = `${filteredProds.length} items found`;
}

function gridCardHTML(p) {
  const safeT = p.title.replace(/'/g, "\\'");
  const safeI = p.image.replace(/'/g, "\\'");
  const safeC = (p.category || '').replace(/'/g, "\\'");
  const stars = starHTML(p.rating?.rate || 4);
  return `
    <article class="product-card">
      <div class="product-image" onclick="goToDetail(${p.id})" style="cursor:pointer;">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
      </div>
      <div class="product-body">
        <h3 class="product-title" onclick="goToDetail(${p.id})" style="cursor:pointer;">
          ${p.title.length > 50 ? p.title.substring(0,50)+'…' : p.title}
        </h3>
        <div style="margin-bottom:8px;">
          <span style="font-size:18px;font-weight:800;color:#1F2937;">$${p.price.toFixed(2)}</span>
        </div>
        <div class="product-meta">
          <span style="color:#F59E0B;">${stars}</span>
          <span style="color:#F59E0B;font-weight:600;">${p.rating?.rate || 4}</span>
          <span style="color:#16A34A;">• Free Ship</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="goToDetail(${p.id})"
                  style="flex:1;padding:8px;border:1.5px solid #2563EB;color:#2563EB;background:white;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;">
            View
          </button>
          <button onclick="addToCart(${p.id},'${safeT}',${p.price},'${safeI}','${safeC}')"
                  class="btn-blue" style="flex:1;padding:8px;font-size:12px;border-radius:8px;">
            🛒 Add
          </button>
        </div>
      </div>
    </article>`;
}

function bindGridFilters() {
  // Sort
  const sortSel = document.querySelector('.sort-select');
  if (sortSel) {
    sortSel.addEventListener('change', () => { currentPage = 1; applyAllFilters(); });
  }
  // Price apply
  const ap = document.querySelector('.btn-apply');
  if (ap) ap.addEventListener('click', () => { currentPage = 1; applyAllFilters(); });

  // Checkboxes
  document.querySelectorAll('.filter-item input').forEach(inp => {
    inp.addEventListener('change', () => { currentPage = 1; applyAllFilters(); });
  });
}

function bindPaginationGrid() {
  const wrap = document.querySelector('.pagination-wrap');
  if (!wrap) return;
  updatePaginationGrid();
}

function updatePaginationGrid() {
  const wrap = document.querySelector('.pagination-wrap');
  if (!wrap) return;
  const total = Math.ceil(filteredProds.length / itemsPerPage);
  let btnDiv = wrap.querySelector('.page-btns');
  if (!btnDiv) {
    wrap.innerHTML = '';
    // show select
    const ss = document.createElement('select');
    ss.className = 'show-select';
    [6,12,24].forEach(n => {
      const o = document.createElement('option');
      o.value = n; o.textContent = `Show ${n}`;
      if (n === itemsPerPage) o.selected = true;
      ss.appendChild(o);
    });
    ss.addEventListener('change', e => {
      itemsPerPage = parseInt(e.target.value); currentPage = 1; renderGridPage();
    });
    wrap.appendChild(ss);
    btnDiv = document.createElement('div');
    btnDiv.className = 'page-btns';
    wrap.appendChild(btnDiv);
  }
  btnDiv.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
  prev.disabled = currentPage === 1;
  prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderGridPage(); window.scrollTo({top:0,behavior:'smooth'}); } });
  btnDiv.appendChild(prev);

  const maxVisible = 5;
  let startP = Math.max(1, currentPage - 2);
  let endP   = Math.min(total, startP + maxVisible - 1);
  if (endP - startP < maxVisible - 1) startP = Math.max(1, endP - maxVisible + 1);

  if (startP > 1) {
    const b = document.createElement('button'); b.className = 'page-btn'; b.textContent = '1';
    b.addEventListener('click', () => { currentPage = 1; renderGridPage(); }); btnDiv.appendChild(b);
    if (startP > 2) { const sp = document.createElement('span'); sp.textContent='…'; sp.style.padding='0 4px'; btnDiv.appendChild(sp); }
  }
  for (let i = startP; i <= endP; i++) {
    const b = document.createElement('button');
    b.className = 'page-btn' + (i === currentPage ? ' active' : '');
    b.textContent = i;
    b.addEventListener('click', () => { currentPage = i; renderGridPage(); window.scrollTo({top:0,behavior:'smooth'}); });
    btnDiv.appendChild(b);
  }
  if (endP < total) {
    if (endP < total - 1) { const sp = document.createElement('span'); sp.textContent='…'; sp.style.padding='0 4px'; btnDiv.appendChild(sp); }
    const b = document.createElement('button'); b.className = 'page-btn'; b.textContent = total;
    b.addEventListener('click', () => { currentPage = total; renderGridPage(); }); btnDiv.appendChild(b);
  }

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
  next.disabled = currentPage === total;
  next.addEventListener('click', () => { if (currentPage < total) { currentPage++; renderGridPage(); window.scrollTo({top:0,behavior:'smooth'}); } });
  btnDiv.appendChild(next);
}

/* ===========================================================
   PRODUCT DETAIL PAGE
   =========================================================== */
async function initDetailPage() {
  const pid = localStorage.getItem(PID_KEY);
  if (!pid) { window.location.href = 'grid-listing.html'; return; }

  try {
    const r = await fetch(`${API_BASE}/${pid}`);
    const p = await r.json();
    populateDetail(p);
    loadRelatedProducts(p.category, p.id);
  } catch(e) {
    showToast('Failed to load product details.', 'error');
  }
}

function populateDetail(p) {
  // Main image
  const mainImg = document.getElementById('mainImg') || document.querySelector('.gallery-main img');
  if (mainImg) { mainImg.src = p.image; mainImg.alt = p.title; }

  // All thumbs — set to product image
  document.querySelectorAll('.gallery-thumbs .thumb img, .thumbs img').forEach(t => {
    t.src = p.image; t.alt = p.title;
  });
  // Update thumb onclick to point to same image
  document.querySelectorAll('.gallery-thumbs .thumb').forEach(t => {
    t.setAttribute('onclick', `changeImg(this,'${p.image}')`);
  });

  // Product name
  const nameEl = document.querySelector('.product-name');
  if (nameEl) nameEl.textContent = p.title;

  // In-stock badge (always show for API products)
  const inStockEl = document.querySelector('.in-stock');
  if (inStockEl) inStockEl.style.display = 'flex';

  // Rating
  const ratingEl = document.querySelector('.rating-num');
  if (ratingEl) ratingEl.textContent = p.rating?.rate || '4.5';

  // Reviews
  const revEl = document.querySelector('.reviews-link');
  if (revEl) revEl.innerHTML = `<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:#9CA3AF;fill:none;"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> ${p.rating?.count || 32} reviews`;

  // Stars
  document.querySelectorAll('.stars-row .s, .stars-row .s.e').forEach((s, i) => {
    const rate = Math.round(p.rating?.rate || 4);
    s.classList.toggle('e', i >= rate);
  });

  // Price tiers
  const tiers = document.querySelectorAll('.price-tier .pt-price');
  if (tiers.length) {
    tiers[0] && (tiers[0].textContent = `$${(p.price * 1.2).toFixed(2)}`);
    tiers[1] && (tiers[1].textContent = `$${p.price.toFixed(2)}`);
    tiers[2] && (tiers[2].textContent = `$${(p.price * 0.85).toFixed(2)}`);
  }

  // Specs table
  const specsTable = document.querySelector('.specs-table');
  if (specsTable) {
    specsTable.innerHTML = `
      <tr><td>Price:</td><td>$${p.price.toFixed(2)}</td></tr>
      <tr><td>Category:</td><td style="text-transform:capitalize;">${p.category}</td></tr>
      <tr><td>Rating:</td><td>${p.rating?.rate || 4.5} / 5 (${p.rating?.count || 0} reviews)</td></tr>
      <tr><td>Condition:</td><td>Brand New</td></tr>
      <tr><td>Shipping:</td><td>Free Worldwide</td></tr>
      <tr><td>Warranty:</td><td>2 years full warranty</td></tr>
    `;
  }

  // Description tab
  const descTab = document.getElementById('tab-desc');
  if (descTab) {
    descTab.querySelector('.desc-text') && (descTab.querySelector('.desc-text').textContent = p.description);
  }

  // Send inquiry button → becomes "Add to Cart"
  const inquiryBtn = document.querySelector('.btn-inquiry');
  const safeT = p.title.replace(/'/g, "\\'");
  const safeI = p.image.replace(/'/g, "\\'");
  const safeC = (p.category || '').replace(/'/g, "\\'");

  if (inquiryBtn) {
    inquiryBtn.textContent = '🛒 Add to Cart';
    inquiryBtn.onclick = () => addToCart(p.id, p.title, p.price, p.image, p.category);
  }

  // Supplier send inquiry button
  const sellerBtn = document.querySelector('.btn-seller');
  if (sellerBtn) {
    sellerBtn.textContent = 'Send Inquiry';
  }

  // Mobile view update
  const mobName = document.querySelector('.mob-product-name');
  if (mobName) mobName.textContent = p.title;

  const mobPrice = document.querySelector('.mob-price-tag');
  if (mobPrice) mobPrice.textContent = `$${p.price.toFixed(2)}`;

  const mobDesc = document.querySelector('.mob-desc-text');
  if (mobDesc) mobDesc.textContent = p.description;

  const mobGalleryImg = document.querySelector('.mob-gallery img');
  if (mobGalleryImg) { mobGalleryImg.src = p.image; mobGalleryImg.alt = p.title; }

  const mobInquiry = document.querySelector('.mob-btn-inquiry');
  if (mobInquiry) {
    mobInquiry.textContent = '🛒 Add to Cart';
    mobInquiry.onclick = () => addToCart(p.id, p.title, p.price, p.image, p.category);
  }

  // Document title
  document.title = p.title + ' — Brand';
}

async function loadRelatedProducts(category, currentId) {
  try {
    const r = await fetch(`${API_BASE}/category/${encodeURIComponent(category)}`);
    const related = (await r.json()).filter(p => p.id !== parseInt(currentId)).slice(0, 6);

    // Desktop related grid
    const relGrid = document.querySelector('.related-grid');
    if (relGrid && related.length) {
      relGrid.innerHTML = related.map(p => `
        <div class="related-card" onclick="goToDetail(${p.id})" style="cursor:pointer;">
          <div class="rc-img"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>
          <div class="rc-info">
            <p>${p.title.substring(0, 28)}…</p>
            <span>$${p.price.toFixed(2)}</span>
          </div>
        </div>`).join('');
    }

    // You may like sidebar
    const ymlCard = document.querySelector('.you-like-card');
    if (ymlCard && related.length) {
      ymlCard.innerHTML = `<h4>You may like</h4>` + related.slice(0, 5).map(p => `
        <div class="like-item" onclick="goToDetail(${p.id})" style="cursor:pointer;">
          <img class="like-img" src="${p.image}" alt="${p.title}" loading="lazy">
          <div class="like-info">
            <p>${p.title.substring(0, 36)}…</p>
            <span>$${p.price.toFixed(2)}</span>
          </div>
        </div>`).join('');
    }

    // Mobile similar products
    const mobSimilar = document.querySelector('.mob-similar-scroll');
    if (mobSimilar && related.length) {
      mobSimilar.innerHTML = related.map(p => `
        <div class="mob-similar-card" onclick="goToDetail(${p.id})" style="cursor:pointer;">
          <div class="msc-img"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>
          <div class="msc-info">
            <div class="msc-price">$${p.price.toFixed(2)}</div>
            <div class="msc-name">${p.title}</div>
          </div>
        </div>`).join('');
    }
  } catch(e) { /* silently fail for related products */ }
}

/* ===========================================================
   CART PAGE
   =========================================================== */
function initCartPage() {
  renderDesktopCart();
  renderMobileCart();
  bindCartPageEvents();
}

function renderDesktopCart() {
  const card = document.querySelector('.cart-card');
  const title = document.querySelector('.page-title');
  const cart  = getCart();

  if (title) title.textContent = `My cart (${cart.length})`;

  if (!card) return;

  if (cart.length === 0) {
    card.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="font-size:64px;margin-bottom:16px;">🛒</div>
        <h3 style="color:#374151;margin-bottom:8px;">Your cart is empty</h3>
        <p style="color:#9CA3AF;margin-bottom:20px;">Browse our products and add something you like!</p>
        <a href="grid-listing.html" class="btn-blue" style="text-decoration:none;padding:12px 28px;display:inline-block;border-radius:8px;">
          Continue Shopping
        </a>
      </div>`;
    updateSummaryCard(0, 0, 0, 0);
    return;
  }

  card.innerHTML = cart.map(item => desktopCartItemHTML(item)).join('');
  recalcSummary();
}

function desktopCartItemHTML(item) {
  const safeT = item.title.replace(/'/g, "\\'");
  const lineTotal = (item.price * item.qty).toFixed(2);
  const options = [1,2,3,4,5,6,7,8,9,10].map(n =>
    `<option value="${n}" ${n === item.qty ? 'selected' : ''}>Qty: ${n}</option>`
  ).join('');

  return `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-img" src="${item.image}" alt="${item.title}">
      <div class="cart-info">
        <div class="cart-name">${item.title}</div>
        <div class="cart-meta">Category: ${item.category || 'General'}</div>
        <div class="cart-seller">Seller: Brand Market</div>
        <div class="cart-actions">
          <button class="btn-remove" onclick="removeCartItem(${item.id})">Remove</button>
          <button class="btn-save" onclick="saveForLater(${item.id})">Save for later</button>
        </div>
      </div>
      <div class="cart-right">
        <span class="cart-price">$${lineTotal}</span>
        <select class="qty-select" onchange="updateCartQty(${item.id}, parseInt(this.value))">
          ${options}
        </select>
      </div>
    </div>`;
}

function renderMobileCart() {
  const section = document.querySelector('.mob-cart-section');
  const cart    = getCart();
  if (!section) return;

  if (cart.length === 0) {
    section.innerHTML = `
      <div style="text-align:center;padding:48px 20px;">
        <div style="font-size:56px;margin-bottom:12px;">🛒</div>
        <h3 style="color:#374151;margin-bottom:8px;">Cart is empty</h3>
        <a href="grid-listing.html" style="color:#2563EB;font-weight:600;">Browse products →</a>
      </div>`;
    updateMobileSummary(0, 0, 0, 0);
    return;
  }

  section.innerHTML = cart.map(item => mobileCartItemHTML(item)).join('');
  updateMobileSummary(...calcTotals(cart));
}

function mobileCartItemHTML(item) {
  return `
    <div class="mob-cart-item" data-id="${item.id}">
      <img class="mob-item-img" src="${item.image}" alt="${item.title}">
      <div class="mob-item-info">
        <div class="mob-item-name">${item.title.substring(0,45)}…</div>
        <div class="mob-item-meta">Category: ${item.category || 'General'}</div>
        <div class="mob-item-seller">Seller: Brand Market</div>
        <div class="mob-qty-price">
          <div class="mob-qty-ctrl">
            <button class="mob-qty-btn" onclick="updateCartQty(${item.id}, ${item.qty - 1})">−</button>
            <input class="mob-qty-num" type="number" value="${item.qty}" min="1" max="99"
                   onchange="updateCartQty(${item.id}, parseInt(this.value)||1)">
            <button class="mob-qty-btn" onclick="updateCartQty(${item.id}, ${item.qty + 1})">+</button>
          </div>
          <span class="mob-item-price">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      </div>
      <button class="mob-dots" onclick="removeCartItem(${item.id})" title="Remove">
        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>`;
}

// Cart actions
window.removeCartItem = function(id) {
  let cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  renderDesktopCart();
  renderMobileCart();
};

window.updateCartQty = function(id, qty) {
  let cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  if (qty < 1) { window.removeCartItem(id); return; }
  item.qty = Math.min(qty, 99);
  saveCart(cart);
  renderDesktopCart();
  renderMobileCart();
};

window.saveForLater = function(id) {
  showToast('Saved for later!', 'info');
};

window.removeAllItems = function() {
  if (!confirm('Remove all items from cart?')) return;
  saveCart([]);
  renderDesktopCart();
  renderMobileCart();
  showToast('Cart cleared.');
};

function calcTotals(cart) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = subtotal > 200 ? subtotal * 0.05 : 0;
  const tax      = (subtotal - discount) * 0.05;
  const shipping = subtotal > 100 ? 0 : 15;
  const total    = subtotal - discount + tax + shipping;
  return [subtotal, discount, tax, shipping, total];
}

function recalcSummary() {
  const cart = getCart();
  const [sub, disc, tax, ship, total] = calcTotals(cart);
  updateSummaryCard(sub, disc, tax, ship, total);
  updateMobileSummary(sub, disc, tax, ship, total);
}

function updateSummaryCard(sub, disc, tax, ship, total = 0) {
  const el = document.querySelector('.summary-card');
  if (!el) return;

  const payIcons = `
    <div class="payment-icons">
      <div class="pay-badge pay-amex" style="font-size:9px;letter-spacing:.5px;">AMEX</div>
      <div class="pay-badge" style="display:flex;gap:1px;">
        <span style="color:#EB001B;font-weight:900;font-size:14px;">●</span>
        <span style="color:#F79E1B;font-weight:900;font-size:14px;">●</span>
      </div>
      <div class="pay-badge pay-pp" style="font-size:11px;font-weight:900;">P</div>
      <div class="pay-badge pay-visa" style="font-size:11px;font-weight:900;font-style:italic;">VISA</div>
      <div class="pay-badge pay-ap" style="font-size:9px;">🍎Pay</div>
    </div>`;

  el.innerHTML = `
    <div class="summary-row"><span>Subtotal:</span><span>$${sub.toFixed(2)}</span></div>
    ${disc > 0 ? `<div class="summary-row"><span>Discount (5%):</span><span class="discount-val">-$${disc.toFixed(2)}</span></div>` : ''}
    <div class="summary-row"><span>Tax (5%):</span><span class="tax-val">+$${tax.toFixed(2)}</span></div>
    <div class="summary-row"><span>Shipping:</span><span>${ship === 0 ? '<span style="color:#16A34A;font-weight:600;">FREE</span>' : '$'+ship.toFixed(2)}</span></div>
    <div class="summary-row total"><span>Total:</span><span>$${total.toFixed(2)}</span></div>
    <button class="btn-checkout" onclick="proceedToCheckout()">Checkout</button>
    ${payIcons}`;
}

function updateMobileSummary(sub, disc, tax, ship, total = 0) {
  const el = document.querySelector('.mob-summary-section');
  if (!el) return;
  const cart = getCart();
  el.innerHTML = `
    <div class="mob-summary-row"><span>Items (${cart.length}):</span><span>$${sub.toFixed(2)}</span></div>
    ${disc > 0 ? `<div class="mob-summary-row"><span>Discount:</span><span style="color:#EF4444;">-$${disc.toFixed(2)}</span></div>` : ''}
    <div class="mob-summary-row"><span>Tax (5%):</span><span>$${tax.toFixed(2)}</span></div>
    <div class="mob-summary-row"><span>Shipping:</span><span>${ship === 0 ? 'Free' : '$'+ship.toFixed(2)}</span></div>
    <div class="mob-summary-row total-mob"><span>Total:</span><span>$${total.toFixed(2)}</span></div>
    <button class="mob-checkout-btn" onclick="proceedToCheckout()">
      Checkout (${cart.reduce((s,i)=>s+i.qty,0)} items)
    </button>`;
}

function bindCartPageEvents() {
  // Coupon apply
  const couponBtn = document.querySelector('.btn-apply-coupon');
  if (couponBtn) {
    couponBtn.addEventListener('click', () => {
      const code = document.querySelector('.coupon-input')?.value.trim().toUpperCase();
      if (code === 'SAVE10') {
        showToast('Coupon applied! 10% extra discount 🎉', 'success');
      } else if (code) {
        showToast('Invalid coupon code.', 'error');
      }
    });
  }

  // Back to shop
  const backBtn = document.querySelector('.btn-back-shop');
  if (backBtn) backBtn.addEventListener('click', () => window.location.href = 'grid-listing.html');

  // Remove all
  const removeAll = document.querySelector('.btn-remove-all');
  if (removeAll) { removeAll.onclick = window.removeAllItems; }

  // Mobile back
  const mobBack = document.querySelector('.mob-back');
  if (mobBack) mobBack.addEventListener('click', () => window.history.back());
}

window.proceedToCheckout = function() {
  const cart = getCart();
  if (!cart.length) { showToast('Your cart is empty!', 'error'); return; }
  const [,,,, total] = calcTotals(cart);
  if (confirm(`Proceed to checkout?\nTotal: $${total.toFixed(2)}\n\n(This is a demo checkout)`)) {
    saveCart([]);
    showToast('Order placed successfully! 🎉');
    setTimeout(() => window.location.href = 'index.html', 1500);
  }
};

/* ===========================================================
   SHARED UTILITIES
   =========================================================== */

// Wishlist toggle (visual only)
window.toggleWish = function(btn, id) {
  btn.classList.toggle('liked');
  const path = btn.querySelector('svg path');
  if (path) path.style.fill = btn.classList.contains('liked') ? '#2563EB' : 'none';
  showToast(btn.classList.contains('liked') ? 'Added to wishlist ♥' : 'Removed from wishlist', 'info');
};

// Gallery thumb switch on detail page
window.changeImg = function(thumb, src) {
  const main = document.getElementById('mainImg');
  if (main) { main.src = src; }
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  if (thumb) thumb.classList.add('active');
};

// Tab switch on detail page
window.switchTab = function(tab, id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  tab.classList.add('active');
  const tc = document.getElementById('tab-' + id);
  if (tc) tc.classList.add('active');
};

// handleSearch called from index.html button via onclick
window.handleSearch = function() {
  const inp = document.querySelector('#searchInput, .search-bar input');
  const q   = inp ? inp.value.trim() : '';
  if (!q) return;
  localStorage.setItem('brand_search', q);
  window.location.href = 'grid-listing.html';
};

// Page buttons on listing (view-btn grid/list toggle)
window.setView = function(mode) {
  const grid = document.getElementById('productGrid') || document.querySelector('.product-list');
  const gBtn = document.getElementById('gridBtn');
  const lBtn = document.getElementById('listBtn');
  if (!grid) return;
  if (mode === 'grid') {
    grid.style.gridTemplateColumns = 'repeat(3,1fr)';
    gBtn && gBtn.classList.add('active'); lBtn && lBtn.classList.remove('active');
  } else {
    grid.style.gridTemplateColumns = '1fr';
    lBtn && lBtn.classList.add('active'); gBtn && gBtn.classList.remove('active');
  }
};

window.setPage = function(btn) {
  document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};