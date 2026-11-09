# Design system examples

The default catalog contains native HTML examples, captured from the service. Do not render normal catalog examples in iframes: the desktop browser feedback picker must be able to select the actual element in this document.

- `service-examples.json`: captured example markup only; it is not a style source.
- `service-styles.py`: reads the current service stylesheet links and inline rules in their actual cascade order, then scopes them to native examples.
- `sample-layout-v1.css` / `sample-layout-v2.css`: catalog framing only, without component appearance overrides.
- `build-preview.py`: embeds the markup and current service CSS directly in `index.html`, refreshes asset versions, and writes source fingerprints.
- `catalog.js`: Foundations, Components categories, Utilities and service capture setup.
- `sample-dom.js`: sample interactions and capture-only stylesheet/ID isolation.

Token and CSS changes are reflected automatically by the service build. After changing component markup, refresh the examples as well:

1. Build service sources with `python3 work/mobile/build-calendar-preview.py`.
2. Open the catalog with `?capture=1` to extract the current v1/v2 service UI. This maintenance mode temporarily runs the actual service documents.
3. Capture each `.ds-sample` outer HTML together with its containing section's `data-component-example`, `data-sample-kind`, and component/utility target into `service-examples.json`. Preserve isolated IDs, remove captured `<style>` elements, and normalize the catalog URL prefix to `__DS_BASE__/` and deployment asset paths to `preview/work/mobile/` or `preview/static/`.
4. Run the build again, package, and verify the normal catalog without `capture=1`. It must have 39 native examples and zero iframes. Check annotation selection as well as visible styles.

Input variants belong under Components → Input. All reusable gym/logo information rows and cards, including visit cards inside bottom sheets, belong under Components → Card. The sheet container itself belongs under Overlay.

## Shared source of truth

A design-system annotation is a request to change the corresponding shared service token/component, not just this catalog. Apply the shared change to every actual service use, build both outputs, verify them, and deploy them together. Styles are always rebuilt from the actual v2 service and its embedded editor. Markup captures must be refreshed after structural changes; editing generated example HTML/CSS alone is not a completed change. Run `python3 work/design-system/check-shared-sources.py` before packaging.

## Catalog categories

The catalog uses a top-level menu, a left category menu, and a right page outline. Foundations contains Colors, Typography, Spacing, Size & Radius, Motion, and Effects. Colors separates Semantic and Atomic into local tabs. Each palette stays on a single row, with horizontal scrolling on narrow screens and no visible scrollbar or token-code labels. Values continue to come from shared service tokens. Utilities currently has only selection helpers and scrolling, so it remains a flat list within its page. Component examples remain native, selectable HTML.
