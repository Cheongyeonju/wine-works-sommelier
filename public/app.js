const MENUS = {
  '스테이크': [
    { name: '립아이 스테이크', price: 65000, emoji: '🥩' },
    { name: '안심 스테이크', price: 72000, emoji: '🥩' },
    { name: '포크 립', price: 38000, emoji: '🍖' },
    { name: '치킨 그릴', price: 28000, emoji: '🍗' },
  ],
  '파스타': [
    { name: '토마토 파스타', price: 18000, emoji: '🍝' },
    { name: '크림 파스타', price: 19000, emoji: '🍝' },
    { name: '트러플 파스타', price: 28000, emoji: '🍝' },
    { name: '봉골레 파스타', price: 20000, emoji: '🍝' },
    { name: '리조또', price: 22000, emoji: '🍚' },
    { name: '버섯 리조또', price: 24000, emoji: '🍄' },
  ],
  '피자': [
    { name: '마르게리타 피자', price: 22000, emoji: '🍕' },
    { name: '트러플 피자', price: 30000, emoji: '🍕' },
  ],
  '해산물': [
    { name: '연어 그릴', price: 35000, emoji: '🐟' },
    { name: '새우 구이', price: 28000, emoji: '🦐' },
    { name: '해산물 플래터', price: 55000, emoji: '🦞' },
    { name: '참치 타르타르', price: 32000, emoji: '🐟' },
    { name: '카르파초', price: 29000, emoji: '🥗' },
  ],
  '사이드': [
    { name: '치즈 플래터', price: 25000, emoji: '🧀' },
    { name: '샐러드', price: 14000, emoji: '🥗' },
    { name: '버섯 요리', price: 16000, emoji: '🍄' },
  ],
  '디저트': [
    { name: '디저트 플래터', price: 18000, emoji: '🍮' },
  ],
};

const WINES = [
  { wine_id: 'B01', name_kr: '페렐라다 까바 브뤼', type: 'Bubble', region: 'Spain', grape: 'Xarel-lo, Macabeo', price_bottle: 69 },
  { wine_id: 'B02', name_kr: '샴페인 가스통 드 끌로', type: 'Bubble', region: 'France', grape: 'Pinot noir, Chardonnay', price_bottle: 88 },
  { wine_id: 'W01', name_kr: '플뤼거 리슬링', type: 'White', region: 'Germany', grape: 'Riesling', price_bottle: 65 },
  { wine_id: 'W02', name_kr: '베네데 카타라토', type: 'White', region: 'Italy', grape: 'Catarratto', price_bottle: 52 },
  { wine_id: 'W03', name_kr: '파운', type: 'White', region: 'France', grape: 'Viognier, Chardonnay', price_bottle: 61 },
  { wine_id: 'W04', name_kr: '옐랜드 소비뇽 블랑', type: 'White', region: 'New Zealand', grape: 'Sauvignon Blanc', price_bottle: 70 },
  { wine_id: 'W05', name_kr: '칼리베다 샤도네이', type: 'White', region: 'USA', grape: 'Chardonnay', price_bottle: 70 },
  { wine_id: 'W06', name_kr: '자블레 비오니에', type: 'White', region: 'France', grape: 'Viognier', price_bottle: 68 },
  { wine_id: 'W07', name_kr: '킹스 오브 프로히비션 샤르도네', type: 'White', region: 'Australia', grape: 'Chardonnay', price_bottle: 69 },
  { wine_id: 'R01', name_kr: '부샤 헤리티지 피노누아', type: 'Red', region: 'France', grape: 'Pinot Noir', price_bottle: 73 },
  { wine_id: 'R02', name_kr: '이 본죠르노 프리미티보', type: 'Red', region: 'Italy', grape: 'Primitivo', price_bottle: 73 },
  { wine_id: 'R03', name_kr: '티앤티 까베르네 소비뇽', type: 'Red', region: 'USA', grape: 'Cabernet Sauvignon', price_bottle: 50 },
  { wine_id: 'R04', name_kr: '꼬또 데 이마스 리제르바', type: 'Red', region: 'Spain', grape: 'Tempranillo', price_bottle: 73 },
  { wine_id: 'R05', name_kr: '옐랜드 피노누아 리저브', type: 'Red', region: 'New Zealand', grape: 'Pinot Noir', price_bottle: 64 },
  { wine_id: 'R07', name_kr: '돈나타 네로 다볼라', type: 'Red', region: 'Italy', grape: 'Nero Davola', price_bottle: 52 },
  { wine_id: 'R09', name_kr: '미미 키안티 수페리오레', type: 'Red', region: 'Italy', grape: 'Sangiovese', price_bottle: 72 },
  { wine_id: 'S01', name_kr: '리히터 리슬링 슈페트레제', type: 'Sweet', region: 'Germany', grape: 'Riesling', price_bottle: 73 },
  { wine_id: 'NA01', name_kr: '논알콜 화이트', type: 'Non-Alcoholic', region: 'Australia', grape: 'White Blended', price_bottle: 70 },
  { wine_id: 'NA02', name_kr: '자카니니 논알콜 레드', type: 'Non-Alcoholic', region: 'Italy', grape: 'Montepulciano', price_bottle: 45 },
];

