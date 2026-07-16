# Arena — Sistema de Diseño de Dravensoft

**Arena** es el lenguaje de interfaz único bajo el que se construyen todos los productos de software de **Dravensoft**. Toma su nombre del escenario donde una obra se exhibe y se aplaude: cada interfaz Arena debe sentirse *digna de ser enaltecida* — la misma promesa de la marca.

## Audiencia y alcance
- **Audiencia del lenguaje: público general.** Arena está pensado para dar identidad a **todo tipo de software** de Dravensoft, independientemente de quién sea el usuario final — desde apps de consumo hasta herramientas internas. Sus fundamentos (color, tipografía, espaciado, accesibilidad, voz) son de propósito general y no asumen un perfil técnico.
- **La Vista general (`Arena - Vista general.dc.html`) es un ejemplo de aplicación**, no el lenguaje en sí. Ilustra Arena aplicado a **la Consola de Entrega, un producto destinado a desarrolladores/equipos técnicos**. Por eso incluye densidad de datos, terminología de dominio (build, deploy, p95) y aceleradores de teclado propios de ese público.
- **Implicación para auditorías y evaluaciones:** los hallazgos observados sobre el ejemplo deben separarse en (a) los que aplican al **lenguaje** (tokens, componentes, patrones — universales) y (b) los propios del **contexto técnico del ejemplo** (jerga, densidad, atajos). Estos últimos no son defectos del lenguaje: en un producto para público general se sustituirían por copy llano, densidad cómoda y menos atajos. Al evaluar Arena para otro tipo de software, calibrar contra esa audiencia general, no contra la Consola.

## Por qué un lenguaje propio (y no Material/Fluent tal cual)
Los sistemas establecidos (Material 3, Fluent, Carbon, Polaris) son **claros por defecto, redondeados y de tono neutral**. La identidad de Dravensoft es lo contrario: **negro cálido dominante, acentos carmesí/oro, geometría afilada y una voz audaz**. Forzar la marca sobre Material produciría una app "genérica con skin". En cambio, Arena:
- **Adopta principios estructurales probados**: disciplina de tokens y escala tipográfica (inspiración Carbon/IBM), estados y densidad claros (inspiración Material), foco visible y accesible.
- **Reescribe las decisiones estéticas** para la identidad: dark-first, radios contenidos, sombras cálidas profundas, carmesí como voz y oro como distinción, y el **Rotor** como firma.

## Fuentes
- Manual de identidad aprobado: `Identidad Dravensoft.dc.html` (raíz del proyecto).
- Marca: Dravensoft — desarrollo de software a medida / consultoría B2B.
- Concepto: orgullo, espectáculo, maestría. Lema: *"Software digno de ser enaltecido"*.

---

## CONTENT FUNDAMENTALS (voz y copy)
- **Idioma:** español (es-ES neutro). Términos técnicos en inglés se respetan (deploy, endpoint, commit).
- **Persona gramatical:** trato de **usted** en producto empresarial y documentación formal; **tú** solo en material de marketing cercano. Nunca mezclar en una misma superficie.
- **Tono:** confiado y directo, nunca fanfarrón. Afirma capacidad sin adjetivos vacíos. Ej.: *"Entrega lista para revisión"* > *"¡Increíble entrega completada!"*.
- **Casing:** títulos en **MAYÚSCULAS con tracking** solo para eyebrows/etiquetas mono (`.22em`); títulos de sección en Archivo peso 800–900 en caja normal (Sentence case). Botones en Sentence case, no Title Case.
- **Etiquetas de dato/estado:** mono en mayúsculas ("EN PROGRESO", "DESPLEGADO").
- **Números:** siempre en mono. Métricas con unidad ("14 ms", "99.98%").
- **Sin emoji** en producto ni documentación. La expresividad viene del color y la tipografía, no de iconos decorativos.
- **Microcopy:** verbos de acción concretos ("Desplegar", "Aprobar entrega", "Revertir"). Errores útiles y sin culpa ("No pudimos conectar con el servidor. Reintentar.").

