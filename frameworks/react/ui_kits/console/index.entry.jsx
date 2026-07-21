import React from 'react';
import { createRoot } from 'react-dom/client';
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
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
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
