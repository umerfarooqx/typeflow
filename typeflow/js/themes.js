const ThemeManager = {
  themes: {
    midnight: 'Midnight', nord: 'Nord', dracula: 'Dracula',
    'tokyo-night': 'Tokyo Night', catppuccin: 'Catppuccin Mocha',
    gruvbox: 'Gruvbox', 'solarized-light': 'Solarized Light',
    'github-light': 'GitHub Light', amoled: 'AMOLED Black',
    'high-contrast': 'High Contrast'
  },
  current: 'midnight',

  init() {
    this.current = Settings.get('theme', 'midnight');
    this.apply();
    document.getElementById('themeCycle').addEventListener('click', () => this.cycle());
  },

  apply(theme = this.current) {
    this.current = theme;
    document.body.className = document.body.className
      .split(' ').filter(c => !c.startsWith('theme-')).join(' ');
    document.body.classList.add('theme-' + theme);
    document.getElementById('themeName').textContent = this.themes[theme] || theme;
    Settings.set('theme', theme);
    const accent = Settings.get('accent', null);
    if (accent) document.documentElement.style.setProperty('--accent', accent);
    this.updateSwatches();
  },

  cycle() {
    const keys = Object.keys(this.themes);
    const i = keys.indexOf(this.current);
    this.apply(keys[(i + 1) % keys.length]);
  },

  buildSwatches(container) {
    container.innerHTML = '';
    for (const [k, name] of Object.entries(this.themes)) {
      const el = document.createElement('div');
      el.className = 'theme-swatch' + (k === this.current ? ' active' : '');
      el.dataset.theme = k;
      el.textContent = name;
      el.addEventListener('click', () => this.apply(k));
      container.appendChild(el);
    }
  },

  updateSwatches() {
    document.querySelectorAll('.theme-swatch').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === this.current);
    });
  },

  exportJSON() {
    return JSON.stringify({
      theme: this.current,
      accent: Settings.get('accent', null),
      custom: Settings.get('customTheme', null)
    });
  },

  importJSON(json) {
    try {
      const d = JSON.parse(json);
      if (d.theme) this.apply(d.theme);
      if (d.accent) { Settings.set('accent', d.accent); document.documentElement.style.setProperty('--accent', d.accent); }
      if (d.custom) Settings.set('customTheme', d.custom);
      return true;
    } catch { return false; }
  }
};