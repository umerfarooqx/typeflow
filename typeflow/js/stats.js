const StatsUtil = {
  computeWPM(correct, ms) { const m = ms / 60000; return m < 0.01 ? 0 : Math.round((correct / 5) / m); },
  computeAccuracy(c, t) { return t === 0 ? 100 : Math.round((c / t) * 100); },
  computeConsistency(samples) {
    if (samples.length < 2) return 100;
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const v = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    const sd = Math.sqrt(v);
    if (mean === 0) return 0;
    return Math.max(0, Math.round((1 - sd / mean) * 100));
  }
};

const Charts = {
  lineChart(canvas, datasets, options = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { l: 40, r: 20, t: 20, b: 30 };
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    ctx.clearRect(0, 0, W, H);
    const all = datasets.flatMap(d => d.data);
    if (!all.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '13px sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('No data yet', W / 2, H / 2); return;
    }
    const max = Math.max(...all, 10), min = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px monospace';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ph / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillText(Math.round(max - (max - min) * (i / 4)), 4, y + 3);
    }
    datasets.forEach(ds => {
      if (!ds.data.length) return;
      ctx.strokeStyle = ds.color || '#ffd166'; ctx.lineWidth = 2;
      ctx.beginPath();
      ds.data.forEach((v, i) => {
        const x = pad.l + (i / Math.max(1, ds.data.length - 1)) * pw;
        const y = pad.t + ph - ((v - min) / (max - min)) * ph;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = ds.color || '#ffd166';
      ds.data.forEach((v, i) => {
        const x = pad.l + (i / Math.max(1, ds.data.length - 1)) * pw;
        const y = pad.t + ph - ((v - min) / (max - min)) * ph;
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      });
    });
  }
};