import React from 'react';
import { createRoot } from 'react-dom/client';
import { Calendar } from '../../components/display/Calendar.jsx';
import { CalendarEvent } from '../../components/display/CalendarEvent.jsx';
import { Button } from '../../components/forms/Button.jsx';

/* Built around the real current week so the "now" line and today's column are
   always in shot. `timeZone` is deliberately NOT passed: omitted, it resolves to
   the viewer's own zone, which is what this demo wants and what the common case
   wants. This card used to compute that zone by hand at the call site, which is
   the line that argued the member should not be required. */
const now = new Date();
const monday = new Date(now);
monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
const at = (day, h, m) => {
  const d = new Date(monday);
  d.setDate(monday.getDate() + day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const events = [
  { id:'s1', title:'Standup',            start:at(0,9,0),  end:at(0,9,30),  colorId:1 },
  { id:'m1', title:'Client review — Northwind', start:at(0,10,0), end:at(0,11,30), colorId:2 },
  { id:'m2', title:'Design critique',    start:at(0,11,0), end:at(0,12,0),  colorId:3 },
  { id:'s2', title:'Standup',            start:at(1,9,0),  end:at(1,9,30),  colorId:1 },
  { id:'m3', title:'Migration planning', start:at(1,13,0), end:at(1,14,30), colorId:4 },
  { id:'s3', title:'Standup',            start:at(2,9,0),  end:at(2,9,30),  colorId:1 },
  { id:'m4', title:'Onsite — Acme',      start:at(2,10,0), end:at(2,12,0),  colorId:5 },
  { id:'m5', title:'Security sync',      start:at(2,10,30),end:at(2,11,0),  colorId:6 },
  { id:'m6', title:'Retro',              start:at(2,11,30),end:at(2,12,30), colorId:7 },
  { id:'s4', title:'Standup',            start:at(3,9,0),  end:at(3,9,30),  colorId:1 },
  { id:'m7', title:'Release window',     start:at(3,15,0), end:at(3,16,30), colorId:8 },
  { id:'s5', title:'Standup',            start:at(4,9,0),  end:at(4,9,30),  colorId:1 },
  { id:'m8', title:'Demo day',           start:at(4,12,0), end:at(4,13,0),  colorId:2 },
  { id:'m9', title:'On-call handover',   start:at(5,11,0), end:at(5,12,0),  colorId:3 },
];

function Demo(){
  const [picked, setPicked] = React.useState(null);
  return (<div>
    <div className="sub">
      Wednesday shows three overlapping events sharing the width · Sunday is hidden until something lands on it
      {picked && <> · picked: {picked}</>}
    </div>
    <Calendar
      actions={<Button size="sm" variant="secondary" icon="ph-bold ph-plus">New event</Button>}
      dayEnd="18:00"
    >
      {/* Two of the fourteen carry an action panel, so the card shows both
          shapes side by side: a plain chip and one with a kebab. The kebab
          sits inside the chip, which is absolutely positioned, so it cannot
          grow the card's content box; the open panel overflows the chip
          deliberately and is not part of layout either. */}
      {events.map((e) => (
        <CalendarEvent key={e.id} id={e.id} title={e.title} start={e.start} end={e.end}
          colorId={e.colorId} onClick={() => setPicked(e.title)}
          {...(e.id === 'm1' || e.id === 'm7' ? {
            actionsEnabled: true,
            actions: <Button size="sm" variant="ghost" icon="ph-bold ph-trash">Delete</Button>,
          } : null)} />
      ))}
    </Calendar>
  </div>);
}
createRoot(document.getElementById('root')).render(<Demo/>);
