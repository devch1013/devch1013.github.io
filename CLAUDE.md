# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal blog/portfolio at https://devch1013.github.io — a Jekyll site built on a vendored (not gem-installed) copy of [jekyll-TeXt-theme](https://github.com/kitian616/jekyll-TeXt-theme) v2.2.6. The theme source lives directly in `_layouts/`, `_includes/`, `_sass/`, `_data/`, so theme files are editable but also diverge from upstream.

## Commands

```bash
bundle exec jekyll serve -H 0.0.0.0    # local dev server (:4000), also `npm run serve`
npm run build                          # JEKYLL_ENV=production jekyll build → _site/
npm run eslint                         # lints _includes/**/*.js
npm run stylelint                      # lints _sass/**/*.scss
npm run docker-dev:default             # dev server in Docker (see docker/)
```

There are no tests. The `dev`, `demo-*`, and `gem-*` npm scripts are upstream-theme leftovers — they reference a `./docs` directory that does not exist here and will fail.

Deploy: pushing to `main` triggers `.github/workflows/jekyll.yml` (Ruby 3.1, `jekyll build`, GitHub Pages). Nothing else publishes the site.

## Content conventions

**Posts are authored in Obsidian.** Most commits are `vault backup: <timestamp>` from the Obsidian git plugin, which bypasses the husky/commitlint hook. Don't reformat or restructure existing markdown bodies — they are round-tripped through Obsidian.

**Post filenames are all `_posts/0000-00-00-<title>.md`.** The `0000-00-00` prefix is a deliberate placeholder; the real publish date comes from `date:` in front matter, and `permalink: date` in `_config.yml` builds the URL from that. Do not rename post files to their actual dates.

Post front matter (see `templates/0000-00-00-POST.md`):
```yaml
layout: article
title: "..."
tags: [...]
aside: {toc: true}
date: 2025-02-20
published: true
```
Article defaults (sharing, license, toc, pageview) come from `defaults:` in `_config.yml`, so posts only need the above.

**`_projects/` is a collection** (`output: true`), rendered by `_layouts/projects.html` as a grid via `article-list.html`. Project pages need `layout: article`, `title`, `cover`, `date`; `nav_key: projects` is applied via `_config.yml` defaults and is what highlights the nav item in `_includes/header.html`.

Images go in `assets/images/` (`cover/` for card covers, `postImages/` for inline).

### Adding a Codex entry

`_codex/` is the AI-authored study-notes section (`/codex.html`, nav "Codex"): writeups of technical problems the author hit, structured 문제 상황 → 원인 → 해결 → 관련 이론. This is the one section Claude is expected to write end to end.

1. **Copy `templates/CODEX.md` to `_codex/<slug>.md`.** The filename becomes the URL — `_codex/jvm-gc-pause.md` → `/codex/jvm-gc-pause.html`. Unlike `_posts/`, there is no `0000-00-00-` date prefix. A filename starting with `_` is silently skipped by Jekyll.
2. **Front matter needs only `title`, `date`, `tags`.** `layout: article`, toc, sharing, license, pageview and `nav_key: codex` all come from the `type: codex` defaults in `_config.yml`. `date` drives the index order (newest first) — always set it. `published: false` keeps a draft out of the build.
3. **Write a one-line summary, then `<!--more-->`, then the body.** The separator is required: `excerpt_separator` is `<!--more-->` site-wide, so omitting it makes the *entire document* the excerpt, and the list card renders the whole article truncated at 200 chars. With it, the card shows exactly the summary line.
4. **Body sections are `h2`**, in this order — the aside TOC is generated from them:

   | Section | Contents |
   |---|---|
   | `## 환경` | Runtime / library / version the problem showed up on. Drop if irrelevant. |
   | `## 문제 상황` | Observed symptoms only, stated generically (see redaction rules below). |
   | `## 재현` | A minimal, self-contained example that triggers it. Drop if the problem is conceptual. |
   | `## 원인` | Why it behaved that way. |
   | `## 해결` | The fix, plus alternatives considered and their trade-offs. |
   | `## 관련 이론` | The background knowledge. This section is the reason the whole area exists — don't skip it. |
   | `## 참고` | Links. Drop if empty. |

   The order is deliberate: someone arriving from a search for the same symptom reads top-down and hits the answer immediately, with the theory as an optional tail.
5. `bundle exec jekyll build` to verify. Search indexing is automatic (`search-data.js` walks every collection); the entry does *not* appear in the home feed or `/archive.html`, which both read `site.posts` only.

Don't set `cover:` on codex entries — `_layouts/codex.html` lists them with `article-list.html type='item'` and no `show_cover`, so covers are ignored.

### Visuals in Codex entries

Codex explains mechanisms, and mechanisms have flow, state and timing — prefer a diagram over three paragraphs of prose. Aim for at least one visual per entry, but never decorative ones.

**Diagrams and charts are per-page opt-in.** `_data/variables.yml` defaults `mermaid`, `chart` and `mathjax` to `false` and `_config.yml` does not override them, so a page without the flag renders the fence as a plain code block — the build still succeeds. Set only what the entry uses:

