import React from 'react';
import { createRoot } from 'react-dom/client';
import { CommandPalette } from './CommandPalette.tsx';
import { Button } from '../../forms/button/Button.tsx';
const commands = [
  {id:'deploy',label:'Deploy to production',hint:'client portal',icon:'ph-bold ph-rocket-launch',shortcut:'⌘D',group:'Actions'},
  {id:'logs',label:'View build logs',hint:'build 4821',icon:'ph-bold ph-terminal-window',group:'Actions'},
  {id:'new',label:'New project',icon:'ph-bold ph-plus-circle',shortcut:'⌘N',group:'Actions'},
  {id:'invite',label:'Invite teammate',hint:'members settings',icon:'ph-bold ph-user-plus'},
  {id:'theme',label:'Toggle theme',icon:'ph-bold ph-moon'},
  {id:'docs',label:'Open documentation',hint:'arena design system',icon:'ph-bold ph-book-open',group:'Destinations',route:'#docs'},
];
function Demo(){
  const[open,setOpen]=React.useState(true);
  React.useEffect(()=>{
    const h=(e: KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpen(true);}};
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[]);
  return(<div>
    <div className="sub">Press Cmd/Ctrl+K · arrows to move · Enter to run · Esc to close</div>
    <Button variant="secondary" size="sm" onClick={()=>setOpen(true)}>Open palette</Button>
    <CommandPalette open={open} onClose={()=>setOpen(false)} commands={commands} onRun={(c)=>console.log('ran', c.id)} />
  </div>);
}
createRoot(document.getElementById('root')!).render(<Demo/>);
