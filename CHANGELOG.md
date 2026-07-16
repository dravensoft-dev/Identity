# Changelog

All notable changes to Arena — Dravensoft Design System are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-16

First public release. The design language is stable and ready for other teams to build on.

### Foundations
- **Design tokens** (`tokens/`): color (daisyUI `--color-*` structure with an Arena legacy-alias compatibility layer), typography, spacing (4px grid), effects (radii, shadows, easings) and fonts. Single entry point `styles.css`.
- **Themes**: dark-first (`:root`, default) and warm light (`.arena-light`) driven by the same tokens; toggle helper in `theme.js`.
- **Content and visual guidelines** documented in `README.md`, plus specimen cards in `guidelines/`.

### Components (`components/`)
- **Forms**: Button, IconButton, Input, Textarea, Select, Checkbox, Radio/RadioGroup, Switch.
- **Display**: Card, Badge, Tag, Avatar, Table, Skeleton.
- **Navigation**: Tabs, Breadcrumbs, Menu, Pagination, CommandPalette, BulkActionBar.
- **Feedback**: Alert, Dialog, ConfirmDialog, Toast, Tooltip, EmptyState, ErrorState, ProgressBar, Onboarding.
- **Brand**: Rotor.
- Each component ships TypeScript types (`.d.ts`) and usage docs with Do/Don't (`.prompt.md`).

### Conventions
- **Danger convention**: destructive actions distinguished by shape (outline in `--error`), never filled, with the sole exception of the final irreversible confirmation.
- **Iconography**: Phosphor Icons (Bold default) adopted as the official set.
- All hardcoded colors removed from components — everything flows through tokens (`--on-accent`, `--scrim`, `--danger-strong`, …).
- Passed Nielsen heuristic audits through severity 1; current maximum severity is 0.

### Examples
- `ui_kits/console/` — Delivery Console recreation demonstrating Arena applied to a real internal product.

### Distribution
- Published as a copy-in reference kit and as a downloadable Agent Skill (`SKILL.md`).
- MIT License.

[1.0.0]: #