```yaml
mermaid: true   # ```mermaid fences
chart: true     # ```chart fences (Chart.js JSON)
mathjax: true   # $$...$$
```

`_includes/markdown-enhancements/*.html` lazy-loads each library from `_data/variables.yml` `sources`. The pinned versions are old and constrain the syntax:

- **mermaid `8.0.0-rc.8`** — its `detectType` matches exactly four keywords (`sequenceDiagram`, `gantt`, `classDiagram`, `gitGraph`) and sends **everything else to the flowchart parser**. So the usable set is `graph`/`flowchart`, `sequenceDiagram`, `classDiagram`, `gantt`, `gitGraph` — and `stateDiagram`, `erDiagram`, `journey`, `pie`, `mindmap`, `timeline` don't degrade gracefully, they hit the flowchart grammar and fail to render. Draw state transitions as `graph LR`; use a table for proportions.
- **Chart.js `2.7.2`** — v2 config schema, so axes are `"scales": {"yAxes": [...]}`, not the v3+ flat form.

The site ships a single light skin (`text_skin: default`, `#fff` background), so visuals don't need dark-mode variants.

**Interactive sections go in `_includes/codex/<slug>.html`,** pulled in with `{% include codex/<slug>.html %}`. Reserve them for cases where changing a value is what makes the mechanism click (scheduling order, cache hit/miss, concurrency timing). Rules: no `iframe` (breaks auto-height, TOC, search and print — an include has none of those problems); scope all CSS under one wrapper class, never bare element or generic selectors, since the entry's stylesheet is the theme's; vanilla JS only, inline in the same file, wrapped in an IIFE because a page may hold several includes; use native controls (`<button>`, `<input type="range">`) so keyboard access comes free; and keep the entry readable with JS off — anything only the widget says must also appear as a sentence in the prose.

Redaction applies to visuals exactly as it does to code: no screenshots, and no diagram that reproduces a real work architecture.

### Redacting work content in Codex entries

Most codex entries start from a problem hit at work, and everything here is published publicly. Write every entry as if it will be read by someone trying to learn about the author's employer's systems.

**Never include, even in passing:**

- Real file names or paths
- Real function, class, method, or variable names from the work codebase
- Table, column, model, or schema names; API endpoint paths; queue or topic names
- Internal service, team, product, or project code names; the employer's or a client's name
- Hostnames, URLs, IP addresses, ports, bucket names, account/tenant/customer identifiers
- **Pasted stack traces, logs, or raw error output.** These are the most common leak: they carry internal package paths, module names, and identifiers verbatim. Retype the one relevant line in generalized form instead of pasting the block.
- Business logic or architecture details that only make sense inside that company

**Instead:**

- Raise the problem to the level of the language, library, protocol, or runtime. "A bidirectional JPA relation triggered N+1 selects on flush" is publishable; the same sentence carrying the real entity name is not.
- When a concrete example is genuinely needed, **write a new one from scratch** — do not rename the real code. Renaming preserves the original structure, which is itself the leak. Build a small standalone example on a generic domain (`User`, `Order`, `Cache`) that reproduces the same mechanism, and confirm it demonstrates the point on its own, detached from the original context.
- Describe the setting only as "업무 중". No employer, project, client, or team name.

**Check before publishing:** reading this entry alone, could someone infer anything about the company's codebase? If yes, generalize further. If the problem cannot be generalized without losing its point, it doesn't get published — leave `published: false`.

## Architecture notes

**Layout chain:** `none` → `base` (html shell, inlines JS from `_includes/scripts/`) → `page`/`article`/`articles` → `home`, `archive`, `projects`, `codex`, `landing`, `404`. Root `*.html` files (`index`, `projects`, `codex`, `archive`, `404`) are front-matter-only stubs pointing at a layout.

**Snippet "functions":** `_includes/snippets/*.html` emulate function calls — they take `include.*` args and write their result into a global `__return`. Always capture immediately:
```liquid
{%- include snippets/get-nav-url.html path=_article.cover -%}
{%- assign _cover = __return -%}
```
A second snippet call clobbers `__return`.

**Config resolution:** `_data/variables.yml` holds theme defaults; `_config.yml` and per-page front matter override them. Liquid reads them as `site.x | default: site.data.variables.default.x`. So a setting missing from `_config.yml` is not unset — check `variables.yml`.

**i18n:** `languages: ["ko", "en"]`, default `ko`. UI strings live in `_data/locale.yml`; page/nav titles use per-locale `titles:` maps with YAML anchors (in front matter and `_data/navigation.yml`). Newer pages only define `en`/`ko` entries.

**Styles:** one entry point, `assets/css/main.scss`, with an explicit `@import` list — a new `_sass` partial is invisible until added there. Site-specific CSS belongs in `_sass/custom.scss` (imported last); custom head/body markup belongs in `_includes/head/custom.html` and `_includes/main/{top,bottom}/custom.html`. These four are the intended override hooks — prefer them to editing theme partials.
