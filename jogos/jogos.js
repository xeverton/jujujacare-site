/* Jogos do Juju Jacaré — lógica dos 10 jogos (níveis infinitos, objetos variados) */
/* Figuras 3D: Noto Emoji (Google), licença Apache 2.0 — obj/LICENSE-noto-emoji.txt */

/* ---------- catálogo, níveis e utilidades ---------- */
var CAT = [], CAT_OK = false, PZL = [];
var CATP = fetch('obj/catalogo.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { CAT = d; CAT_OK = true; }).catch(function () {});
fetch('pzl/lista.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { PZL = d; }).catch(function () {});
function catReady(fn) { if (CAT_OK) fn(); else CATP.then(fn); }
function qk(o) { return 'qc_' + o.f.split('/').pop(); }
function oimg(o, grey) { return 'obj/' + o.f + (grey ? '_cinza' : '') + '.webp'; }
function pick(a, n) { return shuffle(a.slice()).slice(0, n); }
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
function preload(src) { var i = new Image(); i.src = src; }
var LV = {}; try { LV = JSON.parse(localStorage.getItem('jj_lv') || '{}'); } catch (e) {}
function lv(g) { return LV[g] || 1; }
function setLv(g, v) { LV[g] = v; try { localStorage.setItem('jj_lv', JSON.stringify(LV)); } catch (e) {} lvShow(); }
function lvShow() { document.querySelectorAll('[data-lv]').forEach(function (e) { e.textContent = '⭐ Nível ' + lv(e.dataset.lv); }); }
function levelWin(g, title, msg, img, start) {
  var L = lv(g); setLv(g, L + 1);
  setTimeout(function () { rkWinNote(g); }, 50);
  showWin(title, 'Nível ' + L + ' completo! ' + msg, img, function () { start(); setTimeout(function () { falar('lv_up', true); }, 250); }, 'Próximo nível ▶');
}
function shake(b) { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); }
var CORX = {
  vermelho: ['VERMELHO', '#ff3b4a', 'c_maca'], amarelo: ['AMARELO', '#ffd23f', 'c_sol'], azul: ['AZUL', '#3fa9f5', 'c_ceu'],
  verde: ['VERDE', '#4cd964', 'c_juju'], laranja: ['LARANJA', '#ff8c1a', 'c_laranja'], roxo: ['ROXO', '#9b5de5', 'c_uva'],
  branco: ['BRANCO', '#ffffff', 'c_nuvem'], preto: ['PRETO', '#2b2b33', 'c_carvao'], rosa: ['ROSA', '#ff6fb5', 'c_flor'], marrom: ['MARROM', '#8b5a2b', 'c_marrom']
};


/* ---------- encaixe automático das opções na tela (qualquer aparelho/orientação) ---------- */
var DOCK_B = 0;
function VH() { return innerHeight - DOCK_B; }
function mainW() { var m = document.querySelector('main'), cs = getComputedStyle(m); return m.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); }
function overflowPx() { if (DOCK_B) { var m = document.querySelector('main'); return m.getBoundingClientRect().bottom + (scrollY || 0) - VH(); } return document.documentElement.scrollHeight - innerHeight; }
function fitBox(box, opt) {
  if (!box || !box.children.length || !box.offsetParent) return;
  opt = opt || {}; var n = box.children.length, gap = opt.gap || (innerWidth < 500 ? 10 : 16), extraH = opt.extraH || 0;
  box.style.width = '100%'; box.style.maxWidth = 'none';
  var W = box.clientWidth, H = VH() - box.getBoundingClientRect().top - (opt.below || 70), best = null;
  var big = Math.max(1, Math.min(innerWidth, innerHeight) / 560), cap = (opt.max || 190) * big;
  for (var cols = 1; cols <= n; cols++) {   /* maior tamanho possível; empate -> menos linhas */
    var rows = Math.ceil(n / cols), s = Math.min(cap, (W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows - extraH);
    if (!best || s > best[1] + 2 || (Math.abs(s - best[1]) <= 2 && rows < best[2])) best = [cols, s, rows];
  }
  var mn = opt.min || 52;
  if (best[1] < mn) { var c2 = Math.min(n, Math.max(1, Math.floor((W + gap) / (mn + gap)))); best = [c2, mn, Math.ceil(n / c2)]; }
  var cols_ = best[0], rows_ = best[2], s = Math.max(mn, best[1]);
  box.style.display = 'flex'; box.style.flexWrap = 'wrap'; box.style.justifyContent = 'center'; box.style.gap = (gap + extraH) + 'px ' + gap + 'px';
  box.style.marginLeft = 'auto'; box.style.marginRight = 'auto';
  function apply() {
    box.style.maxWidth = (cols_ * s + gap * (cols_ - 1) + 2) + 'px';
    [].forEach.call(box.children, function (c) { c.style.width = s + 'px'; c.style.height = s + 'px'; c.style.flex = 'none'; if (opt.pad) c.style.padding = Math.round(s * opt.pad) + 'px'; });
  }
  apply();
  for (var k = 0, ov = overflowPx(); ov > 1 && s > (opt.min || 52) && k < 15; k++, ov = overflowPx()) { s = Math.max(opt.min || 52, s - Math.max(4, ov / rows_)); apply(); }
}
function shrinkTo(el, prop, minV) {  /* reduz um elemento até a página caber sem rolar */
  if (!el || !el.getClientRects().length) return; var ov = overflowPx();
  for (var k = 0; ov > 1 && k < 12; k++) { var cur = el.getBoundingClientRect()[prop === 'width' ? 'width' : 'height']; var nv = Math.max(minV, cur - ov - 2); if (nv >= cur) break; if (prop === 'maxh') el.style.maxHeight = nv + 'px'; else el.style[prop] = nv + 'px'; ov = overflowPx(); }
}
function fitNow() {
  requestAnimationFrame(function () {
    var ow = document.getElementById('c-obj'), tg = document.getElementById('s-img'), nb = document.getElementById('n-box');
    if (CUR === 'cores') { var co = { below: 50, max: 130, extraH: 30, min: 46 }; ow.style.width = ''; ow.style.height = ''; fitBox(document.getElementById('c-opts'), co); shrinkTo(ow, 'width', 70); if (ow.style.width) ow.style.height = ow.style.width; fitBox(document.getElementById('c-opts'), co); }
    if (CUR === 'sombras') { var so = { below: 40, max: 170, pad: 0.08 }; tg.style.height = ''; fitBox(document.getElementById('s-opts'), so); shrinkTo(tg, 'height', 50); fitBox(document.getElementById('s-opts'), so); }
    if (CUR === 'formas') fitBox(document.getElementById('f-opts'), { below: 80, max: 200, pad: 0.1 });
    if (CUR === 'contar') { nb.style.minHeight = ''; fitBox(document.getElementById('n-opts'), { below: 40, max: 120, min: 44 }); nb.style.minHeight = '0';
      var its = nb.querySelectorAll('.it'); for (var k = 0; k < 12 && overflowPx() > 1 && its.length; k++) { var w0 = its[0].getBoundingClientRect().width; if (w0 <= 30) break; its.forEach(function (e) { e.style.width = (w0 * 0.88) + 'px'; }); } }
    if (CUR === 'piano') { var k = document.getElementById('keys'), pj = document.getElementById('pj'); pj.style.display = ''; k.style.height = ''; shrinkTo(k, 'height', 120); if (overflowPx() > 1) { pj.style.display = 'none'; shrinkTo(k, 'height', 50); } }
    if (CUR === 'pintar') { var sv = document.getElementById('svg'), pl = document.getElementById('pal'); sv.style.maxHeight = ''; pl.style.width = ''; shrinkTo(sv, 'maxh', 150); if (innerWidth > innerHeight) shrinkTo(pl, 'width', 130); else { pl.style.marginLeft = pl.style.marginRight = 'auto'; shrinkTo(pl, 'width', 220); } shrinkTo(pl, 'width', 170); shrinkTo(sv, 'maxh', 70); }
    if (CUR === 'memoria') memFit();
  });
}
addEventListener('resize', fitNow); addEventListener('orientationchange', function () { setTimeout(fitNow, 300); });

/* ---------- QUE COR É? ---------- */
var cq = [], ci = 0, cLock = false, C_N = 8;
function coresStart() {
  catReady(function () {
    var pool = CAT.filter(function (o) { return o.c; });
    cq = []; var used = {};
    shuffle(pool).forEach(function (o) { if (cq.length < C_N && (used[o.c] || 0) < 2) { cq.push(o); used[o.c] = (used[o.c] || 0) + 1; } });
    ci = 0; coresRound(); lvShow();
    setTimeout(function () { if (CUR === 'cores' && ci === 0) falar(qk(cq[0])); }, (((FALAS.i_cores || [0, 5])[1]) * 1000 + 400));
  });
}
function coresRound() {
  cLock = false; var it = cq[ci], L = lv('cores'), w = document.getElementById('c-obj'); w.classList.remove('done');
  document.getElementById('c-grey').src = oimg(it); document.getElementById('c-col').src = oimg(it);
  if (cq[ci + 1]) preload(oimg(cq[ci + 1]));
  document.getElementById('c-word').innerHTML = '&nbsp;';
  document.getElementById('c-q').textContent = 'Qual é a cor ' + it.a + ' ' + it.q + '? (' + (ci + 1) + '/' + C_N + ')';
  var nOpt = Math.min(2 + L, 6), others = pick(Object.keys(CORX).filter(function (k) { return k !== it.c; }), nOpt - 1);
  var ops = shuffle([it.c].concat(others)), box = document.getElementById('c-opts'); box.innerHTML = ''; box.classList.toggle('many', nOpt > 4);
  ops.forEach(function (k) {
    var b = document.createElement('button'); b.className = 'opt'; b.style.background = CORX[k][1]; b.setAttribute('aria-label', CORX[k][0]);
    b.innerHTML = '<span>' + CORX[k][0] + '</span>';
    b.onclick = function () {
      if (cLock) return;
      if (k !== it.c) { shake(b); sNo(); fNo(); return; }
      cLock = true; sOk(); addStar(); pts('cores', 10 * L); w.classList.add('done'); falar(CORX[k][2]);
      var wd = document.getElementById('c-word'); wd.textContent = CORX[k][0] + '!'; wd.style.color = CORX[k][1]; party(70);
      setTimeout(function () { ci++; if (ci < C_N) { coresRound(); setTimeout(function () { falar(qk(cq[ci])); }, 250); } else levelWin('cores', 'Parabéns!', 'Você conhece as cores! 🌈', oimg(it), coresStart); }, 1700);
    };
    box.appendChild(b);
  });
  fitNow();
}

/* ---------- MEMÓRIA ---------- */
var MEM_N = 3, mOpen = [], mMoves = 0, mPairs = 0, mLock = false;
function memPairs() { return [3, 4, 6, 8, 10][Math.min(lv('memoria') - 1, 4)]; }
function memFit() {
  var bd = document.getElementById('board'); if (!bd) return; var n = MEM_N, hdr = document.querySelector('.top').offsetHeight;
  var availH = VH() - hdr - (VH() < 560 ? 100 : 140), availW = Math.min(mainW() - 8, 1000), gap = innerWidth < 500 ? 8 : 12, best = null;
  for (var cols = 2; cols <= 8; cols++) {
    var rows = Math.ceil(2 * n / cols); if (rows * cols - 2 * n >= cols) continue;
    var w = Math.min((availW - gap * (cols - 1)) / cols, (availH - gap * (rows - 1)) / rows * 0.75);
    if (!best || w > best[1] + 0.5) best = [cols, w];
  }
  var w = Math.max(Math.min(best[1], 190), 42);
  bd.style.gap = gap + 'px'; bd.style.maxWidth = 'none'; bd.style.justifyContent = 'center';
  var rows = Math.ceil(2 * n / best[0]);
  for (var k = 0; k < 15; k++) { bd.style.gridTemplateColumns = 'repeat(' + best[0] + ',' + Math.floor(w) + 'px)'; var ov = overflowPx(); if (ov <= 1 || w <= 42) break; w = Math.max(42, w - Math.max(3, ov / rows * 0.75)); }
}
addEventListener('resize', function () { memFit(); });
function memStart() {
  catReady(function () {
    MEM_N = memPairs(); var items = pick(CAT, MEM_N), deck = shuffle(items.concat(items)), bd = document.getElementById('board');
    bd.innerHTML = ''; mOpen = []; mMoves = 0; mPairs = 0; mLock = false; memFit();
    deck.forEach(function (o) {
      var c = document.createElement('button'); c.className = 'card'; c.dataset.n = o.f; c.setAttribute('aria-label', 'carta');
      c.innerHTML = '<div class="in"><div class="b">?</div><div class="f"><img src="' + oimg(o) + '" alt=""></div></div>';
      c.onclick = function () { memFlip(c); }; bd.appendChild(c);
    });
    memInfo(); lvShow();
  });
}
function memInfo() { document.getElementById('m-info').textContent = 'Pares: ' + mPairs + ' de ' + MEM_N + '   •   Jogadas: ' + mMoves; }
function memFlip(c) {
  if (mLock || c.classList.contains('up') || c.classList.contains('ok')) return; c.classList.add('up'); sPop(); mOpen.push(c);
  if (mOpen.length < 2) return; mMoves++; var a = mOpen[0], b = mOpen[1]; mOpen = [];
  if (a.dataset.n === b.dataset.n) {
    setTimeout(function () {
      a.classList.add('ok'); b.classList.add('ok'); a.classList.remove('up'); b.classList.remove('up'); sOk(); addStar(); pts('memoria', 10 * lv('memoria')); party(40); mPairs++; memInfo();
      if (mPairs < MEM_N) falar(rnd(['m_par', 'ok1', 'ok4']));
      else setTimeout(function () { levelWin('memoria', 'Muito bem!', 'Achou todos os pares em ' + mMoves + ' jogadas! 🎉', a.querySelector('img').src, memStart); }, 700);
    }, 350);
  } else { mLock = true; memInfo(); setTimeout(function () { a.classList.remove('up'); b.classList.remove('up'); mLock = false; }, 1000); }
  memInfo();
}

/* ---------- PINTAR (vários desenhos) ---------- */
function starD(cx, cy, R, r, n) { n = n || 5; var d = ''; for (var i = 0; i < n * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); } return d + 'Z'; }
function pz(tag, def, attrs) { return '<' + tag + ' class="pz" data-def="' + def + '" fill="#fff" ' + attrs + '/>'; }
var DESENHOS = {
  juju: null,
  casa: function () {
    return pz('rect', '#bfe9ff', 'x="0" y="0" width="400" height="480" stroke="none"') + pz('circle', '#ffd23f', 'cx="70" cy="70" r="38"') +
      pz('path', '#ffffff', 'd="M250 72 a28 28 0 0 1 50 -12 a24 24 0 0 1 42 14 a20 20 0 0 1 0 40 h-92 a22 22 0 0 1 0 -42 z"') +
      pz('path', '#6bd24a', 'd="M0 380 Q200 350 400 380 L400 480 L0 480 Z"') + pz('rect', '#ff8c1a', 'x="248" y="128" width="34" height="74"') +
      pz('path', '#ff4d5e', 'd="M66 222 L200 108 L334 222 Z"') + pz('rect', '#fff0a0', 'x="95" y="222" width="210" height="168"') +
      pz('rect', '#8b5a2b', 'x="175" y="290" width="54" height="100" rx="6"') + '<circle cx="219" cy="342" r="5" fill="#33204a" stroke="none"/>' +
      pz('rect', '#3fa9f5', 'x="115" y="245" width="48" height="48"') + pz('rect', '#3fa9f5', 'x="240" y="245" width="48" height="48"') +
      '<path d="M139 245 V293 M115 269 H163 M264 245 V293 M240 269 H288" fill="none" stroke-width="4"/>' +
      pz('path', '#d9a066', 'd="M180 390 L224 390 L252 480 L152 480 Z"') + pz('rect', '#8b5a2b', 'x="345" y="300" width="22" height="90"') +
      pz('circle', '#2f9a37', 'cx="356" cy="272" r="40"') + pz('circle', '#ff6fb5', 'cx="40" cy="425" r="14"') + pz('circle', '#ffd23f', 'cx="80" cy="445" r="14"') + pz('circle', '#9b5de5', 'cx="330" cy="440" r="14"');
  },
  peixe: function () {
    return pz('rect', '#3fa9f5', 'x="0" y="0" width="400" height="480" stroke="none"') + pz('path', '#ffe7a8', 'd="M0 420 Q100 395 200 415 T400 410 L400 480 L0 480 Z"') +
      pz('path', '#2f9a37', 'd="M50 420 Q30 370 55 330 Q75 290 50 250 Q86 290 72 330 Q60 370 78 420 Z"') + pz('path', '#4cd964', 'd="M340 420 Q320 360 345 320 Q365 280 345 240 Q382 280 366 320 Q350 360 364 420 Z"') +
      pz('path', '#ff8c1a', 'd="M300 222 L372 160 L360 230 L372 300 Z"') + pz('path', '#ffd23f', 'd="M168 160 Q210 96 254 164 Z"') +
      pz('ellipse', '#ff8c1a', 'cx="200" cy="230" rx="120" ry="80"') + pz('path', '#ffffff', 'd="M230 156 Q256 230 230 304 L256 298 Q280 230 256 162 Z"') +
      pz('path', '#ffd23f', 'd="M178 252 Q200 304 238 266 Z"') + pz('circle', '#ffffff', 'cx="130" cy="210" r="22"') +
      '<circle cx="125" cy="212" r="10" fill="#33204a" stroke="none"/><path d="M92 250 Q108 264 126 252" fill="none" stroke-width="5"/>' +
      pz('circle', '#bfe9ff', 'cx="70" cy="150" r="14"') + pz('circle', '#bfe9ff', 'cx="48" cy="108" r="10"') + pz('circle', '#bfe9ff', 'cx="82" cy="62" r="18"') +
      pz('path', '#ff6fb5', 'd="' + starD(290, 440, 30, 14) + '"') + pz('path', '#ff4d5e', 'd="' + starD(130, 445, 22, 10) + '"');
  },
  carro: function () {
    return pz('rect', '#bfe9ff', 'x="0" y="0" width="400" height="480" stroke="none"') + pz('circle', '#ffd23f', 'cx="332" cy="72" r="36"') +
      pz('path', '#ffffff', 'd="M40 90 a26 26 0 0 1 46 -12 a22 22 0 0 1 38 14 a18 18 0 0 1 0 36 h-84 a20 20 0 0 1 0 -38 z"') +
      pz('rect', '#8a8a99', 'x="0" y="350" width="400" height="130" stroke="none"') +
      pz('rect', '#ffffff', 'x="20" y="418" width="80" height="14"') + pz('rect', '#ffffff', 'x="160" y="418" width="80" height="14"') + pz('rect', '#ffffff', 'x="300" y="418" width="80" height="14"') +
      pz('path', '#ff4d5e', 'd="M118 232 L160 168 L272 168 L312 232 Z"') + pz('path', '#bfe9ff', 'd="M140 230 L170 182 L210 182 L210 230 Z"') +
      pz('path', '#bfe9ff', 'd="M222 230 L222 182 L262 182 L290 230 Z"') + pz('rect', '#ff4d5e', 'x="58" y="226" width="294" height="86" rx="24"') +
      '<path d="M215 234 V306" fill="none" stroke-width="4"/>' + pz('circle', '#ffd23f', 'cx="338" cy="258" r="11"') + pz('circle', '#ff8c1a', 'cx="70" cy="258" r="10"') +
      pz('circle', '#2b2b33', 'cx="122" cy="316" r="38"') + pz('circle', '#2b2b33', 'cx="290" cy="316" r="38"') +
      pz('circle', '#c9c9d6', 'cx="122" cy="316" r="15"') + pz('circle', '#c9c9d6', 'cx="290" cy="316" r="15"');
  },
  foguete: function () {
    var s = pz('rect', '#2b2b33', 'x="0" y="0" width="400" height="480" stroke="none"') + pz('circle', '#fff0a0', 'cx="70" cy="80" r="40"');
    [[330, 70], [300, 170], [60, 220], [110, 400], [350, 260]].forEach(function (p, i) { s += pz('path', '#ffd23f', 'd="' + starD(p[0], p[1], i % 2 ? 14 : 20, i % 2 ? 6 : 8) + '"'); });
    return s + pz('ellipse', '#ffd23f', 'cx="320" cy="390" rx="78" ry="18"') + pz('circle', '#9b5de5', 'cx="320" cy="390" r="44"') +
      pz('path', '#ff8c1a', 'd="M168 352 Q200 462 232 352 Z"') + pz('path', '#ffd23f', 'd="M182 352 Q200 420 218 352 Z"') +
      pz('path', '#ff4d5e', 'd="M150 280 L104 360 L160 338 Z"') + pz('path', '#ff4d5e', 'd="M250 280 L296 360 L240 338 Z"') +
      pz('path', '#ffffff', 'd="M150 345 L150 190 Q200 56 250 190 L250 345 Z"') + pz('path', '#ff4d5e', 'd="M162 150 Q200 56 238 150 Z"') +
      pz('circle', '#3fa9f5', 'cx="200" cy="232" r="30"') + pz('rect', '#ffd23f', 'x="150" y="318" width="100" height="24"');
  },
  sorvete: function () {
    return pz('rect', '#ffd6e8', 'x="0" y="0" width="400" height="480" stroke="none"') + pz('rect', '#d9a066', 'x="0" y="410" width="400" height="70" stroke="none"') +
      pz('path', '#e3b26b', 'd="M128 262 L200 428 L272 262 Z"') + '<path d="M150 285 L235 330 M170 330 L250 285 M160 300 L200 400 M240 300 L200 400" fill="none" stroke-width="4"/>' +
      pz('circle', '#4cd964', 'cx="148" cy="246" r="50"') + pz('circle', '#ffd23f', 'cx="252" cy="246" r="50"') + pz('circle', '#ff6fb5', 'cx="200" cy="180" r="58"') +
      '<path d="M200 106 Q206 76 228 66" fill="none" stroke-width="5"/>' + pz('circle', '#ff3b4a', 'cx="200" cy="114" r="17"') +
      pz('rect', '#3fa9f5', 'x="170" y="170" width="14" height="6" rx="3" transform="rotate(30 177 173)"') + pz('rect', '#ffd23f', 'x="214" y="190" width="14" height="6" rx="3" transform="rotate(-20 221 193)"') +
      pz('rect', '#9b5de5', 'x="190" y="150" width="14" height="6" rx="3"') + pz('path', '#ffffff', 'd="' + starD(60, 80, 26, 11) + '"') + pz('path', '#ffffff', 'd="' + starD(340, 110, 20, 9) + '"');
  }
};
var PAL = ['#ff3b4a', '#ff8c1a', '#ffd23f', '#4cd964', '#2f9a37', '#3fa9f5', '#9b5de5', '#ff6fb5', '#8b5a2b', '#2b2b33', '#bfe9ff', '#ffffff'], cur = '#4cd964', pInit = false, JUJU_SVG = '';
function paintBind() { document.querySelectorAll('#svg .pz').forEach(function (p) { p.addEventListener('click', function () { p.setAttribute('fill', cur); sPop(); }); }); }
function paintSet(k) {
  var svg = document.getElementById('svg'); svg.innerHTML = k === 'juju' ? JUJU_SVG : DESENHOS[k](); paintBind();
  document.querySelectorAll('#dsel button').forEach(function (b) { b.classList.toggle('sel', b.dataset.k === k); });
  fitNow();
}
function paintInit() {
  if (pInit) return; pInit = true; JUJU_SVG = document.getElementById('svg').innerHTML; var pal = document.getElementById('pal');
  PAL.forEach(function (c) {
    var b = document.createElement('button'); b.className = 'c' + (c === cur ? ' sel' : ''); b.style.background = c; b.setAttribute('aria-label', 'cor');
    b.onclick = function () { cur = c; pal.querySelectorAll('.c').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); sPop(); }; pal.appendChild(b);
  });
  [['🌈 Colorir tudo', function () { document.querySelectorAll('#svg .pz').forEach(function (p) { p.setAttribute('fill', p.dataset.def); }); party(60); sOk(); fOk(); }],
   ['🧽 Limpar', function () { document.querySelectorAll('#svg .pz').forEach(function (p) { p.setAttribute('fill', '#fff'); }); }],
   ['💾 Salvar', savePic]].forEach(function (a) { var b = document.createElement('button'); b.className = 'act'; b.textContent = a[0]; b.onclick = a[1]; pal.appendChild(b); });
  var ds = document.getElementById('dsel');
  [['juju', '🐊'], ['casa', '🏠'], ['peixe', '🐠'], ['carro', '🚗'], ['foguete', '🚀'], ['sorvete', '🍦']].forEach(function (d) {
    var b = document.createElement('button'); b.dataset.k = d[0]; b.textContent = d[1]; b.setAttribute('aria-label', 'desenho ' + d[0]);
    b.onclick = function () { paintSet(d[0]); sPop(); }; ds.appendChild(b);
  });
  paintSet('juju');
}
function savePic() {
  var svg = document.getElementById('svg'), xml = new XMLSerializer().serializeToString(svg);
  var img = new Image(); img.onload = function () {
    var cv = document.createElement('canvas'); cv.width = 800; cv.height = 960; var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 800, 960); x.drawImage(img, 0, 0, 800, 960);
    var a = document.createElement('a'); a.download = 'meu-desenho-juju.png'; a.href = cv.toDataURL('image/png'); a.click(); addStar(); falar('p_salvo', true);
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}

