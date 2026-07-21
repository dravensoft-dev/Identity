import React from 'react';
import { createRoot } from 'react-dom/client';
import { Table } from '../../components/display/Table.jsx';
import { Avatar } from '../../components/display/Avatar.jsx';
import { Badge } from '../../components/display/Badge.jsx';
function Demo(){
  const rows=[
    {build:'#4821',project:'Client Portal',status:'ok',p95:'128 ms'},
    {build:'#4820',project:'Payment Gateway',status:'fail',p95:'340 ms'},
    {build:'#4819',project:'Internal Dashboard',status:'ok',p95:'96 ms'},
  ];
  const columns=[
    {key:'build',header:'Build',mono:true,width:'calc(var(--sp-1) * 22.5)'},
    {key:'project',header:'Project'},
    {key:'status',header:'Status',render:(v)=><Badge tone={v==='ok'?'success':'danger'} dot>{v==='ok'?'Deployed':'Down'}</Badge>},
    {key:'p95',header:'p95',align:'right',mono:true},
  ];
  return (
    <div>
      <div className="sub" style={{marginBottom:'var(--sp-3)'}}>Avatar — person · entity · presence</div>
      <div className="row" style={{alignItems:'center'}}>
        <Avatar name="Lucy Fernandez" status="online" />
        <Avatar name="Marco Ruiz" size="lg" status="busy" />
        <Avatar name="Aurora Bank" shape="rounded" />
        <Avatar name="QA Bot" size="sm" status="offline" />
      </div>
      <div className="sub" style={{marginBottom:'var(--sp-3)'}}>Table — with Badge in a cell</div>
      <Table columns={columns} rows={rows} getRowKey={r=>r.build} onRowClick={()=>{}} />
      <div className="sub" style={{marginTop:'var(--sp-5)',marginBottom:'var(--sp-3)'}}>Card mode — the SAME table in a 340px container</div>
      <div style={{width:'calc(var(--sp-1) * 85)',border:'var(--bw) dashed var(--border-strong)',borderRadius:'var(--r-lg)',padding:'var(--sp-3)'}}>
        {/* same columns/rows as above — the container is narrow, the viewport is not */}
        <Table columns={columns} rows={rows} />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo/>);
