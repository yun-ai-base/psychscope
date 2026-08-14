# psychscope — 心理学大师知识图谱

## 项目概述
收录 15 位中外著名心理学大师的知识网站：生平事迹、经典著作、代表言论、学说流派、AI 智评、经典实验、相关拓展。

## 访问入口
直接打开 `index.html`（纯前端，无需服务器）

## 关键文件
| 文件 | 说明 |
|---|---|
| `index.html` | 主页面 |
| `data.js` | **唯一数据源**（内嵌）：心理学家+学派+实验+拓展+年表 timeline |
| `script.js` | 交互逻辑 |
| `style.css` | 样式 |
| `assets/portraits/` | 15 位大师公有领域肖像（本地，加载失败回退色块） |
| `projects.json` | **项目导航配置（公共数据源，手工维护）** |
| `twin-universe.js` | 孪生宇宙导航脚本（独立，可复制给其他项目） |
| `twin-universe.css` | 孪生宇宙样式 |

## 孪生宇宙（Twin Universe）
- 每个项目都有"孪生宇宙"板块，展示除当前项目外的所有其他项目
- **projects.json 是全局公共数据源**：`https://yun-ai-base.github.io/psychscope/projects.json`
- 格式：`{ "name": "项目id", "desc": "描述", "icon": "emoji", "cat": "分类" }`
- 分类：`ai`=AI对话, `tool`=工具, `content`=内容精选
- **新项目上线后记得往 projects.json 加一条**（name 必须唯一，链接格式 `https://yun-ai-base.github.io/{name}/`）
- 维护时机：项目部署到 GitHub Pages 获得 URL 之后再加

## 相关记忆
- 孪生宇宙规范：见全局记忆 `reference_twin_universe`
- projects.json 位置：见 `reference_projects_json_location`
