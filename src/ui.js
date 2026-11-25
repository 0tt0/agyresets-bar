// 组件层：直接构造宿主要求的纯 JSON 组件树（{type, props, children}），不做任何挂载。
// 宿主是拉取式渲染：state 变化后由 state.js / 事件处理器调 $metrix.invalidate 触发重渲染。

import { C, W, H, SHOT_HEIGHT, FEED_COUNT } from "./constants.js";
import { t, SITE } from "./i18n.js";
import { relTime, absTime, monthLabel, monthLabelWidth, pad2, hhmm, daysSince, fmtDays } from "./time.js";
import { state, phase, setTzMode, launchRefresh, shareShot, isSharing, loading } from "./state.js";
import { AGY_ICON, ICON } from "./icon.js";

// ---------------------------------------------------------------------------
// 基础辅助：直接 JSON 节点构造器
// ---------------------------------------------------------------------------

// children 变参扁平化（8 层，兼容数组/map 展开），过滤空值；
// 文本/数字子节点折叠为字符串；空 children 不输出该键。
const el = (type, props, ...children) => {
  const kids = children.flat(8)
    .filter(c => c !== null && c !== undefined && c !== false)
    .map(c => (typeof c === "string" || typeof c === "number") ? String(c) : c)
    .filter(c => c != null);
  const node = { type, props: props || {} };
  if (kids.length) node.children = kids;
  return node;
};
const TX = (text, props) => ({ type: "Text", props: { text: String(text), ...props } });

const Icon = (svg, size, color, extra) =>
  el("Icon", { svg, width: size, height: size, fontSize: size, textColor: color || C.INK, shrink: 0, ...extra });

const openSite = () => $metrix.openURL(SITE);

// ---------------------------------------------------------------------------
// 徽章与触发标签
// ---------------------------------------------------------------------------

// 范围徽章：按 models + plans 生成文字（Antigravity 蓝紫单色系）。
// models=["all"] → 全部模型；["gemini"] → Gemini；["argon","gemini"] → Argon + Gemini；
// plans=["all"] → 全员；["paid"] → 付费；未知值首字母大写原样展示；unspecified / 缺省不显示。
function badgeLabel(r) {
  const models = (r && r.models) || [];
  const plans = (r && r.plans) || [];
  const pretty = list => list
    .filter(x => x && x !== "unspecified")
    .map(x => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" + ");
  let modelText = "";
  if (models.includes("all")) modelText = t("徽章全部模型");
  else modelText = pretty(models);
  let planText = "";
  if (plans.includes("all")) planText = t("徽章全员");
  else if (plans.includes("paid")) planText = t("徽章付费");
  else planText = pretty(plans);
  return [modelText, planText].filter(Boolean).join(" · ");
}

// 触发标签（小字加分项）：incident→事故 / product_release→发版 / weekly→每周额度，
// 其余（unspecified、model_launch、load、backlash…）不显示。
const TRIGGER_KEYS = { incident: "触发事故", product_release: "触发发版", weekly: "触发每周" };
const triggerLabel = r => t(TRIGGER_KEYS[String(r && r.trigger || "")] || "");

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

const card = (children, extra) => el("Box", {
  background: C.CARD, border: [1, C.HAIR], radius: 13, padding: 14,
  fillWidth: true, shrink: 0, ...extra,
}, children);

function IconButton(name, label, onClick, busy) {
  return el("Column", {
    width: 26, height: 26, center: true, radius: 7, shrink: 0,
    label, tooltip: label, cursor: "pointer",
    hover: { background: C.HOVER }, pressed: { background: C.TILE }, onClick,
  }, Icon(ICON[name], 14, C.INK, busy ? {
    keyframes: { duration: 900, repeat: -1, ease: "linear", frames: [{ at: 0, rotate: 0 }, { at: 1, rotate: 360 }] },
  } : null));
}

// 范围徽章：models + plans 合成文字，蓝紫单色；无有效信息时不渲染
function TypeBadge(r) {
  const label = badgeLabel(r);
  if (!label) return null;
  return el("Badge", {
    text: label,
    background: C.ACCENT,
    textColor: C.CARD,
    fontSize: 10, fontWeight: 600, padding: [2, 6], radius: 6, shrink: 0,
  });
}

function updateLine() {
  if (!state.lastLoadedAt) return t("未加载");
  return t("更新时间", hhmm(state.lastLoadedAt)) + (state.error ? t("请求失败后缀") : "");
}