/* ---------- VAMOS CONTAR ---------- */
var nRound = 0, nAns = 0, nLock = false, N_TOTAL = 8, NCOL = ['#ff4d5e', '#3fa9f5', '#4cd964', '#ff8c1a', '#9b5de5', '#ff6fb5'];
var NOMES = ['', 'UM', 'DOIS', 'TRÊS', 'QUATRO', 'CINCO', 'SEIS', 'SETE', 'OITO', 'NOVE', 'DEZ'];
function contarStart() { catReady(function () { nRound = 0; contarRound(); lvShow(); }); }
function contarRound() {
  nLock = false; var L = lv('contar'), mx = Math.min(3 + L, 10), mn = L >= 4 ? 2 : 1;
  nAns = mn + Math.floor(Math.random() * (mx - mn + 1)); var o = rnd(CAT), box = document.getElementById('n-box'); box.innerHTML = '';
  var sz = nAns <= 3 ? '' : nAns <= 6 ? 'clamp(50px,min(21vw,12dvh),112px)' : 'clamp(40px,min(16vw,9dvh),86px)';
  for (var i = 0; i < nAns; i++) {
    var d = document.createElement('div'); d.className = 'it'; d.style.animationDelay = (i * 0.1) + 's'; if (sz) d.style.width = sz;
    d.style.transform = 'rotate(' + (Math.random() * 16 - 8).toFixed(1) + 'deg)';
    d.innerHTML = '<img src="' + oimg(o) + '" alt=""><b>' + (i + 1) + '</b>'; box.appendChild(d);
  }
  document.getElementById('n-q').textContent = 'Quantos tem? (' + (nRound + 1) + '/' + N_TOTAL + ')'; document.getElementById('n-word').innerHTML = '&nbsp;';
  var nOpt = L >= 3 ? 4 : 3, ops = [nAns];
  while (ops.length < nOpt) { var r = Math.max(1, Math.min(10, nAns + Math.floor(Math.random() * 7) - 3)); if (ops.indexOf(r) < 0) ops.push(r); }
  shuffle(ops); var nb = document.getElementById('n-opts'); nb.innerHTML = ''; if (nRound > 0) setTimeout(function () { falar('q_quantos'); }, 300);
  ops.forEach(function (v, k) { var b = document.createElement('button'); b.textContent = v; b.style.background = NCOL[(v + k) % NCOL.length]; b.onclick = function () { contarPick(v, b); }; nb.appendChild(b); });
  fitNow();
}
function contarPick(v, b) {
  if (nLock) return; if (v !== nAns) { shake(b); sNo(); fNo(); return; }
  nLock = true; var its = document.querySelectorAll('#n-box .it'), dt = its.length > 6 ? 380 : 560;
  its.forEach(function (e, i) { setTimeout(function () { e.classList.add('cnt'); tone(500 + i * 70, 0.15, 'triangle', 0.16); }, i * dt); });
  setTimeout(function () { sOk(); addStar(); pts('contar', 10 * lv('contar')); party(60); falar('n' + nAns); var w = document.getElementById('n-word'); w.textContent = NOMES[nAns] + '!'; w.style.color = '#ff8c1a'; }, its.length * dt);
  setTimeout(function () { nRound++; if (nRound < N_TOTAL) contarRound(); else levelWin('contar', 'Muito bem!', 'Você sabe contar direitinho! 🔢', its[0].querySelector('img').src, contarStart); }, its.length * dt + 1700);
}