## VISUAL FOUNDATIONS
- **Color — arquitectura de tokens (estructura daisyUI):** la fuente de verdad son tokens `--color-*` con su par `-content` (el color legible encima), definidos en `tokens/colors.css`. Sobre ellos, una **capa de compatibilidad** mapea los alias históricos de Arena (`--bg`, `--surface-card`, `--crimson`, `--gold`, `--danger`, `--mute`…) a los tokens daisyUI, para no romper los componentes existentes. Los niveles de texto atenuado (`--bone-dim`, `--mute`, `--mute-2`) se derivan de `--color-base-content` con `color-mix`, no son hex fijos.
- **Temas:** el lenguaje es **dark-first** pero soporta dos temas conmutables — **oscuro** (`:root`, por defecto) y **claro** (`.arena-light`, inverso cálido). Los mismos tokens cambian de valor según el tema; los componentes no se reescriben. (La Vista general incluye el toggle en su cabecera.)
- **Valores clave:** fondo negro cálido `#141010` (base-100); superficies elevadas `#1d1715` (base-200) / `#241c19` (base-300); texto hueso `#f3ede5` (base-content). Un solo acento primario (carmesí `#b52a20`) por vista; oro `#c5a059` reservado para foco, distinción y datos destacados. Máximo un acento dominante por pantalla.
- **Tipografía:** Archivo (display/titulares, 800–900), Familjen Grotesk (cuerpo, 400–600), Spline Sans Mono (datos, etiquetas, código). Tracking negativo en display (`-0.02em`), tracking amplio en etiquetas mono (`0.22em`).
- **Espaciado:** grid base 4px; ritmo generoso en marketing (gutter 88px), denso pero respirado en producto.
- **Fondos:** **siempre planos.** Arena **no utiliza degradados de color** en ninguna superficie — ni heros, ni splash, ni cards, ni acentos. La profundidad se construye con la escala de superficies (`base-100`→`base-200`→`base-300`), el borde hairline y la sombra cálida, nunca con transiciones de color. (Único uso permitido de `linear-gradient`: la animación de *shimmer* neutra del `Skeleton`, que es movimiento de carga, no decoración cromática.) Sin fotos de stock genéricas; imágenes de producto reales o placeholders rayados.
- **Bordes:** hairline `1px` `#3a2e29`; borde enfatizado `#52413a`. Se usa el borde, no la sombra, para separar en superficies planas.
- **Sombras:** cálidas y profundas, negativas en spread (`0 12px 28px -12px rgba(0,0,0,.6)`). Glow carmesí solo para el icono de app / CTAs flotantes.
- **Radios:** contenidos — botones/inputs 6px, cards 14px, tile de app 22%. Nada completamente redondo salvo avatares y switches. **Overlays flotantes:** los modales (Dialog, ConfirmDialog, CommandPalette, Onboarding) usan `--r-lg` (14px); las superficies flotantes menores y no-modales (Toast, Menu, BulkActionBar) usan `--r-md` (10px). La regla: si captura toda la pantalla con scrim, `--r-lg`; si es un panel acotado sobre la UI, `--r-md`.
- **Cards:** superficie `#1d1715`, borde hairline, radio 14px, sin sombra en listas (borde) y con `--shadow-2` cuando flotan (menús, diálogos).
- **Animación:** `--ease-out` para entradas, `--ease-emphatic` para el gesto "rotor" (giro al cargar). Duraciones 120/220/420ms. Sin bounce excesivo.
- **Hover:** aclarar superficie un paso (`#241c19`→`#2c221e`) o subir opacidad; en botones de acento el hover añade el glow carmesí (`--glow-accent`). *Nota:* tras el paso a tokens daisyUI, las variantes `--crimson-strong`/`--gold-strong`/`--danger-strong` **alias al color base** (no hay un tono «fuerte» más oscuro separado); el énfasis en press se consigue con la escala, no con un segundo tono.
- **Press:** `scale(.98)` en controles pequeños.
- **Foco:** anillo oro `2px` con offset `2px` — siempre visible, nunca `outline:none` sin reemplazo.
- **Transparencia/blur:** blur solo en overlays de diálogo (`backdrop-filter: blur(6px)` sobre `rgba(20,16,16,.6)`).
- **Microcopy en mayúsculas (H2/H6/H8):** reservar `text-transform:uppercase` + mono a **microetiquetas cortas** (≤2 palabras: eyebrows, labels de campo, badges de estado, encabezados de tabla). Los **mensajes, títulos y cualquier texto de lectura van en caja normal** — nunca frases en mayúsculas. Regla práctica: si no cabe en una «pastilla», va en caja normal.
- **Cierre único (H4):** el descarte con icono usa siempre Phosphor `ph-x` (Tag, Toast). Los **modales** (Dialog/ConfirmDialog) se cierran con su **botón explícito** (Cancelar) o clic-fuera cuando procede, no con el icono; no se mezclan las dos affordances en un mismo componente.
- **Documentación de componente (H10):** cada `*.prompt.md` incluye ejemplos y, cuando aporta, una sección **Hacer / No hacer** con los errores de uso frecuentes.

