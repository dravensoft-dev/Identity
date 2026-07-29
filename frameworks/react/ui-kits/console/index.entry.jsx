import React from 'react';
import { createRoot } from 'react-dom/client';
import { dismissDefault, dismissActionable } from '../../Tokens.generated.js';
import { LoginScreen } from './LoginScreen.jsx';
import { DashboardScreen } from './DashboardScreen.jsx';
import { ProjectScreen } from './ProjectScreen.jsx';
import { Toast } from '../../components/feedback/toast/Toast.jsx';

function App(){
  const [screen, setScreen] = React.useState('login');
  const [project, setProject] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);

  const pushToast = (t) => {
    const id = Math.random();
    setToasts((ts) => [...ts, { ...t, id }]);
    /* A toast carrying a button asks the reader to DECIDE, not only to read, and
     * gets longer for it (WCAG 2.2.1). `persist` overrides both and never
     * auto-dismisses -- mandatory in critical states, per README H1.
     * The test is `actionLabel`, because that is what makes Toast render a button:
     * `onAction` is an event handler and a toast can carry one with no label and
     * no button, which would buy the longer clock for a toast nobody can act on. */
    if (t.persist) return;
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)),
      t.actionLabel ? dismissActionable : dismissDefault);
  };

  const nav = (id) => {
    if (id === 'dashboard') { setScreen('dashboard'); setProject(null); }
    else setScreen('dashboard'); // other sections not implemented in the demo
  };

  let view;
  if (screen === 'login') {
    view = <LoginScreen onLogin={() => setScreen('dashboard')} />;
  } else if (screen === 'project') {
    view = <ProjectScreen onNav={nav} project={project}
      onToast={() => {
        pushToast({ tone: 'success', title: 'Deployment in progress', message: 'build #4822 → production' });
        pushToast({ tone: 'neutral', title: 'Previous build still serving traffic', message: 'build #4821 → production',
          actionLabel: 'Undo', onAction: () => {} });
      }} />;
  } else {
    view = <DashboardScreen onNav={nav}
      onOpenProject={(p) => { setProject(p); setScreen('project'); }} />;
  }

  return (
    <React.Fragment>
      {view}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <Toast key={t.id} tone={t.tone} title={t.title} message={t.message} persist={t.persist}
            actionLabel={t.actionLabel} onAction={t.onAction} dismissible
            onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </React.Fragment>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