/* ---------- JOGA NO LIXO ---------- */
var lLeft = 0;
function lixoStart() { catReady(function () { lixoRound(); lvShow(); }); }
function lixoRound() {
  var y = document.getElementById('yard'); y.querySelectorAll('.tr').forEach(function (e) { e.remove(); });
  var L = lv('lixo'), trash = CAT.filter(function (o) { return o.k === 'lixo'; }), other = CAT.filter(function (o) { return o.k === 'bicho' || o.k === 'natureza' || o.k === 'brinquedo'; });
  var nT = Math.min(3 + L, 10), nO = Math.min(2 + Math.floor(L / 2), 6), items = [], spots = [];
  for (var i = 0; i < nT; i++) items.push({ t: 'lixo', o: rnd(trash) });
  pick(other, nO).forEach(function (o) { items.push({ t: o.k === 'bicho' ? 'amigo' : 'outro', o: o }); });
  var cols = 5, rows = 4; for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) { if (r === rows - 1 && c === cols - 1) continue; spots.push([2 + c * 16 + Math.random() * 5, 36 + r * 14 + Math.random() * 4]); }
  shuffle(spots);
  items.forEach(function (it, k) {
    var b = document.createElement('button'); b.className = 'tr'; b.dataset.t = it.t; b.innerHTML = '<img src="' + oimg(it.o) + '" alt="">';
    var p = spots[k % spots.length]; b.style.left = p[0] + '%'; b.style.top = p[1] + '%'; b.onclick = function () { lixoTap(b); }; y.appendChild(b);
  });
  lLeft = nT; lixoInfo(); document.getElementById('l-info').innerHTML = '&nbsp;';
}
function lixoInfo() { document.getElementById('l-cnt').textContent = '(' + lLeft + ' restando)'; }
function lixoTap(b) {
  if (b.classList.contains('gone')) return; var t = b.dataset.t;
  if (t !== 'lixo') { shake(b); sNo(); falar(t === 'amigo' ? 'l_amigo' : 'l_nao'); document.getElementById('l-info').textContent = t === 'amigo' ? 'Ops! Esse é um amiguinho! 😄' : 'Isso não é lixo, deixa no jardim! 🌼'; return; }
  var bin = document.getElementById('bin'), yard = document.getElementById('yard');
  b.style.left = (bin.offsetLeft / yard.clientWidth * 100 + 2) + '%'; b.style.top = (bin.offsetTop / yard.clientHeight * 100) + '%';
  b.classList.add('gone'); sPop(); setTimeout(function () { bin.classList.remove('eat'); void bin.offsetWidth; bin.classList.add('eat'); tone(300, 0.12, 'square', 0.08); }, 550);
  lLeft--; lixoInfo(); addStar(); pts('lixo', 5 * lv('lixo')); document.getElementById('l-info').textContent = ['Isso aí! 👏', 'Muito bem! ♻️', 'Quintal limpinho! 🌿', 'Boa! 🎉'][Math.floor(Math.random() * 4)];
  if (lLeft === 0) setTimeout(function () { sOk(); party(80); falar('l_fim'); levelWin('lixo', 'Quintal limpinho!', 'Lugar de lixo é no lixo! ♻️', 'img/juju.webp', lixoRound); }, 800);
}

