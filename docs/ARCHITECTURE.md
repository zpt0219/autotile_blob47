# 架构与数据流

## 分层

React 面板调用应用层动作。`useRecipeEditor` 用单一 `Recipe` 状态管理可保存参数，统一经过 `sanitizeRecipe`；`deriveRecipeView` 计算色阶与控件状态。每个面板只声明其使用的字段及动作。

`useStudio` 协调预设、偏好、恢复确认、导入导出和通知。`App` 组装这些能力以及各个面板，不包含算法、存储或导出实现。

浏览器实现由入口注入 `StudioPorts`：

| 能力 | 纯服务 / 接口                                       | 浏览器实现                               |
| ---- | --------------------------------------------------- | ---------------------------------------- |
| 存储 | `KeyValueStore`、`AutosaveService`、`PresetService` | `BrowserStorage`                         |
| 导出 | `ExportBackend`、`ExportService`                    | `app/browser/export.ts`                  |
| 分享 | `SharingBackend`、纯配方编码器                      | `browserPorts` 中的 URL / clipboard 实现 |
| 绘制 | `renderSheet`、`renderMap` 返回 RGBA                | `app/browser/canvas.ts`                  |

核心算法和模型不依赖应用层或面板。基础类型和花纹算法有独立定义；配方模型可引用这些定义，核心渲染通过类型引用配方并调用其校验函数。

## 状态

- **配方**：颜色、花纹、过渡带、噪点与颜色/区域、描边、地形材质、种子等所有影响像素的输入。
- **偏好**：语言、两种缩放、辅助网格和标记点开关。
- **会话**：试铺地图、当前工具、选中的预设、待恢复配方、存储结果。
- **交互临时数据**：活动指针、前一单元格、异步导入标识、导出进行状态。

派生色阶和 RGBA 素材均由当前配方计算，不维护第二份可写配方。

## 渲染

配方变化 → `renderTileset` → 完整图集 RGBA 与纯地形 B 图块。图集面板直接显示图集；试铺面板通过 `renderMapRGBA` 根据八邻居 mask 取对应图块。

`useMemo` 缓存素材及地图像素。网格或标记点开关只重画覆盖层，缩放改变 Canvas 的 CSS 显示尺寸。`useCanvasFrame` 使用 requestAnimationFrame 合并更新并取消过时绘制。

预设缩略图与导出都调用 `renderSheetRGBA`，与图集预览共用同一个算法入口。PNG 编码时浏览器会清除完全透明像素下的 RGB，所以 PNG 比对验证全部 alpha 与所有可见 RGB；算法基线则比较完整原始 RGBA 字节。

## 初始化与保存

启动读取本项目的偏好与预设。有效的新分享链接优先于暂存；否则提供恢复暂存的选择。待恢复时不启动配方自动保存。

自动保存捕获配方快照，300ms 后写入。新编辑取消旧的待写入操作，`pagehide` 立即写入待保存快照；effect 清理取消定时器与事件监听。偏好独立防抖保存。失败向界面报告，不误报成功。

## 导入与导出

新配方文件必须有正确的格式标识、版本与完整参数。解析或校验失败不修改当前状态。异步导入使用请求编号与编辑版本；文件读取期间出现新编辑或更晚的导入时，旧请求失效。

导出服务先深拷贝完整配方并生成像素，再交给浏览器编码 PNG、组合元数据和 ZIP。页面继续编辑不影响已经捕获的快照。下载资源在 finally 中解除 DOM 引用，并回收 ObjectURL。

## 新格式

配方文件：

```json
{
  "format": "autotile-blob47-recipe",
  "version": 1,
  "recipe": "此处为完整 Recipe 对象"
}
```

此示意中的字符串用于说明字段位置，实际 `recipe` 必须是完整对象。未包装的配方对象、旧 `{v, recipe}` 文件及其他版本会被拒绝。

分享编码为带 `b1.` 前缀的压缩 JSON Base64URL；URL hash 使用 `#blob47=`。编码器仅依赖字节、字符串和 fflate，可在 Node 运行。

所有存储键采用 `autotile_blob47.*.v1`，不读取其他应用的存储。
