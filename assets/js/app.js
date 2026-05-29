// ── HELPERS ───────────────────────────────────────────────────────────────
const fmtCLP=n=>'$'+Math.round(n).toLocaleString('es-CL');
const fmtDate=d=>d?d.toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'2-digit'}):'—';
const fmtMes=d=>MNAMES[d.getMonth()]+" '"+String(d.getFullYear()).slice(2);
const mesesRest=fin=>Math.max(0,(fin-TODAY)/(1000*60*60*24*30.44));
const dateToFrac=(d,s,e)=>Math.max(0,Math.min(1,(d-s)/(e-s)));
const monthsBetween=(a,b)=>(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());
const addMonths=(d,n)=>new Date(d.getFullYear(),d.getMonth()+n,1);
const slugEstado=s=>s.replace(/\s*\/\s*/g,'').replace(/\s+/g,'');
const SUB_ONLY_SUPERVISOR='Subcontrato';
const SUB_ONLY_STATUS='SUBCONTRATO';
let activeTooltipObra=null;
let activeModalObra=null;

function isActiveSub(sub, refDate=TODAY){
  return sub.cant>0 && sub.fin>=refDate;
}

function getSubForObra(obra){
  return SUBCONTRATOS.find(s=>s.obra===obra&&s.cant>0) || null;
}

function hasPersonalForObra(obra){
  return PERSONAL.some(p=>p.obra===obra);
}

function getEstadoForObra(obra){
  const sub=getSubForObra(obra);
  if(sub&&!hasPersonalForObra(obra))return SUB_ONLY_STATUS;
  return ESTADOS_MAP[obra]?.estado || SUB_ONLY_STATUS;
}

function getFinForObra(obra){
  const estadoFin=ESTADOS_MAP[obra]?.fin;
  const subFin=getSubForObra(obra)?.fin;
  if(estadoFin&&subFin)return estadoFin>subFin?estadoFin:subFin;
  return estadoFin || subFin || new Date(2026,11,31);
}

function getAllObraNames(){
  return [...new Set([...PERSONAL.map(p=>p.obra),...SUBCONTRATOS.filter(s=>isActiveSub(s)).map(s=>s.obra)])].sort();
}

function passesObraFilters(obraName, supervisor, estado){
  const obraOk=filters.obras===null||filters.obras.has(obraName);
  const supOk=filters.sups===null||filters.sups.has(supervisor);
  const estOk=filters.estados===null||filters.estados.has(estado);
  return obraOk&&supOk&&estOk;
}

// ── FILTER STATE ──────────────────────────────────────────────────────────
// Sets store the SELECTED (included) values. null = all selected (initial state).
const filters = {obras:null, sups:null, estados:null};

function getFiltered(){
  return PERSONAL.filter(p=>{
    return passesObraFilters(p.obra,p.supervisor,getEstadoForObra(p.obra));
  });
}

function getObras(refDate=TODAY){
  const map={};
  PERSONAL.forEach(p=>{
    if(!passesObraFilters(p.obra,p.supervisor,getEstadoForObra(p.obra)))return;
    // If 'desde' is defined and refDate is before it, skip for count purposes
    const activeAtRef=!refDate||!p.desde||(refDate>=p.desde);
    if(!map[p.obra])map[p.obra]={obra:p.obra,supervisor:p.supervisor,personas:[],totalCant:0,totalCosto:0};
    map[p.obra].personas.push(p);
    if(activeAtRef){map[p.obra].totalCant+=p.cant;map[p.obra].totalCosto+=p.costo;}
  });
  SUBCONTRATOS.filter(s=>isActiveSub(s,refDate)).forEach(s=>{
    if(map[s.obra])return;
    const estado=getEstadoForObra(s.obra);
    if(!passesObraFilters(s.obra,SUB_ONLY_SUPERVISOR,estado))return;
    map[s.obra]={obra:s.obra,supervisor:SUB_ONLY_SUPERVISOR,personas:[],totalCant:0,totalCosto:0};
  });
  return Object.values(map).map(o=>{
    return {...o,estado:getEstadoForObra(o.obra),fin:getFinForObra(o.obra),subcontrato:getSubForObra(o.obra)};
  }).sort((a,b)=>a.fin-b.fin);
}

// ── MULTI-SELECT DROPDOWNS ────────────────────────────────────────────────
const ddKeys={Obra:{set:'obras',all:[],label:'Obras'},Sup:{set:'sups',all:[],label:'Supervisores'},Est:{set:'estados',all:[],label:'Estados'}};

function buildDropdowns(){
  ['Obra','Sup','Est'].forEach(key=>{
    const dd=document.getElementById('msDD'+key);
    if(dd)dd.innerHTML='';
  });
  ddKeys.Obra.all=getAllObraNames();
  ddKeys.Sup.all=[...new Set([...PERSONAL.map(p=>p.supervisor),SUB_ONLY_SUPERVISOR])].sort();
  ddKeys.Est.all=[...new Set(getAllObraNames().map(getEstadoForObra))].sort();
  ['Obra','Sup','Est'].forEach(key=>{
    const dd=document.getElementById('msDD'+key);
    const {all}=ddKeys[key];
    // "Select all" row — starts checked (all selected)
    const saDiv=document.createElement('div');
    saDiv.className='ms-option ms-select-all';
    saDiv.innerHTML=`<input type="checkbox" id="chkAll${key}" checked onchange="toggleAll('${key}',this.checked)"><label for="chkAll${key}" style="cursor:pointer;">Seleccionar todo</label>`;
    dd.appendChild(saDiv);
    all.forEach(val=>{
      const div=document.createElement('div');
      div.className='ms-option';
      const id=`chk${key}_${val.replace(/\W/g,'_')}`;
      // all start checked (included in selection)
      div.innerHTML=`<input type="checkbox" id="${id}" value="${val}" checked onchange="toggleOption('${key}','${val}',this.checked)"><label for="${id}" style="cursor:pointer;">${val}</label>`;
      dd.appendChild(div);
    });
  });
}

function toggleDD(key){
  const dd=document.getElementById('msDD'+key);
  ['Obra','Sup','Est'].forEach(k=>{
    if(k!==key) document.getElementById('msDD'+k).classList.remove('open');
  });
  dd.classList.toggle('open');
}

function toggleAll(key,checked){
  const {all,set}=ddKeys[key];
  const dd=document.getElementById('msDD'+key);
  dd.querySelectorAll('input[value]').forEach(inp=>inp.checked=checked);
  // null = all selected; Set with all values = none selected effectively means filter is active
  filters[set]=checked?null:new Set();
  updateBtnLabel(key);
  refreshAll();
}

function toggleOption(key,val,checked){
  const {all,set}=ddKeys[key];
  // If currently null (all), materialise to full set first
  if(filters[set]===null){
    filters[set]=new Set(all);
  }
  if(checked) filters[set].add(val);
  else filters[set].delete(val);
  // If all are checked again → back to null
  if(filters[set].size===all.length) filters[set]=null;
  // Sync "select all" checkbox
  document.getElementById('chkAll'+key).checked=(filters[set]===null);
  updateBtnLabel(key);
  refreshAll();
}