let cart = [];
let currentCategory = '스테이크';
let wineRecommendations = null;
let isCartScreen = false;

// ── 카테고리 전환 ──
function showCategory(category, btn) {
  currentCategory = category;
  document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // 장바구니 화면에서 메뉴 탭 클릭 시 메뉴 화면으로 이동
  if (isCartScreen) showMenu();

  const titles = {
    '스테이크': '스테이크 <span>(Steak)</span>',
    '파스타': '파스타 <span>(Pasta)</span>',
    '피자': '피자 <span>(Pizza)</span>',
    '해산물': '해산물 <span>(Seafood)</span>',
    '사이드': '사이드 <span>(Side)</span>',
    '디저트': '디저트 <span>(Dessert)</span>',
    '와인': '와인 <span>(Wine)</span>',
  };
  document.getElementById('categoryTitle').innerHTML = titles[category] || category;
  renderMenu(category);
}

// ── 메뉴 렌더링 ──
function renderMenu(category) {
  const grid = document.getElementById('menuGrid');
  if (category === '와인') {
    renderWineTab();
    return;
  }
  const items = MENUS[category] || [];
  grid.innerHTML = items.map(item => `
    <div class="menu-card" onclick="addToCart('${item.name}', ${item.price}, this)">
      <div class="menu-card-img">${item.emoji}</div>
      <div class="menu-card-body">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-price">${item.price.toLocaleString()} 원</div>
      </div>
    </div>
  `).join('');
}

// ── 와인 탭 렌더링 ──
function renderWineTab() {
  const grid = document.getElementById('menuGrid');
  const recIds = (wineRecommendations || []).map(r => r.wine_id);

  grid.innerHTML = WINES.map(w => {
    const isRec = recIds.includes(w.wine_id);
    return `
      <div class="menu-card" onclick="addToCart('${w.name_kr}', ${w.price_bottle * 1000}, this)">
        ${isRec ? '<div class="badge-recommend">추천</div>' : ''}
        <div class="menu-card-img">🍷</div>
        <div class="menu-card-body">
          <span class="badge-wine-type badge-${w.type}">${w.type}</span>
          <div class="menu-card-name">${w.name_kr}</div>
          <div class="menu-card-price" style="color:#888;font-size:11px;">${w.region} · ${w.grape}</div>
          <div class="menu-card-price">${w.price_bottle.toLocaleString()}천 원</div>
        </div>
      </div>`;
  }).join('');
}

// ── 장바구니 담기 ──
function addToCart(name, price, el) {
  const existing = cart.find(c => c.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  wineRecommendations = null;
  updateCartCount();

  // 클릭 효과 (0.5초 후 제거)
  if (el) {
    el.classList.add('clicked');
    setTimeout(() => el.classList.remove('clicked'), 400);
  }
}

function updateCartCount() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartCount').textContent = total;
}

// ── 화면 전환 ──
function showCart() {
  isCartScreen = true;
  document.getElementById('menuScreen').style.display = 'none';
  document.getElementById('cartScreen').classList.add('active');
  renderCart();
  if (cart.length > 0) fetchRecommendations();
}

