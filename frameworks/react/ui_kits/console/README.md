# UI Kit — Delivery Console

Interactive recreation of an internal Dravensoft product: the console where the delivery team oversees customer projects, deployments, and activity. Serves as a demonstration of the **Arena** language applied to a real app (dark-first, dense but breathable).

## Demo flow (`index.html`)
1. **Login** — access screen with branding (`AppLogo`: the Rotor mark + wordmark) over a warm gradient.
2. **Projects** (dashboard) — metrics + grid of project cards with deployment status. Clicking a card opens its detail.
3. **Project** — Overview / Deployments / Activity / Settings tabs; the **Deploy** button opens a confirmation dialog and fires a toast.

## Screens (JSX)
- `LoginScreen.jsx` — sign-in.
- `Shell.jsx` — base layout (navigation sidebar + topbar) reused by the dashboard and project screens.
- `DashboardScreen.jsx` — metrics and project grid.
- `ProjectScreen.jsx` — detail view with tabs, deployment table, activity, and settings.
- `Icon.jsx` — wrapper around **Phosphor Icons** (webfont); `weight` bold by default, fill for active state. Requires the `@phosphor-icons/web` stylesheets loaded in the host page.

## Arena components used
Button, IconButton, Input, Switch, Card, Badge, Tag, Tabs, Dialog, Toast, AppLogo.

All data is fictitious. The kit follows the Arena language's design; it doesn't reinvent components (it composes them from `components/`).
