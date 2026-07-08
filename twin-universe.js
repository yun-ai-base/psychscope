/**
 * 孪生宇宙 — 项目导航板块（共享脚本）
 *
 * 用法：
 *   <link rel="stylesheet" href="https://yun-ai-base.github.io/psychscope/twin-universe.css">
 *   <section class="section" id="twin-universe">
 *     <h2 class="section-title">🧬 孪生宇宙</h2>
 *     <p class="section-subtitle">我的其他项目 · 点击跳转探索</p>
 *     <div class="twin-container" id="twin-container"></div>
 *   </section>
 *   <script src="https://yun-ai-base.github.io/psychscope/twin-universe.js"
 *           data-project="psychscope"></script>
 */
(function () {
  'use strict';

  var PROJECTS_URL = 'https://yun-ai-base.github.io/psychscope/projects.json';

  var CATS = {
    ai:      { label: 'AI 对话',  emoji: '🤖' },
    tool:    { label: '工具',     emoji: '🛠️' },
    content: { label: '内容精选', emoji: '📖' },
  };
  var ORDER = ['ai', 'tool', 'content'];

  // Get current project name from data-project attribute
  var currentProject = '';
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('twin-universe.js') > -1) {
      currentProject = scripts[i].getAttribute('data-project') || '';
      break;
    }
  }

  function render(projects) {
    var container = document.getElementById('twin-container');
    if (!container) return;

    // Exclude current project
    var filtered = projects.filter(function (p) { return p.name !== currentProject; });

    // Group by category
    var byCat = {};
    filtered.forEach(function (s) {
      (byCat[s.cat] = byCat[s.cat] || []).push(s);
    });

    var html = '';
    ORDER.forEach(function (cat) {
      var list = byCat[cat];
      if (!list) return;
      var info = CATS[cat];
      html += '<div class="tw-section">'
        + '<div class="tw-section-title">' + info.emoji + ' ' + info.label + '</div>'
        + '<div class="tw-grid">';
      list.forEach(function (s) {
        html += '<a class="tw-card" href="https://yun-ai-base.github.io/' + s.name + '/" target="_blank" rel="noopener">'
          + '<span class="tw-card-icon ' + cat + '">' + s.icon + '</span>'
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

  // Fetch and render
  var xhr = new XMLHttpRequest();
  xhr.open('GET', PROJECTS_URL, true);
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        render(JSON.parse(xhr.responseText));
      } catch (e) {
        // silent fail
      }
    }
  };
  xhr.send();
})();
