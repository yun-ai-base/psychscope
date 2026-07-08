/**
 * PsychScope 心智探索 — 数据驱动交互脚本
 * 数据从 data.js 加载（兼容 file:// 协议）、详情面板、搜索、AI智评切换、卡片动画
 */
(function () {
  'use strict';

  let DATA = window.DATA;
  let currentAiPsychId = 'freud';

  /* ========== 初始化（不再需要异步 fetch） ========== */
  function loadData() {
    if (!DATA) {
      document.querySelectorAll('[id$="-grid"], #timeline-items, #dir-grid, #ai-card, #ai-review-controls').forEach(el => {
        el.innerHTML = '<p style="text-align:center;color:#999;padding:40px">数据加载失败，请刷新页面重试。</p>';
      });
      return;
    }
    initAll();
  }

  /* ========== 工具函数 ========== */
  const SCHOOL_COLORS = {
    '科学心理学': { name: 'blue', hex: '#7AAEC0' },
    '精神分析': { name: 'blue', hex: '#7AAEC0' },
    '行为主义': { name: 'pink', hex: '#FFB2C1' },
    '人本主义': { name: 'green', hex: '#C7E5D4' },
    '认知心理学': { name: 'blue', hex: '#7AAEC0' },
    '社会心理学': { name: 'pink', hex: '#FFB2C1' },
    '_default': { name: 'blue', hex: '#7AAEC0' }
  };

  function getSchoolColor(schoolGroup) {
    return (SCHOOL_COLORS[schoolGroup] || SCHOOL_COLORS._default).name;
  }

  function getSchoolColorHex(schoolGroup) {
    return (SCHOOL_COLORS[schoolGroup] || SCHOOL_COLORS._default).hex;
  }

  /* ========== 书籍画廊数据 ========== */
  const BOOK_GALLERY = [
    { title: '《梦的解析》', author: '弗洛伊德', year: '1900', desc: '弗洛伊德开创性地提出了潜意识理论，开启精神分析的大门。', psychId: 'freud' },
    { title: '《动机与人格》', author: '马斯洛', year: '1954', desc: '需求层次理论的原始著作，人本主义心理学的奠基之作。', psychId: 'maslow' },
    { title: '《思考，快与慢》', author: '卡尼曼', year: '2011', desc: '揭示人类认知的两种系统，深刻改变了经济学、管理学和决策科学。', psychId: 'kahneman' },
    { title: '《活出生命的意义》', author: '弗兰克尔', year: '1946', desc: '弗兰克尔以奥斯维辛幸存者身份阐述意义疗法，美国最具影响力的十本书之一。', psychId: 'frankl' },
    { title: '《行为主义》', author: '华生', year: '1924', desc: '华生的极端环境决定论代表作，将条件反射原理全面应用于人类行为解释。', psychId: 'watson' },
    { title: '《超越自由与尊严》', author: '斯金纳', year: '1971', desc: '论证自由意志是幻象，提出以行为技术设计更美好的社会。', psychId: 'skinner' },
    { title: '《儿童智力的起源》', author: '皮亚杰', year: '1936', desc: '提出认知发展理论的奠基之作，揭示婴儿如何通过动作建构知识结构。', psychId: 'piaget' },
    { title: '《自卑与超越》', author: '阿德勒', year: '1932', desc: '人类所有行为的驱动力源于克服自卑感、追求优越，社会兴趣是关键。', psychId: 'adler' },
    { title: '《路西法效应》', author: '津巴多', year: '2007', desc: '情境将好人变为加害者——好人是如何变成恶魔的。', psychId: 'zimbardo' },
    { title: '《对权威的服从》', author: '米尔格拉姆', year: '1974', desc: '65%的普通人愿意对他人施加致命电击——权威力量的经典实验记录。', psychId: 'milgram' },
    { title: '《心流》', author: '契克森米哈赖', year: '1990', desc: '最优体验心理学 —— 当技能与挑战相匹配时产生的最佳体验状态。', psychId: '' },
    { title: '《心理学与生活》', author: '津巴多', year: '1971', desc: '将科学心理学与日常生活紧密结合的经典教材，全球数百万学生的入门读物。', psychId: 'zimbardo' },
  ];

  /* ========== 渲染学派分类 ========== */
  function renderSchools() {
    const grid = document.getElementById('schools-grid');
    if (!DATA || !grid) return;
    grid.innerHTML = DATA.schools.map(s => `
      <div class="school-card" data-school="${s.id}">
        <div class="school-icon ${s.color === 'pink' ? 'school-icon--pink' : ''} ${s.color === 'green' ? 'school-icon--green' : ''}">${s.icon}</div>
        <div class="school-name">${s.name}</div>
        <div class="school-members">${s.desc}</div>
      </div>
    `).join('');
  }

  /* ========== 渲染精选心理学家 ========== */
  function renderFeatured() {
    const grid = document.getElementById('featured-grid');
    if (!DATA || !grid) return;
    const featured = ['freud', 'piaget', 'kahneman', 'rogers'];
    const items = featured.map(id => DATA.psychologists.find(p => p.id === id)).filter(Boolean);
    grid.innerHTML = items.map((p, i) => `
      <div class="psych-card" data-psych-id="${p.id}">
        <div class="psych-image" style="background:${getSchoolColorHex(p.schoolGroup)}">
          <span class="psych-image-text">${p.name[0]}</span>
        </div>
        <div class="psych-tag psych-tag--${getSchoolColor(p.schoolGroup)}">${p.school}</div>
        <div class="psych-name">${p.name}</div>
        <div class="psych-quote">${p.quote}</div>
      </div>
    `).join('');
  }

  /* ========== 渲染里程碑实验 ========== */
  function renderExperiments() {
    const grid = document.getElementById('experiments-grid');
    if (!DATA || !grid) return;
    const colors = ['blue', 'pink', 'green', 'blue', 'pink', 'green', 'blue', 'pink', 'green'];
    grid.innerHTML = DATA.experiments.map((e, i) => `
      <div class="exp-card" data-psych-id="${e.psychologistId || ''}">
        <div class="exp-year exp-year--${colors[i]}">${e.year}</div>
        <div class="exp-title">${e.title}</div>
        <div class="exp-desc">${e.desc}</div>
      </div>
    `).join('');
  }

  /* ========== 渲染时间线 ========== */
  function renderTimeline() {
    const container = document.getElementById('timeline-items');
    if (!DATA || !container) return;
    const colors = ['blue', 'pink', 'green', 'blue', 'pink', 'green', 'blue', 'pink', 'green'];
    container.innerHTML = DATA.experiments.slice(0, 9).map((e, i) => `
      <div class="timeline-item">
        <div class="timeline-dot timeline-dot--${colors[i]}"></div>
        <div class="timeline-year">${e.year}</div>
        <div class="timeline-event">${e.title}</div>
      </div>
    `).join('');
  }

  /* ========== 渲染首页相关拓展 ========== */
  function renderTopResources() {
    const grid = document.getElementById('resources-grid');
    if (!DATA || !grid) return;
    const typeColors = {
      '经典著作': 'blue', '视频资源': 'pink', '在线测试': 'green',
      '学术资源': 'blue', '博物馆': 'pink', '在线课程': 'green',
      '学术组织': 'blue', '推荐播客': 'pink'
    };
    const typeIcons = {
      '经典著作': '📖', '视频资源': '🎬', '在线测试': '🧪',
      '学术资源': '🏛️', '博物馆': '🏛️', '在线课程': '🎓',
      '学术组织': '🤝', '推荐播客': '🎙️'
    };
    grid.innerHTML = DATA.topResources.map(r => `
      <a href="${r.url}" target="_blank" rel="noopener" class="resource-card resource-card--link">
        <div class="resource-card-top">
          <span class="resource-tag resource-tag--${typeColors[r.type] || 'blue'}">${typeIcons[r.type] || '📌'} ${r.type}</span>
        </div>
        <div class="resource-title">${r.title}</div>
        <div class="resource-desc">${r.desc}</div>
        <div class="resource-arrow">↗</div>
      </a>
    `).join('');
  }

  /* ========== AI 智评渲染 ========== */
  function renderAiReview(psychId) {
    const card = document.getElementById('ai-card');
    const controls = document.getElementById('ai-review-controls');
    if (!DATA || !card) return;
    const p = DATA.psychologists.find(x => x.id === psychId) || DATA.psychologists[0];
    card.innerHTML = `
      <div class="ai-score">
        <div class="ai-score-number" data-ai-score="${p.aiReview.score}">${p.aiReview.score}</div>
        <div class="ai-score-label">综合学术评分</div>
      </div>
      <div class="ai-bar"></div>
      <div class="ai-content">
        <div class="ai-psych-name">${p.name} <span style="font-size:14px;color:#999;font-weight:400">(${p.nameEn})</span></div>
        <div class="ai-quote">${p.aiReview.comment}</div>
        <div class="ai-meta">
          <span class="ai-meta-item">影响力: ${p.aiReview.influence}/10</span>
          <span class="ai-meta-item ai-meta-item--pink">创新性: ${p.aiReview.innovation}/10</span>
          <span class="ai-meta-item ai-meta-item--green">科学性: ${p.aiReview.scientific}/10</span>
        </div>
      </div>
    `;
    if (controls) {
      const names = DATA.psychologists.map(p => [p.id, p.name]);
      controls.innerHTML = names.map(([id, name]) => `
        <button class="ai-nav-btn ${id === psychId ? 'ai-nav-btn--active' : ''}" data-psych-id="${id}">${name}</button>
      `).join('');
    }
    animateAiScore();
  }

  function animateAiScore() {
    const scoreEl = document.querySelector('[data-ai-score]');
    if (!scoreEl) return;
    const target = parseFloat(scoreEl.dataset.aiScore);
    let current = 0;
    const duration = 1000;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = eased * target;
      scoreEl.textContent = current.toFixed(1);
      if (progress < 1) requestAnimationFrame(step);
      else scoreEl.textContent = target.toFixed(1);
    };
    requestAnimationFrame(step);
  }

  /* ========== 渲染名录 ========== */
  function renderDirectory() {
    const grid = document.getElementById('dir-grid');
    if (!DATA || !grid) return;
    const groups = {};
    DATA.psychologists.forEach(p => {
      const key = p.schoolGroup;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    const order = ['科学心理学', '精神分析', '行为主义', '人本主义', '认知心理学'];
    const colors = ['blue', 'blue', 'pink', 'green', 'blue'];
    grid.innerHTML = order.map((g, i) => {
      const members = groups[g] || [];
      return `
        <div class="dir-column">
          <div class="dir-header dir-header--${colors[i]}" style="background:${colors[i]==='pink'?'#FFB2C1':colors[i]==='green'?'#C7E5D4':'#7AAEC0'};color:${colors[i]==='green'||colors[i]==='pink'?'#1F1F1F':'#fff'}">${g}</div>
          <div class="dir-list">
            ${members.map(p => `<div class="dir-name" data-psych-id="${p.id}">${p.name} ${p.lifespan}</div>`).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  /* ========== 详情面板 ========== */
  function openDetail(psychId) {
    if (!DATA) return;
    const p = DATA.psychologists.find(x => x.id === psychId);
    if (!p) return;
    const overlay = document.getElementById('detail-overlay');
    const content = document.getElementById('detail-content');
    const loading = document.getElementById('detail-loading');

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    loading.style.display = 'block';
    content.innerHTML = '';

    // Build detail HTML
    content.innerHTML = `
      <div class="detail-header">
        <div class="detail-meta">
          <span class="detail-lifespan">${p.lifespan}</span>
          <span class="detail-nationality">${p.nationality}</span>
          <span class="detail-school-tag detail-school-tag--${getSchoolColor(p.schoolGroup)}">${p.school}</span>
        </div>
        <h1 class="detail-name">${p.name}</h1>
        <p class="detail-name-en">${p.nameEn}</p>
        <blockquote class="detail-quote">"${p.quote}"</blockquote>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">生平事迹</h3>
        <p class="detail-text">${p.bio}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">代表著作</h3>
        ${p.works.map(w => `
          <div class="detail-work">
            <div class="detail-work-title">${w.title} <span class="detail-work-year">(${w.year})</span></div>
            <div class="detail-work-label">写作背景与目的</div>
            <p class="detail-text">${w.bg}</p>
            <div class="detail-work-label">核心思想</div>
            <p class="detail-text">${w.core}</p>
          </div>
        `).join('')}
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">学说发展脉络</h3>
        <p class="detail-text">${p.theoryEvolution}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">社会影响与评价</h3>
        <p class="detail-text">${p.impact}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">同行之间的联系与传承、突破</h3>
        <p class="detail-text">${p.peers}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">相关学说的社会应用</h3>
        <p class="detail-text">${p.applications}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">AI 智评</h3>
        <div class="detail-ai-card">
          <div class="detail-ai-score">
            <span class="detail-ai-score-num">${p.aiReview.score}</span>
            <span class="detail-ai-score-label">综合评分</span>
          </div>
          <div class="detail-ai-meta">
            <span>影响力 ${p.aiReview.influence}/10</span>
            <span>创新性 ${p.aiReview.innovation}/10</span>
            <span>科学性 ${p.aiReview.scientific}/10</span>
          </div>
          <p class="detail-ai-comment">${p.aiReview.comment}</p>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">相关拓展</h3>
        <div class="detail-related-grid">
          ${p.related.map(r => `
            <a href="${r.url}" target="_blank" rel="noopener" class="detail-related-card">
              <span class="detail-related-type">${r.type}</span>
              <span class="detail-related-title">${r.title}</span>
              <span class="detail-related-desc">${r.desc}</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;

    loading.style.display = 'none';
    overlay.scrollTop = 0;
  }

  function closeDetail() {
    const overlay = document.getElementById('detail-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ========== 学派详情面板 ========== */
  function openSchoolDetail(schoolId) {
    if (!DATA) return;
    const school = DATA.schools.find(s => s.id === schoolId);
    if (!school || !school.detail) return;
    const overlay = document.getElementById('detail-overlay');
    const content = document.getElementById('detail-content');
    const loading = document.getElementById('detail-loading');

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    loading.style.display = 'block';
    content.innerHTML = '';

    const d = school.detail;
    const members = d.members.map(id => DATA.psychologists.find(p => p.id === id)).filter(Boolean);

    content.innerHTML = `
      <div class="detail-header">
        <div class="detail-meta">
          <span class="detail-school-tag detail-school-tag--${school.color}" style="font-size:14px;padding:6px 14px">${school.icon} ${school.name}</span>
        </div>
        <h1 class="detail-name">${school.name}</h1>
        <p class="detail-section-subtitle">${school.desc}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">核心关键词</h3>
        <div class="school-keywords">
          ${d.keywords.map(k => `<span class="school-keyword">${k}</span>`).join('')}
        </div>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">发展历史</h3>
        <p class="detail-text">${d.development}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">学说思想</h3>
        <p class="detail-text">${d.theories}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">社会应用</h3>
        <p class="detail-text">${d.applications}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">学说影响</h3>
        <p class="detail-text">${d.influence}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">经典实验与里程碑</h3>
        <div class="school-experiments">
          ${(d.experimentYears || []).map(y => {
            const exp = DATA.experiments.find(e => e.year === y);
            if (!exp) return '';
            return `<div class="school-exp-card" data-psych-id="${exp.psychologistId || ''}">
              <div class="school-exp-year">${exp.year}</div>
              <div class="school-exp-info">
                <div class="school-exp-title">${exp.title}</div>
                <div class="school-exp-desc">${exp.desc}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">代表著作</h3>
        <div class="school-books">
          ${(d.books || []).map(b => `<div class="school-book-card">
            <div class="school-book-title">${b.title}</div>
            <div class="school-book-author">${b.author}</div>
          </div>`).join('')}
        </div>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">代表人物</h3>
        <div class="school-member-list">
          ${members.map(p => `
            <div class="school-member-card" data-psych-id="${p.id}">
              <div class="school-member-avatar" style="background:${getSchoolColorHex(p.schoolGroup)}">
                <span class="school-member-letter">${p.name[0]}</span>
              </div>
              <div class="school-member-info">
                <div class="school-member-name">${p.name}</div>
                <div class="school-member-en">${p.nameEn}</div>
                <div class="school-member-tag">${p.school}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    loading.style.display = 'none';
    overlay.scrollTop = 0;
  }

  /* ========== 搜索 ========== */
  function openSearch() {
    document.getElementById('search-modal').classList.add('active');
    setTimeout(() => document.getElementById('search-input').focus(), 100);
  }

  function closeSearch() {
    document.getElementById('search-modal').classList.remove('active');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
  }

  function performSearch(query) {
    const container = document.getElementById('search-results');
    if (!DATA || !query.trim()) {
      container.innerHTML = '';
      return;
    }
    const q = query.toLowerCase().trim();
    const results = DATA.psychologists.filter(p => {
      return p.name.includes(q) || p.nameEn.toLowerCase().includes(q) || p.school.includes(q) ||
        p.schoolGroup.includes(q) || p.tags.some(t => t.includes(q)) ||
        p.works.some(w => w.title.includes(q));
    });
    if (results.length === 0) {
      container.innerHTML = '<p class="search-empty">未找到匹配的心理学家，请尝试其他关键词。</p>';
      return;
    }
    container.innerHTML = results.map(p => `
      <div class="search-result-item" data-psych-id="${p.id}">
        <span class="search-result-name">${p.name}</span>
        <span class="search-result-en">${p.nameEn}</span>
        <span class="search-result-school">${p.school}</span>
      </div>
    `).join('');
  }

  /* ========== 孪生宇宙 ========== */
  const TWIN_SITES = [
    { name: 'sciomap', desc: '科学星图 — 科学大师知识图谱', icon: '🔬', cat: 'content' },
    { name: 'philomap', desc: '哲学星球 — 人类思想星图', icon: '🧠', cat: 'content' },
    { name: 'morris-quotes', desc: 'Morris 语录集 · 认知洞察与智慧点评', icon: '✨', cat: 'content' },
    { name: 'research-frontiers', desc: '全球科研突破聚合与 AI 解读', icon: '📡', cat: 'ai' },
    { name: 'cosmic-discussion', desc: '宇宙大爆炸 · AI 终端深度对话', icon: '🌌', cat: 'ai' },
    { name: 'being-towards-death', desc: '向死而生 · AI 终端哲学对话', icon: '🕯️', cat: 'ai' },
    { name: 'cognitive-biases-atlas', desc: '认知谬误可视化 · 21 种思维偏差', icon: '🧩', cat: 'tool' },
    { name: 'project-atlas', desc: '项目全景图 — 知识体系总览', icon: '🗺️', cat: 'tool' },
  ];
  const TWIN_CATS = {
    ai: { label: 'AI 对话', emoji: '🤖', cls: 'ai' },
    tool: { label: '工具', emoji: '🛠️', cls: 'tool' },
    content: { label: '内容精选', emoji: '📖', cls: 'content' },
  };

  function renderTwinUniverse() {
    const container = document.getElementById('twin-container');
    if (!container) return;
    const byCat = {};
    TWIN_SITES.forEach(s => { (byCat[s.cat] = byCat[s.cat] || []).push(s); });
    const order = ['ai', 'tool', 'content'];
    let html = '';
    order.forEach(cat => {
      const list = byCat[cat]; if (!list) return;
      const info = TWIN_CATS[cat];
      html += '<div class="tw-section"><div class="tw-section-title">' + info.emoji + ' ' + info.label + '</div><div class="tw-grid">';
      list.forEach(s => {
        html += '<a class="tw-card" href="https://yun-ai-base.github.io/' + s.name + '/" target="_blank" rel="noopener">'
          + '<span class="tw-card-icon ' + info.cls + '">' + s.icon + '</span>'
          + '<span class="tw-card-info">'
          + '<span class="tw-card-name">' + s.name + '</span>'
          + '<span class="tw-card-desc">' + s.desc + '</span>'
          + '</span>'
          + '<span class="tw-card-arrow">→</span>'
          + '</a>';
      });
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  /* ========== 全部初始化 ========== */
  /* ========== 书籍画廊（环形旋转） ========== */
  let galleryAngle = 0;
  let galleryRunning = true;
  let galleryRAF = null;

  function renderBookGallery() {
    const ring = document.getElementById('book-ring');
    if (!ring) return;

    ring.innerHTML = BOOK_GALLERY.map((book, i) => `
      <div class="book-item" data-index="${i}" data-psych-id="${book.psychId}">
        <div class="book-item-title">${book.title}</div>
        <div class="book-item-author">${book.author}</div>
      </div>
    `).join('');

    const items = ring.querySelectorAll('.book-item');
    const container = ring.parentElement;
    const cx = container.offsetWidth / 2;
    const cy = container.offsetHeight / 2;
    const radius = Math.min(cx, cy) - 60;

    function positionItems(angle) {
      const count = items.length;
      const positions = [];
      items.forEach((el, i) => {
        const a = (i / count) * 2 * Math.PI + angle;
        const x3d = radius * Math.sin(a);
        const z3d = radius * Math.cos(a);

        // Perspective projection
        const perspective = 600;
        const scale = perspective / (perspective + z3d);
        const screenX = cx + x3d * scale - 40;
        const screenY = cy - z3d * 0.08 - 55;

        el.style.left = screenX + 'px';
        el.style.top = screenY + 'px';
        el.style.transform = 'scale(' + scale + ')';
        el.style.opacity = Math.max(0.35, 1 - (z3d + radius) / (2 * radius) * 0.65);

        positions.push({ el, z: z3d });
      });
      // Sort z-index: front items render on top
      positions.sort((a, b) => b.z - a.z).forEach((p, idx) => {
        p.el.style.zIndex = idx + 1;
      });
    }

    // Hover interaction
    const centerDetail = document.getElementById('book-center-detail');
    const centerDefault = document.querySelector('.book-center-default');

    items.forEach((el, i) => {
      el.addEventListener('mouseenter', () => {
        galleryRunning = false;
        const book = BOOK_GALLERY[i];
        centerDefault.style.display = 'none';
        centerDetail.className = 'book-center-detail active';
        centerDetail.innerHTML = `
          <div class="book-center-title">${book.title}</div>
          <div class="book-center-author">${book.author} · ${book.year}</div>
          <div class="book-center-desc">${book.desc}</div>
        `;
      });
      el.addEventListener('mouseleave', () => {
        galleryRunning = true;
        centerDefault.style.display = '';
        centerDetail.className = 'book-center-detail';
        centerDetail.innerHTML = '';
      });
    });

    // Animation loop
    positionItems(0);

    function animate() {
      if (galleryRunning) {
        galleryAngle += 0.002;
        positionItems(galleryAngle);
      }
      galleryRAF = requestAnimationFrame(animate);
    }
    galleryRAF = requestAnimationFrame(animate);
  }

  function initAll() {
    renderSchools();
    renderFeatured();
    renderExperiments();
    renderTimeline();
    renderAiReview(currentAiPsychId);
    renderDirectory();
    renderTopResources();
    renderBookGallery();
    renderTwinUniverse();
    observeCards();
    observeTimelineItems();
    document.getElementById('stat-count').textContent = DATA.psychologists.length;
  }

  /* ========== 事件委托 ========== */

  /* ========== 事件委托 ========== */
  function setupEvents() {
    // Open detail on card click
    document.addEventListener('click', (e) => {
      const psychEl = e.target.closest('[data-psych-id]');
      if (psychEl) {
        const id = psychEl.dataset.psychId;
        if (!id) return;

        // If clicked in AI review controls
        if (psychEl.closest('#ai-review-controls')) {
          currentAiPsychId = id;
          renderAiReview(id);
          return;
        }

        // If clicked in search results
        if (psychEl.closest('#search-results')) {
          closeSearch();
          openDetail(id);
          return;
        }

        // Otherwise open detail
        openDetail(id);
      }
    });

    // Close detail
    document.getElementById('detail-close').addEventListener('click', closeDetail);
    document.getElementById('detail-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('detail-overlay')) closeDetail();
    });

    // Search
    document.getElementById('search-btn').addEventListener('click', openSearch);
    document.getElementById('hero-search').addEventListener('click', openSearch);
    document.getElementById('search-modal-close').addEventListener('click', closeSearch);
    document.getElementById('search-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('search-modal')) closeSearch();
    });
    document.getElementById('search-input').addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    // Search keyboard navigation
    document.getElementById('search-input').addEventListener('keydown', (e) => {
      const results = document.getElementById('search-results');
      const items = results.querySelectorAll('.search-result-item');
      if (!items.length) return;

      const current = results.querySelector('.search-result-item--focused');
      let idx = -1;
      if (current) idx = Array.from(items).indexOf(current);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (current) current.classList.remove('search-result-item--focused');
        idx = (idx + 1) % items.length;
        items[idx].classList.add('search-result-item--focused');
        items[idx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (current) current.classList.remove('search-result-item--focused');
        idx = idx <= 0 ? items.length - 1 : idx - 1;
        items[idx].classList.add('search-result-item--focused');
        items[idx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = current || items[0];
        if (target) target.click();
      }
    });

    // School filter→detail click
    document.addEventListener('click', (e) => {
      const schoolCard = e.target.closest('.school-card');
      if (schoolCard && schoolCard.dataset.school) {
        openSchoolDetail(schoolCard.dataset.school);
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.getElementById('detail-overlay').classList.contains('active')) closeDetail();
        if (document.getElementById('search-modal').classList.contains('active')) closeSearch();
      }
    });
  }

  /* ========== 卡片入场动画 ========== */
  function observeCards() {
    const cards = document.querySelectorAll('.school-card, .psych-card, .exp-card, .resource-card, .dir-column');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(24px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }

  function observeTimelineItems() {
    const items = document.querySelectorAll('.timeline-item');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
      observer.observe(item);
    });
  }

  /* ========== 移动端菜单 ========== */
  function setupMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('nav-links');
    toggle.addEventListener('click', () => {
      nav.classList.toggle('active');
      const isOpen = nav.classList.contains('active');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      const bars = toggle.querySelectorAll('span');
      if (isOpen) {
        bars[0].style.transform = 'translateY(7px) rotate(45deg)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        bars[0].style.transform = '';
        bars[1].style.opacity = '';
        bars[2].style.transform = '';
      }
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('active');
        document.body.style.overflow = '';
        toggle.setAttribute('aria-expanded', 'false');
        const bars = toggle.querySelectorAll('span');
        bars[0].style.transform = '';
        bars[1].style.opacity = '';
        bars[2].style.transform = '';
      });
    });
  }

  /* ========== Header 滚动效果 ========== */
  function setupHeaderScroll() {
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
        header.style.background = 'rgba(232, 245, 249, 0.95)';
      } else {
        header.style.boxShadow = '';
        header.style.background = '';
      }
    });
  }

  /* ========== 回到顶部按钮 ========== */
  function setupBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '↑';
    btn.setAttribute('aria-label', '回到顶部');
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });
  }

  /* ========== 启动 ========== */
  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    setupMobileMenu();
    setupHeaderScroll();
    setupBackToTop();
    loadData();
  });
})();