function updateBtnLabel(key){
  const {all,set}=ddKeys[key];
  const btn=document.getElementById('msBtn'+key);
  const isAll=filters[set]===null;
  const selectedN=isAll?all.length:(filters[set].size);
  if(isAll){
    btn.className='ms-btn';
    btn.innerHTML=(key==='Obra'?'Todas':key==='Sup'?'Todos':'Todos')+' <span class="ms-arrow">▼</span>';
  } else {
    btn.className='ms-btn active-filter';
    btn.innerHTML=`${selectedN}/${all.length} <span class="ms-arrow">▼</span>`;
  }
}

// Close dropdowns on outside click, also hide tooltip
document.addEventListener('click',e=>{
  if(!e.target.closest('.ms-wrap')){
    ['Obra','Sup','Est'].forEach(k=>document.getElementById('msDD'+k).classList.remove('open'));
  }
  if(!e.target.closest('.obra-row')&&!e.target.closest('.tooltip'))hideTT();
});

// ── TABS ──────────────────────────────────────────────────────────────────
let currentTab='Timeline';
let currentView='dotacion';

function switchTab(tab,el){
  currentTab=tab;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel'+tab).classList.add('active');
  document.getElementById('vistaControls').style.display=tab==='Timeline'?'flex':'none';
  document.getElementById('tlLegend').style.display=tab==='Timeline'?'flex':'none';
  if(tab==='Timeline') renderTimeline();
  else if(tab==='Costo') renderCosto();
  else renderEval();
}

function setView(v,btn){
  currentView=v;
  document.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if(currentTab==='Timeline') renderTimeline();
}

function refreshAll(){
  renderKPIs();
  renderSubcontratos();
  if(currentTab==='Timeline') renderTimeline();
  else if(currentTab==='Costo') renderCosto();
  else renderEval();
}

function getProjectedCost(obra){
  if(obra.obra==='PAULISTA III'){
    const costo1=1594005;
    const costoExtra=1100000*3;
    const jul2026=new Date(2026,6,1);
    const mesesFase1=Math.max(0,Math.min((jul2026-TODAY)/(1000*60*60*24*30.44),mesesRest(obra.fin)));
    const mesesFase2=Math.max(0,mesesRest(obra.fin)-mesesFase1);
    return costo1*mesesRest(obra.fin)+costoExtra*mesesFase2;
  }
  return obra.totalCosto*mesesRest(obra.fin);
}

// ── KPI ───────────────────────────────────────────────────────────────────
function renderKPIs(){
  const obras=getObras(); // already defaults to TODAY, respects 'desde'
  const visibleObras=new Set(obras.map(o=>o.obra));
  const totalP=obras.reduce((s,o)=>s+o.totalCant,0);
  const totalC=obras.reduce((s,o)=>s+o.totalCosto,0);
  const totalSub=SUBCONTRATOS.filter(s=>visibleObras.has(s.obra)&&isActiveSub(s)).reduce((s,x)=>s+x.cant,0);
  // Costo proyectado: for each obra, integrate cost month by month (respects 'desde')
  const proy=obras.reduce((sum,o)=>sum+getProjectedCost(o),0);
  document.getElementById('kpiBar').innerHTML=`
    <div class="kpi"><div class="kpi-label">Personal FORMATTO</div><div class="kpi-value">${totalP}<small>pers.</small></div></div>
    <div class="kpi"><div class="kpi-label">Costo Mensual</div><div class="kpi-value" style="font-size:16px;">${fmtCLP(totalC)}</div></div>
    <div class="kpi"><div class="kpi-label">Costo Proyectado</div><div class="kpi-value" style="font-size:16px;color:var(--rojo);">${fmtCLP(proy)}</div></div>
    <div class="kpi"><div class="kpi-label">Obras Filtradas</div><div class="kpi-value">${obras.length}</div></div>
    <div class="kpi"><div class="kpi-label">Subcontratos</div><div class="kpi-value">${totalSub}<small>pers.</small></div></div>`;
}

// ── SUBCONTRATOS ──────────────────────────────────────────────────────────
function renderSubcontratos(){
  const visibleObras=new Set(getObras().map(o=>o.obra));
  const activos=SUBCONTRATOS.filter(s=>visibleObras.has(s.obra)&&isActiveSub(s));
  const inactivos=SUBCONTRATOS.filter(s=>visibleObras.has(s.obra)&&s.cant===0);
  const total=activos.reduce((s,x)=>s+x.cant,0);
  document.getElementById('subList').innerHTML=(activos.length?activos.map(s=>`
    <div class="sub-item">
      <div class="sub-obra">${s.obra}</div>
      <div class="sub-nombre">${s.nombre}</div>
      <div class="sub-meta">
        <div><div class="sub-cant">${s.cant}</div><div style="font-size:7px;color:var(--bark)">pers.</div></div>
        <div class="sub-fin">Fin<br>${fmtDate(s.fin)}</div>
      </div>
    </div>`).join(''):'<div class="sub-note">No hay subcontratos activos para los filtros actuales.</div>')+
    (inactivos.length?`<div class="sub-note">${inactivos.length} subcontratos sin dotación activa no se suman al total.</div>`:'');
  document.getElementById('subTotalVal').innerHTML=`${total}<small style="font-size:9px;color:var(--bark)"> p.</small>`;
}

// ── TIMELINE GRID ─────────────────────────────────────────────────────────
// Layer state
const tlLayers={dot:true,cos:false,sub:false};

function toggleLayer(key){
  tlLayers[key]=!tlLayers[key];
  // keep at least one active
  if(!tlLayers.dot&&!tlLayers.cos&&!tlLayers.sub){tlLayers[key]=true;return;}
  // update button styles
  const bd=document.getElementById('btnLayerDot');
  const bc=document.getElementById('btnLayerCos');
  const bs=document.getElementById('btnLayerSub');
  bd.className='toggle-btn'+(tlLayers.dot?' active':'');
  bc.className='toggle-btn'+(tlLayers.cos?' active':'');
  bs.className='toggle-btn'+(tlLayers.sub?' active':'');
  if(currentTab==='Timeline')renderTimeline();
}

function getTLRange(obras){
  let mx=TODAY;
  const visibleObras=new Set(obras.map(o=>o.obra));
  obras.forEach(o=>{if(o.fin>mx)mx=o.fin;});
  SUBCONTRATOS.filter(s=>visibleObras.has(s.obra)&&isActiveSub(s)).forEach(s=>{if(s.fin>mx)mx=s.fin;});
  const capEnd=new Date(2026,11,31);
  if(mx>capEnd)mx=capEnd;
  return{start:TODAY,end:new Date(mx.getFullYear(),mx.getMonth()+2,1)};
}

function resetDropdowns(){
  filters.obras=null;filters.sups=null;filters.estados=null;
  buildDropdowns();
  ['Obra','Sup','Est'].forEach(updateBtnLabel);
}

// Color scales: Industrial elegante (Red 500 + Gray 800 + Sand)
const DOT_PAL=['#FFFFFF','#F7D9D1','#F0B5A4','#E88E74','#CE4620','#B63D1C','#8E3016','#662210','#3F1409','#2A0D05'];
const COS_PAL=['#FFFFFF','#FAFAF8','#EDEBE5','#BDBDB8','#6A6A64','#2B2B2B'];
const SUB_COLOR='#EDE6D6';

function dotColor(n){return DOT_PAL[Math.min(n,DOT_PAL.length-1)];}
function cosColor(lvl){return COS_PAL[Math.min(lvl,COS_PAL.length-1)];}
function dotMixColor(cosLvl){return DOT_PAL[Math.max(0,Math.min(DOT_PAL.length-1,cosLvl-2))];}
function subColor(){return SUB_COLOR;}

