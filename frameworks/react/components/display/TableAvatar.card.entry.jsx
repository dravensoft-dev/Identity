import React from 'react';
import { createRoot } from 'react-dom/client';
import { Table } from './table/Table.jsx';
import { TableRow } from './table-row/TableRow.jsx';
import { TableCell } from './table-cell/TableCell.jsx';
import { Avatar } from './avatar/Avatar.jsx';
import { Badge } from './badge/Badge.jsx';
function Demo(){
  const rows=[
    {build:'#4821',project:'Client Portal',status:'ok',p95:'128 ms'},
    {build:'#4820',project:'Payment Gateway',status:'fail',p95:'340 ms'},
    {build:'#4819',project:'Internal Dashboard',status:'ok',p95:'96 ms'},
  ];
  // Configuration only: a column heads and sets its cells, never says what is in them.
  const columns=[
    {header:'Build',mono:true,width:'calc(var(--sp-1) * 22.5)'},
    {header:'Project'},
    {header:'Status'},
    {header:'p95',align:'right',mono:true},
  ];
  /* One TableRow per row, one TableCell per cell — which is how the Badge gets
     into the status cell without Arena ever calling a render function. `key` is
     React's own reconciliation; there is no `getRowKey` member any more. Both
     tables wire `onClick`, so the by-hand keyboard checklist in Table.prompt.md
     has a live activation to test in each layout. */
  const body = (onClick) => rows.map((r)=>(
    <TableRow key={r.build} onClick={onClick}>
      <TableCell>{r.build}</TableCell>
      <TableCell>{r.project}</TableCell>
      <TableCell><Badge tone={r.status==='ok'?'success':'danger'} dot>{r.status==='ok'?'Deployed':'Down'}</Badge></TableCell>
      <TableCell>{r.p95}</TableCell>
    </TableRow>
  ));
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
      <Table columns={columns} label="Recent builds">{body(()=>{})}</Table>
      <div className="sub" style={{marginTop:'var(--sp-5)',marginBottom:'var(--sp-3)'}}>Card mode — the SAME table in a 340px container</div>
      <div style={{width:'calc(var(--sp-1) * 85)',border:'var(--bw) dashed var(--border-strong)',borderRadius:'var(--r-lg)',padding:'var(--sp-3)'}}>
        {/* same columns/rows as above — the container is narrow, the viewport is not */}
        <Table columns={columns} label="Recent builds, card mode">{body(()=>{})}</Table>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo/>);
