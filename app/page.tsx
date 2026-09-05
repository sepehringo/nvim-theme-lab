'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import {
  Braces,
  Check,
  ChevronDown,
  Code2,
  Download,
  FileCode2,
  Import,
  Moon,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Palette = Record<string, string>;

const originalPalette: Palette = {
  base: '#232136',
  surface: '#2a273f',
  overlay: '#393552',
  muted: '#6e6a86',
  subtle: '#908caa',
  text: '#e0def4',
  love: '#eb6f92',
  gold: '#f6c177',
  rose: '#ea9a97',
  pine: '#3e8fb0',
  foam: '#9ccfd8',
  iris: '#c4a7e7',
};

const paletteDescriptions: Record<string, string> = {
  base: 'Editor background',
  surface: 'Panels and sidebars',
  overlay: 'Floating windows',
  muted: 'Comments and guides',
  subtle: 'Secondary text',
  text: 'Primary text',
  love: 'Errors and deletions',
  gold: 'Strings and warnings',
  rose: 'Numbers and constants',
  pine: 'Types and links',
  foam: 'Functions and information',
  iris: 'Keywords and operators',
};

function isHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
    const [red, green, blue] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function downloadFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function Token({ token, children, onSelect }: { token: string; children: ReactNode; onSelect: (token: string) => void }) {
  return (
    <button type="button" className="code-token" style={{ color: `var(--theme-${token})` }} onClick={() => onSelect(token)} title={`Edit ${token}`}>
      {children}
    </button>
  );
}

function Line({ number, children }: { number: number; children: ReactNode }) {
  return <div className="code-line"><span className="line-number">{number}</span><span className="line-code">{children}</span></div>;
}

function LuaPreview({ onSelect }: { onSelect: (token: string) => void }) {
  return (
    <div className="code-lines" aria-label="Lua code preview">
      <Line number={1}><Token token="iris" onSelect={onSelect}>local</Token>{' '}<Token token="text" onSelect={onSelect}>palette</Token>{' '}<Token token="iris" onSelect={onSelect}>=</Token>{' '}<Token token="text" onSelect={onSelect}>{'{'}</Token></Line>
      <Line number={2}>{'  '}<Token token="foam" onSelect={onSelect}>accent</Token>{' '}<Token token="iris" onSelect={onSelect}>=</Token>{' '}<Token token="gold" onSelect={onSelect}>&quot;#9ccfd8&quot;</Token><Token token="text" onSelect={onSelect}>,</Token></Line>
      <Line number={3}>{'  '}<Token token="foam" onSelect={onSelect}>background</Token>{' '}<Token token="iris" onSelect={onSelect}>=</Token>{' '}<Token token="gold" onSelect={onSelect}>&quot;#232136&quot;</Token><Token token="text" onSelect={onSelect}>,</Token></Line>
      <Line number={4}><Token token="text" onSelect={onSelect}>{'}'}</Token></Line>
      <Line number={5}>&nbsp;</Line>
      <Line number={6}><Token token="muted" onSelect={onSelect}>-- Apply every highlight atomically</Token></Line>
      <Line number={7}><Token token="iris" onSelect={onSelect}>local function</Token>{' '}<Token token="foam" onSelect={onSelect}>apply_theme</Token><Token token="text" onSelect={onSelect}>(</Token><Token token="pine" onSelect={onSelect}>colors</Token><Token token="text" onSelect={onSelect}>)</Token></Line>
      <Line number={8}>{'  '}<Token token="iris" onSelect={onSelect}>for</Token>{' '}<Token token="text" onSelect={onSelect}>group, color</Token>{' '}<Token token="iris" onSelect={onSelect}>in</Token>{' '}<Token token="foam" onSelect={onSelect}>pairs</Token><Token token="text" onSelect={onSelect}>(colors)</Token>{' '}<Token token="iris" onSelect={onSelect}>do</Token></Line>
      <Line number={9}>{'    '}<Token token="pine" onSelect={onSelect}>vim.api</Token><Token token="text" onSelect={onSelect}>.</Token><Token token="foam" onSelect={onSelect}>nvim_set_hl</Token><Token token="text" onSelect={onSelect}>(</Token><Token token="rose" onSelect={onSelect}>0</Token><Token token="text" onSelect={onSelect}>, group, color)</Token></Line>
      <Line number={10}>{'  '}<Token token="iris" onSelect={onSelect}>end</Token></Line>
      <Line number={11}><Token token="iris" onSelect={onSelect}>end</Token></Line>
      <Line number={12}>&nbsp;</Line>
      <Line number={13}><Token token="foam" onSelect={onSelect}>apply_theme</Token><Token token="text" onSelect={onSelect}>(palette)</Token></Line>
    </div>
  );
}