function hexRgb(hex){
  const c=hex.replace('#','');
  return [parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)];
}

function colorDistance(a,b){
  const ar=hexRgb(a),br=hexRgb(b);
  return Math.hypot(ar[0]-br[0],ar[1]-br[1],ar[2]-br[2]);
}

function cosShiftColor(cosLvl,dotBg){
  let shifted=Math.min(COS_PAL.length-1,cosLvl+1);
  while(shifted<COS_PAL.length-1&&colorDistance(COS_PAL[shifted],dotBg)<70){
    shifted=Math.min(COS_PAL.length-1,shifted+1);
  }
  return COS_PAL[shifted];
}

function isLightColor(hex){
  const [r,g,b]=hexRgb(hex);
  return(r*299+g*587+b*114)/1000>155;
}

function getTimelineSegment(monthIdx,segmentIdx,startDate){
  const qDate=addMonths(startDate,monthIdx);
  const qStart=segmentIdx===0?1:segmentIdx===1?15:30;
  const qEnd=segmentIdx===0?14:segmentIdx===1?29:new Date(qDate.getFullYear(),qDate.getMonth()+1,0).getDate();
  return {
    start:new Date(qDate.getFullYear(),qDate.getMonth(),qStart),
    end:new Date(qDate.getFullYear(),qDate.getMonth(),qEnd)
  };
}

// Timeline segment helpers: 0=day 1, 1=day 15, 2=day 30.
function getQuincenaData(obra,monthIdx,segmentIdx,startDate){
  const {start:qDateStart,end:qDateEnd}=getTimelineSegment(monthIdx,segmentIdx,startDate);
  // Check if obra is active in this quincena
  if(obra.fin<qDateStart)return null; // obra ended before this quincena
  // Count active personas in this quincena (respect 'desde')
  const activePers=obra.personas.filter(p=>{
    if(p.fin<qDateStart)return false;
    if(p.desde&&p.desde>qDateEnd)return false;
    return true;
  });
  const dot=activePers.reduce((s,p)=>s+p.cant,0);
  const costo=activePers.reduce((s,p)=>s+p.costo,0);
  const isFin=obra.fin>=qDateStart&&obra.fin<=qDateEnd;
  const hasCambio=activePers.some(p=>p.desde&&p.desde>=qDateStart&&p.desde<=qDateEnd);
  return{dot,costo,isFin,hasCambio};
}

// Cost level 0-5 relative to max cost in dataset
function costoLevel(costo,maxCosto){
  if(costo<=0)return 0;
  const frac=costo/maxCosto;
  if(frac<0.1)return 1;
  if(frac<0.3)return 2;
  if(frac<0.55)return 3;
  if(frac<0.8)return 4;
  return 5;
}

function fmtMillones(n){
  if(n>=1000000)return'$'+(n/1000000).toFixed(1)+'M';
  return'$'+(n/1000).toFixed(0)+'K';
}

