Onboarding guiado dentro del producto (H10). Complementa a `EmptyState`: presenta funciones por pasos la primera vez. Controlado — guarda `index` y si ya se completó (p. ej. en localStorage) para no repetirlo.

```jsx
const [step, setStep] = useState(0);
<Onboarding open={showTour} index={step}
  onNext={() => setStep((s) => s + 1)}
  onBack={() => setStep((s) => s - 1)}
  onSkip={endTour} onDone={endTour}
  steps={[
    { eyebrow: 'Bienvenido', title: 'Su primera entrega', body: 'Desde aquí desplegará y revertirá con un clic.' },
    { title: 'Paleta de comandos', body: 'Pulse ⌘K para ejecutar cualquier acción sin ratón.' },
    { title: 'Listo', body: 'Puede reabrir esta guía desde Ayuda cuando quiera.' },
  ]} />
```

**Hacer / No hacer**
- Máximo 3–5 pasos y guarda que ya se completó para no repetirlo.
- No bloquees tareas críticas tras el tour: «Saltar» debe estar siempre disponible.