/* ---------- ESTOURA BOLHAS ---------- */
var bT = null, bS = null, bCount = 0, bTime = 30, bRun = false, bGoal = 20;
function bolhasStart() {
  bolhasStop(); catReady(function () {
    var bath = document.getElementById('bath'); bath.querySelectorAll('.bub').forEach(function (e) { e.remove(); });
    var L = lv('bolhas'); bGoal = 15 + L * 5; bCount = 0; ptsReset('bolhas'); bTime = 30; bRun = true; bInfo(); lvShow();
    bS = setInterval(spawnBub, Math.max(260, 560 - L * 40));
    bT = setInterval(function () {
      bTime--; bInfo();
      if (bTime <= 0) {
        bolhasStop();
        if (bCount >= bGoal) levelWin('bolhas', 'Que banho divertido!', 'Você estourou ' + bCount + ' bolhas! 🫧', 'img/juju.webp', bolhasStart);
        else { showWin('Quase lá!', 'Você estourou ' + bCount + ' de ' + bGoal + ' bolhas. Tenta de novo! 🫧', 'img/juju.webp', bolhasStart); setTimeout(function () { rkWinNote('bolhas'); }, 50); }
      }
    }, 1000);
  });
}
function bolhasStop() { bRun = false; clearInterval(bT); clearInterval(bS); }
function bInfo() { document.getElementById('b-cnt').textContent = '🫧 ' + bCount + ' / ' + bGoal; document.getElementById('b-time').textContent = '⏱ ' + Math.max(0, bTime); }
function spawnBub() {
  if (!bRun || document.getElementById('bolhas').className.indexOf('on') < 0) return; var bath = document.getElementById('bath'), L = lv('bolhas');
  var d = document.createElement('div'); d.className = 'bub'; var sz = 50 + Math.random() * 60; d.style.width = d.style.height = sz + 'px';
  d.style.left = (Math.random() * (bath.clientWidth - sz)) + 'px'; d.style.top = bath.clientHeight + 'px';
  var r = Math.random(), val = 1;
  if (r < 0.06) { d.classList.add('gold'); d.innerHTML = '<span>⭐</span>'; val = 5; }
  else if (r < 0.26) { var o = rnd(CAT.filter(function (x) { return x.k === 'bicho' || x.k === 'fruta' || x.k === 'brinquedo'; })); d.innerHTML = '<img src="' + oimg(o) + '" alt="">'; val = 3; }
  bath.appendChild(d);
  var dur = Math.max(2600, 4800 - L * 250) + Math.random() * 2500, t0 = performance.now(), x0 = parseFloat(d.style.left), ph = Math.random() * 6;
  (function mv(t) {
    if (!d.parentNode || d.classList.contains('pop')) return; var u = (t - t0) / dur; if (u >= 1) { d.remove(); return; }
    d.style.top = (bath.clientHeight * (1 - u) - sz * u) + 'px'; d.style.left = (x0 + 18 * Math.sin(u * 8 + ph)) + 'px'; requestAnimationFrame(mv);
  })(t0);
  d.addEventListener('pointerdown', function () {
    if (d.classList.contains('pop')) return; d.classList.add('pop'); tone(900 + Math.random() * 500, 0.07, 'sine', 0.16);
    bCount += val; if (val > 1) { addStar(); sOk(); } bInfo(); pts('bolhas', val); setTimeout(function () { d.remove(); }, 260);
  });
}

