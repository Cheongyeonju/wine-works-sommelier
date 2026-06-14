/* ─────────────────────────────────────────
   Wine Works Admin — admin.js
   Supabase REST API (anon key) 사용
───────────────────────────────────────── */

const ADMIN_PASSWORD = 'wineworks2026';
const SB_URL = CONFIG.SUPABASE_URL;
const SB_KEY = CONFIG.SUPABASE_ANON_KEY;

/* ── 상태 ── */
let allWines = [];
let allFoods = [];
let allLogs  = [];
let allFeedbacks = [];
let currentWineFilter = 'all';
let selectedLogId = null;
/* 피드백 임시 상태: { [logId_wineId]: { score, comment } } */
let fbDraft = {};

/* ══════════════════════════════════════════
   로그인
══════════════════════════════════════════ */
document.getElementById('pwInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

function doLogin() {
  const pw = document.getElementById('pwInput').value.trim();
  if (pw === ADMIN_PASSWORD) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').classList.add('visible');
    initAdmin();
  } else {
    document.getElementById('loginError').textContent = '비밀번호가 올바르지 않습니다.';
    document.getElementById('pwInput').value = '';
    document.getElementById('pwInput').focus();
  }
}

function doLogout() {
  document.getElementById('adminApp').classList.remove('visible');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('pwInput').value = '';
  document.getElementById('loginError').textContent = '';
}

/* ══════════════════════════════════════════
   초기화
══════════════════════════════════════════ */
async function initAdmin() {
  await Promise.all([loadWines(), loadFoods(), loadLogs(), loadFeedbacks()]);
}

/* ══════════════════════════════════════════
   Supabase 헬퍼
══════════════════════════════════════════ */
async function sbFetch(table, query = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
    }
  });
  if (!res.ok) throw new Error(`${table} 로드 실패: ${res.status}`);
  return res.json();
}

async function sbInsert(table, data) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `삽입 실패: ${res.status}`);
  }
  return res.json();
}

async function sbUpdate(table, pkCol, pkVal, data) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${pkCol}=eq.${encodeURIComponent(pkVal)}`, {
    method: 'PATCH',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `업데이트 실패: ${res.status}`);
  }
  return res.json();
}

async function sbDelete(table, pkCol, pkVal) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${pkCol}=eq.${encodeURIComponent(pkVal)}`, {
    method: 'DELETE',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`삭제 실패: ${res.status}`);
}

/* ── Upsert (feedbacks: log_id + wine_id 기준) ── */
async function sbUpsertFeedback(data) {
  const res = await fetch(`${SB_URL}/rest/v1/feedbacks`, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `피드백 저장 실패: ${res.status}`);
  }
  return res.json();
}

