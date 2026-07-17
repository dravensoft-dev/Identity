# Adopting Arena in an Angular app (DAMA playbook)

A step-by-step migration. Each step is independently landable; you can stop after
step 1–5 (the app "wears Arena" over its current Material + custom components) and
adopt primitives incrementally afterwards.

## 1. Tokens

Replace the app's `src/styles.css` `:root` / `html.dark` `--dama-*` block and its
hand-authored `@theme` with a single import:

```css
@import '../../frameworks/angular/theme/arena-tailwind.css';
```

Keep existing `--dama-*` references resolving during the transition by pasting the
**alias shim** below (documentation-only — it lives in your app, not in Arena).

## 2. Material

Replace `shared/design/material-overrides.css` with:

```css
@import '../../frameworks/angular/theme/arena-material.css';   /* AFTER Material's theme */
```

Rebind `material-theme.scss`'s palette to Arena primary/secondary. Arena maps
tokens; it does not replace Material's SCSS palette.

## 3. Theme

Replace the app's `ThemeService` and the `index.html` no-FOUC script with
`theme/theme-service.ts` and `theme/no-fouc.html`. **Flip the default to dark;**
light is the `.arena-light` class (not `html.dark`).

## 4. Fonts

Run `node frameworks/angular/fonts/fetch-fonts.mjs`, ship the resulting `woff2`
into the app's `public/fonts`, and import `fonts/fonts.css`. No CDN request.

## 5. Icons

Run the FontAwesome→Phosphor swap seeded by `icons/icon-manifest.ts`: install
`@phosphor-icons/web` (or the webfont via `<i class="ph-bold ph-x">`), keep the
`<app-icon>` wrapper so call sites don't churn. Bold default, Fill = active,
Duotone = onboarding only.

## 6. Primitives (incremental)

As each `shared/design/components/*` is touched, replace its `*.variants.ts` with
the Arena recipe or swap to the `arena-*` primitive. Do **not** mass-rewrite.

## Token alias shim (paste into your app, not Arena)

```css
/* dama-aliases.css — transition shim, app-side. Arena stays skin-clean. */
:root {
  --dama-bg: var(--color-base-100);
  --dama-surface: var(--color-base-200);      /* --surface-card */
  --dama-border: var(--color-base-300);       /* --border */
  --dama-text: var(--color-base-content);
  --dama-text-muted: var(--mute);
  --dama-primary: var(--color-primary);       /* --crimson */
  --dama-primary-fg: var(--color-primary-content);
  --dama-success: var(--color-success);
  --dama-warning: var(--color-warning);
  --dama-danger: var(--color-error);
  --dama-radius-sm: var(--r-sm);
  --dama-radius: var(--r-md);
  --dama-radius-md: var(--r-lg);
  --dama-shadow: var(--shadow-1);
  --dama-shadow-lg: var(--shadow-2);
}
```