// 1. 头部：标题 + 副标题 + 数据更新时间
function Header() {
  return el("Column", { gap: 2, fillWidth: true, shrink: 0 },
    el("Row", { gap: 8, alignItems: "center", fillWidth: true },
      TX("AGY Resets", { fontSize: 15, fontWeight: 700, singleLine: true }),
      el("Spacer"),
      // 更新时间放在右侧，紧跟刷新按钮
      TX(updateLine(), { fontSize: 10, textColor: C.MUTED, singleLine: true }),
      IconButton("refresh", t("刷新按钮"), launchRefresh, loading()),
      IconButton("share", t("分享按钮"), shareShot, isSharing())),
    TX(t("副标题"), { fontSize: 11, textColor: C.MUTED, singleLine: true }));
}

// 2. Hero 卡：大号相对时间 + 绝对时间（本地/UTC 切换）+ 范围徽章
// 分段控件自绘：原生 Segmented 的文字取系统主题色，在奶油卡片上深色模式会不可读。
function TZSwitch() {
  const seg = (value, label) => {
    const active = state.tzMode === value;
    return el("Box", {
      padding: [3, 9], radius: 6, shrink: 0, cursor: "pointer",
      background: active ? C.INK : C.TILE,
      onClick: () => { setTzMode(value); $metrix.invalidate(); },
    }, TX(label, { fontSize: 10, fontWeight: 600, singleLine: true, textColor: active ? C.CARD : C.MUTED }));
  };
  return el("Row", {
    gap: 0, padding: 2, radius: 8, shrink: 0,
    background: C.TILE, border: [1, C.LINE], alignItems: "center",
  }, seg("local", t("本地时区")), seg("utc", t("UTC时区")));
}

function Hero() {
  const latest = state.status && state.status.latest;
  const utc = state.tzMode === "utc";
  return card([
    el("Row", { gap: 6, alignItems: "center", fillWidth: true },
      TX(t("最新重置标题"), { fontSize: 11, textColor: C.MUTED, singleLine: true }),
      el("Spacer"),
      TZSwitch()),
    latest && latest.at
      ? el("Column", { gap: 5, fillWidth: true, padding: [2, 0, 0, 0] },
          TX(relTime(latest.at), { fontSize: 34, fontWeight: 700, singleLine: true }),
          el("Row", { gap: 8, alignItems: "center", wrap: true },
            TX(absTime(latest.at, utc), { fontSize: 11, textColor: C.MUTED }),
            TypeBadge(latest)))
      : el("Column", { gap: 6, padding: [10, 0] },
          TX(t("暂无数据"), { fontSize: 26, fontWeight: 700 }),
          TX(t("等待数据"), { fontSize: 11, textColor: C.MUTED })),
  ]);
}

// 3. 待定值守卡：scheduled_reset / active_watch 判空渲染
function Watch() {
  if (!state.status) return null;
  const s = state.status;
  const utc = state.tzMode === "utc";
  const slot = (title, r) => {
    if (!r || (!r.at && !r.text)) return null;   // 防御字段缺失
    return el("Column", { gap: 4, fillWidth: true },
      el("Row", { gap: 6, alignItems: "center", wrap: true },
        TX(title, { fontSize: 11, fontWeight: 600, textColor: C.ACCENT, singleLine: true }),
        r.at ? TX(relTime(r.at), { fontSize: 11, singleLine: true }) : null,
        r.at ? TX(absTime(r.at, utc), { fontSize: 10, textColor: C.MUTED, singleLine: true }) : null),
      r.text ? TX(r.text, { fontSize: 12, lineHeight: 1.4 }) : null);
  };
  const scheduled = slot(t("待定重置"), s.scheduled);
  const watch = slot(t("值守中"), s.watch);
  if (!scheduled && !watch) return null;   // 无值守时不占位
  return card([
    TX(t("值守标题"), { fontSize: 12, fontWeight: 600 }),
    el("Column", { gap: 10, fillWidth: true, padding: [6, 0, 0, 0] },
      scheduled, watch,
      TX(t("值守说明"), { fontSize: 10, textColor: C.MUTED })),
  ]);
}