### Convención de peligro (acciones e indicadores de riesgo)
Para diferenciar las **acciones e indicadores destructivos / de riesgo** de la acción principal, Arena las distingue por **forma, no por peso**: **fondo transparente** con el **borde y todo su contenido** (texto e iconos) en el token semántico **`--error`** (alias `--danger`). Así el peligro se lee por color y nunca compite visualmente con el botón primario carmesí, que sí va relleno.
- **Aplica a** todo disparador o indicador de riesgo: botones (`.btn.danger`), icon buttons (`.iconbtn.danger`), ítems de menú (`.mitem.danger`) y equivalentes en listas, tarjetas y barras de herramientas. Hover: aclara con `--danger-soft`. Foco: anillo `--error`.
- **Regla:** un botón de peligro **relleno** no aparece como disparador en la UI (listas, tarjetas, toolbars). El relleno sólido se reserva por peso visual para la acción principal (carmesí).
- **Única excepción — confirmación final irreversible:** dentro de un `ConfirmDialog`, el botón del último «punto de no retorno» **sí se rellena** en `--error` sobre `--color-error-content`. Es la única superficie donde el peligro va relleno, precisamente porque no debe confundirse con una acción cualquiera.
- **Espécimen:** `guidelines/components-danger.html` (los tres estados lado a lado: primary relleno · danger outline · confirmación final rellena).