function renderTimeline(){
  const obras=getObras();
  const visibleObras=new Set(obras.map(o=>o.obra));
  const {start,end}=getTLRange(obras);
  const nM=monthsBetween(start,end);
  const grid=document.getElementById('tlGrid');
  grid.innerHTML='';
  if(obras.length===0){
    grid.innerHTML='<div class="empty-state"><div class="empty-title">Sin obras para los filtros actuales</div><div class="empty-copy">Ajusta Obra, Supervisor o Estado para volver a ver la planificación.</div></div>';
    return;
  }

  // Max values for color scaling
  const allCostos=obras.map(o=>o.totalCosto);
  const maxCosto=Math.max(...allCostos,1);

  // Pre-calc timeline totals for header
  // For each month: [day 1 segment, day 15 segment, day 30 segment]
  const qTotDot=[],qTotCos=[],qTotSub=[];
  for(let i=0;i<nM;i++){
    const dotTotals=[0,0,0],cosTotals=[0,0,0],subTotals=[0,0,0];
    for(let si=0;si<3;si++){
      const seg=getTimelineSegment(i,si,start);
      obras.forEach(o=>{
        const d=getQuincenaData(o,i,si,start);
        if(d){dotTotals[si]+=d.dot;cosTotals[si]+=d.costo;}
      });
      subTotals[si]=SUBCONTRATOS
        .filter(s=>visibleObras.has(s.obra)&&s.cant>0&&s.fin>=seg.start)
        .reduce((sum,x)=>sum+x.cant,0);
    }
    qTotDot.push(dotTotals);
    qTotCos.push(cosTotals);
    qTotSub.push(subTotals);
  }

  // ── HEADER ──
  const hdr=document.createElement('div');
  hdr.className='tl-grid-header';
  const oCol=document.createElement('div');
  oCol.className='obra-col';oCol.textContent='OBRA';
  hdr.appendChild(oCol);

  const mWrap=document.createElement('div');
  mWrap.className='tl-months-wrap';

  for(let i=0;i<nM;i++){
    const d=addMonths(start,i);
    const isCurMth=d.getFullYear()===TODAY.getFullYear()&&d.getMonth()===TODAY.getMonth();
    const grp=document.createElement('div');grp.className='tl-month-grp';

    const lbl=document.createElement('div');
    lbl.className='tl-month-lbl'+(isCurMth?' cur':'');

    // dot total hidden (removed from header per design)
    const totDotEl=document.createElement('span');
    totDotEl.className='tl-mth-tot-dot';
    totDotEl.style.display='none';

    const totCosEl=document.createElement('span');
    totCosEl.className='tl-mth-tot-cos';
    totCosEl.textContent=fmtMillones(qTotCos[i][0]);
    totCosEl.style.display=tlLayers.cos?'':'none';

    const totSubEl=document.createElement('span');
    totSubEl.className='tl-mth-tot-sub';
    totSubEl.textContent=qTotSub[i][0]+'p';
    totSubEl.style.display=tlLayers.sub?'':'none';

    const mthName=document.createElement('span');
    mthName.textContent=MNAMES[d.getMonth()]+" '"+String(d.getFullYear()).slice(2);

    lbl.appendChild(totDotEl);lbl.appendChild(totCosEl);lbl.appendChild(totSubEl);lbl.appendChild(mthName);
    grp.appendChild(lbl);

    const qLbls=document.createElement('div');qLbls.className='tl-quinc-lbls';
    [1,15,30].forEach((day)=>{
      const ql=document.createElement('div');
      ql.className='tl-q-lbl'+(isCurMth?' qcur':'');
      ql.textContent=day;
      qLbls.appendChild(ql);
    });
    grp.appendChild(qLbls);
    mWrap.appendChild(grp);
  }
  hdr.appendChild(mWrap);
  grid.appendChild(hdr);

  // ── ROWS ──
  obras.forEach(obra=>{
    const sub=obra.subcontrato;
    const hasSub=!!sub;
    const isSubOnly=hasSub&&obra.estado===SUB_ONLY_STATUS&&obra.personas.length===0;
    const row=document.createElement('div');
    row.className='obra-row '+(hasSub?'row-combined':'row-simple');

    // Info col
    const info=document.createElement('div');info.className='obra-info';
    info.innerHTML=`<div class="obra-name">${obra.obra}</div>
      <div class="obra-supervisor">Sup. ${obra.supervisor}</div>
      <span class="obra-estado estado-${slugEstado(obra.estado)}">${obra.estado}</span>
      ${hasSub?`<div class="obra-sub-info">◌ ${sub.nombre} · ${sub.cant}p</div>`:''}
      <button class="obra-detail-btn" type="button">Detalle</button>`;
    row.appendChild(info);

    // Quinc cells — 3 per month: day1, day15, day30
    const qCells=document.createElement('div');qCells.className='tl-quinc-cells';

    for(let mi=0;mi<nM;mi++){
      const mthCells=document.createElement('div');mthCells.className='tl-month-cells';

      for(let qi=0;qi<3;qi++){
        // qi=0→day1, qi=1→day15, qi=2→day30
        const data=getQuincenaData(obra,mi,qi,start);
        const cell=document.createElement('div');
        cell.className='tl-qcell';

        // Inactive: no data OR (dot=0 and either no sub, or sub already ended)
        const seg=getTimelineSegment(mi,qi,start);
        const subActive=hasSub&&sub.fin>=seg.start;
        if((!data&&!subActive)||(data&&data.dot===0&&!subActive)){
          cell.classList.add('inactive');
        } else {
          const dot=data?data.dot:0;
          const costo=data?data.costo:0;
          const cosLvl=costoLevel(costo,maxCosto);
          const dotBgForCell=tlLayers.dot&&tlLayers.cos?dotMixColor(cosLvl):dotColor(dot);
          const cosBgForCell=tlLayers.dot&&tlLayers.cos?cosShiftColor(cosLvl,dotBgForCell):cosColor(cosLvl);
          const isFin=data&&data.isFin;
          const hasCambio=data&&data.hasCambio&&qi===0;
          const isCurQ=mi===0&&qi===0;

          if(isCurQ)cell.classList.add('hoy');
          if(isFin)cell.classList.add('fin-obra');
          if(hasCambio)cell.classList.add('cambio');

          // Background — dotación + costo tienen prioridad; subcontrato queda como banda.
          if(isSubOnly&&subActive&&tlLayers.sub){
            cell.classList.add('sub-only');
            cell.style.background=subColor();
          } else if(tlLayers.dot&&tlLayers.cos){
            // Cuña redondeada solo entre dot y cos
            cell.classList.add('mix');
            cell.style.background=dotBgForCell;
            cell.style.setProperty('--mix-cos',cosBgForCell);
          } else if(tlLayers.dot){
            cell.style.background=dotBgForCell;
          } else if(tlLayers.cos){
            cell.style.background=cosBgForCell;
          } else if(tlLayers.sub){
            // Solo sub: fondo gris según cantidad (obras sin sub quedan blancas)
            cell.style.background=hasSub?subColor():'#FFFFFF';
          }

          // Contrast check per visible layer.
          const dotBg=dotBgForCell;
          const cosBg=cosBgForCell;
          if(tlLayers.dot)cell.classList.add(isLightColor(dotBg)?'dot-light':'dot-dark');
          if(tlLayers.cos)cell.classList.add(isLightColor(cosBg)?'cos-light':'cos-dark');
          // Light text check — usar dotación como color primario para el texto
          const primaryBg=isSubOnly&&subActive&&tlLayers.sub?subColor():tlLayers.dot?dotBgForCell:tlLayers.cos?cosBgForCell:(hasSub?subColor():'#FFFFFF');
          if(isLightColor(primaryBg))cell.classList.add('lt');
          else cell.classList.remove('lt');

          // Cell content — tl-dot-content fills tile with padding-bottom:20px, sub-band absolute at bottom
          let html='';
          if(isSubOnly&&subActive){
            html+=`<div class="tl-sub-band full">
              <span style="font-size:14px;font-weight:700;color:var(--grafito);">${sub.cant}p</span>
              <span style="font-size:8px;color:var(--umber);letter-spacing:0.03em;">sub</span>
            </div>`;
          } else if(subActive&&tlLayers.sub){
            const soloSub=!tlLayers.dot&&!tlLayers.cos;
            if(soloSub){
              // Solo sub: band llena todo el tile
              html+=`<div class="tl-sub-band full">
                <span style="font-size:14px;font-weight:700;color:var(--grafito);">${sub.cant}p</span>
                <span style="font-size:8px;color:var(--umber);letter-spacing:0.03em;">sub</span>
              </div>`;
            } else {
              // Dot + sub: dot content con padding-bottom, sub-band absoluta al fondo
              cell.classList.add('has-sub');
              let dotHtml='';
              if(tlLayers.dot&&dot>0){
                dotHtml+=`<div class="tl-t-top"><span class="tl-t-num">${dot}</span><span class="tl-t-unit">p</span></div>`;
              } else if(tlLayers.dot&&dot===0){
                dotHtml+=`<div style="opacity:0.25;font-size:10px;color:var(--bark);">—</div>`;
              }
              if(tlLayers.cos&&dot>0){
                if(tlLayers.dot)dotHtml+=`<div class="tl-t-div"></div>`;
                dotHtml+=`<div class="tl-t-cos">${fmtMillones(costo)}</div>`;
              }
              html+=`<div class="tl-dot-content">${dotHtml}</div>`;
              html+=`<div class="tl-sub-band">
                <span style="font-size:9px;font-weight:700;color:var(--grafito);">${sub.cant}p</span>
                <span style="font-size:7px;color:var(--umber);letter-spacing:0.03em;">sub</span>
              </div>`;
            }
          } else {
            // Sin sub — contenido centrado normal
            if(tlLayers.dot&&dot>0){
              html+=`<div class="tl-t-top"><span class="tl-t-num">${dot}</span><span class="tl-t-unit">p</span></div>`;
            } else if(tlLayers.dot&&dot===0){
              html+=`<div class="tl-t-top" style="opacity:0.3"><span class="tl-t-num" style="font-size:10px">—</span></div>`;
            }
            if(tlLayers.cos&&dot>0){
              if(tlLayers.dot)html+=`<div class="tl-t-div"></div>`;
              html+=`<div class="tl-t-cos">${fmtMillones(costo)}</div>`;
            }
          }
          if(isCurQ)html+=`<span class="tl-marker tl-marker-hoy">HOY</span>`;
          if(isFin)html+=`<span class="tl-marker tl-marker-fin">FIN</span>`;
          cell.innerHTML=html;

          // Hover → show legend
          cell.addEventListener('mouseenter',()=>{
            const leg=document.getElementById('tlLegendRow');
            if(leg)leg.classList.add('visible');
          });
          cell.addEventListener('mouseleave',()=>{
            const leg=document.getElementById('tlLegendRow');
            if(leg)leg.classList.remove('visible');
          });
        }

        mthCells.appendChild(cell);
      }
      qCells.appendChild(mthCells);
    }

    row.appendChild(qCells);
    row.addEventListener('click',e=>{e.stopPropagation();toggleModal(obra,sub);});
    row.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();toggleTTFixed(e,obra,sub);});
    info.querySelector('.obra-detail-btn').addEventListener('click',e=>{e.stopPropagation();toggleModal(obra,sub);});
    grid.appendChild(row);
  });

  // ── TOTAL ROW ──
  const totRow=document.createElement('div');totRow.className='tl-total-row';
  const totLbl=document.createElement('div');totLbl.className='tl-total-lbl';totLbl.textContent='TOTAL';
  totRow.appendChild(totLbl);
  const totCells=document.createElement('div');totCells.className='tl-total-cells';

  for(let i=0;i<nM;i++){
    const totMth=document.createElement('div');totMth.className='tl-tot-mth';
    for(let qi=0;qi<3;qi++){
      const tc=document.createElement('div');tc.className='tl-tot-cell';
      const isCur=i===0&&qi===0;
      let html='';
      if(tlLayers.dot){
        html+=`<span class="tl-tot-num${isCur?' red':''}">${qTotDot[i][qi]}p</span>`;
      }
      if(tlLayers.cos){
        html+=`<span class="tl-tot-cos" style="display:block">${fmtMillones(qTotCos[i][qi])}</span>`;
      }
      if(tlLayers.sub){
        html+=`<span class="tl-tot-sub" style="display:block">${qTotSub[i][qi]}p</span>`;
      }
      tc.innerHTML=html||'<span class="tl-tot-lbl">—</span>';
      totMth.appendChild(tc);
    }
    totCells.appendChild(totMth);
  }
  totRow.appendChild(totCells);
  grid.appendChild(totRow);

  // ── LEGEND ROW ──
  const legRow=document.createElement('div');legRow.className='tl-legend-row';legRow.id='tlLegendRow';
  let legHtml='';
  if(tlLayers.dot){
    legHtml+=`<div class="tl-leg-grp">
      <span class="tl-leg-title">Dotación</span>
      <div class="tl-leg-scale">
        ${DOT_PAL.map(c=>`<div class="tl-leg-sw" style="background:${c};${c==='#FFFFFF'?'border:1px solid var(--border)':''}"></div>`).join('')}
      </div>
      <span class="tl-leg-cap">0 → 7+ pers</span>
    </div><div class="tl-leg-sep"></div>`;
  }
  if(tlLayers.cos){
    legHtml+=`<div class="tl-leg-grp">
      <span class="tl-leg-title" style="color:var(--grafito)">Costo</span>
      <div class="tl-leg-scale">
        ${COS_PAL.map(c=>`<div class="tl-leg-sw" style="background:${c};${c==='#FFFFFF'?'border:1px solid var(--border)':''}"></div>`).join('')}
      </div>
      <span class="tl-leg-cap">bajo → alto</span>
    </div><div class="tl-leg-sep"></div>`;
  }
  if(tlLayers.sub){
    legHtml+=`<div class="tl-leg-grp">
      <span class="tl-leg-title" style="color:var(--bark)">Subcontrato</span>
      <div class="tl-leg-scale">
        <div class="tl-leg-sw" style="background:${SUB_COLOR};border:1px solid var(--border);width:42px;"></div>
      </div>
      <span class="tl-leg-cap">color fijo</span>
    </div><div class="tl-leg-sep"></div>`;
  }
  legHtml+=`<div class="tl-leg-fin"><div class="tl-leg-fin-box"></div><span>Fin obra</span></div>`;
  legHtml+=`<div class="tl-leg-fin" style="margin-left:8px;"><div style="width:12px;height:12px;box-shadow:inset 0 0 0 2.5px var(--rojo);background:#F5F0E8;"></div><span>Hoy</span></div>`;
  legHtml+=`<div class="tl-leg-fin" style="margin-left:8px;"><div style="width:12px;height:12px;outline:1.5px dashed var(--bark);outline-offset:-1px;background:#BCBCB7;"></div><span>Ingreso programado</span></div>`;
  legRow.innerHTML=legHtml;
  grid.appendChild(legRow);
}

