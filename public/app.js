// ── 메뉴 데이터 ──
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
  '와인': [],
};

// ── 장바구니 ──
let cart = [];
let currentCategory = '스테이크';
let wineRecommendations = null;

// ── 카테고리 표시 ──
function showCategory(category) {
  currentCategory = category;

  document.querySelectorAll('.category-item').forEach(el => {
    el.classList.toggle('active', el.textContent.replace('🍷 ', '') === category);
  });

  const titles = {
    '스테이크': '스테이크 (Steak)',
    '파스타': '파스타 (Pasta)',
    '피자': '피자 (Pizza)',
    '해산물': '해산물 (Seafood)',
    '사이드': '사이드 (Side)',
    '디저트': '디저트 (Dessert)',
    '와인': '와인 (Wine)',
  };
  document.getElementById('categoryTitle').innerHTML =
    titles[category] + (category !== '와인' ? '' : '');

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
    <div class="menu-card" onclick="addToCart('${item.name}', ${item.price})">
      <div class="menu-card-img">${item.emoji}</div>
      <div class="menu-card-body">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-price">${item.price.toLocaleString()} 원</div>
      </div>
    </div>
  `).join('');
}

// ── 와인 탭 (Touch 1) ──
async function renderWineTab() {
  const grid = document.getElementById('menuGrid');
  const cartFoods = cart.map(c => c.name);

  // 추천 영역
  let recommendHTML = '';
  if (cartFoods.length === 0) {
    recommendHTML = `
      <div class="wine-tab-recommend">
        <h3>🍷 추천 와인</h3>
        <div class="empty-msg">아직 선택하신 메뉴가 없어요.<br>메뉴를 먼저 담아주시면 어울리는 와인을 추천해드릴게요 🍷</div>
      </div>`;
  } else {
    if (!wineRecommendations) {
      recommendHTML = `
        <div class="wine-tab-recommend">
          <h3>🍷 추천 와인</h3>
          <div class="empty-msg"><div class="dots"><span></span><span></span><span></span></div></div>
        </div>`;
      grid.innerHTML = recommendHTML + getAllWineCards([]);
      await fetchRecommendations();
      return;
    } else {
      recommendHTML = `<div class="wine-tab-recommend">
        <h3>🍷 담으신 메뉴에 어울리는 와인</h3>
        <div class="wine-cards-row">
          ${wineRecommendations.map(w => `
            <div class="wine-rec-card">
              <div class="badge-recommend">추천</div>
              <div class="wine-rec-card-name">${w.name_kr}</div>
              <div class="wine-rec-card-info">${w.region} · ${w.grape}</div>
              <div class="wine-rec-card-foods">🍽 ${w.matching_foods.join(', ')}</div>
              <button class="btn-add-wine" onclick="addToCart('${w.name_kr}', 0)">+ 담기</button>
            </div>
          `).join('')}
        </div>
      </div>`;
    }
  }

  grid.innerHTML = recommendHTML + getAllWineCards(wineRecommendations || []);
}

function getAllWineCards(recs) {
  const recIds = recs.map(r => r.wine_id);
  const allWines = [
    { wine_id: 'B01', name_kr: '페렐라다 까바 브뤼', type: 'Bubble', region: 'Spain', price_bottle: 69 },
    { wine_id: 'B02', name_kr: '샴페인 가스통 드 끌로', type: 'Bubble', region: 'France', price_bottle: 88 },
    { wine_id: 'W01', name_kr: '플뤼거 리슬링', type: 'White', region: 'Germany', price_bottle: 65 },
    { wine_id: 'W02', name_kr: '베네데 카타라토', type: 'White', region: 'Italy', price_bottle: 52 },
    { wine_id: 'W03', name_kr: '파운', type: 'White', region: 'France', price_bottle: 61 },
    { wine_id: 'W05', name_kr: '칼리베다 샤도네이', type: 'White', region: 'USA', price_bottle: 70 },
    { wine_id: 'R01', name_kr: '부샤 헤리티지 피노누아', type: 'Red', region: 'France', price_bottle: 73 },
    { wine_id: 'R03', name_kr: '티앤티 까베르네 소비뇽', type: 'Red', region: 'USA', price_bottle: 50 },
    { wine_id: 'R04', name_kr: '꼬또 데 이마스 리제르바', type: 'Red', region: 'Spain', price_bottle: 73 },
    { wine_id: 'R07', name_kr: '돈나타 네로 다볼라', type: 'Red', region: 'Italy', price_bottle: 52 },
    { wine_id: 'R09', name_kr: '미미 키안티 수페리오레', type: 'Red', region: 'Italy', price_bottle: 72 },
    { wine_id: 'S01', name_kr: '리히터 리슬링 슈페트레제', type: 'Sweet', region: 'Germany', price_bottle: 73 },
    { wine_id: 'NA01', name_kr: '논알콜 화이트', type: 'Non-Alc', region: 'Australia', price_bottle: 70 },
    { wine_id: 'NA02', name_kr: '자카니니 논알콜 레드', type: 'Non-Alc', region: 'Italy', price_bottle: 45 },
  ];

  return `<div class="menu-grid">` + allWines.map(w => {
    const isRec = recIds.includes(w.wine_id);
    return `
      <div class="menu-card" onclick="addToCart('${w.name_kr}', ${w.price_bottle * 1000})">
        ${isRec ? '<div class="badge-recommend">추천</div>' : ''}
        <div class="menu-card-img">🍷</div>
        <div class="menu-card-body">
          <div class="menu-card-name">${w.name_kr}</div>
          <div class="menu-card-price" style="color:#888;font-size:11px;">${w.type} · ${w.region}</div>
        </div>
      </div>`;
  }).join('') + `</div>`;
}

// ── Edge Function 호출 ──
async function fetchRecommendations() {
  const cartFoods = cart.map(c => c.name);
  if (cartFoods.length === 0) return;

  try {
    const res = await fetch(
      `${CONFIG.SUPABASE_URL}/functions/v1/recommend`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ordered_foods: cartFoods }),
      }
    );
    const data = await res.json();
    if (data.recommendations) {
      wineRecommendations = data.recommendations;
      updateWineRecommendUI(data.recommendations);
    }
  } catch (e) {
    console.error('추천 오류:', e);
  }
}

// ── 추천 UI 업데이트 ──
function updateWineRecommendUI(recs) {
  // Touch 3 장바구니 화면
  const area = document.getElementById('wineRecommendArea');
  if (area) {
    area.innerHTML = `<div class="wine-cards-row">
      ${recs.map(w => `
        <div class="wine-rec-card">
          <div class="wine-rec-card-name">${w.name_kr}</div>
          <div class="wine-rec-card-info">${w.region} · ${w.grape}</div>
          <div class="wine-rec-card-foods">🍽 ${w.matching_foods.join(', ')}</div>
          <button class="btn-add-wine" onclick="addToCart('${w.name_kr}', 0)">+ 주문에 추가</button>
        </div>
      `).join('')}
    </div>`;
  }

  // Touch 1 와인 탭 갱신
  if (currentCategory === '와인') renderWineTab();
}

// ── 장바구니 담기 ──
function addToCart(name, price) {
  const existing = cart.find(c => c.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  wineRecommendations = null; // 음식 변경 시 추천 초기화
  updateCartCount();

  // 시각 피드백
  const btn = event.currentTarget;
  if (btn) {
    btn.style.borderColor = '#1A3A2A';
    setTimeout(() => btn.style.borderColor = '', 300);
  }
}

function updateCartCount() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartCount').textContent = total;
}

// ── 장바구니 화면 ──
function showCart() {
  document.getElementById('menuScreen').style.display = 'none';
  document.getElementById('cartScreen').classList.add('active');
  renderCart();
  fetchRecommendations();
}

function showMenu() {
  document.getElementById('menuScreen').style.display = '';
  document.getElementById('cartScreen').classList.remove('active');
}

function renderCart() {
  const el = document.getElementById('cartItems');
  if (cart.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:#aaa;padding:40px 0;">장바구니가 비었습니다</div>';
    document.getElementById('cartTotal').textContent = '0 원';
    document.getElementById('wineRecommendArea').innerHTML =
      '<div class="wine-loading" style="color:rgba(255,255,255,0.4)">음식을 담으면 어울리는 와인을 추천해드려요</div>';
    return;
  }

  el.innerHTML = cart.map((c, i) => `
    <div class="cart-item">
      <div>
        <div class="cart-item-name">${c.name} × ${c.qty}</div>
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
  fetchRecommendations();
}

// ── 초기 렌더링 ──
showCategory('스테이크');