const contentEl = document.getElementById('content');
const tabsEl = document.getElementById('category-tabs');
const updatedAtEl = document.getElementById('updated-at');
const refreshBtn = document.getElementById('refresh-btn');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMeta = document.getElementById('modal-meta');
const modalDesc = document.getElementById('modal-desc');
const modalLink = document.getElementById('modal-link');
const modalClose = document.getElementById('modal-close');

let lastData = null;
let activeCategory = 'all';

function formatDate(pubDate) {
  if (!pubDate) return '';
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return pubDate;
  return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderTabs(categories) {
  tabsEl.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'tab-btn' + (activeCategory === 'all' ? ' active' : '');
  allBtn.textContent = 'すべて';
  allBtn.onclick = () => { activeCategory = 'all'; render(); };
  tabsEl.appendChild(allBtn);

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (activeCategory === cat.key ? ' active' : '');
    btn.textContent = cat.label;
    btn.onclick = () => { activeCategory = cat.key; render(); };
    tabsEl.appendChild(btn);
  });
}

function renderCategorySection(cat) {
  const section = document.createElement('section');
  section.className = 'category-section';

  const heading = document.createElement('h2');
  heading.textContent = cat.label;
  section.appendChild(heading);

  if (cat.error) {
    const err = document.createElement('p');
    err.className = 'error-box';
    err.textContent = `取得に失敗しました: ${cat.error}`;
    section.appendChild(err);
    return section;
  }

  const grid = document.createElement('div');
  grid.className = 'card-grid';

  cat.items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.onclick = () => openModal(item, cat.label);

    const badge = document.createElement('span');
    badge.className = 'rank-badge';
    badge.textContent = `TOP ${idx + 1}`;

    const title = document.createElement('h3');
    title.textContent = item.title;

    const desc = document.createElement('p');
    desc.textContent = item.description;

    const date = document.createElement('span');
    date.className = 'pubdate';
    date.textContent = formatDate(item.pubDate);

    card.append(badge, title, desc, date);
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function render() {
  if (!lastData) return;
  renderTabs(lastData.categories);
  contentEl.innerHTML = '';

  const categoriesToShow =
    activeCategory === 'all'
      ? lastData.categories
      : lastData.categories.filter((c) => c.key === activeCategory);

  categoriesToShow.forEach((cat) => {
    contentEl.appendChild(renderCategorySection(cat));
  });
}

function openModal(item, categoryLabel) {
  modalTitle.textContent = item.title;
  modalMeta.textContent = `${categoryLabel} ・ ${formatDate(item.pubDate)} ・ NHKニュース`;
  modalDesc.textContent = item.description;
  modalLink.href = item.link;
  modal.classList.remove('hidden');
}

modalClose.onclick = () => modal.classList.add('hidden');
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});

async function loadNews() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = '取得中...';
  try {
    const res = await fetch(`../data/news.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    lastData = data;
    updatedAtEl.textContent = `最終更新: ${new Date(data.updatedAt).toLocaleString('ja-JP')}`;
    render();
  } catch (err) {
    contentEl.innerHTML = `<p class="error-box">ニュースの取得に失敗しました。しばらくしてから再度お試しください。</p>`;
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄 更新';
  }
}

refreshBtn.onclick = loadNews;
loadNews();
