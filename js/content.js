const Content = {
  cache: {},
  packs: {
    words1000: 'content/words-en-1000.json',
    words5000: 'content/words-en-5000.json',
    phrases: 'content/phrases-en.json',
    quotesClassic: 'content/quotes-classic.json',
    quotesCoding: 'content/quotes-coding.json',
    literature: 'content/literature.json',
    codeJS: 'content/code-javascript.json',
    codePython: 'content/code-python.json',
    codeHTML: 'content/code-html-css.json',
    numbers: 'content/numbers.json',
    symbols: 'content/symbols.json',
    bigrams: 'content/bigrams.json',
    trigrams: 'content/trigrams.json',
    pangrams: 'content/pangrams.json',
    homeRow: 'content/home-row-words.json',
    topRow: 'content/top-row-words.json',
    bottomRow: 'content/bottom-row-words.json',
    capitals: 'content/capitals.json',
    nonsense: 'content/nonsense-syllables.json'
  },

  async load(name) {
    if (this.cache[name]) return this.cache[name];
    try {
      const res = await fetch(this.packs[name]);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      this.cache[name] = data;
      return data;
    } catch (e) {
      // Fallback: minimal inline data
      return this.fallback(name);
    }
  },

  fallback(name) {
    const words = 'the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back use two how our work first well way even new want because any these give day most us'.split(' ');
    if (name === 'numbers') return ['1234 5678 9012', '3.14159 2.71828', '555-1234 555-9876'];
    if (name === 'symbols') return ['!@#$ %^&* ()_+', '{[<>]}', '~`|\\/'];
    if (name === 'bigrams') return ['th','he','in','er','an','re','on','at','en','nd','ti','es','or','te','of','ed','is','it','al','ar'];
    if (name === 'trigrams') return ['the','and','ing','her','tha','nth','int','ere','tio','ter'];
    if (name === 'pangrams') return ['The quick brown fox jumps over the lazy dog.','Pack my box with five dozen liquor jugs.','How vexingly quick daft zebras jump!'];
    if (name === 'quotesClassic') return ['The only way to do great work is to love what you do.','In the middle of difficulty lies opportunity.','Simplicity is the ultimate sophistication.'];
    if (name === 'quotesCoding') return ['Talk is cheap. Show me the code.','Premature optimization is the root of all evil.','Any fool can write code that a computer can understand.'];
    if (name === 'codeJS') return ['const x = arr.map(n => n * 2);','function greet(name) { return `Hello, ${name}`; }','if (user.isAdmin) { grantAccess(); }'];
    if (name === 'codePython') return ['def greet(name):\n    return f"Hello, {name}"','for i in range(10):\n    print(i)','with open("file.txt") as f:\n    data = f.read()'];
    if (name === 'codeHTML') return ['<div class="container">Hello</div>','<a href="https://example.com">Link</a>','body { color: #333; font-size: 16px; }'];
    if (name === 'homeRow') return ['ask','sad','lad','fall','glad','flask','salad','all','add','lass'];
    if (name === 'topRow') return ['quiet','power','write','pretty','report','people','project','writer','prior','tower'];
    if (name === 'bottomRow') return ['zebra','vibes','combo','mimic','banner','cabin','nomad','vivid','canyon','bomb'];
    if (name === 'capitals') return ['NASA FBI USA UK UN','JavaScript Python HTML CSS','Monday Tuesday Wednesday'];
    if (name === 'nonsense') return ['fa so la ti do re mi','ka ta pa sa ma na','zu vo wo xo yo zo'];
    if (name === 'literature') return ['It was the best of times, it was the worst of times.','Call me Ishmael. Some years ago, never mind how long precisely...','All happy families are alike; each unhappy family is unhappy in its own way.'];
    if (name === 'phrases') return ['on the way','in the end','as well as','at the same time','for example','in fact'];
    return words;
  },

  async getWordPool() {
    const data = await this.load('words1000');
    return Array.isArray(data) ? data : data.words || this.fallback('words1000');
  },

  async getQuote() {
    const [classic, coding] = await Promise.all([
      this.load('quotesClassic'), this.load('quotesCoding')
    ]);
    const pool = [...(Array.isArray(classic) ? classic : []), ...(Array.isArray(coding) ? coding : [])];
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'Type here.';
  },

  async getCodeSnippet() {
    const packs = ['codeJS', 'codePython', 'codeHTML'];
    const p = await this.load(packs[Math.floor(Math.random() * packs.length)]);
    return Array.isArray(p) && p.length ? p[Math.floor(Math.random() * p.length)] : 'const x = 1;';
  },

  async getNumbers() {
    const d = await this.load('numbers');
    return Array.isArray(d) && d.length ? d[Math.floor(Math.random() * d.length)] : '1234';
  },

  async getSymbols() {
    const d = await this.load('symbols');
    return Array.isArray(d) && d.length ? d[Math.floor(Math.random() * d.length)] : '!@#$';
  },

  async getPack(name) {
    return await this.load(name);
  }
};