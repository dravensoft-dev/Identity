import React from 'react';
import { createRoot } from 'react-dom/client';
import type { ToastPlacement, ToastTone } from '../../../Api.generated';
import { Button } from '../../forms/button/Button.tsx';
import { Dialog } from '../dialog/Dialog.tsx';
import { Toast, TOAST_DISMISS } from '../toast/Toast.tsx';
import { ToastHost } from './ToastHost.tsx';

const PLACEMENTS: ToastPlacement[] = ['top-start', 'top-end', 'bottom-start', 'bottom-end'];

interface Notice {
  id: number;
  title: string;
  tone: ToastTone;
  actionLabel?: string;
}

let nextId = 0;

function Card() {
  const [placement, setPlacement] = React.useState<ToastPlacement>('bottom-end');
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [dialog, setDialog] = React.useState(false);

  const drop = (id: number) => setNotices((all) => all.filter((one) => one.id !== id));

  const raise = (tone: ToastTone, title: string, actionLabel?: string) => {
    const notice: Notice = { id: nextId++, title, tone, actionLabel };
    setNotices((all) => [...all, notice]);
    if (tone === 'danger') return;
    setTimeout(() => drop(notice.id),
      actionLabel ? TOAST_DISMISS.actionable : TOAST_DISMISS.default);
  };

  return (
    <React.Fragment>
      <div className="sub">The corner is the whole API — one host, four placements</div>
      <div className="row">
        {PLACEMENTS.map((corner) => (
          <Button key={corner} variant={corner === placement ? 'primary' : 'ghost'}
            onClick={() => setPlacement(corner)}>{corner}</Button>
        ))}
      </div>

      <div className="sub">Raise notices and watch them stack, in the order they were raised</div>
      <div className="row">
        <Button onClick={() => raise('success', 'Snapshot taken')}>Raise an advisory</Button>
        <Button variant="secondary" onClick={() => raise('gold', 'Quota at 80%', 'Increase')}>
          Raise one with an action
        </Button>
        <Button variant="ghost" onClick={() => raise('danger', 'Region unreachable', 'Retry')}>
          Raise a danger
        </Button>
        <Button variant="ghost" onClick={() => setDialog(true)}>Open a dialog under the stack</Button>
      </div>
      <p className="echo">
        advisory {TOAST_DISMISS.default}ms · with an action {TOAST_DISMISS.actionable}ms · danger never
      </p>

      <Dialog open={dialog} title="A stack outranks this panel" eyebrow="Layering"
        onClose={() => setDialog(false)}>
        Raise a notice with the dialog open: it paints above the scrim, because --z-toast is the one
        slot above every other overlay.
      </Dialog>

      <ToastHost placement={placement}>
        {notices.map((notice) => (
          <Toast key={notice.id} tone={notice.tone} title={notice.title}
            message="Raised from the demo page." actionLabel={notice.actionLabel}
            dismissible onAction={() => drop(notice.id)} onClose={() => drop(notice.id)} />
        ))}
      </ToastHost>
    </React.Fragment>
  );
}

createRoot(document.getElementById('root')!).render(<Card />);