/* ---------- CADÊ A SOMBRA? ---------- */
var sq = [], si = 0, sLock = false, S_TOTAL = 8;
function sombrasStart() { catReady(function () { sq = pick(CAT, S_TOTAL); si = 0; sombrasRound(); lvShow(); }); }
function sombrasRound() {
  sLock = false; var it = sq[si], L = lv('sombras'), im = document.getElementById('s-img'); im.src = oimg(it); im.style.animation = 'none'; void im.offsetWidth; im.style.animation = '';
  document.getElementById('s-q').textContent = 'Qual é a sombra? (' + (si + 1) + '/' + S_TOTAL + ')';
  var nOpt = Math.min(1 + L, 5), pool = CAT.filter(function (x) { return x !== it; });
  if (L >= 4) { var same = pool.filter(function (x) { return x.k === it.k; }); if (same.length >= nOpt) pool = same; }
  var ops = shuffle([it].concat(pick(pool, nOpt - 1))), box = document.getElementById('s-opts'); box.innerHTML = ''; box.classList.toggle('many', nOpt > 3);
  ops.forEach(function (o) {
    var b = document.createElement('button'); b.innerHTML = '<img src="' + oimg(o) + '" alt="">'; b.setAttribute('aria-label', 'sombra');
    b.onclick = function () {
      if (sLock) return; if (o !== it) { shake(b); sNo(); fNo(); return; }
      sLock = true; b.classList.add('ok'); sOk(); fOk(); addStar(); pts('sombras', 10 * L); party(60);
      setTimeout(function () { si++; if (si < S_TOTAL) { sombrasRound(); falar('q_sombra'); } else levelWin('sombras', 'Muito bem!', 'Você achou todas as sombras! 🌗', oimg(it), sombrasStart); }, 1600);
    };
    box.appendChild(b);
  });
  fitNow();
}

/* ---------- FORMAS ---------- */
var FORMAS = {
  circulo: ['CÍRCULO', '<circle cx="50" cy="50" r="44"/>', 'o'], quadrado: ['QUADRADO', '<rect x="8" y="8" width="84" height="84" rx="6"/>', 'o'],
  triangulo: ['TRIÂNGULO', '<path d="M50 6 L95 90 L5 90 Z"/>', 'o'], estrela: ['ESTRELA', '<path d="M50 4 L62 37 L97 38 L69 59 L79 93 L50 73 L21 93 L31 59 L3 38 L38 37 Z"/>', 'a'],
  coracao: ['CORAÇÃO', '<path d="M50 90 C20 70 3 52 6 30 C9 10 36 4 50 24 C64 4 91 10 94 30 C97 52 80 70 50 90 Z"/>', 'o'],
  retangulo: ['RETÂNGULO', '<rect x="4" y="24" width="92" height="52" rx="5"/>', 'o'], oval: ['OVAL', '<ellipse cx="50" cy="50" rx="30" ry="45"/>', 'o'],
  losango: ['LOSANGO', '<path d="M50 3 L92 50 L50 97 L8 50 Z"/>', 'o']
};
var FCOL = ['#ff4d5e', '#3fa9f5', '#ffd23f', '#4cd964', '#9b5de5', '#ff8c1a', '#ff6fb5'], FALVO = 'circulo', fr = 0, fLock = false, F_TOTAL = 8, fLast = '';
function formasPool() { var L = lv('formas'); return L === 1 ? ['circulo', 'quadrado', 'triangulo'] : L === 2 ? ['circulo', 'quadrado', 'triangulo', 'estrela', 'coracao'] : Object.keys(FORMAS); }
function formasStart() { fr = 0; formasRound(true); lvShow(); }
function formasRound(first) {
  fLock = false; var L = lv('formas'), ks = formasPool(); do { FALVO = rnd(ks); } while (FALVO === fLast && ks.length > 1); fLast = FALVO;
  document.getElementById('f-q').textContent = 'Cadê ' + FORMAS[FALVO][2] + ' ' + FORMAS[FALVO][0].toLowerCase() + '?';
  document.getElementById('f-info').textContent = (fr + 1) + ' de ' + F_TOTAL;
  var nOpt = Math.min(L === 1 ? 3 : L <= 3 ? 4 : 6, ks.length), ops = shuffle([FALVO].concat(pick(ks.filter(function (k) { return k !== FALVO; }), nOpt - 1)));
  var cols = shuffle(FCOL.slice()), box = document.getElementById('f-opts'); box.innerHTML = ''; box.classList.toggle('six', nOpt > 4);
  ops.forEach(function (k, i) {
    var b = document.createElement('button'); b.setAttribute('aria-label', FORMAS[k][0]);
    var rot = L >= 3 ? (Math.random() * 40 - 20).toFixed(0) : 0;
    b.innerHTML = '<svg viewBox="0 0 100 100" fill="' + cols[i % cols.length] + '" stroke="#33204a" stroke-width="6" stroke-linejoin="round"><g transform="rotate(' + rot + ' 50 50)">' + FORMAS[k][1] + '</g></svg>';
    b.onclick = function () {
      if (fLock) return; if (k !== FALVO) { shake(b); sNo(); fNo(); return; }
      fLock = true; b.classList.add('ok'); sOk(); fOk(); addStar(); pts('formas', 10 * L); party(60);
      document.getElementById('f-info').textContent = 'É ' + FORMAS[k][2] + ' ' + FORMAS[k][0] + '! ✨';
      setTimeout(function () { fr++; if (fr < F_TOTAL) formasRound(); else levelWin('formas', 'Parabéns!', 'Você conhece as formas! 🔺🟦⭐', 'img/juju.webp', formasStart); }, 1600);
    };
    box.appendChild(b);
  });
  fitNow();
  var wait = first ? (((FALAS.i_formas || [0, 4])[1]) * 1000 + 500) : 350; setTimeout(function () { if (CUR === 'formas') falar('f_' + FALVO); }, wait);
}