// 4. 统计瓦片行：重置次数 / 平均间隔 / 最长间隔（太阳黄 / 玫瑰粉 / 天空蓝），
// 与 agyresets.com 首页三个指标对齐。
function Stats() {
  const s = state.status;
  const tile = (bg, label, value) => el("Box", {
    background: bg, border: [1, C.HAIR], radius: 10, padding: [10, 10],
    grow: 1, basis: 0,
  }, el("Column", { gap: 2 },
    TX(label, { fontSize: 10, singleLine: true }),
    TX(value, { fontSize: 16, fontWeight: 700, singleLine: true })));
  return el("Grid", { columns: 3, gap: 8, fillWidth: true, shrink: 0 },
    tile(C.SUN, t("统计次数"), s && s.total != null ? t("统计次数值", s.total) : "—"),
    tile(C.ROSE, t("统计间隔"), s && s.avgIntervalDays != null ? t("统计天数值", s.avgIntervalDays) : "—"),
    tile(C.SKY, t("统计最长"), s && s.longestGapDays != null ? t("统计天数值", s.longestGapDays) : "—"));
}

// 5. 日历热力图：近 4 个月按月分组，重置日统一蓝紫；格 tooltip = 日期 + 徽章文字
function Heatmap() {
  const map = {};   // 本地日期 → 徽章文字（重置影响范围）
  for (const r of state.resets) {
    const t = Date.parse(r.at);
    if (!Number.isFinite(t)) continue;
    const d = new Date(t);
    const key = d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    if (!(key in map)) map[key] = badgeLabel(r);   // 同一天多条取最新一条
  }
  const now = new Date();
  const todayKey = now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate());
  const rows = [];
  for (let i = 3; i >= 0; i--) {
    const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let d = 1; d <= dim; d++) {
      const key = first.getFullYear() + "-" + pad2(first.getMonth() + 1) + "-" + pad2(d);
      const hit = key in map;
      // 每格 grow:1 自适应铺满可用宽度（固定 7px 会右侧大片留白）
      cells.push(el("Box", {
        aspectRatio: 1, radius: 2, grow: 1, basis: 0, shrink: 1,
        background: hit ? C.ACCENT : C.TILE,
        opacity: key > todayKey ? 0.35 : 1,
        ...(key === todayKey ? { border: [1, C.TODAY] } : null),
        tooltip: t("日历格提示", key, hit ? (map[key] || t("日历重置")) : ""),
      }));
    }
    rows.push(el("Row", { gap: 8, alignItems: "center", fillWidth: true },
      TX(monthLabel(first.getMonth()), { fontSize: 10, textColor: C.MUTED, width: monthLabelWidth(), shrink: 0 }),
      el("Row", { gap: 2, wrap: false, fillWidth: true, grow: 1, basis: 0 }, cells)));
  }
  const swatch = (color, label) => el("Row", { gap: 4, alignItems: "center" },
    el("Box", { width: 8, height: 8, radius: 2, background: color, shrink: 0 }),
    TX(label, { fontSize: 10, textColor: C.MUTED }));
  return card([
    TX(t("日历标题"), { fontSize: 12, fontWeight: 600 }),
    el("Column", { gap: 4, fillWidth: true, padding: [8, 0, 0, 0] }, rows),
    el("Row", { gap: 12, padding: [8, 0, 0, 0] },
      swatch(C.ACCENT, t("图例重置"))),
  ]);
}

// 6. 公告流：范围徽章 + 触发标签 + 原文 + X 链接
// 公告卡：整卡可点直达推文，绝对时间收进 tooltip，避免四组信息挤在一行
function FeedItem(r) {
  const open = r.url ? { onClick: () => $metrix.openURL(r.url), cursor: "pointer" } : null;
  const trigger = triggerLabel(r);
  return el("Box", {
    background: C.CARD, border: [1, C.HAIR], radius: 10, padding: [10, 12],
    fillWidth: true, shrink: 0, tooltip: absTime(r.at, state.tzMode === "utc") + (r.url ? t("公告点击提示") : ""),
    hover: open ? { background: C.HOVER } : null,
    ...(open || null),
  }, el("Column", { gap: 4, fillWidth: true },
    el("Row", { gap: 6, alignItems: "center", wrap: true },
      TypeBadge(r),
      trigger ? TX(trigger, { fontSize: 10, textColor: C.MUTED, singleLine: true }) : null,
      TX(relTime(r.at), { fontSize: 11, fontWeight: 600 })),
    r.text ? TX(r.text, { fontSize: 12, lineHeight: 1.4 }) : null));
}

