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
        <Menu trigger={<Button variant="secondary" iconRight={<i className="ph-bold ph-caret-down"/>}>Actions</Button>}
          items={[
            {header:'Deployment'},
            {label:'View logs',icon:<i className="ph-bold ph-scroll"/>,onClick:()=>{}},
            {label:'Duplicate',icon:<i className="ph-bold ph-copy"/>,shortcut:'⌘D',onClick:()=>{}},
            {divider:true},
            {label:'Delete',icon:<i className="ph-bold ph-trash"/>,destructive:true,onClick:()=>{}},
          ]} />
        <Menu align="end" trigger={<IconButton label="More options"><i className="ph-bold ph-dots-three-vertical"/></IconButton>}
          items={[
            {label:'Rename',icon:<i className="ph-bold ph-pencil-simple"/>,onClick:()=>{}},
            {label:'Archive',icon:<i className="ph-bold ph-archive"/>,onClick:()=>{}},
          ]} />
      </div>
      <div className="sub" style={{marginBottom:'var(--sp-3)'}}>Pagination</div>
      <Pagination page={p} pageCount={12} onChange={setP} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo/>);
