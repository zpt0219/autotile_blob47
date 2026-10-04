# Autotile Blob47

独立的浏览器端 Blob47 地形图集工作台。React + TypeScript + Vite；无需后端或其他仓库。

生成固定 32px 图块、8 列 × 6 行的 **256 × 192px** 图集，包含 47 种规范状态（实心图块在布局中出现两次）。支持边缘花纹、过渡带、噪点、描边纹理、两侧地形材质和透明地形 B，可用鼠标、触控笔、触摸在 16 × 10 试铺画板检查拼接。

## 本地运行

需要 Node.js 22.13+（也可使用满足依赖要求的 Node.js 24+）。

```bash
npm ci
npm run dev
```

访问终端显示的地址，默认是 `http://127.0.0.1:5177/`。

```bash
npm run typecheck  # 源码、单元测试、浏览器测试与配置的严格类型检查
npm run lint      # ESLint
npm test          # 算法、配方、服务与像素基线测试
npm run build     # 生产构建
npm run preview   # 本地预览 dist/
```

浏览器测试：

```bash
npx playwright install chromium
npm run test:e2e
```

`test:e2e` 自动构建生产包，再启动独立本地预览服务器并运行 Chromium 测试。缺少浏览器系统库时，可使用 Playwright 的 `install-deps chromium` 安装。测试产物位于被 Git 忽略的 `test-results/`。

## 配方、预设与导出

- 所有影响图集像素的参数都在一个完整配方中，包括噪点目标区域与自定义噪点颜色。
- 内置水岸预设可编辑、另存为用户预设；用户预设可重命名与删除。
- 编辑配方 300ms 防抖自动保存，离开页面时保存待写入快照。重新打开时可恢复或开始新的编辑，确认前不会覆盖暂存。
- 存储受限时显示保存失败提示；当前配方仍可导出。
- 配方 JSON 使用 `autotile-blob47-recipe` / version 1；分享链接使用 `#blob47=b1.…`。
- ZIP 包含无网格、无标记点的 PNG 和布局元数据 JSON。JSON 包括完整配方、邻居 bit、图集布局及 256 项 mask 查找表。
- 导出捕获独立快照；打包期间继续调整参数不会改变该次导出。
- 试铺地图、工具、弹窗是会话数据。缩放、网格、标记点和语言作为本项目偏好独立保存。

这是全新项目：存储使用 `autotile_blob47.*.v1` 命名空间，不读取旧应用数据；只接受本项目的新配方文件和分享编码。没有站点集成或部署脚本。

## 架构

参照 Portrait Studio 的模型、应用服务与浏览器适配边界，保留 React 界面。

```text
src/
├── app/         # 装配、状态、服务、能力接口与浏览器实现
├── model/       # 完整配方、预设与会话模型
├── core/        # Blob47、RGBA 渲染、编解码、花纹算法
├── data/        # 内置预设与随项目保存的烘焙数据
├── panels/      # 独立控件面板、画布与模态框
├── components/  # 通用取色、种子、提示控件
├── shared/      # 中英文文案
└── styles/      # 页面样式
```

`core/` 与 `model/` 可以直接在 Node 环境运行，不依赖 React、DOM、Canvas 或浏览器存储。Vite 构建只使用本项目内文件。

- [架构与数据流](docs/ARCHITECTURE.md)
- [Blob47 渲染约定](docs/BLOB47.md)
- [实施与验证记录](docs/IMPLEMENTATION.md)
- [提取与重构计划](docs/EXTRACTION_PLAN.md)
