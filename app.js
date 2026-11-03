// data: {habits:[{id,name,color,max}], log:{date:{habitId:value}}}  (max 1 = yes/no, 5 = scale)
let db = JSON.parse(localStorage.tudum || '{"habits":[],"log":{}}');
const save = () => { localStorage.tudum = JSON.stringify(db); render(); };
const $ = id => document.getElementById(id);
const dt = o => new Date(Date.now() - o * 864e5);
const day = (o = 0) => dt(o).toLocaleDateString('sv'); // local YYYY-MM-DD
const fmt = (d, o) => d.toLocaleDateString('en', o);
const esc = s => s.replace(/[&<>"]/g, c => `&#${c.charCodeAt()};`);
const val = (d, id) => (db.log[d] || {})[id] || 0;
const PALETTE = ['#8b5cf6', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#14b8a6', '#eab308', '#ef4444'];
let editing, wk = 0, cur = day(); // wk = weeks back from this week; // cur = date being viewed/edited

function render() {
  $('title').textContent = cur == day() ? 'Today' : fmt(new Date(cur + 'T00:00'), { weekday: 'long' });
  $('date').value = cur;
  $('today').innerHTML = db.habits.map(h => `
    <div class="card" style="--c:${h.color}">
      <span class="name" data-edit="${h.id}">${esc(h.name)}</span>
      ${h.max > 1 ? `<span class="step">
        <button data-id="${h.id}" data-n="${val(cur, h.id) - 1}" ${val(cur, h.id) <= 0 ? 'disabled' : ''}>−</button>
        <b>${val(cur, h.id)}</b>
        <button data-id="${h.id}" data-n="${val(cur, h.id) + 1}" ${val(cur, h.id) >= h.max ? 'disabled' : ''}>+</button></span>`
      : `<button class="pip ${val(cur, h.id) ? 'on' : ''}" data-id="${h.id}" data-n="1">✓</button>`}
    </div>`).join('') || '<p class="empty">No habits yet. Tap + to add one.</p>';

  const days = [6, 5, 4, 3, 2, 1, 0].map(o => o + 7 * wk);
  $('wk').textContent = wk == 0 ? 'This week' : wk == 1 ? 'Last week' : `${fmt(dt(days[0]), { day: 'numeric', month: 'short' })} – ${fmt(dt(days[6]), { day: 'numeric', month: 'short' })}`;
  $('next').disabled = !wk;
  $('history').innerHTML = db.habits.length ? '<div class="grid"><span></span>' +
    days.map(o => `<span class="${day(o) == cur ? 'sel' : ''}">${fmt(dt(o), { weekday: 'narrow' })}<br>${day(o).slice(8)}</span>`).join('') +
    db.habits.map(h => `<span class="hname">${esc(h.name)}</span>` + days.map(o =>
      `<i class="cell" data-date="${day(o)}" style="--c:${h.color};--v:${val(day(o), h.id) / h.max}"></i>`).join('')).join('') + '</div>' : '';
}

$('today').onclick = e => {
  const b = e.target.closest('[data-n]'), n = b && +b.dataset.n;
  if (b) { const l = db.log[cur] ||= {}; l[b.dataset.id] = val(cur, b.dataset.id) == n ? n - 1 : n; save(); }
  else if (e.target.dataset.edit) open(db.habits.find(h => h.id == e.target.dataset.edit));
};
$('date').max = cur;
$('date').onchange = e => { cur = e.target.value || day(); wk = Math.floor((Date.parse(day()) - Date.parse(cur)) / 864e5 / 7); render(); };
$('prev').onclick = () => { wk++; render(); };
$('next').onclick = () => { wk--; render(); };
$('history').onclick = e => e.target.dataset.date && (cur = e.target.dataset.date, render());
$('add').onclick = () => open();
$('colors').innerHTML = PALETTE.map(c => `<input type="radio" name="color" value="${c}" style="background:${c}">`).join('');

function open(h) {
  editing = h; const f = $('form');
  f.name.value = h?.name || ''; f.color.value = h?.color || PALETTE[0]; f.max.value = h?.max || 1;
  $('del').hidden = !h; $('dlg').showModal();
}
$('dlg').onclose = () => {
  const f = $('form'), r = $('dlg').returnValue;
  if (r == 'save') {
    const v = { name: f.name.value, color: f.color.value, max: +f.max.value };
    editing ? Object.assign(editing, v) : db.habits.push({ id: Date.now(), ...v });
  } else if (r == 'del' && confirm('Delete habit?')) db.habits = db.habits.filter(h => h != editing);
  else return;
  save();
};

$('export').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db)], { type: 'application/json' }));
  a.download = `tudum-${day()}.json`; a.click();
};
$('import').onclick = () => $('file').click();
$('file').onchange = async e => { db = JSON.parse(await e.target.files[0].text()); save(); };

navigator.storage?.persist?.();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
render();