function showMenu() {
  isCartScreen = false;
  document.getElementById('menuScreen').style.display = '';
  document.getElementById('cartScreen').classList.remove('active');
  renderMenu(currentCategory);
}

// ── 장바구니 렌더링 ──
function renderCart() {
  const el = document.getElementById('cartItems');
  const wineArea = document.getElementById('wineRecommendArea');

  if (cart.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:#aaa;padding:40px 0;font-size:14px;">장바구니가 비었습니다</div>';
    document.getElementById('cartTotal').textContent = '0 원';
    wineArea.innerHTML = '<div class="wine-loading" style="color:rgba(255,255,255,0.4);font-size:13px;">음식을 담으면 어울리는 와인을 추천해드려요</div>';
    return;
  }

  el.innerHTML = cart.map((c, i) => `
    <div class="cart-item">
      <div>
        <div class="cart-item-name">${c.name}</div>
        <div class="cart-item-qty">수량 ${c.qty}개</div>
      </div>
      <div style="display:flex;align-items:center">
        <div class="cart-item-price">${(c.price * c.qty).toLocaleString()} 원</div>
        <button class="cart-item-remove" onclick="removeFromCart(${i})">×</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById('cartTotal').textContent = total.toLocaleString() + ' 원';
}

function removeFromCart(i) {
  cart.splice(i, 1);
  wineRecommendations = null;
  updateCartCount();
  renderCart();

  // 장바구니 비면 추천 초기화
  if (cart.length === 0) {
    document.getElementById('wineRecommendArea').innerHTML =
      '<div class="wine-loading" style="color:rgba(255,255,255,0.4);font-size:13px;">음식을 담으면 어울리는 와인을 추천해드려요</div>';
  } else {
    fetchRecommendations();
  }
}

// ── Edge Function 호출 ──
async function fetchRecommendations() {
  if (cart.length === 0) {
    document.getElementById('wineRecommendArea').innerHTML =
      '<div class="wine-loading" style="color:rgba(255,255,255,0.4);font-size:13px;">음식을 담으면 어울리는 와인을 추천해드려요</div>';
    return;
  }

  document.getElementById('wineRecommendArea').innerHTML =
    '<div class="wine-loading"><div class="dots"><span></span><span></span><span></span></div></div>';

  const cartFoods = cart.map(c => c.name);

  try {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'apikey': CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ ordered_foods: cartFoods }),
    });
    const data = await res.json();
    if (data.recommendations) {
      wineRecommendations = data.recommendations;
      updateWineUI(data.recommendations);
    }
  } catch (e) {
    document.getElementById('wineRecommendArea').innerHTML =
      '<div class="wine-loading" style="color:rgba(255,100,100,0.7);font-size:13px;">추천을 불러오지 못했습니다</div>';
  }
}

// ── 추천 UI 업데이트 ──
function updateWineUI(recs) {
  const area = document.getElementById('wineRecommendArea');
  if (!area) return;

  area.innerHTML = `<div class="wine-cards-row">
    ${recs.map(w => `
      <div class="wine-rec-card">
        <button class="btn-add-wine" onclick="addToCart('${w.name_kr}', ${getPriceByWineId(w.wine_id) * 1000}, null)">+</button>
        <div class="wine-rec-card-content">
          <span class="badge-wine-type badge-${w.type || 'White'}">${w.type || 'Wine'}</span>
          <div class="wine-rec-card-name">${w.name_kr}</div>
          <div class="wine-rec-card-info">${w.region} · ${w.grape}</div>
          <div class="wine-rec-card-price">Bottle ${getPriceByWineId(w.wine_id).toLocaleString()}천 원</div>
        </div>
      </div>
    `).join('')}
  </div>`;

  if (currentCategory === '와인') renderWineTab();
}

function getPriceByWineId(id) {
  const w = WINES.find(w => w.wine_id === id);
  return w ? w.price_bottle : 0;
}

// ── 초기 렌더링 ──
const firstBtn = document.querySelector('.category-item');
showCategory('스테이크', firstBtn);