function Feed() {
  const list = state.resets;
  const shown = list.slice(0, FEED_COUNT);
  return el("Column", { gap: 8, fillWidth: true, shrink: 0 },
    el("Row", { gap: 6, alignItems: "center", fillWidth: true },
      TX(t("公告标题"), { fontSize: 12, fontWeight: 600 }),
      TX(list.length ? t("公告计数", shown.length, list.length) : "", { fontSize: 10, textColor: C.MUTED })),
    shown.map(r => FeedItem(r)),
    list.length > FEED_COUNT
      ? el("Row", { center: true, fillWidth: true },
          el("Link", { text: t("查看全部"), url: SITE, href: SITE,
            fontSize: 10, textColor: C.MUTED }))
      : null);
}

// 错误横幅：保留旧数据的同时提示失败 + 重试
function ErrorBanner() {
  return el("Row", {
    gap: 8, padding: [8, 10], radius: 8, background: C.ROSE, border: [1, C.INK],
    alignItems: "center", fillWidth: true, shrink: 0,
  },
    Icon(ICON.alert, 13, C.INK),
    TX(state.error, { fontSize: 11, grow: 1, shrink: 1, lineHeight: 1.3 }),
    el("Button", { onClick: launchRefresh }, t("重试")));
}

// 7. 底部来源说明
function Footer() {
  return TX(t("页脚"),
    { fontSize: 10, textColor: C.MUTED, textAlign: "center", lineHeight: 1.4, padding: [2, 0, 6, 0] });
}

function Problem() {
  return el("Column", { gap: 10, center: true, padding: [36, 20], fillWidth: true, grow: 1 },
    Icon(ICON.alert, 22, C.ACCENT),
    TX(t("加载失败"), { fontSize: 14, fontWeight: 600, textAlign: "center" }),
    TX(state.error, { fontSize: 11, textColor: C.MUTED, textAlign: "center", lineHeight: 1.35 }),
    el("Button", { onClick: launchRefresh }, t("重试")));
}

function Loading() {
  return el("Column", { gap: 12, center: true, padding: [40, 20], fillWidth: true },
    el("Spinner"),
    TX(t("加载中"), { fontSize: 12, textColor: C.MUTED }));
}

// 面板主体按相位渲染（见 state.js 相位机）：problem / loading / ready。
function Body() {
  const p = phase();
  if (p === "problem") return Problem();
  if (p === "loading") return Loading();
  return el("Column", { gap: 12, padding: [14, 16, 10, 16], fillWidth: true },
    state.error ? ErrorBanner() : null,
    Header(),
    Hero(),
    Watch(),
    Stats(),
    Heatmap(),
    Feed(),
    Footer());
}

// ---------------------------------------------------------------------------
// tray / panel
// ---------------------------------------------------------------------------

function trayTree() {
  const s = state.status;
  const latest = s && s.latest;
  let days = s && s.daysSinceLast != null ? s.daysSinceLast : null;
  if (days == null) days = daysSince(s && s.lastResetAt || latest && latest.at || "");
  const title = days != null ? fmtDays(days) + "d" : state.error ? "!" : "—";
  const tip = latest && latest.text
    ? "AGY Resets · " + t("托盘最近重置") + relTime(latest.at) + " · " + latest.text.slice(0, 60)
    : "AGY Resets";
  const tray = {
    icon: AGY_ICON,
    iconTemplate: true,
    title,
    tooltip: tip,
    menu: [
      { label: t("菜单打开官网"), onClick: openSite },
    ],
  };
  // 无数据且有错误（problem 相位）：带出 error，tooltip 级联优先显示它，替代只有 "!" 的信息缺失
  if (!state.status && !state.resets.length && state.error) tray.error = state.error;
  return tray;
}

function panelTree() {
  // 根容器高度恒定：窗口尺寸不随分享状态变化，避免截图时窗口抖动。
  // 分享态仅把内层 Scroll 换成 Column，让内容溢出渲染，从而能截到 600px 以下的部分。
  // 分享态内层显式撑到截图高度并自带奶油底色：否则 600 以下的溢出区会露出系统灰底。
  const inner = isSharing()
    ? el("Column", { fillWidth: true, height: SHOT_HEIGHT, background: C.PAPER }, Body())
    : el("Scroll", { grow: 1, basis: 0, fillWidth: true }, Body());
  return el("Column", {
    width: W, height: H, fontSize: 13, textColor: C.INK, background: C.PAPER,
    shortcuts: { "CmdOrCtrl+R": launchRefresh },
  }, inner);
}

export { trayTree, panelTree };
