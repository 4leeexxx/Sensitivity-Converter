'use strict';

// yaw = degrees per count (1 count = 1 DPI unit of movement)
const GAMES = [
  { name:'Valorant',              yaw:0.07,    icon:'🎯' },
  { name:'CS2 / Counter-Strike',  yaw:0.022,   icon:'💥' },
  { name:'Fortnite',              yaw:0.05588,  icon:'🏗️' },
  { name:'Apex Legends',          yaw:0.022,   icon:'🦊' },
  { name:'Overwatch 2',           yaw:0.0066,  icon:'🌍' },
  { name:'Rainbow Six Siege',     yaw:0.00572, icon:'🛡️' },
  { name:'Warzone / MW',          yaw:0.00666, icon:'☠️' },
  { name:'Rust',                  yaw:0.1,     icon:'🔨' },
  { name:'Escape from Tarkov',    yaw:0.05756, icon:'🎒' },
  { name:'Battlefield 2042',      yaw:0.00572, icon:'💣' },
  { name:'Halo Infinite',         yaw:0.01745, icon:'👾' },
  { name:'Destiny 2',             yaw:0.02222, icon:'🚀' },
  { name:'PUBG',                  yaw:0.00572, icon:'🐔' },
  { name:'Quake',                 yaw:0.022,   icon:'⚡' },
];

const RateLimit = (() => {
  const MAX=10,WIN=10000,ts=[];
  return { allow(){ const n=Date.now(); while(ts.length&&n-ts[0]>WIN)ts.shift(); if(ts.length>=MAX)return false; ts.push(n);return true; } };
})();

function safeText(id,v){ const e=document.getElementById(id); if(e)e.textContent=String(v); }
function getEl(id){ return document.getElementById(id); }

function sanitizeNum(raw, min, max) {
  const n = parseFloat(String(raw).replace(/[^0-9.\-]/g,''));
  if (!isFinite(n) || n < min || n > max) return NaN;
  return n;
}

function populateSelects() {
  const from = getEl('fromGame'), to = getEl('toGame');
  GAMES.forEach((g,i) => {
    const o1 = document.createElement('option'); o1.value=i; o1.textContent=g.icon+' '+g.name; from.appendChild(o1);
    const o2 = document.createElement('option'); o2.value=i; o2.textContent=g.icon+' '+g.name; to.appendChild(o2);
  });
  to.value = '1'; // default: from Valorant to CS2
}

function convertSens() {
  if (!RateLimit.allow()) return showError('Slow down! Try again in a moment. 😊');

  const fromIdx = parseInt(getEl('fromGame').value);
  const toIdx   = parseInt(getEl('toGame').value);
  const sens    = sanitizeNum(getEl('fromSens').value, 0.001, 9999);
  const dpi     = sanitizeNum(getEl('mouseDPI').value, 100, 25600);

  if (isNaN(sens)) return showError('Please enter a valid sensitivity value. 🎯');
  if (isNaN(dpi))  return showError('Please enter a valid DPI (100–25600). ⚙️');
  if (fromIdx < 0 || fromIdx >= GAMES.length || toIdx < 0 || toIdx >= GAMES.length)
    return showError('Please select valid games. 🎮');

  const fromGame = GAMES[fromIdx], toGame = GAMES[toIdx];

  // Unified sens = sens * dpi * yaw  (counts per 360°)
  // counts360 = 360 / (sens * yaw)
  // Then: toSens = 360 / (counts360 * toYaw)
  const counts360  = 360 / (sens * fromGame.yaw);
  const toSens     = 360 / (counts360 * toGame.yaw);
  const edpi       = sens * dpi;
  const toEdpi     = toSens * dpi;
  const cm360      = (counts360 / dpi) * 2.54;  // inches * 2.54
  const in360      = counts360 / dpi;

  safeText('val-sens',   toSens.toFixed(4));
  safeText('val-edpi',   Math.round(toEdpi));
  safeText('val-cm360',  cm360.toFixed(1) + ' cm');
  safeText('val-in360',  in360.toFixed(2) + '"');

  safeText('verdict-emoji', '🎯');
  safeText('verdict-title', fromGame.name + '  →  ' + toGame.name);
  safeText('verdict-sub',   `Your eDPI is ${Math.round(edpi)} · ${cm360.toFixed(1)} cm per full 360°`);
  const banner = getEl('verdict-banner');
  if (banner) banner.className = 'verdict-banner info';

  // All-games grid
  const grid = getEl('all-games-grid');
  grid.innerHTML = '';
  GAMES.forEach((g,i) => {
    if (i === fromIdx) return;
    const converted = 360 / (counts360 * g.yaw);
    const card = document.createElement('div');
    card.className = 'game-mini-card' + (i===toIdx ? ' highlight-game' : '');
    const nameEl = document.createTextNode(g.icon + ' ' + g.name);
    const sensEl = document.createTextNode(converted.toFixed(4));
    const nameDiv = document.createElement('div'); nameDiv.className='game-name'; nameDiv.appendChild(nameEl);
    const sensDiv = document.createElement('div'); sensDiv.className='game-sens'; sensDiv.appendChild(sensEl);
    card.appendChild(nameDiv); card.appendChild(sensDiv);
    grid.appendChild(card);
  });

  showResults();
}

function showError(msg) {
  safeText('verdict-emoji','⚠️');safeText('verdict-title','Oops!');safeText('verdict-sub',msg);
  const b=getEl('verdict-banner');if(b)b.className='verdict-banner loss';
  safeText('val-sens','—');safeText('val-edpi','—');safeText('val-cm360','—');safeText('val-in360','—');
  showResults();
  const card=document.querySelector('.calc-card');if(card){card.style.animation='none';void card.offsetWidth;card.style.animation='shake .4s ease';}
}

function showResults() {
  const p=getEl('results');if(p){p.style.display='block';p.style.animation='none';void p.offsetWidth;p.style.animation='pop-in .45s cubic-bezier(.22,1,.36,1)';}
  const r=getEl('resetBtn');if(r)r.style.display='block';
  if(p) p.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function resetSens() {
  getEl('fromSens').value='';getEl('mouseDPI').value='';
  const p=getEl('results');if(p)p.style.display='none';
  const r=getEl('resetBtn');if(r)r.style.display='none';
  getEl('fromGame').value='0';getEl('toGame').value='1';
}

const st=document.createElement('style');
st.textContent=`
.all-games-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:10px;}
.game-mini-card{background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;transition:transform .2s;}
.game-mini-card:hover{transform:translateY(-2px);}
.game-mini-card.highlight-game{background:var(--gold-light);border-color:var(--gold);}
.game-name{font-size:12px;font-weight:800;color:var(--text-mid);margin-bottom:4px;}
.game-sens{font-size:16px;font-weight:900;color:var(--text);}
@keyframes shake{0%{transform:translateX(0)}18%{transform:translateX(-7px)}36%{transform:translateX(7px)}54%{transform:translateX(-4px)}72%{transform:translateX(4px)}100%{transform:translateX(0)}}
@keyframes pop-in{from{opacity:0;transform:scale(.96)translateY(10px)}to{opacity:1;transform:scale(1)translateY(0)}}
`;
document.head.appendChild(st);

document.addEventListener('DOMContentLoaded',()=>{
  populateSelects();
  const p=getEl('results');if(p)p.style.display='none';
  const r=getEl('resetBtn');if(r)r.style.display='none';
});
