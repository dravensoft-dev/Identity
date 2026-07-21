import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppLogo } from '../../components/brand/AppLogo.jsx';
const CRIMSON = <img src="../../../../assets/rotor-crimson.svg" alt=""/>;
const BONE = <img src="../../../../assets/rotor-bone.svg" alt=""/>;
function Demo(){return(<div>
  <div className="sub">AppLogo — the four steps of the scale</div>
  <div className="row"><AppLogo size="xl" mark={CRIMSON} name="Draven" dim="soft"/></div>
  <div className="row"><AppLogo size="lg" mark={CRIMSON} name="Draven" dim="soft"/></div>
  <div className="row"><AppLogo size="md" mark={CRIMSON} name="Draven" dim="soft"/></div>
  <div className="row"><AppLogo size="sm" mark={CRIMSON} name="Draven" dim="soft"/></div>
  <div className="sub">Monochrome · single ink — a bone mark, no dim</div>
  <div className="row"><AppLogo size="md" mark={BONE} name="Dravensoft"/></div>
  <div className="sub">Vertical · stacked</div>
  <div className="row"><AppLogo size="md" orientation="vertical" mark={CRIMSON} name="Draven" dim="soft"/></div>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
