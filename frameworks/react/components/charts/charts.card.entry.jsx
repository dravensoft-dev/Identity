import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChartCard } from '../../components/charts/ChartCard.jsx';
import { BarChart } from '../../components/charts/BarChart.jsx';
import { LineChart } from '../../components/charts/LineChart.jsx';
import { DoughnutChart } from '../../components/charts/DoughnutChart.jsx';
const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function Demo(){return (<div>
  <div className="sub">Identity — the categorical ramp, assigned in order</div>
  <div className="grid">
    <ChartCard title="Deploys per day">
      <BarChart labels={days} values={[12,19,9,22,17,4,6]} seriesLabel="Deploys" />
    </ChartCard>
    <ChartCard title="Requests by service">
      <BarChart labels={['Web','API','Worker','Static']} values={[420,310,140,90]} slots={[1,2,3,4]} seriesLabel="rps" />
    </ChartCard>
    <ChartCard title="p95 latency">
      <LineChart labels={days} values={[120,138,131,142,180,164,150]} seriesLabel="p95" slot={5} area valueSuffix=" ms" />
    </ChartCard>
    <ChartCard title="Traffic share">
      <DoughnutChart labels={['Web','API','Worker','Static']} values={[420,310,140,90]} seriesLabel="Traffic" valueSuffix=" rps" />
    </ChartCard>
  </div>
  <div className="sub">Meaning — opt-in, only when the series IS a state</div>
  <div className="grid">
    <ChartCard title="Failed builds">
      <BarChart labels={days} values={[1,0,3,1,5,0,0]} tone="danger" seriesLabel="Failed" />
    </ChartCard>
    <ChartCard title="Error rate">
      <LineChart labels={days} values={[0.4,0.3,1.2,0.6,2.1,0.5,0.4]} tone="danger" seriesLabel="Error rate" area valueSuffix="%" />
    </ChartCard>
  </div>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