// ── TOOLTIP ───────────────────────────────────────────────────────────────
function showTT(e,obra,sub){
  const m=mesesRest(obra.fin);
  document.getElementById('ttTitle').textContent=obra.obra;
  let b=`<div class="tt-row"><span>Personas</span><span>${obra.totalCant}</span></div>
    <div class="tt-row"><span>Costo mensual</span><span>${fmtCLP(obra.totalCosto)}</span></div>
    <div class="tt-row"><span>Costo proyectado</span><span>${fmtCLP(obra.totalCosto*m)}</span></div>
    <div class="tt-row"><span>Meses rest.</span><span>${m.toFixed(1)}</span></div>
    <div class="tt-row"><span>Estado</span><span>${obra.estado}</span></div>
    <div class="tt-row"><span>Fin</span><span>${fmtDate(obra.fin)}</span></div>`;
  if(sub){b+=`<div class="tt-sep"></div><div style="font-size:8px;color:var(--sub);margin-bottom:2px;">Sub: ${sub.nombre}</div><div class="tt-row"><span>Cant.</span><span>${sub.cant}</span></div><div class="tt-row"><span>Fin sub.</span><span>${fmtDate(sub.fin)}</span></div>`;}
  b+=`<div class="tt-hint" style="margin-top:6px;font-size:7px;color:var(--bark);letter-spacing:0.08em;">CLICK DERECHO → DETALLE COMPLETO</div>`;
  document.getElementById('ttBody').innerHTML=b;
  const tt=document.getElementById('tooltip');
  tt.style.left=(e.clientX+14)+'px';tt.style.top=(e.clientY-10)+'px';
  tt.classList.add('visible');
}
function hideTT(){
  activeTooltipObra=null;
  document.getElementById('tooltip').classList.remove('visible');
}

function toggleTTFixed(e,obra,sub){
  e.preventDefault();
  if(activeTooltipObra===obra.obra){
    hideTT();
    return;
  }
  closeModalDirect();
  activeTooltipObra=obra.obra;
  showTT(e,obra,sub);
  // Fijar posición, no seguir al mouse
  const tt=document.getElementById('tooltip');
  tt.style.left=(e.clientX+14)+'px';
  tt.style.top=(e.clientY-10)+'px';
}

// ── MODAL ─────────────────────────────────────────────────────────────────
function toggleModal(obra,sub){
  if(activeModalObra===obra.obra&&document.getElementById('modalOverlay').classList.contains('open')){
    closeModalDirect();
    return;
  }
  openModal(obra,sub);
}

function openModal(obra,sub){
  hideTT();
  activeModalObra=obra.obra;
  const m=mesesRest(obra.fin);
  document.getElementById('modalTitle').textContent=obra.obra;
  document.getElementById('modalSubtitle').textContent=`Sup: ${obra.supervisor} · ${obra.estado} · Fin: ${fmtDate(obra.fin)}`;
  const sorted=[...obra.personas].sort((a,b)=>EVAL_ORDER[a.eval]-EVAL_ORDER[b.eval]);
  const ec={MB:0,B:0,R:0,M:0};sorted.forEach(p=>{if(ec[p.eval]!==undefined)ec[p.eval]++;});
  document.getElementById('modalBody').innerHTML=`
    <div class="modal-section">
      <div class="modal-section-label">Resumen Económico</div>
      <div class="modal-grid">
        <div><div class="modal-kpi-val">${obra.totalCant}</div><div class="modal-kpi-lbl">Personas</div></div>
        <div><div class="modal-kpi-val" style="font-size:14px;">${fmtCLP(obra.totalCosto)}</div><div class="modal-kpi-lbl">Costo mensual</div></div>
        <div><div class="modal-kpi-val red" style="font-size:14px;">${fmtCLP(obra.totalCosto*m)}</div><div class="modal-kpi-lbl">Costo proyectado (${m.toFixed(1)} meses)</div></div>
        <div><div class="modal-kpi-val" style="font-size:14px;">${fmtDate(obra.fin)}</div><div class="modal-kpi-lbl">Fin estimado</div></div>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-section-label">Personal — ${Object.entries(ec).filter(([,v])=>v>0).map(([k,v])=>`${v}${k}`).join(' · ')}</div>
      ${sorted.map(p=>`<div class="modal-person-row">
        <div class="modal-ev-tag" style="background:${EVAL_COLORS[p.eval]}">${p.eval}</div>
        <div><div class="modal-person-name">${p.nombre}</div><div class="modal-person-meta">${p.cargo} · ${fmtCLP(p.costo)}/mes</div></div>
      </div>`).join('')}
    </div>
    ${sub?`<div class="modal-section"><div class="modal-section-label">Subcontrato</div>
      <div style="font-size:10px;font-weight:700;color:var(--grafito)">${sub.nombre}</div>
      <div style="font-size:9px;color:var(--bark);margin-top:2px;">${sub.cant} personas · Fin: ${fmtDate(sub.fin)}</div>
    </div>`:''}`;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal(e){if(e.target===document.getElementById('modalOverlay'))closeModalDirect();}
function closeModalDirect(){
  activeModalObra=null;
  document.getElementById('modalOverlay').classList.remove('open');
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModalDirect();});

