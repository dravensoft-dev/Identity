# UI kit: the Delivery Console

Interactive recreation of an internal Dravensoft product: the console where the delivery team oversees customer projects, deployments, and activity. Serves as a demonstration of the **Arena** language applied to a real app (dark-first, dense but breathable).

## Demo flow (`index.html`)
1. **Login**: access screen with branding (`AppLogo`, the Rotor mark plus wordmark) on the warm base surface.
2. **Projects** (dashboard): metrics and a grid of project cards with deployment status. Clicking a card opens its detail.
3. **Project**: Overview / Deployments / Activity / Settings tabs; the **Deploy** button opens a confirmation dialog and fires a toast.

## Screens (JSX)
- `LoginScreen.tsx`: sign-in.
- `Shell.tsx`: base layout (navigation sidebar plus topbar) reused by the dashboard and project screens.
- `DashboardScreen.tsx`: metrics and project grid.
- `ProjectScreen.tsx`: detail view with tabs, deployment table, activity, and settings.

## Arena components used
Button, IconButton, Input, Switch, Card, Badge, Tag, Tabs, Dialog, Toast, AppLogo.

All data is fictitious. The kit follows the Arena language's design; it doesn't reinvent components (it composes them from `components/`).