## ICONOGRAPHY
- **Set oficial: [Phosphor Icons](https://phosphoricons.com)** (licencia MIT, uso comercial libre sin atribución). Elegido por alinearse con la identidad audaz de Dravensoft: es la familia open-source con más variedad de estilo (1.500+ iconos en 6 pesos) y su peso **Bold** tiene la presencia y el alto contraste que pide la marca — el equivalente en iconos de Archivo Black.
- **Pesos y uso:**
  - **Bold** (`.ph-bold`) — peso por defecto en toda la UI. Presencia y legibilidad en alto contraste.
  - **Fill** (`.ph-fill`) — estado activo/seleccionado (p. ej. el ítem de navegación activo, un toggle encendido).
  - **Duotone** (`.ph-duotone`) — solo para destacar funciones/onboarding, con el acento carmesí en la capa primaria. Efecto premium de dos tonos; usar con moderación.
- **Carga (CDN):** enlazar la hoja de cada peso usado, p. ej. `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css`, y aplicar la clase de peso + la del icono: `<i class="ph-bold ph-rocket-launch"></i>`. Producción: instalar `@phosphor-icons/react` (`<Rocket weight="bold"/>`).
- Tamaños: 16 / 20 / 24 px (vía `font-size`). Color: hereda `currentColor`; acento solo cuando es interactivo/activo.
- **No** sobrescribir `font-family/weight/style` de las clases `.ph-*` (rompe los glifos).
- **Sin emoji.** Sin unicode arbitrario como icono. El **Rotor** (`assets/rotor-*.svg`) es marca, no icono de UI: no usarlo como glifo funcional.
- *Nota de migración:* el UI kit `console/Icon.jsx` usa SVGs propios estilo trazo como puente; la referencia oficial para producto nuevo es Phosphor.

---

## Índice / manifiesto
- `styles.css` — punto de entrada global (solo @imports). Consumidores enlazan este archivo.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`.
- `assets/` — `rotor-crimson/bone/ink.svg`, `app-icon.svg`.
- `guidelines/` — tarjetas de especímenes (`@dsCard`): tipografía (`type-display`, `type-body`, `type-mono`), color (`colors-neutrals`, `colors-accents`, `colors-status`), espaciado (`spacing-scale`), efectos (`effects-radius`, `effects-shadow`), iconografía (`icons`), marca (`brand-logo`, `brand-rotor`) y la **convención de peligro** (`components-danger`).
- `components/` — primitivas React: `forms/` (Button, IconButton, Input, Textarea, Select, Checkbox, Radio/RadioGroup, Switch), `display/` (Card, Badge, Tag, Avatar, Table, Skeleton), `navigation/` (Tabs, Breadcrumbs, Menu, Pagination, CommandPalette, BulkActionBar), `feedback/` (Alert, Dialog, ConfirmDialog, Toast, Tooltip, EmptyState, ErrorState, ProgressBar, Onboarding), `brand/` (Rotor).
- `ui_kits/console/` — recreación de la Consola de Entrega (producto interno de ejemplo).
- `SKILL.md` — para uso como Agent Skill descargable.

## Intentional additions
- **Tokens de consistencia (pre-publicación v1.0):** `--danger-strong` (simétrico a `--crimson-strong`/`--gold-strong`) y `--scrim`/`--scrim-blur` (backdrop unificado de los modales, en `tokens/effects.css`). Con ellos no quedan colores hardcodeados (`#fff`, `rgba(20,16,16,.6)`) en los componentes: todo pasa por token, incluido `--on-accent`. *Estado actual:* tras la migración a tokens daisyUI, las variantes `*-strong` **alias al color base** de su acento; se conservan como punto de extensión por si un tema define un tono pressed diferenciado.
- **Rotor** (componente de marca) — envoltorio del símbolo para splash/estados de carga; no existe como "componente" en la identidad pero es necesario para producto.
- **Iconografía Phosphor Icons** — set adoptado por ausencia de uno propio en la identidad; peso Bold como base (ver sección ICONOGRAPHY).
- **Componentes de remediación** (tras la auditoría heurística de Nielsen):
  - *Revisión 2 (severidad 3):* `ConfirmDialog` (confirmación de acciones destructivas, H3/H5), `EmptyState` y `ErrorState` (recuperación, H9), `CommandPalette` (acelerador ⌘K, H7), `Toast.action` e `Input` con validación (H5, H9).
  - *Revisión 3 (severidad 2):* `Skeleton` (carga asíncrona) y `Toast persist` (H1), `Breadcrumbs` (H3), `Switch confirm`/`onRequestChange` (H5), `IconButton showLabel` (H6), `BulkActionBar` y **tokens de densidad** (`--dz-*` + scope `.arena-compact`) (H7), `--mute-2` recalibrado a contraste **WCAG AA** (H8) y `Onboarding` guiado (H10).
  - *Revisión 4 (severidad 1):* `ProgressBar` determinada (H1); **cierre unificado** con Phosphor `ph-x` en Tag/Toast (H4); **taxonomía de tonos de Badge** aclarada —estado vs. énfasis— (H4/H8); guía de **microcopy en mayúsculas** (H2/H6/H8) y convención de **Hacer/No hacer** en la doc de cada componente (H10). Con esto no quedan hallazgos de severidad ≥1; la severidad máxima vigente es 0.