/* ---------- QUEBRA-CABEÇA (arrastar e encaixar) ---------- */
var QG = { c: 2, r: 2, pic: null, done: 0, total: 0 }, qDrag = null;
function quebraGrid(L) { return [[2, 2], [3, 2], [3, 3], [4, 3], [4, 4]][Math.min(L - 1, 4)]; }
function quebraStart() {
  var go_ = function () {
    var L = lv('quebra'), g = quebraGrid(L); QG.c = g[0]; QG.r = g[1];
    var list = PZL.length ? PZL : [{ f: 'e_cachorro', r: 1 }]; var p = rnd(list); if (QG.pic && list.length > 1) while (p.f === QG.pic.f) p = rnd(list);
    QG.pic = p; QG.done = 0; QG.total = QG.c * QG.r; quebraBuild(); lvShow();
  };
  if (PZL.length) go_(); else setTimeout(go_, 500);
}
function quebraBuild() {
  var bd = document.getElementById('qboard'), tr = document.getElementById('qtray'), url = 'pzl/' + QG.pic.f + '.webp', ar = QG.pic.r;
  var land = innerWidth > innerHeight * 1.1, hdr = document.querySelector('.top').offsetHeight;
  var availW = Math.min(mainW() + 16, 1000), availH = VH() - hdr - 150;
  var bw, bh;
  if (land) { bw = Math.min(availW * 0.56, availH * ar); }
  else { bw = Math.min(availW - 40, availH * 0.5 * ar); }
  bh = bw / ar; var pw = bw / QG.c, ph = bh / QG.r;
  bd.style.width = bw + 'px'; bd.style.height = bh + 'px'; bd.innerHTML = '<div class="ghost" style="background-image:url(' + url + ')"></div>';
  QG.pw = pw; QG.ph = ph; tr.innerHTML = '';
  var ts = land ? Math.min(1, (availW - bw - 30) / (pw * 2.2)) : Math.min(1, (availH * 0.42) / (ph * Math.ceil(QG.total / Math.max(1, Math.floor(availW / (pw + 10)))))) ;
  var trayW = land ? Math.max(120, availW - bw - 90) : availW - 70, trayH = land ? availH + 60 : Math.max(120, VH() - hdr - bh - 150);
  for (ts = 0.95; ts > 0.35; ts -= 0.05) { var pc = Math.max(1, Math.floor((trayW + 10) / (pw * ts + 10))), pr = Math.ceil(QG.total / pc); if (pr * (ph * ts + 10) <= trayH) break; }
  QG.ts = ts;
  for (var i = 0; i < QG.total; i++) {
    var x = i % QG.c, y = Math.floor(i / QG.c);
    var s = document.createElement('div'); s.className = 'slot'; s.style.left = x * pw + 'px'; s.style.top = y * ph + 'px'; s.style.width = pw + 'px'; s.style.height = ph + 'px'; s.dataset.i = i; bd.appendChild(s);
  }
  shuffle(Array.from({ length: QG.total }, function (_, i) { return i; })).forEach(function (i) {
    var x = i % QG.c, y = Math.floor(i / QG.c), p = document.createElement('div'); p.className = 'pc'; p.dataset.i = i;
    p.style.width = pw * ts + 'px'; p.style.height = ph * ts + 'px';
    p.style.backgroundImage = 'url(' + url + ')'; p.style.backgroundSize = (QG.c * 100) + '% ' + (QG.r * 100) + '%';
    p.style.backgroundPosition = (QG.c > 1 ? x / (QG.c - 1) * 100 : 0) + '% ' + (QG.r > 1 ? y / (QG.r - 1) * 100 : 0) + '%';
    p.style.transform = 'rotate(' + (Math.random() * 14 - 7).toFixed(1) + 'deg)';
    p.addEventListener('pointerdown', qDown); tr.appendChild(p);
  });
}
function qDown(e) {
  var p = e.currentTarget; if (p.classList.contains('placed')) return; e.preventDefault();
  var r = p.getBoundingClientRect(); var W = QG.pw, H = QG.ph;
  qDrag = { p: p, ox: W / 2, oy: H / 2, sx: e.clientX, sy: e.clientY, moved: false, ph: document.createElement('div') };
  qDrag.ph.className = 'pc ph'; qDrag.ph.style.width = r.width + 'px'; qDrag.ph.style.height = r.height + 'px'; p.parentNode.insertBefore(qDrag.ph, p);
  p.classList.add('drag'); p.style.width = W + 'px'; p.style.height = H + 'px'; p.style.transform = 'scale(1.06)';
  p.style.left = (e.clientX - W / 2) + 'px'; p.style.top = (e.clientY - H / 2) + 'px'; document.body.appendChild(p);
  try { p.setPointerCapture(e.pointerId); } catch (x) {}
  p.addEventListener('pointermove', qMove); p.addEventListener('pointerup', qUp); p.addEventListener('pointercancel', qUp); sPop();
}
function qMove(e) {
  if (!qDrag) return; var p = qDrag.p; if (Math.abs(e.clientX - qDrag.sx) + Math.abs(e.clientY - qDrag.sy) > 8) qDrag.moved = true;
  p.style.left = (e.clientX - qDrag.ox) + 'px'; p.style.top = (e.clientY - qDrag.oy) + 'px';
}
function qUp(e) {
  if (!qDrag) return; var p = qDrag.p, i = +p.dataset.i, bd = document.getElementById('qboard'), br = bd.getBoundingClientRect();
  p.removeEventListener('pointermove', qMove); p.removeEventListener('pointerup', qUp); p.removeEventListener('pointercancel', qUp);
  var x = i % QG.c, y = Math.floor(i / QG.c), tx = br.left + (x + 0.5) * QG.pw, ty = br.top + (y + 0.5) * QG.ph;
  var cx = e.clientX - qDrag.ox + QG.pw / 2, cy = e.clientY - qDrag.oy + QG.ph / 2, dist = Math.hypot(cx - tx, cy - ty);
  var ph = qDrag.ph; qDrag = null;
  if (dist < Math.min(QG.pw, QG.ph) * 0.5) {
    p.classList.remove('drag'); p.classList.add('placed'); p.style.left = x * QG.pw + 'px'; p.style.top = y * QG.ph + 'px'; p.style.transform = 'none';
    bd.appendChild(p); ph.remove(); QG.done++; pts('quebra', 5 * lv('quebra')); tone(880, 0.12, 'triangle', 0.18); tone(1175, 0.15, 'triangle', 0.14, 0.08); addStar();
    var sl = bd.querySelector('.slot[data-i="' + i + '"]'); if (sl) sl.classList.add('ok');
    if (QG.done === QG.total) { bd.classList.add('done'); sOk(); party(120); falar('q_fim'); setTimeout(function () { levelWin('quebra', 'Montou!', 'Que quebra-cabeça bonito! 🧩', 'pzl/' + QG.pic.f + '.webp', quebraStart); }, 1500); }
    else if (QG.done % 3 === 0) falar('q_peca');
  } else {
    var inBoard = cx > br.left && cx < br.right && cy > br.top && cy < br.bottom;
    if (inBoard) sNo();
    p.classList.remove('drag'); p.style.left = ''; p.style.top = ''; p.style.width = QG.pw * QG.ts + 'px'; p.style.height = QG.ph * QG.ts + 'px';
    p.style.transform = 'rotate(' + (Math.random() * 14 - 7).toFixed(1) + 'deg)'; ph.parentNode.insertBefore(p, ph); ph.remove();
    if (inBoard) { p.classList.remove('no'); void p.offsetWidth; p.classList.add('no'); }
    var sl2 = bd.querySelector('.slot[data-i="' + i + '"]'); if (sl2) { sl2.classList.remove('hint'); void sl2.offsetWidth; sl2.classList.add('hint'); setTimeout(function () { sl2.classList.remove('hint'); }, 1300); }
  }
}
addEventListener('resize', function () { if (CUR === 'quebra' && QG.pic && QG.done === 0) quebraBuild(); });

