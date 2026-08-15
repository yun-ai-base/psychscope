/**
 * PsychScope 心智探索 — 数据驱动交互脚本
 * 数据从 data.js 加载（兼容 file:// 协议）、详情面板、搜索、AI智评切换、卡片动画
 * v2: 详情上下页导航 / hash 路由 / 搜索增强 / 书廊触屏 / 语录墙 / 暗色模式 / 阅读进度
 */
(function () {
  'use strict';

  let DATA = window.DATA;
  let currentAiPsychId = 'freud';
  let currentDetailIndex = -1;

  /* ========== 初始化（不再需要异步 fetch） ========== */
  function loadData() {
    if (!DATA) {
      document.querySelectorAll('[id$="-grid"], #timeline-items, #dir-grid, #ai-card, #ai-review-controls, #quotes-viewport').forEach(el => {
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

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ========== 书籍画廊数据（15 位大师代表作） ========== */
  const BOOK_GALLERY = [
    { title: '《梦的解析》', author: '弗洛伊德', year: '1900', desc: '弗洛伊德开创性地提出了潜意识理论，开启精神分析的大门。', psychId: 'freud',
    core: "梦是「愿望的达成」，是通往潜意识的王道。弗洛伊德在本书中系统构建了梦的工作机制——凝缩、移置、象征与润饰，并据此提出意识、前意识与潜意识的地形模型：梦是被压抑愿望的伪装性满足，须通过自由联想才能触及深层含义。学术评价：这是精神分析的奠基文献，开创了深度心理学的范式；但其释梦方法长期被批评缺乏可证伪性，现代认知神经科学对REM睡眠与梦的研究也部分修正了其假设。即便如此，本书对文学、艺术与临床心理治疗的辐射力至今无出其右。" },
    { title: '《动机与人格》', author: '马斯洛', year: '1954', desc: '需求层次理论的原始著作，人本主义心理学的奠基之作。', psychId: 'maslow',
    core: "需求层次理论——生理、安全、归属与爱、尊重、自我实现五层递进。马斯洛强调动机的整体性与「人之为人」的积极面，反对行为主义的机械刺激—反应观，并以自我实现者的特质研究为人类潜能背书。学术评价：作为人本主义心理学的三大宣言之一，它把心理学从病理学拉回对健康的关注；但层次的递进顺序并非铁律（为理想牺牲安全的例子屡见不鲜），跨文化普适性也受质疑。作为动机组织框架，它在管理、教育与组织行为领域至今被广泛引用。" },
    { title: '《思考，快与慢》', author: '卡尼曼', year: '2011', desc: '揭示人类认知的两种系统，深刻改变了经济学、管理学和决策科学。', psychId: 'kahneman',
    core: "双系统理论：系统1快速、直觉、自动化，系统2缓慢、审慎、需消耗认知资源。卡尼曼与特沃斯基通过大量精巧实验揭示了锚定、可得性、代表性等启发式偏差，提出前景理论（损失厌恶、参照依赖、框架效应），颠覆了经济学「理性人」假设。学术评价：行为经济学的里程碑，2002年诺贝尔经济学奖由此而来；作者也坦承双系统是一种有用的隐喻而非神经真实。围绕该框架的重复实验争议（如「麦克白效应」复制失败）反而成为学界反思科学实践的样本。" },
    { title: '《活出生命的意义》', author: '弗兰克尔', year: '1946', desc: '弗兰克尔以奥斯维辛幸存者身份阐述意义疗法，美国最具影响力的十本书之一。', psychId: 'frankl',
    core: "意义疗法（Logotherapy）的奠基之作。弗兰克尔以奥斯维辛集中营幸存者的身份论证：人的一切外在都可以被剥夺，唯独「在任何境遇中选择自己态度的自由」不可剥夺。他提出意义的三条来源——创造的价值（工作）、体验的价值（爱与自然）、态度的价值（苦难），并指出「人真正渴求的不是紧张缺席，而是为一个值得的目标而奋斗」。学术评价：存在主义心理学与维也纳第三学派的经典；方法论上偏主观、缺乏严格实证，但其对意义感与心理韧性的洞见，被当代积极心理学的意义研究与创伤后成长理论大量承接。" },
    { title: '《行为主义》', author: '华生', year: '1924', desc: '华生的极端环境决定论代表作，将条件反射原理全面应用于人类行为解释。', psychId: 'watson',
    core: "行为主义的宣言书。华生主张心理学应彻底抛弃意识与内省，只研究可观察、可测量的行为；他引入巴甫洛夫的条件反射作为行为的统一原理，并豪言「给我一打健全的婴儿，我可以把他们训练成任何一种类型的专家」。学术评价：本书吹响了心理学「行为主义革命」的号角，推动心理学从主观主义走向客观科学；但其环境决定论忽视了遗传与认知中介，小阿尔伯特实验的伦理问题亦被后世反复批判。它把「人可被塑造」的乐观主义带给了教育与社会工程，也把「人是机器」的冷酷留给了辩论。" },
    { title: '《超越自由与尊严》', author: '斯金纳', year: '1971', desc: '论证自由意志是幻象，提出以行为技术设计更美好的社会。', psychId: 'skinner',
    core: "激进行为主义的巅峰。斯金纳论证「自由」「尊严」只是遮蔽行为真实成因的幻觉——一切行为都由强化历史与环境变量决定，所谓意志不过是操作条件作用的产物；他主张以「行为技术」（以正强化为主的程序）设计文化而非依赖惩罚。学术评价：行为主义内部逻辑自洽，催生了行为矫正、程序教学与ABA疗法等实践；但「人即环境的产物」立场引发人本主义者的强烈抗议，其「社会工程设计」的极权风险至今仍被视为警示。它是心理学史上最彻底的「科学主义」宣言，也是最动人的哲学争论现场。" },
    { title: '《儿童智力的起源》', author: '皮亚杰', year: '1936', desc: '提出认知发展理论的奠基之作，揭示婴儿如何通过动作建构知识结构。', psychId: 'piaget',
    core: "发生认识论的奠基之作。皮亚杰通过对三个孩子的系统观察提出：智力既非天赋亦非环境印刻，而是儿童通过动作与环境的「同化—顺应」平衡过程主动建构的；他描绘了感觉运动阶段（0—2岁）中客体永久性等认知里程碑。学术评价：开创了认知发展研究的结构主义+建构主义传统，是发展心理学的基石；后世用更敏感的范式发现婴儿的能力出现早于皮亚杰所述，阶段之间的刚性边界也被松动，但「动作—图式—建构」的机制框架至今支配着我们对儿童思维的理解。" },
    { title: '《自卑与超越》', author: '阿德勒', year: '1932', desc: '人类所有行为的驱动力源于克服自卑感、追求优越，社会兴趣是关键。', psychId: 'adler',
    core: "个体心理学的总纲。阿德勒提出：自卑感是普遍的人类处境，也是追求优越的动力源泉；早期记忆、出生顺序与家庭氛围塑造了每个人的「生活风格」，决定其应对人生三大任务（职业、社会、爱情）的方式；而社会兴趣（Gemeinschaftsgefühl）是心理健康的核心标尺。学术评价：早于马斯洛半个世纪提出「自我完善」取向，深刻影响新精神分析与人本主义；其概念体系较松散、缺乏标准化测量，但「自卑—补偿」「生活方式」等洞见在现代咨询、教育与组织管理中生命力强劲。" },
    { title: '《路西法效应》', author: '津巴多', year: '2007', desc: '情境将好人变为加害者——好人是如何变成恶魔的。', psychId: 'zimbardo',
    core: "情境论的社会心理学宣言。津巴多以斯坦福监狱实验（1971）为核心，论证善与恶的分界不在人格而在情境与系统——角色分工、去个体化、权威结构足以让普通好人滑向残暴；他以卢旺达种族屠杀与阿布格莱布虐囚事件佐证「情境的邪恶」。学术评价：实验本身的伦理问题与2018年档案公开引发的可靠性争议使它成为学界反复检视的样本；但「情境力量」命题与「好苹果与坏桶」的隐喻，仍是社会心理学最具影响力的思想之一，也是组织伦理教育的必修案例。" },
    { title: '《对权威的服从》', author: '米尔格拉姆', year: '1974', desc: '65%的普通人愿意对他人施加致命电击——权威力量的经典实验记录。', psychId: 'milgram',
    core: "服从实验的完整记录。米尔格拉姆发现，65%的普通被试在实验者权威的指令下，对「学习者」施加了致命的450伏电击。他提出服从的「代理状态」理论——个体把自己视为执行他人意志的工具，从而卸下道德责任；并归纳出权威正当性、渐进的电压阶梯（缓冲效应）、承诺与群体从众等促进服从的因素。学术评价：社会心理学最震撼的实验，直接启发了对纳粹式顺从的制度性反思；其欺骗与心理压力催生了后世严格的研究伦理规范，堪称「以科学之名、以伦理为界」的分水岭。" },
    { title: '《心流》', author: '契克森米哈赖', year: '1990', desc: '最优体验心理学 —— 当技能与挑战相匹配时产生的最佳体验状态。', psychId: '',
    core: "最优体验心理学。契克森米哈赖发现，当技能与挑战达到平衡并略高于均值时，人会进入全神贯注、忘记自我与时间的「心流」状态——这是内在动机的巅峰，也是幸福的微观结构。他提炼出心流的构成要素：清晰目标、即时反馈、挑战—技能匹配、行动与意识融合等，并把「使体验最优化」的技术延伸到工作、休闲与创造。学术评价：为积极心理学提供了可操作的核心概念，被游戏设计、运动训练与创造力研究广泛运用；「心流」的边界界定虽有模糊之处，但作为主观体验的研究范式，它把「最优状态」从神秘主义带进了实验室。" },
    { title: '《心理学与生活》', author: '津巴多', year: '1971', desc: '将科学心理学与日常生活紧密结合的经典教材，全球数百万学生的入门读物。', psychId: 'zimbardo',
    core: "经典心理学通识教材。津巴多以「心理学即生活」为纲，把感知、学习、记忆、动机、社会行为等科学原理与日常经验无缝对接，反复训练读者的批判性思维与科学方法素养——心理学不是常识的注脚，而是检验常识的工具。学术评价：全球数百万学生的入门读物，堪称心理学科普的范式；作为教材，其框架随每版修订而更新，而「通识化难免简化争议」的批评始终存在。它的价值不在于给出结论，而在于交付一套理解人的工具箱。" },
    { title: '《心理类型》', author: '荣格', year: '1921', desc: '提出内倾-外倾人格类型与集体潜意识雏形，深刻影响人格心理学。', psychId: 'jung',
    core: "人格类型学的奠基之作。荣格提出两种态度类型（内倾/外倾）与四种心理功能（思维、情感、感觉、直觉），组合出八种人格类型；同时阐述集体潜意识与原型（人格面具、阿尼玛/阿尼姆斯、阴影），把类型学建立在与弗洛伊德对立的「个体化」进程之上。学术评价：MBTI等现代人格测验的直接思想源头，深刻影响心理咨询、职业测评与组织管理；类型划分被批评有静态化、标签化倾向，实证效度弱于大五模型，但其对「个体差异之尊严」的态度具有持久的人文价值。" },
    { title: '《社会学习理论》', author: '班杜拉', year: '1977', desc: '提出观察学习与自我效能感，连接行为主义与认知心理学的桥梁。', psychId: 'bandura',
    core: "从行为主义通往认知心理学的桥梁。班杜拉提出两大支柱：观察学习（示范、模仿与替代强化，波波玩偶实验为经典证据）与自我效能感（个体对自身完成任务能力的信念）。他主张「交互决定论」——人不是环境的被动产物，而是行为、环境与个人因素互相塑造的能动者。学术评价：修正了行为主义刺激—反应模式的狭隘性，为认知行为疗法（CBT）提供理论根基；自我效能感已被反复验证对学业、健康与职业行为具有广泛预测力，是二十世纪最具实践影响力的心理学概念之一。" },
    { title: '《真实的幸福》', author: '塞利格曼', year: '2002', desc: '积极心理学奠基之作，将幸福解构为可测量的品格优势与积极情绪。', psychId: 'seligman',
    core: "积极心理学运动宣言。塞利格曼将幸福拆解为三个可研究的成分：愉悦的生活（积极情绪）、投入的生活（心流与优势发挥）、有意义的生活（归属高于自我的事业）；他开发VIA品格优势分类（24种），主张幸福不是遗传设定了上限的彩票，而是可以通过练习提升的能力。学术评价：发起并命名了积极心理学，把心理学使命从「治疗疾病」转向「促进繁荣」；「三件好事」等干预研究为其提供了实证支撑，但「幸福过度个人化、忽视社会结构」的批评也在学界持续发酵。" },
  ];

  /* ========== AI 评分雷达图辅助 ========== */
  const RAD_CX = 110, RAD_CY = 110, RAD_R = 80;
  const RAD_SQRT3_2 = 0.8660254037844387;
  function radPt(i, v) {
    const s = Math.max(0, Math.min(10, v)) / 10;
    if (i === 0) return { x: RAD_CX, y: RAD_CY - s * RAD_R };
    if (i === 1) return { x: RAD_CX - s * RAD_R * RAD_SQRT3_2, y: RAD_CY + s * RAD_R * 0.5 };
    return { x: RAD_CX + s * RAD_R * RAD_SQRT3_2, y: RAD_CY + s * RAD_R * 0.5 };
  }
  function radPointsStr(vals) {
    const p = vals.map((v, i) => radPt(i, v));
    return p.map(pt => pt.x.toFixed(2) + ',' + pt.y.toFixed(2)).join(' ');
  }
  function buildRadarSVG(initVals) {
    let grid = '';
    [2, 4, 6, 8, 10].forEach(function (v) {
      const s = v / 10;
      const T = [RAD_CX, RAD_CY - s * RAD_R];
      const L = [RAD_CX - s * RAD_R * RAD_SQRT3_2, RAD_CY + s * RAD_R * 0.5];
      const R = [RAD_CX + s * RAD_R * RAD_SQRT3_2, RAD_CY + s * RAD_R * 0.5];
      grid += '<polygon points="' + T[0] + ',' + T[1] + ' ' + L[0] + ',' + L[1] + ' ' + R[0] + ',' + R[1] + '" fill="none" stroke="var(--divider)" stroke-width="0.5"/>';
    });
    const T0 = [RAD_CX, RAD_CY - RAD_R];
    const L0 = [RAD_CX - RAD_R * RAD_SQRT3_2, RAD_CY + RAD_R * 0.5];
    const R0 = [RAD_CX + RAD_R * RAD_SQRT3_2, RAD_CY + RAD_R * 0.5];
    const axes = '<line x1="' + RAD_CX + '" y1="' + RAD_CY + '" x2="' + T0[0] + '" y2="' + T0[1] + '" stroke="var(--divider)" stroke-width="0.5"/>'
      + '<line x1="' + RAD_CX + '" y1="' + RAD_CY + '" x2="' + L0[0] + '" y2="' + L0[1] + '" stroke="var(--divider)" stroke-width="0.5"/>'
      + '<line x1="' + RAD_CX + '" y1="' + RAD_CY + '" x2="' + R0[0] + '" y2="' + R0[1] + '" stroke="var(--divider)" stroke-width="0.5"/>';
    const pts = radPointsStr(initVals);
    const ip0 = radPt(0, initVals[0]);
    const ip1 = radPt(1, initVals[1]);
    const ip2 = radPt(2, initVals[2]);
    return '<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="三维评分雷达图">'
      + grid + axes
      + '<polygon id="ai-radar-poly" points="' + pts + '" fill="var(--accent-blue)" fill-opacity="0.18" stroke="var(--accent-blue)" stroke-width="1.5" stroke-linejoin="round"/>'
      + '<circle id="ai-radar-d0" cx="' + ip0.x.toFixed(2) + '" cy="' + ip0.y.toFixed(2) + '" r="3.5" fill="var(--accent-blue)"/>'
      + '<circle id="ai-radar-d1" cx="' + ip1.x.toFixed(2) + '" cy="' + ip1.y.toFixed(2) + '" r="3.5" fill="var(--accent-pink)"/>'
      + '<circle id="ai-radar-d2" cx="' + ip2.x.toFixed(2) + '" cy="' + ip2.y.toFixed(2) + '" r="3.5" fill="var(--accent-green)"/>'
      + '<text x="' + RAD_CX + '" y="14" text-anchor="middle">影响力 <tspan id="ai-radar-v0" class="ai-radar-val">' + initVals[0].toFixed(1) + '</tspan></text>'
      + '<text x="' + (L0[0] - 6) + '" y="' + (L0[1] + 4) + '" text-anchor="end">创新性 <tspan id="ai-radar-v1" class="ai-radar-val">' + initVals[1].toFixed(1) + '</tspan></text>'
      + '<text x="' + (R0[0] + 6) + '" y="' + (R0[1] + 4) + '" text-anchor="start">科学性 <tspan id="ai-radar-v2" class="ai-radar-val">' + initVals[2].toFixed(1) + '</tspan></text>'
      + '</svg>';
  }
  let aiRadarPrev = null;
  function animateAiRadar(toVals) {
    const from = aiRadarPrev || [0, 0, 0];
    aiRadarPrev = toVals.slice();
    const poly = document.getElementById('ai-radar-poly');
    const d0 = document.getElementById('ai-radar-d0');
    const d1 = document.getElementById('ai-radar-d1');
    const d2 = document.getElementById('ai-radar-d2');
    const v0 = document.getElementById('ai-radar-v0');
    const v1 = document.getElementById('ai-radar-v1');
    const v2 = document.getElementById('ai-radar-v2');
    if (!poly || !d0) return;
    const dur = 800;
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const cur = [0,1,2].map(function (i) { return from[i] + (toVals[i] - from[i]) * e; });
      poly.setAttribute('points', radPointsStr(cur));
      const p0 = radPt(0, cur[0]);
      const p1 = radPt(1, cur[1]);
      const p2 = radPt(2, cur[2]);
      d0.setAttribute('cx', p0.x.toFixed(2)); d0.setAttribute('cy', p0.y.toFixed(2));
      d1.setAttribute('cx', p1.x.toFixed(2)); d1.setAttribute('cy', p1.y.toFixed(2));
      d2.setAttribute('cx', p2.x.toFixed(2)); d2.setAttribute('cy', p2.y.toFixed(2));
      v0.textContent = cur[0].toFixed(1);
      v1.textContent = cur[1].toFixed(1);
      v2.textContent = cur[2].toFixed(1);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ========== 渲染学派分类 ========== */
  function renderSchools() {
    const grid = document.getElementById('schools-grid');
    if (!DATA || !grid) return;
    grid.innerHTML = DATA.schools.map(s => `
      <div class="school-card" data-school="${s.id}" role="button" tabindex="0" aria-label="查看${s.name}详情">
        <div class="school-icon ${s.color === 'pink' ? 'school-icon--pink' : ''} ${s.color === 'green' ? 'school-icon--green' : ''}">${s.icon}</div>
        <div class="school-name">${s.name}</div>
        <div class="school-members">${s.desc}</div>
        <span class="card-more-hint">查看详情 →</span>
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
      <div class="psych-card" data-psych-id="${p.id}" role="button" tabindex="0" aria-label="查看${p.name}详情">
        <div class="psych-image" style="background:${getSchoolColorHex(p.schoolGroup)}">
          ${p.image ? `<img class="portrait" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" onerror="this.remove()">` : ''}
          <span class="psych-image-text">${p.name[0]}</span>
          <span class="psych-image-year">${p.lifespan}</span>
        </div>
        <div class="psych-tag psych-tag--${getSchoolColor(p.schoolGroup)}">${p.school}</div>
        <div class="psych-name">${p.name}</div>
        <div class="psych-quote">${p.quote}</div>
        <span class="card-more-hint">查看详情 →</span>
      </div>
    `).join('');
  }

  /* ========== 渲染里程碑实验 ========== */
  function renderExperiments() {
    const grid = document.getElementById('experiments-grid');
    if (!DATA || !grid) return;
    const colors = ['blue', 'pink', 'green', 'blue', 'pink', 'green', 'blue', 'pink', 'green'];
    grid.innerHTML = DATA.experiments.map((e, i) => `
      <div class="exp-card" data-psych-id="${e.psychologistId || ''}" role="button" tabindex="${e.psychologistId ? '0' : '-1'}" aria-label="${e.psychologistId ? '查看相关心理学家详情' : e.title}">
        <div class="exp-year exp-year--${colors[i]}">${e.year}</div>
        <div class="exp-title">${e.title}</div>
        <div class="exp-desc">${e.desc}</div>
        ${e.psychologistId ? '<span class="card-more-hint">查看详情 →</span>' : ''}
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
      <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="resource-card resource-card--link">
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
      <div class="ai-radar" id="ai-radar-wrap">${buildRadarSVG([p.aiReview.influence, p.aiReview.innovation, p.aiReview.scientific])}</div>
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
      controls.innerHTML = `
        <button class="ai-arrow-btn" id="ai-prev" aria-label="上一位">←</button>
        <div class="ai-nav-list" id="ai-nav-list">${names.map(([id, name]) => `
          <button class="ai-nav-btn ${id === psychId ? 'ai-nav-btn--active' : ''}" data-psych-id="${id}">${name}</button>
        `).join('')}</div>
        <button class="ai-arrow-btn" id="ai-next" aria-label="下一位">→</button>
      `;
    }
    animateAiScore();
    animateAiRadar([p.aiReview.influence, p.aiReview.innovation, p.aiReview.scientific]);
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

  /* ========== 思想传承图谱 ========== */
  const RELATION_EDGES = [
    { from: 'freud', to: 'jung', type: 'mentor' },
    { from: 'freud', to: 'adler', type: 'mentor' },
    { from: 'watson', to: 'skinner', type: 'mentor' },
    { from: 'watson', to: 'bandura', type: 'influence' },
    { from: 'skinner', to: 'bandura', type: 'influence' },
    { from: 'adler', to: 'frankl', type: 'influence' },
    { from: 'freud', to: 'frankl', type: 'influence' },
    { from: 'adler', to: 'maslow', type: 'influence' },
    { from: 'adler', to: 'rogers', type: 'influence' },
    { from: 'maslow', to: 'seligman', type: 'influence' },
    { from: 'rogers', to: 'seligman', type: 'influence' },
    { from: 'milgram', to: 'zimbardo', type: 'influence' }
  ];
  const RELATION_POS = {
    wundt: [120, 217],
    freud: [250, 190], jung: [250, 85], adler: [250, 295],
    watson: [380, 140], skinner: [380, 240],
    maslow: [510, 85], rogers: [510, 160], frankl: [510, 235], seligman: [510, 310],
    bandura: [640, 75], piaget: [640, 145], milgram: [640, 215], zimbardo: [640, 285], kahneman: [640, 355]
  };
  const RELATION_COLORS = {
    '科学心理学': '#5E93AB',
    '精神分析': '#7A6BB0',
    '行为主义': '#C76A85',
    '人本主义': '#4F8A6D',
    '认知心理学': '#5E93AB'
  };
  const RELATION_GROUPS = [
    { x: 120, label: '科学心理学' },
    { x: 250, label: '精神分析' },
    { x: 380, label: '行为主义' },
    { x: 510, label: '人本主义' },
    { x: 640, label: '认知心理学' }
  ];
  function shortName(name) {
    let t = name.split('·').pop();
    if (t === 'B.F.斯金纳') t = '斯金纳';
    return t;
  }
  function renderRelations() {
    const wrap = document.getElementById('relations-wrap');
    if (!DATA || !wrap) return;
    const byId = {};
    DATA.psychologists.forEach(function (p) { byId[p.id] = p; });
    const R = 15;
    let edges = '';
    RELATION_EDGES.forEach(function (e) {
      const a = RELATION_POS[e.from], b = RELATION_POS[e.to];
      if (!a || !b) return;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len, uy = dy / len;
      const x1 = a[0] + ux * (R + 3), y1 = a[1] + uy * (R + 3);
      const x2 = b[0] - ux * (R + 7), y2 = b[1] - uy * (R + 7);
      const px = -uy, py = ux;
      const off = Math.min(34, len * 0.16);
      const cpx = (x1 + x2) / 2 + px * off, cpy = (y1 + y2) / 2 + py * off;
      const cls = e.type === 'mentor' ? 'rel-edge rel-edge--mentor' : 'rel-edge rel-edge--influence';
      edges += '<path class="' + cls + '" d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + cpx.toFixed(1) + ' ' + cpy.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" marker-end="url(#rel-arrow)"/>';
    });
    let nodes = '';
    Object.keys(RELATION_POS).forEach(function (id) {
      const p = byId[id];
      const pos = RELATION_POS[id];
      const hex = RELATION_COLORS[p ? p.schoolGroup : '认知心理学'] || '#5E93AB';
      const name = p ? shortName(p.name) : id;
      nodes += '<g class="rel-node" data-psych-id="' + id + '" role="button" tabindex="0" style="cursor:pointer">'
        + '<circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="' + R + '" fill="' + hex + '" stroke="var(--bg-card)" stroke-width="2.5"/>'
        + '<text x="' + pos[0] + '" y="' + (pos[1] + R + 15) + '" text-anchor="middle" class="rel-node-text">' + name + '</text>'
        + '</g>';
    });
    let groups = '';
    RELATION_GROUPS.forEach(function (g) {
      groups += '<text x="' + g.x + '" y="42" text-anchor="middle" class="rel-group-label">' + g.label + '</text>';
    });
    wrap.innerHTML = '<svg viewBox="0 0 760 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="思想传承关系图谱">'
      + '<defs><marker id="rel-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>'
      + groups + edges + nodes + '</svg>'
      + '<div class="relations-legend">'
      + '<span class="lg-item"><span class="lg-line lg-line--mentor"></span>师承 / 传承</span>'
      + '<span class="lg-item"><span class="lg-line lg-line--influence"></span>思想影响 / 先驱</span>'
      + '<span class="lg-note">箭头方向 = 影响者 → 后继者 · 点击节点查看详情</span>'
      + '</div>';
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
            ${members.map(p => `<div class="dir-name" data-psych-id="${p.id}" role="button" tabindex="0">
              <span class="dir-name-text">${p.name}</span>
              <span class="dir-lifespan">${p.lifespan}</span>
              <span class="dir-arrow" aria-hidden="true">↗</span>
            </div>`).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  /* ========== 生平年表渲染 ========== */
  function renderTimelineHTML(p) {
    const items = p.timeline || [];
    if (!items.length) return '<p class="detail-text">暂无年表数据</p>';
    return '<div class="detail-timeline">' + items.map(function (t) {
      return '<div class="tl-item tl-item--' + t.type + '">'
        + '<div class="tl-year">' + (t.year || '至今') + '</div>'
        + '<div class="tl-dot"></div>'
        + '<div class="tl-event">' + t.event + '</div>'
        + '</div>';
    }).join('') + '</div>';
  }

  /* ========== 渲染核心概念 ========== */
  function renderConcepts() {
    const grid = document.getElementById('concepts-grid');
    if (!DATA || !grid || !DATA.concepts) return;
    const categories = ['认知与学习', '情绪与动机', '人格与自我', '社会与群体', '发展心理', '临床与应用'];
    const byName = {};
    DATA.psychologists.forEach(function (p) { byName[p.id] = p; });
    grid.innerHTML = categories.map(function (cat) {
      const items = DATA.concepts.filter(function (c) { return c.category === cat; });
      if (!items.length) return '';
      return '<div class="concept-group">'
        + '<div class="concept-group-title">' + cat + '</div>'
        + '<div class="concept-cards">'
        + items.map(function (c) {
          const rel = (c.psychologistIds || []).map(function (id) { const p = byName[id]; return p ? shortName(p.name) : id; }).join(' · ');
          return '<div class="concept-card" data-concept-id="' + c.id + '" role="button" tabindex="0">'
            + '<div class="concept-name">' + c.name + ' <span class="concept-en">' + c.nameEn + '</span></div>'
            + '<div class="concept-def">' + c.definition + '</div>'
            + '<div class="concept-related">' + rel + '</div>'
            + '</div>';
        }).join('')
        + '</div></div>';
    }).join('');
  }

  function openConceptDetail(conceptId) {
    if (!DATA || !DATA.concepts) return;
    const c = DATA.concepts.find(function (x) { return x.id === conceptId; });
    if (!c) return;
    const overlay = document.getElementById('detail-overlay');
    const content = document.getElementById('detail-content');
    const loading = document.getElementById('detail-loading');
    currentDetailIndex = -1;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    loading.style.display = 'block';
    content.innerHTML = '';
    updateDetailNav();
    const byName = {};
    DATA.psychologists.forEach(function (p) { byName[p.id] = p; });
    const related = (c.psychologistIds || []).map(function (id) { return byName[id]; }).filter(Boolean);
    content.innerHTML = '<div class="detail-header">'
      + '<div class="detail-meta"><span class="detail-school-tag detail-school-tag--blue">' + c.category + '</span></div>'
      + '<h1 class="detail-name">' + c.name + '</h1>'
      + '<p class="detail-name-en">' + c.nameEn + '</p>'
      + '</div>'
      + '<div class="detail-section"><h3 class="detail-section-title">概念释义</h3><p class="detail-text">' + c.definition + '</p></div>'
      + '<div class="detail-section"><h3 class="detail-section-title">深入理解</h3><p class="detail-text">' + (c.detail || '') + '</p></div>'
      + '<div class="detail-section"><h3 class="detail-section-title">相关心理学家</h3>'
      + '<div class="school-member-list">'
      + related.map(function (p) {
        return '<div class="school-member-card" data-psych-id="' + p.id + '">'
          + '<div class="school-member-avatar" style="background:' + getSchoolColorHex(p.schoolGroup) + '">'
          + (p.image ? '<img class="portrait" src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) + '" loading="lazy" decoding="async" onerror="this.remove()">' : '')
          + '<span class="school-member-letter">' + p.name[0] + '</span>'
          + '</div>'
          + '<div class="school-member-info">'
          + '<div class="school-member-name">' + p.name + '</div>'
          + '<div class="school-member-en">' + p.nameEn + '</div>'
          + '<div class="school-member-tag">' + p.school + '</div>'
          + '</div></div>';
      }).join('')
      + '</div></div>';
    loading.style.display = 'none';
    overlay.scrollTop = 0;
  }

  /* ========== 详情面板 ========== */
  function openDetail(psychId, opts) {
    if (!DATA) return;
    const idx = DATA.psychologists.findIndex(x => x.id === psychId);
    const p = DATA.psychologists[idx];
    if (!p) return;
    currentDetailIndex = idx;
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
          ${(p.tags || []).map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="detail-title-row">
          ${p.image ? `<div class="detail-portrait" style="background:${getSchoolColorHex(p.schoolGroup)}"><img class="portrait" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.remove()"><span class="detail-portrait-initial">${p.name[0]}</span></div>` : ''}
          <div class="detail-title-block">
            <h1 class="detail-name">${p.name}</h1>
            <p class="detail-name-en">${p.nameEn}</p>
          </div>
        </div>
        <blockquote class="detail-quote">"${p.quote}"</blockquote>
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">生平年表</h3>
        ${renderTimelineHTML(p)}
      </div>

      <div class="detail-section">
        <h3 class="detail-section-title">生平事迹</h3>
        <p class="detail-text">${p.bio}</p>
      </div>

      ${p.coreTheory && p.coreTheory.length ? `
      <div class="detail-section">
        <h3 class="detail-section-title">核心学说思想</h3>
        <div class="detail-theory-list">
          ${p.coreTheory.map(t => `
            <div class="detail-theory-item">
              <div class="detail-theory-title">${escapeHtml(t.title)}</div>
              <p class="detail-text">${t.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

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
            <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="detail-related-card">
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
    updateDetailNav();
    syncHash(psychId);
    if (opts && opts.focusClose !== false) {
      document.getElementById('detail-close').focus();
    }
  }

  function updateDetailNav() {
    const prevBtn = document.getElementById('detail-prev');
    const nextBtn = document.getElementById('detail-next');
    if (!prevBtn || !nextBtn) return;
    const total = DATA ? DATA.psychologists.length : 0;
    prevBtn.disabled = currentDetailIndex <= 0;
    nextBtn.disabled = currentDetailIndex < 0 || currentDetailIndex >= total - 1;
    prevBtn.setAttribute('aria-disabled', prevBtn.disabled);
    nextBtn.setAttribute('aria-disabled', nextBtn.disabled);
  }

  function navigateDetail(dir) {
    if (!DATA || currentDetailIndex < 0) return;
    const next = currentDetailIndex + dir;
    if (next < 0 || next >= DATA.psychologists.length) return;
    openDetail(DATA.psychologists[next].id);
  }

  function closeDetail() {
    const overlay = document.getElementById('detail-overlay');
    if (!overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    clearHash();
  }

  /* ========== Hash 路由 ========== */
  function syncHash(psychId) {
    try {
      history.replaceState(null, '', '#psych-' + psychId);
    } catch (e) { /* file:// 下忽略 */ }
  }

  function clearHash() {
    try {
      if (location.hash.indexOf('#psych-') === 0) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    } catch (e) { /* file:// 下忽略 */ }
  }

  function restoreFromHash() {
    if (!DATA) return;
    const m = location.hash.match(/^#psych-(.+)$/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    if (DATA.psychologists.some(p => p.id === id)) {
      openDetail(id, { focusClose: false });
    }
  }

  /* ========== 学派详情面板 ========== */
  function openSchoolDetail(schoolId) {
    if (!DATA) return;
    const school = DATA.schools.find(s => s.id === schoolId);
    if (!school || !school.detail) return;
    const overlay = document.getElementById('detail-overlay');
    const content = document.getElementById('detail-content');
    const loading = document.getElementById('detail-loading');

    currentDetailIndex = -1;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    loading.style.display = 'block';
    content.innerHTML = '';
    updateDetailNav();

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
                ${p.image ? `<img class="portrait" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" onerror="this.remove()">` : ''}
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
      const haystack = [
        p.name, p.nameEn, p.nationality, p.school, p.schoolGroup, p.bio,
        (p.tags || []).join(' '),
        (p.works || []).map(w => w.title + ' ' + w.core).join(' ')
      ].join(' ').toLowerCase();
      const expHit = DATA.experiments.some(e =>
        e.psychologistId === p.id && (e.title + ' ' + e.year + ' ' + e.desc).toLowerCase().includes(q)
      );
      return haystack.includes(q) || expHit;
    });
    if (results.length === 0) {
      container.innerHTML = '<p class="search-empty">未找到匹配内容，请尝试其他关键词（支持著作、实验、学派）。</p>';
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

  /* ========== 经典著作书架（极简书架 + 详情卡 + 自动轮播） ========== */
  const BOOK_SPINES = [
    ['#8FC3D6', '#5E93AB'],
    ['#FFC2CF', '#E88BA0'],
    ['#D2ECDF', '#8FC9AE'],
    ['#D6C9F0', '#A78FD0'],
    ['#FFE0B8', '#E8B87E'],
    ['#BFE3EA', '#7FB8C5'],
    ['#F3C9D9', '#D98FB0'],
    ['#C9E4C9', '#8CB98C']
  ];

  let bookSelectedIndex = 0;
  let orbitRotation = 0;          // 环形整体旋转角
  let orbitTarget = null;         // 点击后的目标旋转角（平滑过渡）
  let orbitRAF = null;
  let orbitHovered = false;       // 鼠标在轨道或详情卡上 → 暂停自转
  let orbitAuto = true;           // 是否持续自转
  let lastFrontIndex = -1;        // 当前"面向观众"的书
  let isMobile = false;
  let dragState = null;           // 拖拽状态 {startX, startRot, lastX, dragged}
  let suppressNextClick = false;  // 拖拽后抑制一次点击
  const DRAG_SENSITIVITY = 0.006; // 拖拽 1px ≈ 0.006 弧度

  function detectMobile() {
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function renderBookOrbit() {
    const orbit = document.getElementById('book-orbit');
    if (!orbit) return;
    if (orbitRAF) { cancelAnimationFrame(orbitRAF); orbitRAF = null; }
    isMobile = detectMobile();

    orbit.innerHTML = BOOK_GALLERY.map((book, i) => {
      const spine = BOOK_SPINES[i % BOOK_SPINES.length];
      return `
      <button class="book ${i === 0 ? 'active' : ''}" data-index="${i}" data-psych-id="${book.psychId}"
              role="option" aria-selected="${i === 0}" aria-label="${book.title}，${book.author}">
        <span class="book-spine" style="background:linear-gradient(180deg, ${spine[0]}, ${spine[1]})">
          <span class="book-spine-top"></span>
          <span class="book-spine-title">${book.title}</span>
          <span class="book-spine-author">${book.author}</span>
        </span>
      </button>`;
    }).join('');

    // 点击：旋转到该书正前方并锁定
    orbit.addEventListener('click', (e) => {
      if (suppressNextClick) { suppressNextClick = false; return; }
      const btn = e.target.closest('.book');
      if (btn) selectBook(parseInt(btn.dataset.index, 10));
    });

    // 鼠标在轨道或详情卡上 → 暂停自转（阅读不被打断）
    orbit.addEventListener('mouseenter', () => { orbitHovered = true; });
    orbit.addEventListener('mouseleave', () => { orbitHovered = false; });
    const detailCardHover = document.getElementById('book-detail-card');
    if (detailCardHover) {
      detailCardHover.addEventListener('mouseenter', () => { orbitHovered = true; });
      detailCardHover.addEventListener('mouseleave', () => { orbitHovered = false; });
    }

    // 鼠标拖拽旋转（跟手转盘）
    orbit.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      dragState = { startX: e.clientX, startRot: orbitRotation, lastX: e.clientX, dragged: false };
      orbitTarget = null;
      orbitHovered = true;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;
      if (!dragState.dragged && Math.abs(dx) > 5) dragState.dragged = true;
      if (dragState.dragged) {
        orbitRotation = dragState.startRot + dx * DRAG_SENSITIVITY;
        applyOrbitFrame();
      }
      dragState.lastX = e.clientX;
    });
    document.addEventListener('mouseup', () => {
      if (dragState) {
        if (dragState.dragged) {
          suppressNextClick = true;   // 拖拽后抑制误触点击
          orbitAuto = false;          // 拖拽 = 用户接管，停止自转
          updateDetailCard(lastFrontIndex);
        }
        dragState = null;
      }
    });

    // hover 预览：悬停某本书 → 详情卡即时显示；移开恢复"前方书"
    orbit.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.book');
      if (btn) previewBook(parseInt(btn.dataset.index, 10));
    });
    orbit.addEventListener('mouseout', (e) => {
      const btn = e.target.closest('.book');
      const to = e.relatedTarget;
      if (btn && (!to || !to.closest || !to.closest('.book'))) {
        updateDetailCard(lastFrontIndex);
      }
    });

    // 键盘 ←→：旋转到相邻书
    orbit.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const total = BOOK_GALLERY.length;
      const next = e.key === 'ArrowRight'
        ? (lastFrontIndex + 1) % total
        : (lastFrontIndex - 1 + total) % total;
      selectBook(next);
      const active = orbit.querySelector('.book.active');
      if (active) active.focus();
    });

    // 跨断点切换（桌面环形 <-> 移动端网格）重渲染
    if (window.matchMedia) {
      window.matchMedia('(max-width: 768px)').addEventListener('change', (e) => {
        if (e.matches !== isMobile) renderBookOrbit();
      });
    }

    if (isMobile) {
      // 移动端：静态网格，点击切换
      orbit.classList.add('is-mobile');
      selectBook(0);
      return;
    }
    orbit.classList.remove('is-mobile');
    lastFrontIndex = -1;
    positionOrbit();
    setFrontBook(0);
    updateDetailCard(0);
    orbitRAF = requestAnimationFrame(animateOrbit);
  }

  /* 3D 椭圆轨道投影定位；返回当前"面向观众"（最靠前）的书 */
  function positionOrbit() {
    const orbit = document.getElementById('book-orbit');
    if (!orbit) return lastFrontIndex;
    const books = orbit.querySelectorAll('.book');
    const cx = orbit.offsetWidth / 2;
    const cy = orbit.offsetHeight / 2;
    const R = Math.min(cx, cy) * 1.08;
    const perspective = 800;
    let front = 0, frontVal = -Infinity;

    books.forEach((el, i) => {
      const a = (i / books.length) * 2 * Math.PI + orbitRotation;
      const x3d = Math.sin(a) * R;
      // 深度：前方书（cos 最大）最近 -> z3d 最小 -> 透视放大
      const z3d = -Math.cos(a) * R;
      const scale = perspective / (perspective + z3d);
      const w = 62, h = 186;
      const screenX = cx + x3d * scale - w / 2;
      const screenY = cy - z3d * 0.22 * scale - h * scale / 2;
      el.style.left = screenX + 'px';
      el.style.top = screenY + 'px';
      el.style.transform = 'scale(' + scale + ')';
      el.style.opacity = Math.max(0.42, 1 - (z3d + R) / (2 * R) * 0.72);
      el.style.zIndex = Math.round(scale * 100);
      if (Math.cos(a) > frontVal) { frontVal = Math.cos(a); front = i; }
    });
    return front;
  }

  function setFrontBook(index) {
    const orbit = document.getElementById('book-orbit');
    if (!orbit) return;
    orbit.querySelectorAll('.book').forEach((b, i) => {
      const on = i === index;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
  }

  /* 刷新一帧：定位 + 更新前方高亮；拖拽与自动动画共用 */
  function applyOrbitFrame() {
    const front = positionOrbit();
    if (front !== lastFrontIndex) {
      lastFrontIndex = front;
      setFrontBook(front);
      if (!orbitHovered) updateDetailCard(front);
    }
  }

  function animateOrbit() {
    orbitRAF = null;
    if (orbitTarget !== null) {
      // 平滑旋转到目标角
      let diff = orbitTarget - orbitRotation;
      diff = ((diff % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
      if (Math.abs(diff) < 0.006) {
        orbitRotation = orbitTarget;
        orbitTarget = null;
      } else {
        orbitRotation += diff * 0.09;
      }
    } else if (!orbitHovered && orbitAuto && !reduceMotion()) {
      orbitRotation += 0.0012; // 缓慢自转（约 90s 一圈）
    }
    applyOrbitFrame();
    orbitRAF = requestAnimationFrame(animateOrbit);
  }

  function updateDetailCard(index) {
    const detailCard = document.getElementById('book-detail-card');
    if (!detailCard) return;
    const book = BOOK_GALLERY[index];
    const spine = BOOK_SPINES[index % BOOK_SPINES.length];
    const ribbon = document.getElementById('book-detail-ribbon');
    if (ribbon) ribbon.style.background = 'linear-gradient(180deg, ' + spine[0] + ', ' + spine[1] + ')';

    document.getElementById('book-detail-title').textContent = book.title;
    document.getElementById('book-detail-meta').textContent = book.author + ' · ' + book.year;
    document.getElementById('book-detail-desc').textContent = book.desc;

    // 核心学术思想（长文折叠，超长才显示展开按钮）
    const coreText = document.getElementById('book-detail-core-text');
    const toggleBtn = document.getElementById('book-detail-toggle');
    if (coreText) {
      coreText.textContent = book.core || '';
      coreText.classList.remove('expanded');
      if (toggleBtn) toggleBtn.textContent = '展开全文 ↓';
      requestAnimationFrame(() => {
        if (!toggleBtn) return;
        const needToggle = coreText.scrollHeight > coreText.clientHeight + 4;
        toggleBtn.style.display = needToggle ? '' : 'none';
      });
    }

    const authorBtn = document.getElementById('book-detail-author');
    if (book.psychId) {
      authorBtn.hidden = false;
      authorBtn.dataset.psychId = book.psychId;
    } else {
      authorBtn.hidden = true;
      authorBtn.removeAttribute('data-psych-id');
    }

    if (detailCard.hidden) {
      detailCard.hidden = false;
      requestAnimationFrame(() => detailCard.classList.add('shown'));
    }
  }

  /* 选中某本书：旋转到正前方 + 锁定（用户介入后停止自转） */
  function selectBook(index) {
    const orbit = document.getElementById('book-orbit');
    if (!orbit) return;
    orbitAuto = false;

    if (isMobile) {
      // 移动端网格：直接高亮 + 更新详情
      setFrontBook(index);
      lastFrontIndex = index;
      updateDetailCard(index);
      return;
    }

    // 计算目标旋转角：使该书 cos(a)=1（正前方）
    const n = BOOK_GALLERY.length;
    let target = -((index / n) * 2 * Math.PI);
    const cur = orbitRotation;
    while (target - cur > Math.PI) target -= 2 * Math.PI;
    while (target - cur < -Math.PI) target += 2 * Math.PI;
    orbitTarget = target;
    // 立即反馈，旋转到位后动画持续跟进
    setFrontBook(index);
    updateDetailCard(index);
  }

  // hover 预览：显示书籍简介，但不改变前方高亮；移开后恢复前方书
  function previewBook(index) {
    updateDetailCard(index);
  }

  /* ========== 思想语录墙 ========== */
  let quotesTimer = null;
  let quotesIndex = 0;
  let quotesHovered = false;

  function renderQuotes() {
    const viewport = document.getElementById('quotes-viewport');
    const dots = document.getElementById('quotes-dots');
    if (!DATA || !viewport) return;
    const quotes = DATA.psychologists.map(p => ({ text: p.quote, name: p.name, school: p.school }));
    viewport.innerHTML = quotes.map((q, i) => `
      <div class="quote-slide ${i === 0 ? 'active' : ''}" data-index="${i}" role="tabpanel" aria-label="第${i + 1}条语录">
        <div class="quote-mark">“</div>
        <p class="quote-text">${q.text}</p>
        <div class="quote-author">— ${q.name} <span class="quote-school">${q.school}</span></div>
      </div>
    `).join('');
    dots.innerHTML = quotes.map((q, i) => `
      <button class="quote-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="语录${i + 1}"></button>
    `).join('');
    startQuotesAuto();
  }

  function goQuote(index) {
    const slides = document.querySelectorAll('.quote-slide');
    const dots = document.querySelectorAll('.quote-dot');
    if (!slides.length) return;
    const total = slides.length;
    quotesIndex = ((index % total) + total) % total;
    slides.forEach((s, i) => s.classList.toggle('active', i === quotesIndex));
    dots.forEach((d, i) => d.classList.toggle('active', i === quotesIndex));
  }

  function nextQuote() { goQuote(quotesIndex + 1); }
  function prevQuote() { goQuote(quotesIndex - 1); }

  function startQuotesAuto() {
    stopQuotesAuto();
    quotesTimer = setInterval(() => {
      if (!quotesHovered) nextQuote();
    }, 4500);
  }

  function stopQuotesAuto() {
    if (quotesTimer) { clearInterval(quotesTimer); quotesTimer = null; }
  }

  function setupQuotes() {
    const carousel = document.getElementById('quotes-carousel');
    const prev = document.getElementById('quotes-prev');
    const next = document.getElementById('quotes-next');
    const dots = document.getElementById('quotes-dots');
    if (!carousel) return;
    carousel.addEventListener('mouseenter', () => { quotesHovered = true; });
    carousel.addEventListener('mouseleave', () => { quotesHovered = false; });
    prev.addEventListener('click', () => { nextQuote(); startQuotesAuto(); });
    next.addEventListener('click', () => { prevQuote(); startQuotesAuto(); });
    dots.addEventListener('click', (e) => {
      const dot = e.target.closest('.quote-dot');
      if (dot) { goQuote(parseInt(dot.dataset.index, 10)); startQuotesAuto(); }
    });
  }

  /* ========== 暗色模式 ========== */
  function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const saved = (function () {
      try { return localStorage.getItem('psych-theme'); } catch (e) { return null; }
    })();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      html.setAttribute('data-theme', 'dark');
    }
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) {
        html.removeAttribute('data-theme');
        try { localStorage.setItem('psych-theme', 'light'); } catch (e) { /* ignore */ }
      } else {
        html.setAttribute('data-theme', 'dark');
        try { localStorage.setItem('psych-theme', 'dark'); } catch (e) { /* ignore */ }
      }
    });
  }

  /* ========== 阅读进度条 ========== */
  function setupProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const ratio = total > 0 ? h.scrollTop / total : 0;
      bar.style.width = (ratio * 100).toFixed(1) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ========== 全部初始化 ========== */
  function initAll() {
    renderSchools();
    renderFeatured();
    renderExperiments();
    renderTimeline();
    renderAiReview(currentAiPsychId);
    renderDirectory();
    renderConcepts();
    renderRelations();
    renderTopResources();
    renderBookOrbit();
    renderQuotes();
    observeCards();
    observeTimelineItems();
    setupQuotes();
    updateStats();
  }

  /* ========== 动态统计 ========== */
  function updateStats() {
    if (!DATA) return;
    const countEl = document.getElementById('stat-count');
    const schoolsEl = document.getElementById('stat-schools');
    const worksEl = document.getElementById('stat-works');
    const expEl = document.getElementById('stat-exp');
    if (countEl) countEl.textContent = DATA.psychologists.length;
    if (schoolsEl) schoolsEl.textContent = DATA.schools.length;
    if (worksEl) {
      const total = DATA.psychologists.reduce((acc, p) => acc + (p.works ? p.works.length : 0), 0);
      worksEl.textContent = total + '+';
    }
    if (expEl) expEl.textContent = DATA.experiments.length;
  }

  /* ========== 事件委托 ========== */
  function setupEvents() {
    // Open concept detail on card click
    document.addEventListener('click', (e) => {
      const conceptEl = e.target.closest('[data-concept-id]');
      if (conceptEl && conceptEl.dataset.conceptId) {
        openConceptDetail(conceptEl.dataset.conceptId);
      }
    });

    // Open detail on card click
    document.addEventListener('click', (e) => {
      // 环形书架/书籍网格的点击由书架自身处理（选中 + 详情卡），不触发作者详情
      if (e.target.closest('.book')) return;

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

    // Keyboard activation for role=button cards
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const t = e.target;
      if (!t || t.getAttribute('role') !== 'button') return;
      const psychEl = t.closest('[data-psych-id]');
      if (psychEl) {
        e.preventDefault();
        const id = psychEl.dataset.psychId;
        if (id && !psychEl.closest('#ai-review-controls')) {
          openDetail(id);
        }
      }
      const schoolCard = t.closest('.school-card');
      if (schoolCard && schoolCard.dataset.school) {
        e.preventDefault();
        openSchoolDetail(schoolCard.dataset.school);
      }
    });

    // Close detail
    document.getElementById('detail-close').addEventListener('click', closeDetail);
    document.getElementById('detail-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('detail-overlay')) closeDetail();
    });

    // Detail prev/next
    document.getElementById('detail-prev').addEventListener('click', () => navigateDetail(-1));
    document.getElementById('detail-next').addEventListener('click', () => navigateDetail(1));

    // Book detail core text expand/collapse
    document.getElementById('book-detail-toggle').addEventListener('click', () => {
      const coreText = document.getElementById('book-detail-core-text');
      const btn = document.getElementById('book-detail-toggle');
      if (!coreText || !btn) return;
      const expanded = coreText.classList.toggle('expanded');
      btn.textContent = expanded ? '收起 ↑' : '展开全文 ↓';
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

    // Global keyboard: Esc close, ←/→ navigate detail
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.getElementById('detail-overlay').classList.contains('active')) closeDetail();
        if (document.getElementById('search-modal').classList.contains('active')) closeSearch();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const overlay = document.getElementById('detail-overlay');
        if (!overlay.classList.contains('active')) return;
        const inInput = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
        if (inInput) return;
        e.preventDefault();
        navigateDetail(e.key === 'ArrowLeft' ? -1 : 1);
      }
    });

    // AI review prev/next arrows
    document.addEventListener('click', (e) => {
      const aiPrev = e.target.closest('#ai-prev');
      const aiNext = e.target.closest('#ai-next');
      if (!aiPrev && !aiNext) return;
      const total = DATA ? DATA.psychologists.length : 0;
      const cur = DATA.psychologists.findIndex(p => p.id === currentAiPsychId);
      let next = cur;
      if (aiPrev) next = cur <= 0 ? total - 1 : cur - 1;
      if (aiNext) next = cur >= total - 1 ? 0 : cur + 1;
      currentAiPsychId = DATA.psychologists[next].id;
      renderAiReview(currentAiPsychId);
    });

    // hashchange
    window.addEventListener('hashchange', restoreFromHash);
  }

  /* ========== 卡片入场动画 ========== */
  function observeCards() {
    const cards = document.querySelectorAll('.school-card, .psych-card, .exp-card, .resource-card, .dir-column, .concept-card');
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
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
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
    }, { passive: true });
  }

  /* ========== 启动 ========== */
  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    setupMobileMenu();
    setupHeaderScroll();
    setupBackToTop();
    setupThemeToggle();
    setupProgressBar();
    loadData();
    restoreFromHash();
  });
})();
