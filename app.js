/* Windows 11 web simulation */
const APPS = [
  { id:'explorer', name:'Проводник', icon:'📁' },
  { id:'notepad', name:'Блокнот', icon:'📝' },
  { id:'calc', name:'Калькулятор', icon:'🧮' },
  { id:'settings', name:'Параметры', icon:'⚙️' },
  { id:'browser', name:'Браузер', icon:'🌐' }
];

const state = { open: [], z: 10, startOpen: false };
const layer = document.getElementById('windows-layer');
const startMenu = document.getElementById('start-menu');
const tbCenter = document.getElementById('tb-center');

function el(tag, cls, html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!==undefined)e.innerHTML=html; return e; }

function renderDesktopIcons(){
  const box = document.getElementById('icons');
  box.innerHTML='';
  APPS.forEach(a=>{
    const icon = el('div','desk-icon',`<div class="di-glyph">${a.icon}</div><div class="di-label">${a.name}</div>`);
    icon.ondblclick = ()=> openApp(a.id);
    box.appendChild(icon);
  });
}

function renderTaskbar(){
  tbCenter.innerHTML='';
  const start = el('button','tb-btn start','⊞');
  start.title='Пуск';
  start.onclick=(e)=>{ e.stopPropagation(); toggleStart(); };
  tbCenter.appendChild(start);
  APPS.forEach(a=>{
    const b = el('button','tb-btn','<span>'+a.icon+'</span>');
    b.title=a.name;
    b.onclick=()=> openApp(a.id);
    tbCenter.appendChild(b);
  });
}

function toggleStart(force){
  state.startOpen = force!==undefined ? force : !state.startOpen;
  startMenu.classList.toggle('hidden', !state.startOpen);
}

function renderStartPinned(){
  const p = document.getElementById('sm-pinned');
  p.innerHTML='';
  APPS.forEach(a=>{
    const t = el('div','sm-tile',`<div class="st-glyph">${a.icon}</div><div>${a.name}</div>`);
    t.onclick=()=>{ openApp(a.id); toggleStart(false); };
    p.appendChild(t);
  });
}

function createWindow(appId){
  const app = APPS.find(a=>a.id===appId) || {name:appId, icon:'▢'};
  const win = el('div','win');
  const offset = state.open.length*28;
  win.style.left = (120+offset)+'px';
  win.style.top = (80+offset)+'px';
  win.style.width='640px'; win.style.height='420px';
  win.style.zIndex = ++state.z;

  const bar = el('div','win-bar');
  const title = el('div','win-title', app.icon+' '+app.name);
  const btns = el('div','win-btns');
  const min = el('button','wb min','—');
  const max = el('button','wb max','□');
  const close = el('button','wb close','✕');
  btns.append(min,max,close);
  bar.append(title,btns);

  const body = el('div','win-body');
  body.innerHTML = appBody(appId);

  win.append(bar,body);
  layer.appendChild(win);

  win.addEventListener('mousedown',()=>{ win.style.zIndex = ++state.z; });
  close.onclick=()=>{ win.remove(); state.open=state.open.filter(w=>w!==win); };
  min.onclick=()=>{ win.style.display='none'; };
  max.onclick=()=>{
    if(win.dataset.max){ win.style.left=win.dataset.x; win.style.top=win.dataset.y; win.style.width=win.dataset.w; win.style.height=win.dataset.h; delete win.dataset.max; }
    else { win.dataset.x=win.style.left; win.dataset.y=win.style.top; win.dataset.w=win.style.width; win.dataset.h=win.style.height; win.dataset.max='1'; win.style.left='0px'; win.style.top='0px'; win.style.width='100%'; win.style.height='calc(100% - 48px)'; }
  };

  makeDraggable(win, bar);
  state.open.push(win);
  return win;
}

function makeDraggable(win, handle){
  let sx=0, sy=0, ox=0, oy=0, dragging=false;
  handle.addEventListener('mousedown', e=>{
    if(e.target.closest('.wb')) return;
    dragging=true; sx=e.clientX; sy=e.clientY;
    ox=parseInt(win.style.left)||0; oy=parseInt(win.style.top)||0;
    win.style.zIndex=++state.z;
    e.preventDefault();
  });
  window.addEventListener('mousemove', e=>{
    if(!dragging) return;
    win.style.left=(ox+e.clientX-sx)+'px';
    win.style.top=Math.max(0, oy+e.clientY-sy)+'px';
  });
  window.addEventListener('mouseup', ()=>{ dragging=false; });
}

function appBody(id){
  if(id==='notepad') return '<textarea class="np-area" placeholder="Введите текст…"></textarea>';
  if(id==='calc') return `<div class="calc"><div class="calc-screen">0</div><div class="calc-keys">${['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','=',''].map(k=>`<button data-k="${k}">${k}</button>`).join('')}</div></div>`;
  if(id==='explorer') return '<div class="exp"><div class="exp-side">Быстрый доступ<br>• Рабочий стол<br>• Документы<br>• Изображения</div><div class="exp-main">Папка пуста</div></div>';
  if(id==='settings') return '<div style="padding:16px"><h3>Параметры</h3><p>Система · Персонализация · Сеть</p></div>';
  if(id==='browser') return '<div style="padding:16px"><input placeholder="Введите адрес…" style="width:100%;padding:8px"><p style="color:#666">Встроенный браузер (демо)</p></div>';
  return '<div style="padding:16px">Приложение</div>';
}

function openApp(id){
  if(id==='settings' && state.startOpen) toggleStart(false);
  const w = createWindow(id);
  if(id==='calc') bindCalc(w);
  toggleStart(false);
}

function bindCalc(win){
  const screen = win.querySelector('.calc-screen');
  let expr='';
  win.querySelectorAll('.calc-keys button').forEach(b=>{
    b.onclick=()=>{
      const k=b.dataset.k;
      if(k==='C'){ expr=''; screen.textContent='0'; return; }
      if(k==='='){
        try{ const v = Function('return '+expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'))(); screen.textContent = String(v); expr=String(v); }
        catch(e){ screen.textContent='Ошибка'; expr=''; }
        return;
      }
      if(k==='±'){ expr = expr.startsWith('-')?expr.slice(1):'-'+expr; screen.textContent=expr||'0'; return; }
      if(k==='%'){ expr += '/100'; screen.textContent=expr; return; }
      expr += k; screen.textContent=expr;
    };
  });
}

function clock(){
  const now = new Date();
  const t = now.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  const d = now.toLocaleDateString('ru-RU');
  document.getElementById('tray-clock').innerHTML = t+'<br><small>'+d+'</small>';
}

document.addEventListener('click', e=>{
  if(!e.target.closest('#start-menu') && !e.target.closest('.start')) toggleStart(false);
});

renderDesktopIcons();
renderTaskbar();
renderStartPinned();
clock();
setInterval(clock, 10000);
openApp('explorer');