// ── COSTO PROYECTADO ──────────────────────────────────────────────────────
function buildRangeSelectors(obras){
  if(obras.length===0){
    const desSel=document.getElementById('rangeDesde');
    const hasSel=document.getElementById('rangeHasta');
    desSel.innerHTML='<option value="0">Sin datos</option>';
    hasSel.innerHTML='<option value="0">Sin datos</option>';
    return;
  }
  const allFins=obras.map(o=>o.fin);
  const lastFin=new Date(Math.max(...allFins));
  const nM=monthsBetween(TODAY,lastFin)+2;
  const desSel=document.getElementById('rangeDesde');
  const hasSel=document.getElementById('rangeHasta');
  const prevDes=desSel.value,prevHas=hasSel.value;
  desSel.innerHTML='';hasSel.innerHTML='';
  for(let i=0;i<nM;i++){
    const d=addMonths(TODAY,i);
    const lbl=fmtMes(d);
    const od=document.createElement('option');od.value=i;od.textContent=lbl;desSel.appendChild(od);
    const oh=document.createElement('option');oh.value=i;oh.textContent=lbl;hasSel.appendChild(oh);
  }
  desSel.value=prevDes&&prevDes<nM?prevDes:0;
  hasSel.value=prevHas&&prevHas<nM?prevHas:nM-1;
  if(parseInt(hasSel.value)<parseInt(desSel.value))hasSel.value=nM-1;
}

function renderCosto(){
  const obras=getObras();
  buildRangeSelectors(obras);
  if(obras.length===0){
    document.getElementById('costoInner').innerHTML='<div class="empty-state"><div class="empty-title">Sin costos para los filtros actuales</div><div class="empty-copy">No hay obras ni subcontratos que coincidan con la selección.</div></div>';
    return;
  }
  const fromM=parseInt(document.getElementById('rangeDesde').value)||0;
  const toM=parseInt(document.getElementById('rangeHasta').value)||99;

  const rows=obras.map(o=>{
    const costoP=getProjectedCost(o);
    return {...o,meses:mesesRest(o.fin),costoP};
  })
    .sort((a,b)=>b.costoP-a.costoP);
  const maxCP=Math.max(...rows.map(r=>r.costoP),1);
  const totProy=rows.reduce((s,r)=>s+r.costoP,0);
  const totMens=rows.reduce((s,r)=>s+r.totalCosto,0);

  // Evolution
  const allFins=obras.map(o=>o.fin);
  const lastFin=new Date(Math.max(...allFins));
  const nEvol=monthsBetween(TODAY,lastFin)+2;
  const evolRows=[];
  let prev=null;
  for(let i=0;i<nEvol;i++){
    const md=addMonths(TODAY,i);
    const activas=obras.filter(o=>o.fin>=md);
    const costoMes=activas.reduce((s,o)=>s+o.totalCosto,0);
    const terminan=obras.filter(o=>o.fin.getFullYear()===md.getFullYear()&&o.fin.getMonth()===md.getMonth());
    const delta=prev!==null?costoMes-prev:0;
    evolRows.push({i,mes:md,activas:activas.length,costoMes,delta,terminan});
    prev=costoMes;
  }
  const filteredEvol=evolRows.filter(r=>r.i>=fromM&&r.i<=toM);
  const maxEvolC=Math.max(...filteredEvol.map(r=>r.costoMes),1);

  document.getElementById('costoInner').innerHTML=`
    <div>
      <div class="section-label">Detalle por Obra — Costo Proyectado desde Hoy</div>
      <table class="costo-table">
        <thead><tr><th>Obra</th><th>Sup.</th><th>Estado</th><th class="num">Dot.</th><th class="num">Costo Mens.</th><th class="num">Meses Rest.</th><th class="num">Fin</th><th class="num">Costo Proyectado</th><th>Dist.</th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td class="obra-td">${r.obra}</td><td>${r.supervisor}</td>
          <td><span class="obra-estado estado-${slugEstado(r.estado)}" style="display:inline-block">${r.estado}</span></td>
          <td class="num">${r.totalCant}</td><td class="num">${fmtCLP(r.totalCosto)}</td>
          <td class="num">${r.meses.toFixed(1)}</td><td class="num">${fmtDate(r.fin)}</td>
          <td class="num" style="color:var(--rojo)">${fmtCLP(r.costoP)}</td>
          <td><span class="bar-mini" style="width:${Math.round((r.costoP/maxCP)*80)}px"></span></td>
        </tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="4" class="obra-td">TOTAL</td><td class="num">${fmtCLP(totMens)}</td><td class="num">—</td><td class="num">—</td><td class="num" style="color:var(--rojo)">${fmtCLP(totProy)}</td><td></td></tr></tfoot>
      </table>
    </div>
    <div>
      <div class="section-label">Dotación y Costo Mensual por Proyecto</div>
      <div style="overflow-x:auto;">
      <table class="evol-table" style="min-width:600px;">
        <thead>
          <tr>
            <th style="min-width:140px;">Proyecto</th>
            <th class="num" style="min-width:60px;">Sup.</th>
            ${filteredEvol.map(r=>`<th class="num" style="min-width:80px;white-space:nowrap;${r.i===0?'color:var(--rojo);':''}">${fmtMes(r.mes)}${r.i===0?' ★':''}</th>`).join('')}
            <th class="num">Total Proy.</th>
          </tr>
        </thead>
        <tbody>${(()=>{
          // Build per-month obra snapshots (respects 'desde' field)
          const obrasPerMonth=filteredEvol.map(r=>getObras(r.mes));
          const allObras=getObras().sort((a,b)=>a.fin-b.fin);
          let colTotalDot=new Array(filteredEvol.length).fill(0);
          let colTotalCosto=new Array(filteredEvol.length).fill(0);
          const obraRows=allObras.map(o=>{
            const costoP=getProjectedCost(o);
            const cells=filteredEvol.map((r,ci)=>{
              const snap=obrasPerMonth[ci].find(x=>x.obra===o.obra);
              const active=o.fin>=r.mes;
              const dot=snap?snap.totalCant:0;
              const costo=snap?snap.totalCosto:0;
              if(active&&dot>0){colTotalDot[ci]+=dot;colTotalCosto[ci]+=costo;}
              const isFin=active&&o.fin.getFullYear()===r.mes.getFullYear()&&o.fin.getMonth()===r.mes.getMonth();
              const bg=isFin?'background:#F2F6F8;':(!active?'background:var(--faint);opacity:0.4;':'');
              return active
                ?`<td class="num" style="${bg}"><div style="font-size:11px;font-weight:700;color:var(--grafito);">${dot}p</div><div style="font-size:8px;color:var(--bark);">${fmtCLP(costo)}</div>${isFin?'<div style="font-size:7px;color:var(--rojo);font-weight:700;">FIN</div>':''}</td>`
                :`<td class="num" style="${bg}"><div style="font-size:9px;color:var(--sand);">—</div></td>`;
            }).join('');
            return`<tr>
              <td class="obra-td" style="white-space:nowrap;">${o.obra}<br><span class="obra-estado estado-${slugEstado(o.estado)}" style="display:inline-block;margin-top:2px;">${o.estado}</span></td>
              <td style="font-size:9px;color:var(--bark);">${o.supervisor}</td>
              ${cells}
              <td class="num" style="color:var(--rojo);font-weight:700;">${fmtCLP(costoP)}</td>
            </tr>`;
          }).join('');
          // Totals footer rows
          const dotRow='<tr style="background:var(--faint);border-top:2px solid var(--grafito);"><td class="obra-td" colspan="2">DOTACIÓN TOTAL</td>'+filteredEvol.map((_,ci)=>`<td class="num" style="font-weight:700;font-size:12px;">${colTotalDot[ci]}p</td>`).join('')+'<td></td></tr>';
          const costoRow='<tr style="background:var(--cream);"><td class="obra-td" colspan="2">COSTO TOTAL MES</td>'+filteredEvol.map((_,ci)=>`<td class="num" style="color:var(--rojo);font-weight:700;">${fmtCLP(colTotalCosto[ci])}</td>`).join('')+'<td></td></tr>';
          return obraRows+dotRow+costoRow;
        })()}</tbody>
      </table>
      </div>
      <div style="font-size:8px;color:var(--bark);margin-top:6px;">★ Mes actual · Celdas marcadas = mes de término del proyecto · — = proyecto finalizado</div>
    </div>`;
}

