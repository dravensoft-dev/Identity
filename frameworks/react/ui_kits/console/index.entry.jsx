import React from 'react';
import { createRoot } from 'react-dom/client';
import { dismissDefault, dismissActionable } from '../../tokens.generated.js';
import { LoginScreen } from './LoginScreen.jsx';
import { DashboardScreen } from './DashboardScreen.jsx';
import { ProjectScreen } from './ProjectScreen.jsx';
import { Toast } from '../../components/feedback/Toast.jsx';

function App(){
  const [screen, setScreen] = React.useState('login');
  const [project, setProject] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);

  const pushToast = (t) => {
    const id = Math.random();
    setToasts((ts) => [...ts, { ...t, id }]);
    /* A toast carrying a button asks the reader to DECIDE, not only to read, and
     * gets longer for it (WCAG 2.2.1). `persist` overrides both and never
     * auto-dismisses -- mandatory in critical states, per README H1. */
    if (t.persist) return;
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)),
      t.action ? dismissActionable : dismissDefault);
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
      onToast={() => pushToast({ tone: 'success', title: 'Deployment in progress', message: 'build #4822 → production' })} />;
  } else {
    view = <DashboardScreen onNav={nav}
      onOpenProject={(p) => { setProject(p); setScreen('project'); }} />;
  }

  return (
    <React.Fragment>
      {view}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <Toast key={t.id} tone={t.tone} title={t.title} message={t.message}
            onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </React.Fragment>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
