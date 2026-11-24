# AGY Resets Bar

Antigravity 额度什么时候重置，你不用再盯着官网刷新。

一个常驻菜单栏的 [Metrix.Bar](https://metrix.bar) 看板，盯着 Google Antigravity（Gemini/Argon）的重置公告，一有动静就告诉你。数据来自 [agyresets.com](https://agyresets.com) 的公开 API（监听 @_mohansolo），与 Google/Antigravity 无隶属关系。[English](README.md)

## 安装

点开下面的链接，再打开下载好的文件即可 —— Metrix.Bar 直接导入 `.bar`。

- [`agy-resets.bar`](https://cdn.jsdelivr.net/gh/YOURNAME/agyresets-bar@v0.1.0/agy-resets.bar)

也可以把下面这行粘到浏览器地址栏，直接从 CDN 导入：

```text
metrixbar://install?url=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2FYOURNAME%2Fagyresets-bar%40v0.1.0%2Fagy-resets.bar&sha256=0f31a92b3842fa177d74adcb38eddb5a4fb7c11975a421c0762c6c08bc381b02
```

GitHub 渲染 Markdown 时会剥离自定义协议，所以这里以可复制文本给出。安装链接中的 `YOURNAME` 是占位符——发布前请替换为你的 GitHub 用户名；若届时文件有改动，需重算 sha256（`shasum -a 256 agy-resets.bar`）并同步更新。

看板语言跟随 Metrix.Bar 宿主显示语言——`zh*` 显示中文，其余显示英文。语言在 Worker 创建（安装或重载看板）时捕获，切换系统或宿主语言后需重载看板才生效。

## 它能帮你做什么

- **一眼知道上次重置过去多久**，可切本地时间或 UTC。
- **分清每次重置的范围**，徽章标明影响的模型（Gemini / Argon / 全部）与人群（全员 / 付费）。
- **近四个月日历**，看到节奏而不只是最新一次。
- **与官网首页对齐的统计**：重置次数、平均间隔、最长间隔。
- **新公告才发通知**，刚装完不会蹦出过期的。
- **点一下把面板截图复制到剪贴板**。

## 补充说明

每 2 分钟刷新一次；请求失败会保留上一次的数据并给出重试，不会变成空面板。请求直连 `agyresets.com`，本机需要能访问该域名。提醒默认开启，可在看板设置里关闭。Vue 运行时在启动时从 CDN 加载：主源 JSDMirror，jsDelivr 兜底。

## 来源与许可

数据来自 [agyresets.com](https://agyresets.com) 的公开 API（监听 @_mohansolo 的推文整理），与本项目无隶属关系，也不代表 Google。

[Apache-2.0](LICENSE)。Vue 运行时在启动时从 CDN 加载（主源 JSDMirror、jsDelivr 兜底），仍适用其 MIT 协议。「Google」「Antigravity」「Gemini」「Argon」为 Google 商标，仅用于标识所监控的服务。