// ── EVALUACIÓN ────────────────────────────────────────────────────────────
function renderEval(){
  const obras=getObras();
  const evalObras=obras.filter(o=>o.personas.length>0);
  if(evalObras.length===0){
    document.getElementById('evalResumenBar').innerHTML='<div class="empty-state compact"><div class="empty-title">Sin personal evaluado</div><div class="empty-copy">No hay registros que coincidan con los filtros.</div></div>';
    document.getElementById('evalCardsGrid').innerHTML='';
    return;
  }
  const maxP=Math.max(...evalObras.map(o=>o.personas.length),1);

  // Global counts
  const gc={M:0,R:0,B:0,MB:0};
  const obrasPorEval={M:[],R:[],B:[],MB:[]};
  getFiltered().forEach(p=>{
    if(gc[p.eval]!==undefined){
      gc[p.eval]++;
      if(!obrasPorEval[p.eval].includes(p.obra))obrasPorEval[p.eval].push(p.obra);
    }
  });
  const totalEval=Object.values(gc).reduce((s,v)=>s+v,0);

  // Sticky resumen bar
  const countsHtml=['M','R','B','MB'].map(k=>`
    <div class="eval-count-badge">
      <div>
        <div class="eval-count-badge-val">${gc[k]}</div>
        <div style="font-size:7px;color:var(--bark);margin-top:1px;">${totalEval?((gc[k]/totalEval*100).toFixed(0)):'0'}%</div>
      </div>
      <div class="eval-count-badge-lbl" style="background:${EVAL_COLORS[k]}">${k}</div>
    </div>`).join('');

  // Chips per eval category
  const chipsHtml=['M','R','B','MB'].map(k=>{
    if(obrasPorEval[k].length===0)return'';
    return`<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:4px;">
      <span style="font-size:8px;font-weight:700;color:${EVAL_COLORS[k]};width:18px;">${k}</span>
      ${obrasPorEval[k].map(o=>`<span class="eval-chip" onclick="scrollToCard('${o.replace(/'/g,"\\'")}',this)">${o}</span>`).join('')}
    </div>`;
  }).join('');

  document.getElementById('evalResumenBar').innerHTML=`
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:8px;">
      <span style="font-size:8px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--bark);">Resumen Global — ${totalEval} personas</span>
      <div class="eval-resumen-counts">${countsHtml}</div>
    </div>
    <div>${chipsHtml}</div>`;

  // Cards — equal height via minHeight
  const CARD_ROW_H=32; // px per person row
  const CARD_FIXED_H=52+maxP*CARD_ROW_H+34; // header+rows+footer

  const cardsHtml=evalObras.map(o=>{
    const activePers=o.personas.filter(p=>!p.desde||(TODAY>=p.desde));
    const sorted=[...activePers].sort((a,b)=>EVAL_ORDER[a.eval]-EVAL_ORDER[b.eval]);
    const ec={MB:0,B:0,R:0,M:0};
    activePers.forEach(p=>{if(ec[p.eval]!==undefined)ec[p.eval]++;});
    const emptyN=maxP-sorted.length; // sorted is from activePers
    const rows=sorted.map(p=>`
      <div class="eval-row">
        <div class="eval-badge-tag" style="background:${EVAL_COLORS[p.eval]}">${p.eval}</div>
        <div><div class="eval-person-name">${p.nombre}</div><div class="eval-cargo">${p.cargo}</div></div>
      </div>`).join('')+
      Array(emptyN).fill(`<div class="eval-row empty"><div class="eval-badge-tag"></div><div><div class="eval-person-name">—</div></div></div>`).join('');
    const stats=Object.entries(ec).filter(([,v])=>v>0).map(([k,v])=>`
      <div class="eval-stat">
        <div class="eval-stat-val" style="color:${EVAL_COLORS[k]}">${v}</div>
        <div class="eval-stat-lbl" style="color:${EVAL_COLORS[k]}">${k}</div>
      </div>`).join('');
    const obraId='card_'+o.obra.replace(/[^a-zA-Z0-9]/g,'_');
    return`<div class="eval-card" id="${obraId}" style="min-height:${CARD_FIXED_H}px;">
      <div class="eval-card-header">
        <div class="eval-obra-name">${o.obra}</div>
        <div class="eval-sup">Sup. ${o.supervisor} · ${o.totalCant} pers.</div>
      </div>
      <div class="eval-list">${rows}</div>
      <div class="eval-card-footer">${stats}</div>
    </div>`;
  }).join('');

  document.getElementById('evalCardsGrid').innerHTML=cardsHtml;
}

function scrollToCard(obraName,chipEl){
  // Remove previous highlights
  document.querySelectorAll('.eval-card.highlighted').forEach(c=>c.classList.remove('highlighted'));
  document.querySelectorAll('.eval-chip.highlight').forEach(c=>c.classList.remove('highlight'));
  const id='card_'+obraName.replace(/[^a-zA-Z0-9]/g,'_');
  const card=document.getElementById(id);
  if(!card)return;
  card.classList.add('highlighted');
  chipEl.classList.add('highlight');
  card.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>{card.classList.remove('highlighted');chipEl.classList.remove('highlight');},2500);
}

// ── INIT ──────────────────────────────────────────────────────────────────
function dateFromApi(value){
  if(!value)return value;
  if(value instanceof Date)return value;
  if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}/.test(value))return parseLocalDate(value.slice(0,10));
  return value;
}

function replaceMap(target,source){
  Object.keys(target).forEach(k=>delete target[k]);
  Object.entries(source||{}).forEach(([key,value])=>{
    target[key]={...value,fin:dateFromApi(value.fin)};
  });
}

function hydrateArray(target,rows){
  target.splice(0,target.length,...(rows||[]).map(row=>{
    const item={...row};
    if(item.fin)item.fin=dateFromApi(item.fin);
    if(item.desde)item.desde=dateFromApi(item.desde);
    return item;
  }));
}

async function hydrateTimelineDataFromApi(){
  if(window.location.protocol==='file:'){
    const mode=document.getElementById('adminMode');
    if(mode)mode.textContent='HTML estatico con data local';
    return;
  }
  try{
    const res=await fetch('/api/timeline-data',{cache:'no-store'});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'No se pudieron cargar los datos.');
    if(data.config?.cutoffDate){
      TIMELINE_CONFIG={...TIMELINE_CONFIG,...data.config};
      TODAY=parseLocalDate(TIMELINE_CONFIG.cutoffDate);
      window.TIMELINE_CONFIG=TIMELINE_CONFIG;
    }
    replaceMap(ESTADOS_MAP,data.estados);
    hydrateArray(PERSONAL,data.personal);
    hydrateArray(SUBCONTRATOS,data.subcontratos);
    if(data.evalColors)Object.assign(EVAL_COLORS,data.evalColors);
    if(data.evalOrder)Object.assign(EVAL_ORDER,data.evalOrder);
    const mode=document.getElementById('adminMode');
    if(mode)mode.textContent=data.source==='supabase'?'Supabase conectado':'Modo demo con data local';
    if(data.warning)setAdminStatus(data.warning,false);
  }catch(err){
    setAdminStatus(err.message||'No se pudo conectar con la API.',true);
  }
}

function setAdminStatus(message,isError=false){
  const el=document.getElementById('adminAuthStatus');
  if(!el)return;
  el.textContent=message;
  el.className='admin-status'+(isError?' error':'');
}

function getAdminToken(){
  return localStorage.getItem('formatto_admin_token')||'';
}

async function adminFetch(url,options={}){
  const headers={...(options.headers||{}),'Content-Type':'application/json'};
  const token=getAdminToken();
  if(token)headers.Authorization=`Bearer ${token}`;
  const res=await fetch(url,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||'Operacion rechazada.');
  return data;
}

async function reloadAfterWrite(message){
  await hydrateTimelineDataFromApi();
  resetDropdowns();
  refreshAll();
  setAdminStatus(message,false);
}

function val(id){return document.getElementById(id)?.value?.trim()||'';}

function bindAdmin(){
  document.getElementById('adminOpenBtn')?.addEventListener('click',()=>document.getElementById('adminPanel')?.classList.add('open'));
  document.getElementById('adminCloseBtn')?.addEventListener('click',()=>document.getElementById('adminPanel')?.classList.remove('open'));
  document.getElementById('adminLoginBtn')?.addEventListener('click',async()=>{
    try{
      const res=await fetch('/api/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:val('adminEmail'),password:val('adminPassword')})
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'No se pudo iniciar sesion.');
      localStorage.setItem('formatto_admin_token',data.accessToken||'');
      setAdminStatus(`Sesion activa: ${data.user?.email||'admin'}`,false);
    }catch(err){setAdminStatus(err.message,true);}
  });
  document.getElementById('adminLogoutBtn')?.addEventListener('click',()=>{
    localStorage.removeItem('formatto_admin_token');
    setAdminStatus('Sesion cerrada.',false);
  });
  document.getElementById('saveObraBtn')?.addEventListener('click',async()=>{
    try{
      await adminFetch('/api/admin/obras',{method:'POST',body:JSON.stringify({
        nombre:val('obraNombre'),supervisor:val('obraSupervisor'),estado:val('obraEstado'),fin:val('obraFin')
      })});
      await reloadAfterWrite('Obra guardada.');
    }catch(err){setAdminStatus(err.message,true);}
  });
  document.getElementById('deleteObraBtn')?.addEventListener('click',async()=>{
    try{
      const nombre=val('obraNombre');
      if(!nombre)throw new Error('Indica la obra a eliminar.');
      await adminFetch(`/api/admin/obras?nombre=${encodeURIComponent(nombre)}`,{method:'DELETE'});
      await reloadAfterWrite('Obra eliminada.');
    }catch(err){setAdminStatus(err.message,true);}
  });
  document.getElementById('savePersonaBtn')?.addEventListener('click',async()=>{
    try{
      await adminFetch('/api/admin/personal',{method:'POST',body:JSON.stringify({
        obra:val('personaObra'),nombre:val('personaNombre'),cargo:val('personaCargo'),
        supervisor:val('personaSupervisor'),cant:val('personaCant'),costo:val('personaCosto'),
        eval:val('personaEval'),fin:val('personaFin'),desde:val('personaDesde')
      })});
      await reloadAfterWrite('Personal agregado.');
    }catch(err){setAdminStatus(err.message,true);}
  });
  document.getElementById('saveSubBtn')?.addEventListener('click',async()=>{
    try{
      await adminFetch('/api/admin/subcontratos',{method:'POST',body:JSON.stringify({
        obra:val('subObra'),nombre:val('subNombre'),cant:val('subCant'),fin:val('subFin')
      })});
      await reloadAfterWrite('Subcontrato guardado.');
    }catch(err){setAdminStatus(err.message,true);}
  });
  document.getElementById('previewExcelBtn')?.addEventListener('click',async()=>{
    const file=document.getElementById('excelFile')?.files?.[0];
    if(!file){setAdminStatus('Selecciona un archivo Excel.',true);return;}
    const form=new FormData();form.append('file',file);
    try{
      const res=await fetch('/api/admin/excel-preview',{method:'POST',body:form});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'No se pudo leer el Excel.');
      document.getElementById('excelPreview').textContent=JSON.stringify(data,null,2);
      setAdminStatus('Vista previa Excel lista.',false);
    }catch(err){setAdminStatus(err.message,true);}
  });
}

function bindTimelineControls(){
  document.querySelectorAll('.tab[data-tab]').forEach(tab=>{
    tab.addEventListener('click',()=>switchTab(tab.dataset.tab,tab));
  });
  document.getElementById('msBtnObra')?.addEventListener('click',()=>toggleDD('Obra'));
  document.getElementById('msBtnSup')?.addEventListener('click',()=>toggleDD('Sup'));
  document.getElementById('msBtnEst')?.addEventListener('click',()=>toggleDD('Est'));
  document.getElementById('btnLayerDot')?.addEventListener('click',()=>toggleLayer('dot'));
  document.getElementById('btnLayerCos')?.addEventListener('click',()=>toggleLayer('cos'));
  document.getElementById('btnLayerSub')?.addEventListener('click',()=>toggleLayer('sub'));
  document.getElementById('rangeDesde')?.addEventListener('change',renderCosto);
  document.getElementById('rangeHasta')?.addEventListener('change',renderCosto);
  document.getElementById('modalOverlay')?.addEventListener('click',closeModal);
  document.getElementById('modalCloseBtn')?.addEventListener('click',closeModalDirect);
}

async function initTimelineApp(){
  bindTimelineControls();
  bindAdmin();
  await hydrateTimelineDataFromApi();
  buildDropdowns();
  renderSubcontratos();
  renderKPIs();
  renderTimeline();
}

initTimelineApp();

// no resize needed for grid layout