/* ══════════════════════════════════════════
   탭 전환
══════════════════════════════════════════ */
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    const names = ['wines', 'foods', 'logs', 'feedbacks'];
    b.classList.toggle('active', names[i] === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${name}`).classList.add('active');
}

/* ══════════════════════════════════════════
   ① 와인 관리
══════════════════════════════════════════ */
async function loadWines() {
  try {
    allWines = await sbFetch('wines', 'order=wine_id.asc');
    renderWines();
  } catch (e) {
    showToast(e.message, true);
    document.getElementById('wineTableBody').innerHTML =
      `<tr><td colspan="9" style="text-align:center;padding:40px;color:#888">${e.message}</td></tr>`;
  }
}

function renderWines() {
  const filtered = currentWineFilter === 'all'
    ? allWines
    : allWines.filter(w => w.type === currentWineFilter);

  document.getElementById('wineCount').textContent =
    `(${filtered.length}종 / 전체 ${allWines.length}종)`;

  const tbody = document.getElementById('wineTableBody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="icon">🍷</div><p>해당 타입의 와인이 없습니다</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(w => `
    <tr>
      <td class="muted" style="font-family:monospace">${w.wine_id}</td>
      <td>
        <div style="font-weight:600;font-size:13px">${w.name_kr || w.name}</div>
        <div style="font-size:11px;color:#888">${w.name}</div>
      </td>
      <td><span class="type-badge ${typeCls(w.type)}">${w.type}</span></td>
      <td class="muted">${w.region || '-'}</td>
      <td class="muted">${w.grape || '-'}</td>
      <td class="price">${fmtPrice(w.price_glass)}</td>
      <td class="price">${fmtPrice(w.price_bottle)}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" ${w.is_active ? 'checked' : ''}
            onchange="toggleWineActive('${w.wine_id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-sm" onclick="openWineModal('${w.wine_id}')">수정</button>
          <button class="btn-sm danger" onclick="deleteWine('${w.wine_id}')">삭제</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterWines(type, btn) {
  currentWineFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderWines();
}

function typeCls(type) {
  const map = { Bubble: 'type-bubble', White: 'type-white', Red: 'type-red',
                 Sweet: 'type-sweet', 'Non-Alcoholic': 'type-non-alcoholic' };
  return map[type] || '';
}

async function toggleWineActive(wineId, isActive) {
  try {
    await sbUpdate('wines', 'wine_id', wineId, { is_active: isActive });
    const w = allWines.find(x => x.wine_id === wineId);
    if (w) w.is_active = isActive;
    showToast(`${wineId} ${isActive ? '판매 재개' : '판매 중단'}`);
  } catch (e) {
    showToast(e.message, true);
    await loadWines();
  }
}

function openWineModal(wineId) {
  const isEdit = wineId !== null;
  document.getElementById('wineModalTitle').textContent = isEdit ? '와인 수정' : '와인 추가';
  document.getElementById('wineModalId').value = wineId || '';

  const fields = ['wine_id','type','name','name_kr','region','grape','flavor_notes','price_glass','price_bottle'];
  if (isEdit) {
    const w = allWines.find(x => x.wine_id === wineId);
    if (!w) return;
    fields.forEach(f => {
      const el = document.getElementById(`wf_${f}`);
      if (el) el.value = w[f] ?? '';
    });
    document.getElementById('wf_wine_id').disabled = true;
  } else {
    fields.forEach(f => {
      const el = document.getElementById(`wf_${f}`);
      if (el) el.value = '';
    });
    document.getElementById('wf_wine_id').disabled = false;
  }
  document.getElementById('wineModal').classList.add('open');
}

async function saveWine() {
  const isEdit = !!document.getElementById('wineModalId').value;
  const data = {
    wine_id:      document.getElementById('wf_wine_id').value.trim(),
    type:         document.getElementById('wf_type').value,
    name:         document.getElementById('wf_name').value.trim(),
    name_kr:      document.getElementById('wf_name_kr').value.trim(),
    region:       document.getElementById('wf_region').value.trim(),
    grape:        document.getElementById('wf_grape').value.trim(),
    flavor_notes: document.getElementById('wf_flavor_notes').value.trim(),
    price_glass:  Number(document.getElementById('wf_price_glass').value) || null,
    price_bottle: Number(document.getElementById('wf_price_bottle').value) || null,
  };
  if (!data.wine_id || !data.name) { showToast('ID와 이름은 필수입니다', true); return; }

  try {
    if (isEdit) {
      const id = document.getElementById('wineModalId').value;
      await sbUpdate('wines', 'wine_id', id, data);
      showToast('와인 정보가 수정되었습니다');
    } else {
      data.is_active = true;
      await sbInsert('wines', data);
      showToast('와인이 추가되었습니다');
    }
    closeModal('wineModal');
    await loadWines();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function deleteWine(wineId) {
  if (!confirm(`"${wineId}" 와인을 삭제할까요? 되돌릴 수 없습니다.`)) return;
  try {
    await sbDelete('wines', 'wine_id', wineId);
    showToast('삭제되었습니다');
    await loadWines();
  } catch (e) {
    showToast(e.message, true);
  }
}

/* ══════════════════════════════════════════
   ② 음식 관리
══════════════════════════════════════════ */
async function loadFoods() {
  try {
    allFoods = await sbFetch('foods', 'order=food_id.asc');
    renderFoods();
  } catch (e) {
    showToast(e.message, true);
    document.getElementById('foodTableBody').innerHTML =
      `<tr><td colspan="5" style="text-align:center;padding:40px;color:#888">${e.message}</td></tr>`;
  }
}

function renderFoods() {
  document.getElementById('foodCount').textContent = `(${allFoods.length}개)`;
  const tbody = document.getElementById('foodTableBody');
  if (!allFoods.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">🍽️</div><p>음식 데이터가 없습니다</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = allFoods.map(f => `
    <tr>
      <td class="muted" style="font-family:monospace">${f.food_id}</td>
      <td style="font-weight:500">${f.name}</td>
      <td class="muted">${f.category || '-'}</td>
      <td>
        <label class="toggle">
          <input type="checkbox" ${f.is_active ? 'checked' : ''}
            onchange="toggleFoodActive('${f.food_id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-sm" onclick="openFoodModal('${f.food_id}')">수정</button>
          <button class="btn-sm danger" onclick="deleteFood('${f.food_id}')">삭제</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function toggleFoodActive(foodId, isActive) {
  try {
    await sbUpdate('foods', 'food_id', foodId, { is_active: isActive });
    const f = allFoods.find(x => x.food_id === foodId);
    if (f) f.is_active = isActive;
    showToast(`${foodId} ${isActive ? '판매 재개' : '판매 중단'}`);
  } catch (e) {
    showToast(e.message, true);
    await loadFoods();
  }
}

function openFoodModal(foodId) {
  const isEdit = foodId !== null;
  document.getElementById('foodModalTitle').textContent = isEdit ? '음식 수정' : '음식 추가';
  document.getElementById('foodModalId').value = foodId || '';

  if (isEdit) {
    const f = allFoods.find(x => x.food_id === foodId);
    if (!f) return;
    document.getElementById('ff_food_id').value = f.food_id;
    document.getElementById('ff_food_id').disabled = true;
    document.getElementById('ff_name').value = f.name;
    document.getElementById('ff_category').value = f.category || '';
  } else {
    document.getElementById('ff_food_id').value = '';
    document.getElementById('ff_food_id').disabled = false;
    document.getElementById('ff_name').value = '';
    document.getElementById('ff_category').value = '';
  }
  document.getElementById('foodModal').classList.add('open');
}

async function saveFood() {
  const isEdit = !!document.getElementById('foodModalId').value;
  const data = {
    food_id:  document.getElementById('ff_food_id').value.trim(),
    name:     document.getElementById('ff_name').value.trim(),
    category: document.getElementById('ff_category').value.trim(),
  };
  if (!data.food_id || !data.name) { showToast('ID와 이름은 필수입니다', true); return; }

  try {
    if (isEdit) {
      const id = document.getElementById('foodModalId').value;
      await sbUpdate('foods', 'food_id', id, data);
      showToast('음식 정보가 수정되었습니다');
    } else {
      data.is_active = true;
      await sbInsert('foods', data);
      showToast('음식이 추가되었습니다');
    }
    closeModal('foodModal');
    await loadFoods();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function deleteFood(foodId) {
  if (!confirm(`"${foodId}" 음식을 삭제할까요?`)) return;
  try {
    await sbDelete('foods', 'food_id', foodId);
    showToast('삭제되었습니다');
    await loadFoods();
  } catch (e) {
    showToast(e.message, true);
  }
}

/* ══════════════════════════════════════════
   ③ 추천 이력
══════════════════════════════════════════ */
async function loadLogs() {
  try {
    allLogs = await sbFetch('rec_logs', 'order=created_at.desc&limit=100');
    renderLogList();
  } catch (e) {
    showToast(e.message, true);
    document.getElementById('logList').innerHTML =
      `<div class="empty-state"><div class="icon">⚠️</div><p>${e.message}</p></div>`;
  }
}

function renderLogList() {
  document.getElementById('logCount').textContent = `(${allLogs.length}건)`;
  const el = document.getElementById('logList');
  if (!allLogs.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">📋</div><p>추천 이력이 없습니다</p></div>`;
    return;
  }
  el.innerHTML = allLogs.map(log => {
    const foods = Array.isArray(log.ordered_foods) ? log.ordered_foods.join(', ') : log.ordered_foods || '-';
    const wines = Array.isArray(log.recommended_wines) ? log.recommended_wines.join(' · ') : '-';
    const date  = fmtDate(log.created_at);
    return `
      <div class="log-card" id="logcard-${log.log_id}" onclick="selectLog('${log.log_id}')">
        <div class="log-card-top">
          <span class="log-id">#${log.log_id}</span>
          <span class="log-date">${date}</span>
        </div>
        <div class="log-foods">${foods}</div>
        <div class="log-wines">🍷 ${wines}</div>
      </div>`;
  }).join('');
}

async function selectLog(logId) {
  selectedLogId = logId;
  document.querySelectorAll('.log-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`logcard-${logId}`);
  if (card) card.classList.add('selected');

  const log = allLogs.find(l => String(l.log_id) === String(logId));
  if (!log) return;

  /* 기존 feedbacks 불러오기 */
  let existingFbs = [];
  try {
    existingFbs = await sbFetch('feedbacks', `log_id=eq.${logId}`);
  } catch (e) { /* ignore */ }

  const wines = Array.isArray(log.recommended_wines) ? log.recommended_wines : [];
  const aiJson = log.ai_result_json || {};

  /* 패널 렌더 */
  const wrap = document.getElementById('logDetailWrap');
  wrap.innerHTML = `
    <div class="detail-panel">
      <div class="detail-panel-title">
        추천 와인 피드백
        <span style="font-size:11px;color:#888;font-weight:400;margin-left:8px">
          ${fmtDate(log.created_at)}
        </span>
      </div>
      ${wines.length
        ? wines.map(wineId => {
            const existing = existingFbs.find(f => f.wine_id === wineId) || null;
            const draftKey = `${logId}_${wineId}`;
            if (existing && !fbDraft[draftKey]) {
              fbDraft[draftKey] = { score: existing.score, comment: existing.comment || '' };
            }
            const draft = fbDraft[draftKey] || { score: 0, comment: '' };
            const wineInfo = allWines.find(w => w.wine_id === wineId);
            const wineName = wineInfo ? (wineInfo.name_kr || wineInfo.name) : wineId;
            /* 추천 이유 */
            let reason = '';
            if (aiJson.recommendations) {
              const rec = aiJson.recommendations.find(r => r.wine_id === wineId);
              if (rec) reason = rec.reason || '';
            }
            return `
              <div class="wine-feedback-item">
                <div class="wine-fb-name">${wineName} <span style="font-size:11px;color:#888;font-family:monospace">${wineId}</span></div>
                ${reason ? `<div class="wine-fb-reason">${reason}</div>` : ''}
                <div class="star-row" id="stars-${logId}-${wineId}">
                  ${[1,2,3,4,5].map(n =>
                    `<span class="star ${n <= draft.score ? 'active' : ''}"
                      onclick="setScore('${logId}','${wineId}',${n})">★</span>`
                  ).join('')}
                </div>
                <textarea class="fb-comment" rows="2"
                  id="comment-${logId}-${wineId}"
                  placeholder="소믈리에 코멘트를 입력하세요..."
                  onchange="setComment('${logId}','${wineId}',this.value)"
                >${draft.comment}</textarea>
                <div>
                  <button class="btn-save-fb" onclick="saveFeedback('${logId}','${wineId}')">저장</button>
                  ${existing ? `<span class="saved-chip" id="chip-${logId}-${wineId}">저장됨</span>` : `<span class="saved-chip" id="chip-${logId}-${wineId}" style="display:none">저장됨</span>`}
                </div>
              </div>`;
          }).join('')
        : '<div class="empty-state"><p>추천 와인 데이터가 없습니다</p></div>'
      }
    </div>`;
}

function setScore(logId, wineId, score) {
  const key = `${logId}_${wineId}`;
  fbDraft[key] = fbDraft[key] || { score: 0, comment: '' };
  fbDraft[key].score = score;
  /* 별 업데이트 */
  document.querySelectorAll(`#stars-${logId}-${wineId} .star`).forEach((s, i) => {
    s.classList.toggle('active', i < score);
  });
}

function setComment(logId, wineId, val) {
  const key = `${logId}_${wineId}`;
  fbDraft[key] = fbDraft[key] || { score: 0, comment: '' };
  fbDraft[key].comment = val;
}

async function saveFeedback(logId, wineId) {
  const key = `${logId}_${wineId}`;
  const draft = fbDraft[key] || { score: 0, comment: '' };
  if (!draft.score) { showToast('점수를 선택해주세요', true); return; }

  try {
    await sbUpsertFeedback({
      log_id:  Number(logId),
      wine_id: wineId,
      score:   draft.score,
      comment: draft.comment || null,
    });
    const chip = document.getElementById(`chip-${logId}-${wineId}`);
    if (chip) { chip.style.display = 'inline-block'; }
    showToast('피드백이 저장되었습니다');
    await loadFeedbacks(); /* 피드백 탭 갱신 */
  } catch (e) {
    showToast(e.message, true);
  }
}

/* ══════════════════════════════════════════
   ④ 피드백 현황
══════════════════════════════════════════ */
async function loadFeedbacks() {
  try {
    allFeedbacks = await sbFetch('feedbacks', 'order=created_at.desc');
    renderFeedbacks();
  } catch (e) {
    showToast(e.message, true);
  }
}

function renderFeedbacks() {
  renderSummary();
  renderFeedbackTable();
}

function renderSummary() {
  /* 와인별 평균 점수 */
  const byWine = {};
  allFeedbacks.forEach(fb => {
    if (!byWine[fb.wine_id]) byWine[fb.wine_id] = { total: 0, count: 0 };
    byWine[fb.wine_id].total += fb.score;
    byWine[fb.wine_id].count += 1;
  });

  const sorted = Object.entries(byWine)
    .map(([wineId, d]) => ({ wineId, avg: d.total / d.count, count: d.count }))
    .sort((a, b) => b.avg - a.avg);

  const grid = document.getElementById('summaryGrid');
  if (!sorted.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">⭐</div><p>아직 피드백 데이터가 없습니다</p></div>`;
    return;
  }
  grid.innerHTML = sorted.map(({ wineId, avg, count }) => {
    const wineInfo = allWines.find(w => w.wine_id === wineId);
    const name = wineInfo ? (wineInfo.name_kr || wineInfo.name) : wineId;
    const type = wineInfo ? wineInfo.type : '';
    const pct = (avg / 5 * 100).toFixed(0);
    return `
      <div class="summary-card">
        <div class="summary-wine-name">${name}</div>
        <div class="summary-wine-type">${type} · ${wineId}</div>
        <div class="summary-score-row">
          <span class="score-big">${avg.toFixed(1)}</span>
          <span class="score-max">/ 5</span>
          <span class="score-count">(${count}건)</span>
        </div>
        <div class="score-bar-wrap">
          <div class="score-bar" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderFeedbackTable() {
  const tbody = document.getElementById('feedbackTableBody');
  if (!allFeedbacks.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">⭐</div><p>피드백 데이터가 없습니다</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = allFeedbacks.map(fb => {
    const log = allLogs.find(l => String(l.log_id) === String(fb.log_id));
    const foods = log && Array.isArray(log.ordered_foods) ? log.ordered_foods.join(', ') : (log ? log.ordered_foods : '-');
    const wineInfo = allWines.find(w => w.wine_id === fb.wine_id);
    const wineName = wineInfo ? (wineInfo.name_kr || wineInfo.name) : fb.wine_id;
    const stars = fb.score ? '★'.repeat(fb.score) + '☆'.repeat(5 - fb.score) : '-';
    const starsClass = fb.score ? 'score-stars' : 'no-score';
    return `
      <tr>
        <td class="muted">${fmtDate(fb.created_at)}</td>
        <td style="font-size:12px;max-width:200px">${foods || '-'}</td>
        <td>
          <div style="font-weight:500">${wineName}</div>
          <div style="font-size:11px;color:#888;font-family:monospace">${fb.wine_id}</div>
        </td>
        <td><span class="${starsClass}">${stars}</span></td>
        <td style="font-size:12px;color:#555;max-width:200px">${fb.comment || '-'}</td>
      </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════
   모달 유틸
══════════════════════════════════════════ */
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
/* 오버레이 클릭으로 닫기 */
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => {
    if (e.target === el) el.classList.remove('open');
  });
});

/* ══════════════════════════════════════════
   유틸
══════════════════════════════════════════ */
function fmtPrice(v) {
  if (!v) return '-';
  return Number(v).toLocaleString('ko-KR') + '원';
}

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' })
    + ' ' + d.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
}

let toastTimer = null;
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function togglePw() {
  const input = document.getElementById('pwInput');
  const btn = document.getElementById('pwToggle');
  if (input.type === 'password') {
    input.type = 'text';
    btn.style.opacity = '1';
  } else {
    input.type = 'password';
    btn.style.opacity = '0.4';
  }
}