function PythonPreview({ onSelect }: { onSelect: (token: string) => void }) {
  return (
    <div className="code-lines" aria-label="Python code preview">
      <Line number={1}><Token token="iris" onSelect={onSelect}>from</Token>{' '}<Token token="pine" onSelect={onSelect}>dataclasses</Token>{' '}<Token token="iris" onSelect={onSelect}>import</Token>{' '}<Token token="pine" onSelect={onSelect}>dataclass</Token></Line>
      <Line number={2}>&nbsp;</Line>
      <Line number={3}><Token token="rose" onSelect={onSelect}>@dataclass</Token></Line>
      <Line number={4}><Token token="iris" onSelect={onSelect}>class</Token>{' '}<Token token="pine" onSelect={onSelect}>Theme</Token><Token token="text" onSelect={onSelect}>:</Token></Line>
      <Line number={5}>{'    '}<Token token="text" onSelect={onSelect}>name:</Token>{' '}<Token token="pine" onSelect={onSelect}>str</Token></Line>
      <Line number={6}>{'    '}<Token token="text" onSelect={onSelect}>colors:</Token>{' '}<Token token="pine" onSelect={onSelect}>dict</Token><Token token="text" onSelect={onSelect}>[</Token><Token token="pine" onSelect={onSelect}>str</Token><Token token="text" onSelect={onSelect}>,</Token>{' '}<Token token="pine" onSelect={onSelect}>str</Token><Token token="text" onSelect={onSelect}>]</Token></Line>
      <Line number={7}>&nbsp;</Line>
      <Line number={8}><Token token="iris" onSelect={onSelect}>def</Token>{' '}<Token token="foam" onSelect={onSelect}>contrast_ratio</Token><Token token="text" onSelect={onSelect}>(foreground, background):</Token></Line>
      <Line number={9}>{'    '}<Token token="muted" onSelect={onSelect}># Keep every token readable.</Token></Line>
      <Line number={10}>{'    '}<Token token="iris" onSelect={onSelect}>return</Token>{' '}<Token token="foam" onSelect={onSelect}>calculate_luminance</Token><Token token="text" onSelect={onSelect}>(foreground, background)</Token></Line>
      <Line number={11}>&nbsp;</Line>
      <Line number={12}><Token token="text" onSelect={onSelect}>theme</Token>{' '}<Token token="iris" onSelect={onSelect}>=</Token>{' '}<Token token="pine" onSelect={onSelect}>Theme</Token><Token token="text" onSelect={onSelect}>(</Token><Token token="gold" onSelect={onSelect}>&quot;Moon&quot;</Token><Token token="text" onSelect={onSelect}>, {'{}'})</Token></Line>
    </div>
  );
}

