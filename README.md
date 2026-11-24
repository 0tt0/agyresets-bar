# AGY Resets Bar

Never miss an Antigravity quota reset again.

A menu bar dashboard for [Metrix.Bar](https://metrix.bar) that watches Google Antigravity (Gemini/Argon) reset announcements from [agyresets.com](https://agyresets.com) and tells you when one lands. Data comes from the public agyresets.com API (watching @_mohansolo); this project is not affiliated with Google or Antigravity. [中文说明](README.zh-CN.md)

## Install

Open the link, then open the downloaded file — Metrix.Bar imports `.bar` files directly.

- [`agy-resets.bar`](https://cdn.jsdelivr.net/gh/YOURNAME/agyresets-bar@v0.1.0/agy-resets.bar)

Or paste this into your browser's address bar to import straight from the CDN:

```text
metrixbar://install?url=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2FYOURNAME%2Fagyresets-bar%40v0.1.0%2Fagy-resets.bar&sha256=0f31a92b3842fa177d74adcb38eddb5a4fb7c11975a421c0762c6c08bc381b02
```

GitHub strips custom schemes from rendered Markdown, so that link is copyable text rather than a clickable anchor. `YOURNAME` in the links is a placeholder — replace it with your GitHub username before publishing, and re-compute the sha256 (`shasum -a 256 agy-resets.bar`) if the file changes.

The dashboard language follows your Metrix.Bar display language — Chinese for `zh*` locales, English otherwise. The language is captured when the dashboard's Worker is created, so reload the dashboard after switching your system or host language.

## What you get

- **How long since the last reset**, in local time or UTC.
- **Scope badges** — which models (Gemini, Argon, all) and plans (everyone, paid) each reset covers.
- **A four-month calendar** — the rhythm, not just the latest entry.
- **Stats**: total resets, average interval, longest gap — matching the agyresets.com homepage.
- **A notification when a new announcement drops**, and never a stale one on install.
- **One-click screenshot sharing.**

## Good to know

It refreshes every 2 minutes; a failed request keeps the last good data and offers Retry. Requests go straight to `agyresets.com`, so that host must be reachable. Alerts are on by default and can be turned off in dashboard settings. The Vue runtime loads at startup from a CDN — JSDMirror first, with jsDelivr as a fallback.

## Credits & license

Data comes from the public [agyresets.com](https://agyresets.com) API (watching @_mohansolo). Not affiliated with agyresets.com, Google, or Antigravity.

[Apache-2.0](LICENSE). Vue is loaded from a CDN at startup (JSDMirror primary, jsDelivr fallback) and stays under MIT. "Google", "Antigravity", "Gemini" and "Argon" are trademarks of Google, used only to identify the monitored service.
