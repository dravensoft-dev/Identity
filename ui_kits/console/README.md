# UI Kit — Consola de Entrega

Recreación interactiva de un producto interno de Dravensoft: la consola donde el equipo de delivery supervisa proyectos de clientes, despliegues y actividad. Sirve como demostración del lenguaje **Arena** aplicado a una app real (dark-first, densa pero respirada).

## Flujo del demo (`index.html`)
1. **Login** — pantalla de acceso con marca (Rotor + wordmark) sobre gradiente cálido.
2. **Proyectos** (dashboard) — métricas + grid de tarjetas de proyecto con estado de despliegue. Clic en una tarjeta abre el detalle.
3. **Proyecto** — pestañas Resumen / Despliegues / Actividad / Ajustes; el botón **Desplegar** abre un diálogo de confirmación y lanza un toast.

## Pantallas (JSX)
- `LoginScreen.jsx` — acceso.
- `Shell.jsx` — layout base (sidebar de navegación + topbar) reutilizado por dashboard y proyecto.
- `DashboardScreen.jsx` — métricas y grid de proyectos.
- `ProjectScreen.jsx` — detalle con pestañas, tabla de despliegues, actividad y ajustes.
- `Icon.jsx` — wrapper de **Phosphor Icons** (webfont); `weight` bold por defecto, fill para estado activo. Requiere las hojas `@phosphor-icons/web` cargadas en la página host.

## Componentes Arena usados
Button, IconButton, Input, Switch, Card, Badge, Tag, Tabs, Dialog, Toast, Rotor.

Todos los datos son ficticios. El kit copia el diseño del lenguaje Arena; no reinventa componentes (los compone desde `components/`).