function GoPreview({ onSelect }: { onSelect: (token: string) => void }) {
  return (
    <div className="code-lines" aria-label="Go code preview">
      <Line number={1}><Token token="iris" onSelect={onSelect}>package</Token>{' '}<Token token="text" onSelect={onSelect}>theme</Token></Line>
      <Line number={2}>&nbsp;</Line>
      <Line number={3}><Token token="iris" onSelect={onSelect}>type</Token>{' '}<Token token="pine" onSelect={onSelect}>Palette</Token>{' '}<Token token="iris" onSelect={onSelect}>map</Token><Token token="text" onSelect={onSelect}>[</Token><Token token="pine" onSelect={onSelect}>string</Token><Token token="text" onSelect={onSelect}>]</Token><Token token="pine" onSelect={onSelect}>string</Token></Line>
      <Line number={4}>&nbsp;</Line>
      <Line number={5}><Token token="iris" onSelect={onSelect}>func</Token>{' '}<Token token="foam" onSelect={onSelect}>Export</Token><Token token="text" onSelect={onSelect}>(palette </Token><Token token="pine" onSelect={onSelect}>Palette</Token><Token token="text" onSelect={onSelect}>) (</Token><Token token="pine" onSelect={onSelect}>string</Token><Token token="text" onSelect={onSelect}>, </Token><Token token="pine" onSelect={onSelect}>error</Token><Token token="text" onSelect={onSelect}>) {'{'}</Token></Line>
      <Line number={6}>{'    '}<Token token="iris" onSelect={onSelect}>if</Token>{' '}<Token token="foam" onSelect={onSelect}>len</Token><Token token="text" onSelect={onSelect}>(palette) </Token><Token token="iris" onSelect={onSelect}>==</Token>{' '}<Token token="rose" onSelect={onSelect}>0</Token>{' '}<Token token="text" onSelect={onSelect}>{'{'}</Token></Line>
      <Line number={7}>{'        '}<Token token="iris" onSelect={onSelect}>return</Token>{' '}<Token token="gold" onSelect={onSelect}>&quot;&quot;</Token><Token token="text" onSelect={onSelect}>, </Token><Token token="foam" onSelect={onSelect}>errors.New</Token><Token token="text" onSelect={onSelect}>(</Token><Token token="gold" onSelect={onSelect}>&quot;empty palette&quot;</Token><Token token="text" onSelect={onSelect}>)</Token></Line>
      <Line number={8}>{'    '}<Token token="text" onSelect={onSelect}>{'}'}</Token></Line>
      <Line number={9}>{'    '}<Token token="iris" onSelect={onSelect}>return</Token>{' '}<Token token="foam" onSelect={onSelect}>encode</Token><Token token="text" onSelect={onSelect}>(palette), </Token><Token token="rose" onSelect={onSelect}>nil</Token></Line>
      <Line number={10}><Token token="text" onSelect={onSelect}>{'}'}</Token></Line>
    </div>
  );
}

