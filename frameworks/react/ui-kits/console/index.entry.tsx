import type { ToastTone } from '../../Api.generated';
import type { ConsoleProject } from './DashboardScreen.tsx';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginScreen } from './LoginScreen.tsx';
import { DashboardScreen } from './DashboardScreen.tsx';
import { ProjectScreen } from './ProjectScreen.tsx';
import { Toast, TOAST_DISMISS } from '../../components/feedback/toast/Toast.tsx';
import { ToastHost } from '../../components/feedback/toast-host/ToastHost.tsx';

interface ConsoleToast {
  tone: ToastTone;
  title: string;
  message: string;
  persist?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

function App(){
  const [screen, setScreen] = React.useState('login');
  const [project, setProject] = React.useState<ConsoleProject | null>(null);
  const [toasts, setToasts] = React.useState<(ConsoleToast & { id: number })[]>([]);

  const pushToast = (t: ConsoleToast) => {
    const id = Math.random();
    setToasts((ts) => [...ts, { ...t, id }]);

    if (t.persist) return;
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)),
      t.actionLabel ? TOAST_DISMISS.actionable : TOAST_DISMISS.default);
  };

  const nav = (id: string) => {
    if (id === 'dashboard') { setScreen('dashboard'); setProject(null); }
    else setScreen('dashboard');
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
      onOpenProject={(p: ConsoleProject) => { setProject(p); setScreen('project'); }} />;
  }

  return (
    <React.Fragment>
      {view}
      <ToastHost>
        {toasts.map((t) => (
          <Toast key={t.id} tone={t.tone} title={t.title} message={t.message} persist={t.persist}
            actionLabel={t.actionLabel} onAction={t.onAction} dismissible
            onClose={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
        ))}
      </ToastHost>
    </React.Fragment>
  );
}

createRoot(document.getElementById('root')!).render(<App/>);
