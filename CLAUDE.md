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

## Architecture notes

**Layout chain:** `none` → `base` (html shell, inlines JS from `_includes/scripts/`) → `page`/`article`/`articles` → `home`, `archive`, `projects`, `landing`, `404`. Root `*.html` files (`index`, `projects`, `archive`, `404`) are front-matter-only stubs pointing at a layout.

**Snippet "functions":** `_includes/snippets/*.html` emulate function calls — they take `include.*` args and write their result into a global `__return`. Always capture immediately:
```liquid
{%- include snippets/get-nav-url.html path=_article.cover -%}
{%- assign _cover = __return -%}
```
A second snippet call clobbers `__return`.

**Config resolution:** `_data/variables.yml` holds theme defaults; `_config.yml` and per-page front matter override them. Liquid reads them as `site.x | default: site.data.variables.default.x`. So a setting missing from `_config.yml` is not unset — check `variables.yml`.

**i18n:** `languages: ["ko", "en"]`, default `ko`. UI strings live in `_data/locale.yml`; page/nav titles use per-locale `titles:` maps with YAML anchors (in front matter and `_data/navigation.yml`). Newer pages only define `en`/`ko` entries.

**Styles:** one entry point, `assets/css/main.scss`, with an explicit `@import` list — a new `_sass` partial is invisible until added there. Site-specific CSS belongs in `_sass/custom.scss` (imported last); custom head/body markup belongs in `_includes/head/custom.html` and `_includes/main/{top,bottom}/custom.html`. These four are the intended override hooks — prefer them to editing theme partials.
