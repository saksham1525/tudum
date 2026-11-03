// data: {habits:[{id,name,emoji,color,max}], log:{date:{habitId:value}}}
let db = JSON.parse(localStorage.tudum || '{"habits":[],"log":{}}');
const save = () => { localStorage.tudum = JSON.stringify(db); render(); };
const $ = id => document.getElementById(id);
const day = (offset = 0) => new Date(Date.now() - offset * 864e5).toLocaleDateString('sv'); // local YYYY-MM-DD
const val = (d, id) => (db.log[d] || {})[id] || 0;
const PALETTE = ['#8b5cf6', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#14b8a6', '#eab308', '#ef4444']; // violet, orange, green, blue, pink, teal, amber, red
let editing, cur = day(); // cur = date being viewed/edited

$('colors').innerHTML = PALETTE.map(c => `<input type="radio" name="color" value="${c}" style="background:${c}">`).join('');

function render() {
  $('date').value = cur;
  $('today').innerHTML = db.habits.map(h => `
    <div class="row">
      <span class="name" data-edit="${h.id}">${h.emoji} ${h.name}</span>
      ${h.max == 1
        ? `<input type="checkbox" data-id="${h.id}" ${val(cur, h.id) ? 'checked' : ''}>`
        : `<select data-id="${h.id}">${[0,1,2,3,4,5].map(n => `<option ${n == val(cur, h.id) ? 'selected' : ''}>${n}</option>`)}</select>`}
    </div>`).join('') || '<p>No habits yet.</p>';
  const days = [6,5,4,3,2,1,0];
  $('history').innerHTML = '<div class="grid"><span></span>' + days.map(o => `<span>${day(o).slice(8)}</span>`).join('') +
    db.habits.map(h => `<span style="text-align:left">${h.emoji}</span>` + days.map(o =>
      `<span class="cell" data-date="${day(o)}" style="background:${h.color};opacity:${.15 + .85 * val(day(o), h.id) / h.max}"></span>`).join('')).join('') + '</div>';
}

$('today').onchange = e => {
  const d = cur; (db.log[d] ||= {})[e.target.dataset.id] = e.target.type == 'checkbox' ? +e.target.checked : +e.target.value;
  save();
};
$('today').onclick = e => e.target.dataset.edit && open(db.habits.find(h => h.id == e.target.dataset.edit));
$('date').max = cur;
$('date').onchange = e => { cur = e.target.value || day(); render(); };
$('history').onclick = e => e.target.dataset.date && (cur = e.target.dataset.date, render());
$('add').onclick = () => open();

function open(h) {
  editing = h; const f = $('form');
  f.emoji.value = h?.emoji || ''; f.name.value = h?.name || ''; f.color.value = h?.color || PALETTE[0]; f.max.value = h?.max || 1;
  $('del').hidden = !h; $('dlg').showModal();
}
$('dlg').onclose = () => {
  const f = $('form'), r = $('dlg').returnValue;
  if (r == 'save') {
    const v = { emoji: f.emoji.value, name: f.name.value, color: f.color.value, max: +f.max.value };
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
