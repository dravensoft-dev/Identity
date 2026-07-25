import React from 'react';
import { createRoot } from 'react-dom/client';
import { Menu } from '../../components/navigation/Menu.jsx';
import { Pagination } from '../../components/navigation/Pagination.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Button } from '../../components/forms/Button.jsx';
function Demo(){
  const [p,setP]=React.useState(3);
  return (
    <div>
      <div className="sub" style={{marginBottom:'var(--sp-3)'}}>Menu — actions / overflow</div>
      <div className="row" style={{alignItems:'center'}}>
        <Menu trigger={<Button variant="secondary" iconRight="ph-bold ph-caret-down">Actions</Button>}
          onSelect={()=>{}}
          items={[
            {header:'Deployment'},
            {label:'View logs',icon:'ph-bold ph-scroll'},
            {label:'Duplicate',icon:'ph-bold ph-copy',shortcut:'⌘D'},
            {divider:true},
            {label:'Delete',icon:'ph-bold ph-trash',destructive:true},
          ]} />
        <Menu align="end" trigger={<IconButton label="More options" icon="ph-bold ph-dots-three-vertical" />}
          onSelect={()=>{}}
          items={[
            {label:'Rename',icon:'ph-bold ph-pencil-simple'},
            {label:'Archive',icon:'ph-bold ph-archive'},
          ]} />
      </div>
      <div className="sub" style={{marginBottom:'var(--sp-3)'}}>Pagination</div>
      <Pagination page={p} pageCount={12} onChange={setP} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo/>);