/* ---------- PIANO DO JUJU ---------- */
var PK = [[262, 'DÓ', '#ff4d5e', 'maca'], [294, 'RÉ', '#ff8c1a', 'cenoura'], [330, 'MI', '#ffd23f', 'banana'], [349, 'FÁ', '#4cd964', 'sapo'], [392, 'SOL', '#3fa9f5', 'baleia'], [440, 'LÁ', '#9b5de5', 'uva'], [494, 'SI', '#ff6fb5', 'porquinho'], [523, 'DÓ', '#ff4d5e', 'joaninha']];
var SONGS = {
  brilha: ['Brilha, brilha estrelinha', [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0, 4, 4, 3, 3, 2, 2, 1, 4, 4, 3, 3, 2, 2, 1, 0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0]],
  alegria: ['Hino da Alegria', [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1, 2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0]],
  carneiro: ['O Carneirinho', [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4, 2, 1, 0, 1, 2, 2, 2, 2, 1, 1, 2, 1, 0]]
};
var SONG = SONGS.brilha[1], SONG_K = 'brilha', pInitK = false, pSong = -1, pDT = null, pStarN = 0, INSTR = 0;
function pnote(f) {
  if (typeof SOM !== 'undefined' && !SOM) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var t = AC.currentTime;
    var H = INSTR === 0 ? [[1, 'triangle', 0.28], [2, 'sine', 0.08], [3, 'sine', 0.03]] : INSTR === 1 ? [[1, 'sine', 0.3], [4, 'sine', 0.06], [10, 'sine', 0.02]] : [[1, 'square', 0.07], [2, 'square', 0.03]];
    var dec = INSTR === 1 ? 0.6 : INSTR === 2 ? 0.35 : 1.1;
    H.forEach(function (h) { var o = AC.createOscillator(), g = AC.createGain(); o.type = h[1]; o.frequency.value = f * h[0]; g.gain.setValueAtTime(h[2], t); g.gain.exponentialRampToValueAtTime(0.001, t + dec); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dec + 0.05); });
  } catch (e) {}
}
function pianoInit() {
  if (!pInitK) {
    pInitK = true; var k = document.getElementById('keys');
    PK.forEach(function (p, i) {
      var b = document.createElement('button'); b.style.setProperty('--k', p[2]); b.innerHTML = '<img src="obj/' + p[3] + '.webp" alt=""><b>' + p[1] + '</b>'; b.setAttribute('aria-label', p[1]);
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); pianoKey(i); }); k.appendChild(b);
    });
    var bar = document.getElementById('pbar');
    Object.keys(SONGS).forEach(function (s) { var b = document.createElement('button'); b.className = 'btn grn'; b.textContent = '⭐ ' + SONGS[s][0]; b.onclick = function () { pianoSong(s); }; bar.appendChild(b); });
    var ins = document.createElement('button'); ins.className = 'btn'; ins.id = 'pi-ins'; ins.onclick = function () { INSTR = (INSTR + 1) % 3; insLbl(); pnote(523); }; bar.appendChild(ins); insLbl();
  }
  pianoStop(); fitNow();
}
function insLbl() { document.getElementById('pi-ins').textContent = ['🎹 Piano', '🎵 Sininho', '🤖 Robô'][INSTR]; }
function pianoKey(i) {
  var ks = document.querySelectorAll('#keys button'), b = ks[i]; pnote(PK[i][0]); b.classList.add('on'); setTimeout(function () { b.classList.remove('on'); }, 180);
  var pj = document.getElementById('pj'); pj.classList.add('dance'); clearTimeout(pDT); pDT = setTimeout(function () { pj.classList.remove('dance'); }, 500);
  if (pSong >= 0) {
    if (i === SONG[pSong]) {
      pSong++; pStarN++; document.getElementById('pi-info').textContent = '⭐ ' + pStarN + ' de ' + SONG.length + ' notas';
      if (pSong >= SONG.length) { pianoStop(); addStar(3); sOk(); var k_ = SONG_K; showWin('Que lindo!', 'Você tocou ' + SONGS[k_][0] + '! 🌟', 'obj/estrela.webp', function () { pianoSong(k_); }); return; }
      pianoHint();
    }
  } else document.getElementById('pi-info').textContent = PK[i][1] + ' 🎵';
}
function pianoHint() { document.querySelectorAll('#keys button').forEach(function (b, j) { b.classList.toggle('hint', j === SONG[pSong]); }); }
function pianoSong(s) {
  SONG_K = s || 'brilha'; SONG = SONGS[SONG_K][1]; pSong = 0; pStarN = 0; document.getElementById('pi-info').textContent = 'Siga a tecla que brilha! ✨';
  var demo = SONG.slice(0, 7), k = 0, ks = document.querySelectorAll('#keys button'); ks.forEach(function (b) { b.classList.remove('hint'); });
  (function nx() {
    if (pSong !== 0 || CUR !== 'piano') return;
    if (k < demo.length) { var i = demo[k++]; pnote(PK[i][0]); ks[i].classList.add('on'); setTimeout(function () { ks[i].classList.remove('on'); }, 250); setTimeout(nx, 450); }
    else { falar('pi_vez'); pianoHint(); }
  })();
}
function pianoStop() { pSong = -1; document.querySelectorAll('#keys button').forEach(function (b) { b.classList.remove('hint'); }); var i = document.getElementById('pi-info'); if (i) i.textContent = 'Toque nas teclas! 🎶'; }

