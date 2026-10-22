const KB_LAYOUT = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','backspace'],
  ['tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
  ['caps','a','s','d','f','g','h','j','k','l',';','\'','enter'],
  ['shift','z','x','c','v','b','n','m',',','.','/','shift2'],
  ['space']
];

const Keyboard = {
  keys: {},
  build(container) {
    container.innerHTML = ''; this.keys = {};
    KB_LAYOUT.forEach(row => {
      const r = document.createElement('div'); r.className = 'kb-row';
      row.forEach(k => {
        const el = document.createElement('div');
        el.className = 'kb-key';
        if (k === 'space') el.classList.add('space');
        else if (['backspace','tab','caps','enter','shift','shift2'].includes(k)) el.classList.add('wide');
        el.textContent = k === 'space' ? '␣' : (k.length > 1 ? k.slice(0, 5) : k.toUpperCase());
        el.dataset.key = k; r.appendChild(el); this.keys[k] = el;
      });
      container.appendChild(r);
    });
  },
  highlightNext(ch) {
    Object.values(this.keys).forEach(k => k.classList.remove('next'));
    if (!ch) return;
    const key = ch === ' ' ? 'space' : ch.toLowerCase();
    if (this.keys[key]) this.keys[key].classList.add('next');
  },
  press(ch, ripple) {
    const key = ch === ' ' ? 'space' : ch.toLowerCase();
    const el = this.keys[key]; if (!el) return;
    el.classList.add('pressed');
    if (ripple) { el.classList.add('ripple'); setTimeout(() => el.classList.remove('ripple'), 400); }
    setTimeout(() => el.classList.remove('pressed'), 100);
  },
  flashError(ch) {
    const key = ch === ' ' ? 'space' : ch.toLowerCase();
    const el = this.keys[key]; if (!el) return;
    el.classList.add('error');
    setTimeout(() => el.classList.remove('error'), 200);
  },
  buildHeatmap(container, errorMap) {
    container.innerHTML = '';
    const maxErr = Math.max(1, ...Object.values(errorMap));
    KB_LAYOUT.forEach(row => {
      const r = document.createElement('div'); r.className = 'hm-row';
      row.forEach(k => {
        if (['tab','caps','shift','shift2','enter'].includes(k)) return;
        const el = document.createElement('div'); el.className = 'hm-key';
        const key = k === 'backspace' ? null : k;
        const c = key ? (errorMap[key] || 0) : 0;
        const t = c / maxErr;
        el.style.background = `rgb(${Math.round(110 + t * 145)},${Math.round(231 - t * 160)},${Math.round(183 - t * 120)})`;
        el.textContent = k === 'space' ? '' : k.toUpperCase();
        if (c > 0) el.title = `${c} errors`;
        r.appendChild(el);
      });
      container.appendChild(r);
    });
  }
};