export default function Home() {
  const [palette, setPalette] = useState<Palette>(originalPalette);
  const [selectedToken, setSelectedToken] = useState('foam');
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState('All changes are local');
  const importRef = useRef<HTMLInputElement>(null);

  const filteredPalette = useMemo(() => Object.entries(palette).filter(([name]) => name.toLowerCase().includes(filter.toLowerCase())), [filter, palette]);
  const themeStyle = Object.fromEntries(Object.entries(palette).map(([name, value]) => [`--theme-${name}`, value])) as CSSProperties;
  const selectedContrast = contrastRatio(palette[selectedToken], palette.base);

  useEffect(() => {
    const context = (document as Document & {
      modelContext?: {
        registerTool: (tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: Record<string, unknown>;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => unknown;
        }, options: { signal: AbortSignal }) => void | Promise<void>;
      };
    }).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    const register = (tool: Parameters<typeof context.registerTool>[0]) => {
      void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    };

    register({
      name: 'set_palette_color',
      title: 'Set palette color',
      description: 'Change one visible Neovim palette token to a six-digit hexadecimal color.',
      inputSchema: {
        type: 'object',
        properties: {
          token: { type: 'string', enum: Object.keys(originalPalette) },
          color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        },
        required: ['token', 'color'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const candidate = input as { token?: string; color?: string };
        if (!candidate.token || !(candidate.token in originalPalette) || !candidate.color || !isHex(candidate.color)) {
          throw new Error('A known palette token and six-digit hex color are required.');
        }
        flushSync(() => {
          setSelectedToken(candidate.token!);
          setPalette((current) => ({ ...current, [candidate.token!]: candidate.color!.toLowerCase() }));
          setNotice(`${candidate.token} updated`);
        });
        return { token: candidate.token, color: candidate.color.toLowerCase() };
      },
    });

    register({
      name: 'reset_palette',
      title: 'Reset palette',
      description: 'Restore every visible color to the original Rosé Pine Moon palette.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute() {
        flushSync(() => {
          setPalette(originalPalette);
          setNotice('Palette reset');
        });
        return { reset: true, colors: Object.keys(originalPalette).length };
      },
    });

    return () => lifecycle.abort();
  }, []);

  function updateColor(value: string) {
    if (!isHex(value)) return;
    setPalette((current) => ({ ...current, [selectedToken]: value.toLowerCase() }));
    setNotice(`${selectedToken} updated`);
  }

  function exportJson() {
    downloadFile('theme-lab-palette.json', JSON.stringify({ name: 'My Theme Lab palette', base: 'rose-pine-moon', palette }, null, 2), 'application/json');
    setNotice('JSON palette exported');
  }

  function exportLua() {
    const colors = Object.entries(palette).map(([name, value]) => `      ${name} = "${value}",`).join('\n');
    const lua = `return {\n  "rose-pine/neovim",\n  name = "rose-pine",\n  priority = 1000,\n  config = function()\n    require("rose-pine").setup({\n      variant = "moon",\n      palette = {\n        moon = {\n${colors}\n        },\n      },\n    })\n    vim.cmd.colorscheme("rose-pine-moon")\n  end,\n}\n`;
    downloadFile('colorscheme.lua', lua, 'text/plain');
    setNotice('Neovim Lua exported');
  }

  async function importJson(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = parsed.palette ?? parsed;
      const next = { ...palette };
      for (const [name, value] of Object.entries(incoming)) {
        if (name in next && typeof value === 'string' && isHex(value)) next[name] = value.toLowerCase();
      }
      setPalette(next);
      setNotice(`${file.name} imported`);
    } catch {
      setNotice('Could not read that palette');
    }
  }

  return (
    <main className="theme-lab" style={themeStyle}>
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Sparkles aria-hidden="true" /></div><div><h1>Theme Lab</h1><p>Neovim color studio</p></div></div>
        <button type="button" className="theme-select" aria-label="Current base theme"><span className="theme-orb" /><span><small>Base theme</small>Rosé Pine Moon</span><ChevronDown aria-hidden="true" /></button>
        <div className="topbar-actions">
          <span className="saved-state"><Check aria-hidden="true" /> {notice}</span>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importJson(file); event.target.value = ''; }} />
          <Button variant="outline" onClick={() => importRef.current?.click()}><Import data-icon="inline-start" /> Import</Button>
          <Button onClick={exportLua}><Download data-icon="inline-start" /> Export Lua</Button>
        </div>
      </header>

      <section className="workspace">
        <aside className="palette-panel panel">
          <div className="panel-heading"><div><span className="eyebrow">Foundation</span><h2>Palette</h2></div><span className="count">{Object.keys(palette).length}</span></div>
          <div className="search-wrap"><Search aria-hidden="true" /><Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Find a color" aria-label="Search palette" /></div>
          <ScrollArea className="palette-scroll"><div className="palette-list">
            {filteredPalette.map(([name, value]) => (
              <button key={name} type="button" className={`palette-row ${selectedToken === name ? 'is-active' : ''}`} onClick={() => setSelectedToken(name)}>
                <span className="swatch" style={{ background: value }} /><span className="palette-name"><strong>{name}</strong><small>{paletteDescriptions[name]}</small></span><code>{value}</code>
              </button>
            ))}
          </div></ScrollArea>
          <div className="palette-footer"><Moon aria-hidden="true" /><span><strong>Dark appearance</strong><small>Terminal true color</small></span></div>
        </aside>

        <section className="preview-column">
          <div className="preview-header"><div><span className="eyebrow">Live canvas</span><h2>See every change in context</h2></div><div className="preview-tools">
            <Button variant="ghost" size="sm" onClick={() => { setPalette(originalPalette); setNotice('Palette reset'); }}><RotateCcw data-icon="inline-start" /> Reset</Button>
            <Button variant="outline" size="sm" onClick={exportJson}><Braces data-icon="inline-start" /> JSON</Button>
          </div></div>

          <Tabs defaultValue="lua" className="editor-shell">
            <div className="editor-titlebar"><div className="window-controls" aria-hidden="true"><i /><i /><i /></div><TabsList variant="line" aria-label="Preview language"><TabsTrigger value="lua"><FileCode2 /> init.lua</TabsTrigger><TabsTrigger value="python"><FileCode2 /> palette.py</TabsTrigger><TabsTrigger value="go"><FileCode2 /> export.go</TabsTrigger></TabsList><span className="editor-meta">NORMAL&nbsp;&nbsp; UTF-8</span></div>
            <div className="editor-body">
              <TabsContent value="lua"><LuaPreview onSelect={setSelectedToken} /></TabsContent><TabsContent value="python"><PythonPreview onSelect={setSelectedToken} /></TabsContent><TabsContent value="go"><GoPreview onSelect={setSelectedToken} /></TabsContent>
              <div className="completion-menu"><div className="completion-title"><Code2 /> Completion <span>3 items</span></div>
                <button type="button" onClick={() => setSelectedToken('foam')}><span className="kind function-kind">ƒ</span><strong style={{ color: palette.foam }}>apply_theme</strong><small>Function</small></button>
                <button type="button" onClick={() => setSelectedToken('pine')}><span className="kind type-kind">T</span><strong style={{ color: palette.pine }}>Theme</strong><small>Type</small></button>
                <button type="button" onClick={() => setSelectedToken('text')}><span className="kind variable-kind">v</span><strong style={{ color: palette.text }}>palette</strong><small>Variable</small></button>
              </div>
            </div>
            <div className="diagnostic-line"><span className="mode">NORMAL</span><span>theme-lab/init.lua</span><span className="diagnostic-spacer" /><span className="error-dot" /> 1<span className="warning-dot" /> 2<span>Lua</span><span>13:1</span></div>
          </Tabs>

          <div className="ui-samples">
            <button type="button" onClick={() => setSelectedToken('love')}><span className="sample-icon error-sample">×</span><span><small>Diagnostic error</small><strong>Undefined global “theme”</strong></span></button>
            <button type="button" onClick={() => setSelectedToken('gold')}><span className="sample-icon warning-sample">!</span><span><small>Warning</small><strong>Unused local value</strong></span></button>
            <button type="button" onClick={() => setSelectedToken('pine')}><span className="sample-icon info-sample">i</span><span><small>Information</small><strong>3 references found</strong></span></button>
          </div>
        </section>

        <aside className="inspector-panel panel">
          <div className="panel-heading"><div><span className="eyebrow">Inspector</span><h2>{selectedToken}</h2></div><span className="inspector-swatch" style={{ background: palette[selectedToken] }} /></div>
          <div className="control-group"><label htmlFor="color-map">Color map</label><div className="color-map-wrap"><input id="color-map" type="color" value={palette[selectedToken]} onChange={(event) => updateColor(event.target.value)} aria-label={`Choose ${selectedToken} color`} /><div className="color-map-glow" style={{ background: palette[selectedToken] }} /><span>Click anywhere to pick</span></div></div>
          <div className="control-group"><label htmlFor="hex-value">Hex value</label><div className="hex-field"><span>#</span><Input key={`${selectedToken}-${palette[selectedToken]}`} id="hex-value" defaultValue={palette[selectedToken].slice(1).toUpperCase()} maxLength={6} onChange={(event) => { const value = event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase(); event.target.value = value; if (value.length === 6) updateColor(`#${value}`); }} /><button type="button" aria-label="Copy hex value" onClick={() => void navigator.clipboard?.writeText(palette[selectedToken])}><Check aria-hidden="true" /></button></div></div>
          <div className="relationship-card"><span className="eyebrow">Used by</span><div><span style={{ background: palette[selectedToken] }} /><strong>{paletteDescriptions[selectedToken]}</strong></div><p>Changes update every linked highlight in the preview.</p></div>
          <div className="contrast-card"><div className="contrast-preview" style={{ color: palette[selectedToken], background: palette.base }}>Aa</div><div><small>Contrast on base</small><strong>{selectedContrast.toFixed(2)}:1 ratio</strong></div><span className={`pass-badge ${selectedContrast >= 4.5 ? '' : 'is-low'}`}>{selectedContrast >= 4.5 && <Check />} {selectedContrast >= 4.5 ? 'PASS' : 'LOW'}</span></div>
          <div className="inspector-note"><Sparkles aria-hidden="true" /><p><strong>Tip</strong> Click syntax directly in the editor to jump to its palette color.</p></div>
        </aside>
      </section>
    </main>
  );
}