/* ---------- JOGADOR + RANKING (top 5 de cada jogo, para sempre) ---------- */
var RK_URL = 'https://script.google.com/macros/s/AKfycbxKDVBQQ-nJIHqIWhnn8IbHB0g9s58b-A7p79N6UhVs3GxDltlao4MD2zwp6dbOZnXKHQ/exec';
var RK_GAMES = { cores: ['🎨', 'Que cor é?'], memoria: ['🃏', 'Memória'], contar: ['🔢', 'Contar'], lixo: ['♻️', 'Joga no lixo'], bolhas: ['🫧', 'Bolhas'], sombras: ['🌗', 'Sombras'], formas: ['🔺', 'Formas'], quebra: ['🧩', 'Quebra-cabeça'] };
var USER = null, SP = {}, SP_SENT = {}, RK_CACHE = null;
function getCookie(k) { var m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; }
function setCookie(k, v) { document.cookie = k + '=' + encodeURIComponent(v) + '; max-age=2592000; path=/; SameSite=Lax'; }
function userLoad() { try { var c = getCookie('jj_user'); if (c) USER = JSON.parse(c); } catch (e) {} if (USER) setCookie('jj_user', JSON.stringify(USER)); }
function userSave() { setCookie('jj_user', JSON.stringify(USER)); userShow(); }
function anonName(id) { return 'JujuUser' + (1000 + (parseInt(id.slice(-6), 36) % 9000)); }
function userName() { return USER ? (USER.n || anonName(USER.id)) : ''; }
function newId() { var s = ''; for (var i = 0; i < 14; i++) s += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]; return s; }
function userShow() { var e = document.getElementById('u-name'); if (e) e.textContent = userName() || 'Jogador'; }
function nomeAbrir(primeira, depois) {
  var m = document.getElementById('nome'), inp = document.getElementById('nome-in');
  m.classList.add('on'); inp.value = USER && USER.n ? USER.n : ''; document.getElementById('nome-pular').style.display = primeira ? '' : 'none';
  document.getElementById('nome-t').textContent = primeira ? 'Qual é o seu nome?' : 'Trocar meu nome';
  m._depois = depois; if (primeira) falar('nome', false); setTimeout(function () { try { inp.focus(); } catch (e) {} }, 150);
}
function nomeOk(pular) {
  var v = (document.getElementById('nome-in').value || '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  if (!pular && v.length < 2) { shake(document.getElementById('nome-in')); sNo(); return; }
  if (!USER) USER = { id: newId(), n: '' };
  USER.n = pular ? '' : v; userSave(); var m = document.getElementById('nome'); m.classList.remove('on'); sOk();
  if (m._depois) { var f = m._depois; m._depois = null; f(); }
}
function pts(g, v) { if (!RK_GAMES[g]) return; SP[g] = (SP[g] || 0) + v; var e = document.querySelector('[data-pts="' + g + '"]'); if (e) { e.textContent = '🏅 ' + SP[g]; e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } }
function ptsReset(g) { SP[g] = 0; SP_SENT[g] = 0; var e = document.querySelector('[data-pts="' + g + '"]'); if (e) e.textContent = '🏅 0'; }
function rkSend(g, score, cb) {
  score = Math.floor(score || SP[g] || 0); if (!USER || !RK_GAMES[g] || score <= 0 || score <= (SP_SENT[g] || 0)) { if (cb) cb(0); return; }
  SP_SENT[g] = score;
  fetch(RK_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ g: g, s: score, u: USER.id, n: USER.n || '' }) })
    .then(function (r) { return r.json(); }).then(function (d) { if (d && d.ok) { if (RK_CACHE) RK_CACHE[g] = d.rank; if (cb) cb(d.pos || 0); } else if (cb) cb(0); })
    .catch(function () { SP_SENT[g] = 0; if (cb) cb(0); });
}
function rkWinNote(g, score) {
  var note = document.getElementById('w-rk'); note.textContent = ''; note.style.display = 'none';
  rkSend(g, score, function (pos) {
    if (pos > 0 && document.getElementById('win').classList.contains('on')) {
      note.textContent = (pos === 1 ? '🥇 Você é o 1º lugar' : '🏆 Você está em ' + pos + 'º lugar') + ' no ranking de ' + RK_GAMES[g][1] + '!'; note.style.display = 'block';
      setTimeout(function () { falar('rk_top'); }, 1800);
    }
  });
}
function rkOpen(g) {
  var m = document.getElementById('rank'); m.classList.add('on'); g = RK_GAMES[g] ? g : (m._g || 'bolhas'); m._g = g;
  var tabs = document.getElementById('rk-tabs'); tabs.innerHTML = '';
  Object.keys(RK_GAMES).forEach(function (k) { var b = document.createElement('button'); b.textContent = RK_GAMES[k][0]; b.title = RK_GAMES[k][1]; b.className = k === g ? 'sel' : ''; b.onclick = function () { rkOpen(k); }; tabs.appendChild(b); });
  document.getElementById('rk-t').textContent = '🏆 ' + RK_GAMES[g][1];
  var list = document.getElementById('rk-list'); list.innerHTML = '<li class="muted">Carregando…</li>';
  var draw = function () {
    var L = (RK_CACHE && RK_CACHE[g]) || []; list.innerHTML = '';
    if (!L.length) { list.innerHTML = '<li class="muted">Ninguém ainda! Seja o primeiro! 🐊</li>'; return; }
    L.forEach(function (x, i) { var li = document.createElement('li'); if (x.n === userName()) li.className = 'me'; li.innerHTML = '<b>' + ['🥇', '🥈', '🥉', '4º', '5º'][i] + '</b><span></span><em>' + x.s + ' pts</em>'; li.querySelector('span').textContent = x.n; list.appendChild(li); });
  };
  if (RK_CACHE) draw();
  fetch(RK_URL + '?t=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) { if (d && d.ok) { RK_CACHE = d.rank; if (m._g === g) draw(); } }).catch(function () { if (!RK_CACHE) list.innerHTML = '<li class="muted">Sem internet agora 😕</li>'; });
}
function rkClose() { document.getElementById('rank').classList.remove('on'); }
userLoad();


/* ---------- MÚSICAS DO JUJU ENQUANTO JOGA (player do YouTube visível, iniciado pela criança) ---------- */
var DK = { on: false, p: null, list: [], i: 0, api: false, ready: false };
try { DK.pref = localStorage.getItem('jj_musicas') === '1'; } catch (e) {}
function dockLoadList(cb) {
  if (DK.list.length) return cb();
  fetch('/videos.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); })
    .then(function (a) { DK.list = shuffle(a.filter(function (v) { return !v.short; })); cb(); }).catch(function () { cb(); });
}
function dockOpen() {
  if (!DK.list.length) return dockLoadList(function () { if (DK.list.length) dockOpen(); });
  DK.on = true; try { localStorage.setItem('jj_musicas', '1'); } catch (e) {}
  document.body.classList.add('docked'); var dd = document.getElementById('dock'); dd.classList.add('on'); dd.classList.remove('mini'); document.getElementById('d-big').textContent = '⤡'; clearTimeout(DK.mt); DK.mt = setTimeout(dockMini, 2500); dockBtn(); if (typeof musStop === 'function') musStop();
  if (!DK.api) { DK.api = true; window.onYouTubeIframeAPIReady = dockMake; var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s); }
  else if (DK.p && DK.p.playVideo) DK.p.playVideo(); else if (window.YT && YT.Player) dockMake();
  setTimeout(dockLayout, 60);
}
function dockMake() {
  if (DK.p) return; var v = DK.list[DK.i % DK.list.length];
  DK.p = new YT.Player('d-p', { host: 'https://www.youtube-nocookie.com', videoId: v.id,
    playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1, fs: 0, controls: 0, disablekb: 1, cc_load_policy: 0, iv_load_policy: 3, cc_lang_pref: 'none' },
    events: { onApiChange: function (e) { try { e.target.unloadModule('captions'); e.target.unloadModule('cc'); } catch (x) {} }, onReady: function (e) { DK.ready = true; try { e.target.unloadModule('captions'); } catch (x) {} try { e.target.setVolume(30); } catch (x) {} e.target.playVideo(); dockTitle(); },
      onStateChange: function (e) { if (e.data === 1) { try { e.target.unloadModule('captions'); } catch (x) {} } if (e.data === 0) dockNext(); dockPP(); } } });
}
function dockTitle() { var v = DK.list[DK.i % DK.list.length]; document.getElementById('d-t').textContent = '🎵 ' + (v ? v.title.replace(/\s*\|.*$/, '').replace(/#\S+/g, '').trim() : 'Músicas do Juju'); }
function dockPlayPause() { if (!DK.p || !DK.p.getPlayerState) return; if (DK.p.getPlayerState() === 1) DK.p.pauseVideo(); else DK.p.playVideo(); }
function dockPP() { var b = document.getElementById('d-pp'); if (b && DK.p && DK.p.getPlayerState) b.textContent = DK.p.getPlayerState() === 1 ? '⏸' : '▶'; }
function dockNext() { if (!DK.p || !DK.p.loadVideoById) return; DK.i++; DK.p.loadVideoById(DK.list[DK.i % DK.list.length].id); dockTitle(); }
function dockClose() {
  DK.on = false; try { localStorage.setItem('jj_musicas', '0'); } catch (e) {}
  if (DK.p && DK.p.pauseVideo) DK.p.pauseVideo(); document.getElementById('dock').classList.remove('on'); document.body.classList.remove('docked');
  dockBtn(); dockLayout(); if (typeof musStart === 'function' && typeof STARTED !== 'undefined' && STARTED && CUR !== 'piano') musStart();
}
function dockToggle() { if (DK.on) dockClose(); else dockOpen(); }
function dockBtn() { var b = document.getElementById('mus'); if (b) { b.classList.toggle('sel', DK.on); b.setAttribute('aria-pressed', DK.on); } }
function dockDuck(on) { if (!DK.on || !DK.p) return; try { DK.p.setVolume(on ? 12 : 30); } catch (e) {} }
function dockVol(v) { if (DK.on && DK.p && DK.p.setVolume) try { DK.p.setVolume(v); } catch (e) {} }
function dockPause(p) { if (!DK.on || !DK.p) return; try { p ? DK.p.pauseVideo() : DK.p.playVideo(); } catch (e) {} }
function dockLayout() {
  var d = document.getElementById('dock'), m = document.querySelector('main'), land = innerWidth > innerHeight * 1.1;
  DOCK_B = 0; m.style.paddingBottom = ''; m.style.paddingRight = ''; m.style.maxWidth = ''; document.body.classList.remove('dside');
  if (DK.on) {
    var w = 208 + 14, h = 200 + 44 + 10;   /* reserva sempre o tamanho do mini player */
    if (land && innerWidth >= 600) { m.style.paddingRight = w + 'px'; m.style.maxWidth = 'none'; document.body.classList.add('dside'); }
    else DOCK_B = h;
  }
  document.documentElement.style.setProperty('--dockb', DOCK_B + 'px');
  if (typeof fitNow === 'function') fitNow(); if (CUR === 'quebra' && QG.pic && QG.done === 0) quebraBuild();
}
function dockMini() { var d = document.getElementById('dock'); d.classList.add('mini'); document.getElementById('d-big').textContent = '⤢'; }
function dockBig() { var d = document.getElementById('dock'); if (d.classList.contains('mini')) { d.classList.remove('mini'); document.getElementById('d-big').textContent = '⤡'; } else dockMini(); }
var IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
addEventListener('resize', function () { if (DK.on) dockLayout(); });
