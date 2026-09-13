'use client';

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import {
  Braces,
  Check,
  Code2,
  Copy,
  Download,
  FileCode2,
  Import,
  Moon,
  Redo2,
  RotateCcw,
  ScanSearch,
  Search,
  Sparkles,
  Undo2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  createLazyCode,
  createThemeJson,
  defaultTheme,
  parseThemeInput,
  rolesForVariable,
  semanticRoleLabels,
  supportedThemeNames,
  themeColors,
  themeRegistry,
  type SemanticRole,
  type ThemeDefinition,
  type ThemeImportResult,
} from '@/lib/theme-registry';

type Palette = Record<string, string>;
type ThemeSnapshot = ThemeDefinition;

type PaletteHistory = {
  past: ThemeSnapshot[];
  present: ThemeSnapshot;
  future: ThemeSnapshot[];
  lastGroup?: string;
};

type PaletteAction =
  | { type: 'set-color'; token: string; color: string; group?: string }
  | { type: 'replace'; theme: ThemeSnapshot }
  | { type: 'undo' }
  | { type: 'redo' };

const paletteUsages: Record<string, string[]> = {
  base: ['Editor canvas', 'Normal background'],
  surface: ['Tab bar', 'Statusline', 'Side panels'],
  overlay: ['Completion menu', 'Floating windows'],
  muted: ['Comments', 'Line numbers', 'Indent guides'],
  subtle: ['Secondary labels', 'Inactive text'],
  text: ['Normal text', 'Variables'],
  love: ['Errors', 'Git deletions'],
  gold: ['Strings', 'Warnings'],
  rose: ['Numbers', 'Constants'],
  pine: ['Types', 'Links', 'Information'],
  foam: ['Functions', 'Methods'],
  iris: ['Keywords', 'Operators', 'Active mode'],
};

const surfaceTokens = new Set(['base', 'surface', 'overlay']);
const historyLimit = 100;

function palettesMatch(first: Palette, second: Palette) {
  const names = Object.keys(first);
  return (
    names.length === Object.keys(second).length &&
    names.every((name) => first[name] === second[name])
  );
}

function paletteHistoryReducer(
  state: PaletteHistory,
  action: PaletteAction,
): PaletteHistory {
  if (action.type === 'set-color') {
    if (state.present.palette[action.token] === action.color) return state;
    const continuesGroup =
      action.group !== undefined && action.group === state.lastGroup;
    return {
      past: continuesGroup
        ? state.past
        : [...state.past, state.present].slice(-historyLimit),
      present: {
        ...state.present,
        palette: { ...state.present.palette, [action.token]: action.color },
      },
      future: [],
      lastGroup: action.group,
    };
  }

  if (action.type === 'replace') {
    if (
      state.present.id === action.theme.id &&
      palettesMatch(state.present.palette, action.theme.palette)
    )
      return state;
    return {
      past: [...state.past, state.present].slice(-historyLimit),
      present: action.theme,
      future: [],
    };
  }

  if (action.type === 'undo') {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    };
  }

  const next = state.future[0];
  if (!next) return state;
  return {
    past: [...state.past, state.present].slice(-historyLimit),
    present: next,
    future: state.future.slice(1),
  };
}

function isHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map(
      (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
    );
    const [red, green, blue] = channels.map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function hexToHsv(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta !== 0) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return { h: hue, s: maximum === 0 ? 0 : delta / maximum, v: maximum };
}

function hsvToHex(hue: number, saturation: number, value: number) {
  const chroma = value * saturation;
  const section = hue / 60;
  const intermediate = chroma * (1 - Math.abs((section % 2) - 1));
  const offset = value - chroma;
  let channels = [0, 0, 0];
  if (section < 1) channels = [chroma, intermediate, 0];
  else if (section < 2) channels = [intermediate, chroma, 0];
  else if (section < 3) channels = [0, chroma, intermediate];
  else if (section < 4) channels = [0, intermediate, chroma];
  else if (section < 5) channels = [intermediate, 0, chroma];
  else channels = [chroma, 0, intermediate];
  return `#${channels
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function downloadFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function LiveCodePanel({
  filename,
  code,
  onCopy,
}: {
  filename: string;
  code: string;
  onCopy: () => void;
}) {
  return (
    <div className="live-code-panel">
      <div className="live-code-toolbar">
        <span>
          <FileCode2 aria-hidden="true" /> {filename}
        </span>
        <Button variant="ghost" size="sm" onClick={onCopy}>
          <Copy data-icon="inline-start" /> Copy
        </Button>
      </div>
      <div className="live-code-scroll">
        <pre aria-label={`${filename} live code`}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function Token({
  token,
  children,
  onSelect,
}: {
  token: string;
  children: ReactNode;
  onSelect: (token: string) => void;
}) {
  return (
    <button
      type="button"
      className="code-token"
      style={{ color: `var(--theme-${token})` }}
      onClick={() => onSelect(token)}
      title="Edit this preview color"
    >
      {children}
    </button>
  );
}

function Line({
  number,
  children,
  severity,
}: {
  number: number;
  children: ReactNode;
  severity?: 'error' | 'warning';
}) {
  return (
    <div className="code-line">
      <span className={`line-sign ${severity ?? ''}`}>
        {severity ? '●' : ''}
      </span>
      <span className="line-number">{number}</span>
      <span className="line-code">{children}</span>
    </div>
  );
}

function PaletteHotspot({
  token,
  onSelect,
  className = '',
}: {
  token: string;
  onSelect: (token: string) => void;
  className?: string;
}) {
  const labels: Record<string, string> = {
    base: 'editor',
    surface: 'panel',
    overlay: 'popup',
    muted: 'comments',
    subtle: 'secondary',
  };
  return (
    <button
      type="button"
      className={`palette-hotspot ${className}`}
      onClick={() => onSelect(token)}
      aria-label={`Edit ${labels[token] ?? token} color`}
    >
      <ScanSearch aria-hidden="true" />
      <span>{labels[token] ?? token}</span>
    </button>
  );
}

function ColorMap({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string, historyGroup?: string) => void;
}) {
  const hsv = hexToHsv(value);
  const mapRef = useRef<HTMLButtonElement>(null);
  const interactionCount = useRef(0);
  const activeGroup = useRef<string | undefined>(undefined);

  function startInteraction(kind: string) {
    const group = `${kind}-${++interactionCount.current}`;
    activeGroup.current = group;
    return group;
  }

  function pickColor(clientX: number, clientY: number, group?: string) {
    const bounds = mapRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const saturation = Math.min(
      1,
      Math.max(0, (clientX - bounds.left) / bounds.width),
    );
    const brightness =
      1 - Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height));
    onChange(hsvToHex(hsv.h, saturation, brightness), group);
  }

  return (
    <div className="color-picker">
      <button
        ref={mapRef}
        type="button"
        className="color-map"
        style={{ '--picker-hue': `hsl(${hsv.h} 100% 50%)` } as CSSProperties}
        aria-label="Choose saturation and brightness"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pickColor(
            event.clientX,
            event.clientY,
            startInteraction('color-map'),
          );
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            pickColor(event.clientX, event.clientY, activeGroup.current);
        }}
        onPointerUp={() => {
          activeGroup.current = undefined;
        }}
        onLostPointerCapture={() => {
          activeGroup.current = undefined;
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02;
          if (
            !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
              event.key,
            )
          )
            return;
          event.preventDefault();
          const saturation = Math.min(
            1,
            Math.max(
              0,
              hsv.s +
                (event.key === 'ArrowRight'
                  ? step
                  : event.key === 'ArrowLeft'
                    ? -step
                    : 0),
            ),
          );
          const brightness = Math.min(
            1,
            Math.max(
              0,
              hsv.v +
                (event.key === 'ArrowUp'
                  ? step
                  : event.key === 'ArrowDown'
                    ? -step
                    : 0),
            ),
          );
          onChange(hsvToHex(hsv.h, saturation, brightness));
        }}
      >
        <span
          className="color-map-cursor"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            background: value,
          }}
        />
      </button>
      <div className="hue-control">
        <span>Hue</span>
        <Slider
          value={[hsv.h]}
          min={0}
          max={360}
          onPointerDown={() => {
            startInteraction('hue');
          }}
          onValueChange={(next) =>
            onChange(
              hsvToHex(Array.isArray(next) ? next[0] : next, hsv.s, hsv.v),
              activeGroup.current,
            )
          }
          onValueCommitted={() => {
            activeGroup.current = undefined;
          }}
          aria-label="Hue"
        />
      </div>
    </div>
  );
}

function LuaPreview({ onSelect }: { onSelect: (token: string) => void }) {
  return (
    <div className="code-lines" aria-label="Lua code preview">
      <Line number={1}>
        <Token token="iris" onSelect={onSelect}>
          local
        </Token>{' '}
        <Token token="text" onSelect={onSelect}>
          palette
        </Token>{' '}
        <Token token="iris" onSelect={onSelect}>
          =
        </Token>{' '}
        <Token token="text" onSelect={onSelect}>
          {'{'}
        </Token>
      </Line>
      <Line number={2}>
        {'  '}
        <Token token="foam" onSelect={onSelect}>
          accent
        </Token>{' '}
        <Token token="iris" onSelect={onSelect}>
          =
        </Token>{' '}
        <Token token="gold" onSelect={onSelect}>
          &quot;#9ccfd8&quot;
        </Token>
        <Token token="text" onSelect={onSelect}>
          ,
        </Token>
      </Line>
      <Line number={3}>
        {'  '}
        <Token token="foam" onSelect={onSelect}>
          background
        </Token>{' '}
        <Token token="iris" onSelect={onSelect}>
          =
        </Token>{' '}
        <Token token="gold" onSelect={onSelect}>
          &quot;#232136&quot;
        </Token>
        <Token token="text" onSelect={onSelect}>
          ,
        </Token>
      </Line>
      <Line number={4}>
        <Token token="text" onSelect={onSelect}>
          {'}'}
        </Token>
      </Line>
      <Line number={5} severity="error">
        <Token token="iris" onSelect={onSelect}>
          local
        </Token>{' '}
        <span className="diagnostic-error">
          <Token token="text" onSelect={onSelect}>
            preview
          </Token>
        </span>{' '}
        <Token token="iris" onSelect={onSelect}>
          =
        </Token>{' '}
        <span className="diagnostic-error">
          <Token token="text" onSelect={onSelect}>
            missing_palette
          </Token>
        </span>
        <span className="virtual-error">● Undefined variable</span>
      </Line>
      <Line number={6} severity="warning">
        <Token token="iris" onSelect={onSelect}>
          local
        </Token>{' '}
        <span className="diagnostic-warning">
          <Token token="text" onSelect={onSelect}>
            unused
          </Token>
        </span>{' '}
        <Token token="iris" onSelect={onSelect}>
          =
        </Token>{' '}
        <Token token="rose" onSelect={onSelect}>
          true
        </Token>
        <span className="virtual-warning">● Unused local</span>
      </Line>
      <Line number={7}>&nbsp;</Line>
      <Line number={8}>
        <Token token="muted" onSelect={onSelect}>
          -- Apply every highlight atomically
        </Token>
      </Line>
      <Line number={9}>
        <Token token="iris" onSelect={onSelect}>
          local function
        </Token>{' '}
        <Token token="foam" onSelect={onSelect}>
          apply_theme
        </Token>
        <Token token="text" onSelect={onSelect}>
          (
        </Token>
        <Token token="pine" onSelect={onSelect}>
          colors
        </Token>
        <Token token="text" onSelect={onSelect}>
          )
        </Token>
      </Line>
      <Line number={10}>
        {'  '}
        <Token token="iris" onSelect={onSelect}>
          for
        </Token>{' '}
        <Token token="text" onSelect={onSelect}>
          group, color
        </Token>{' '}
        <Token token="iris" onSelect={onSelect}>
          in
        </Token>{' '}
        <Token token="foam" onSelect={onSelect}>
          pairs
        </Token>
        <Token token="text" onSelect={onSelect}>
          (colors)
        </Token>{' '}
        <Token token="iris" onSelect={onSelect}>
          do
        </Token>
      </Line>
      <Line number={11}>
        {'    '}
        <Token token="pine" onSelect={onSelect}>
          vim.api
        </Token>
        <Token token="text" onSelect={onSelect}>
          .
        </Token>
        <Token token="foam" onSelect={onSelect}>
          nvim_set_hl
        </Token>
        <Token token="text" onSelect={onSelect}>
          (
        </Token>
        <Token token="rose" onSelect={onSelect}>
          0
        </Token>
        <Token token="text" onSelect={onSelect}>
          , group, color)
        </Token>
      </Line>
      <Line number={12}>
        {'  '}
        <Token token="iris" onSelect={onSelect}>
          end
        </Token>
      </Line>
      <Line number={13}>
        <Token token="iris" onSelect={onSelect}>
          end
        </Token>
      </Line>
      <Line number={14}>&nbsp;</Line>
      <Line number={15}>
        <Token token="pine" onSelect={onSelect}>
          vim.api
        </Token>
        <Token token="text" onSelect={onSelect}>
          .
        </Token>
        <Token token="foam" onSelect={onSelect}>
          nvim_
        </Token>
        <span className="cursor-block" />
      </Line>
    </div>
  );
}

function PythonPreview({ onSelect }: { onSelect: (token: string) => void }) {
  return (
    <div className="code-lines" aria-label="Python code preview">
      <Line number={1}>
        <Token token="iris" onSelect={onSelect}>
          from
        </Token>{' '}
        <Token token="pine" onSelect={onSelect}>
          dataclasses
        </Token>{' '}
        <Token token="iris" onSelect={onSelect}>
          import
        </Token>{' '}
        <Token token="pine" onSelect={onSelect}>
          dataclass
        </Token>
      </Line>
      <Line number={2}>&nbsp;</Line>
      <Line number={3}>
        <Token token="rose" onSelect={onSelect}>
          @dataclass
        </Token>
      </Line>
      <Line number={4}>
        <Token token="iris" onSelect={onSelect}>
          class
        </Token>{' '}
        <Token token="pine" onSelect={onSelect}>
          Theme
        </Token>
        <Token token="text" onSelect={onSelect}>
          :
        </Token>
      </Line>
      <Line number={5}>
        {'    '}
        <Token token="text" onSelect={onSelect}>
          name:
        </Token>{' '}
        <Token token="pine" onSelect={onSelect}>
          str
        </Token>
      </Line>
      <Line number={6}>
        {'    '}
        <Token token="text" onSelect={onSelect}>
          colors:
        </Token>{' '}
        <Token token="pine" onSelect={onSelect}>
          dict
        </Token>
        <Token token="text" onSelect={onSelect}>
          [
        </Token>
        <Token token="pine" onSelect={onSelect}>
          str
        </Token>
        <Token token="text" onSelect={onSelect}>
          ,
        </Token>{' '}
        <Token token="pine" onSelect={onSelect}>
          str
        </Token>
        <Token token="text" onSelect={onSelect}>
          ]
        </Token>
      </Line>
      <Line number={7}>&nbsp;</Line>
      <Line number={8}>
        <Token token="iris" onSelect={onSelect}>
          def
        </Token>{' '}
        <Token token="foam" onSelect={onSelect}>
          contrast_ratio
        </Token>
        <Token token="text" onSelect={onSelect}>
          (foreground, background):
        </Token>
      </Line>
      <Line number={9}>
        {'    '}
        <Token token="muted" onSelect={onSelect}>
          # Keep every token readable.
        </Token>
      </Line>
      <Line number={10}>
        {'    '}
        <Token token="iris" onSelect={onSelect}>
          return
        </Token>{' '}
        <Token token="foam" onSelect={onSelect}>
          calculate_luminance
        </Token>
        <Token token="text" onSelect={onSelect}>
          (foreground, background)
        </Token>
      </Line>
      <Line number={11}>&nbsp;</Line>
      <Line number={12}>
        <Token token="text" onSelect={onSelect}>
          theme
        </Token>{' '}
        <Token token="iris" onSelect={onSelect}>
          =
        </Token>{' '}
        <Token token="pine" onSelect={onSelect}>
          Theme
        </Token>
        <Token token="text" onSelect={onSelect}>
          (
        </Token>
        <Token token="gold" onSelect={onSelect}>
          &quot;Moon&quot;
        </Token>
        <Token token="text" onSelect={onSelect}>
          , {'{}'})
        </Token>
      </Line>
    </div>
  );
}

function GoPreview({ onSelect }: { onSelect: (token: string) => void }) {
  return (
    <div className="code-lines" aria-label="Go code preview">
      <Line number={1}>
        <Token token="iris" onSelect={onSelect}>
          package
        </Token>{' '}
        <Token token="text" onSelect={onSelect}>
          theme
        </Token>
      </Line>
      <Line number={2}>&nbsp;</Line>
      <Line number={3}>
        <Token token="iris" onSelect={onSelect}>
          type
        </Token>{' '}
        <Token token="pine" onSelect={onSelect}>
          Palette
        </Token>{' '}
        <Token token="iris" onSelect={onSelect}>
          map
        </Token>
        <Token token="text" onSelect={onSelect}>
          [
        </Token>
        <Token token="pine" onSelect={onSelect}>
          string
        </Token>
        <Token token="text" onSelect={onSelect}>
          ]
        </Token>
        <Token token="pine" onSelect={onSelect}>
          string
        </Token>
      </Line>
      <Line number={4}>&nbsp;</Line>
      <Line number={5}>
        <Token token="iris" onSelect={onSelect}>
          func
        </Token>{' '}
        <Token token="foam" onSelect={onSelect}>
          Export
        </Token>
        <Token token="text" onSelect={onSelect}>
          (palette{' '}
        </Token>
        <Token token="pine" onSelect={onSelect}>
          Palette
        </Token>
        <Token token="text" onSelect={onSelect}>
          ) (
        </Token>
        <Token token="pine" onSelect={onSelect}>
          string
        </Token>
        <Token token="text" onSelect={onSelect}>
          ,{' '}
        </Token>
        <Token token="pine" onSelect={onSelect}>
          error
        </Token>
        <Token token="text" onSelect={onSelect}>
          ) {'{'}
        </Token>
      </Line>
      <Line number={6}>
        {'    '}
        <Token token="iris" onSelect={onSelect}>
          if
        </Token>{' '}
        <Token token="foam" onSelect={onSelect}>
          len
        </Token>
        <Token token="text" onSelect={onSelect}>
          (palette){' '}
        </Token>
        <Token token="iris" onSelect={onSelect}>
          ==
        </Token>{' '}
        <Token token="rose" onSelect={onSelect}>
          0
        </Token>{' '}
        <Token token="text" onSelect={onSelect}>
          {'{'}
        </Token>
      </Line>
      <Line number={7}>
        {'        '}
        <Token token="iris" onSelect={onSelect}>
          return
        </Token>{' '}
        <Token token="gold" onSelect={onSelect}>
          &quot;&quot;
        </Token>
        <Token token="text" onSelect={onSelect}>
          ,{' '}
        </Token>
        <Token token="foam" onSelect={onSelect}>
          errors.New
        </Token>
        <Token token="text" onSelect={onSelect}>
          (
        </Token>
        <Token token="gold" onSelect={onSelect}>
          &quot;empty palette&quot;
        </Token>
        <Token token="text" onSelect={onSelect}>
          )
        </Token>
      </Line>
      <Line number={8}>
        {'    '}
        <Token token="text" onSelect={onSelect}>
          {'}'}
        </Token>
      </Line>
      <Line number={9}>
        {'    '}
        <Token token="iris" onSelect={onSelect}>
          return
        </Token>{' '}
        <Token token="foam" onSelect={onSelect}>
          encode
        </Token>
        <Token token="text" onSelect={onSelect}>
          (palette),{' '}
        </Token>
        <Token token="rose" onSelect={onSelect}>
          nil
        </Token>
      </Line>
      <Line number={10}>
        <Token token="text" onSelect={onSelect}>
          {'}'}
        </Token>
      </Line>
    </div>
  );
}

export default function Home() {
  const [{ past, present: theme, future }, dispatchPalette] = useReducer(
    paletteHistoryReducer,
    {
      past: [],
      present: defaultTheme,
      future: [],
    },
  );
  const { name: themeName, palette } = theme;
  const [themeLibrary, setThemeLibrary] = useState(themeRegistry);
  const [selectedToken, setSelectedToken] = useState(defaultTheme.roleMap.foam);
  const [hexDraft, setHexDraft] = useState(
    defaultTheme.palette[defaultTheme.roleMap.foam].slice(1).toUpperCase(),
  );
  const [previewLanguage, setPreviewLanguage] = useState('lua');
  const [filter, setFilter] = useState('');
  const [importCode, setImportCode] = useState('');
  const [notice, setNotice] = useState('All changes are local');
  const importRef = useRef<HTMLInputElement>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const filteredPalette = useMemo(
    () =>
      Object.entries(palette).filter(([name]) =>
        name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [filter, palette],
  );
  const rolePalette = themeColors(theme);
  const themeStyle = Object.fromEntries(
    Object.entries(rolePalette).map(([name, value]) => [
      `--theme-${name}`,
      value,
    ]),
  ) as CSSProperties;
  const selectedRoles = rolesForVariable(theme, selectedToken);
  const selectedRole = selectedRoles[0] ?? ('foam' as SemanticRole);
  const selectedIsSurface = selectedRoles.some((role) =>
    surfaceTokens.has(role),
  );
  const contrastForeground = selectedIsSurface
    ? rolePalette.text
    : palette[selectedToken];
  const contrastBackground = selectedIsSurface
    ? palette[selectedToken]
    : rolePalette.base;
  const selectedContrast = contrastRatio(
    contrastForeground,
    contrastBackground,
  );
  const lazyCode = createLazyCode(theme);
  const jsonCode = createThemeJson(theme);
  const importAnalysis = useMemo<{
    result?: ThemeImportResult;
    error?: string;
  }>(() => {
    if (!importCode.trim()) return {};
    try {
      return { result: parseThemeInput(importCode) };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Could not read theme.',
      };
    }
  }, [importCode]);

  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: {
              name: string;
              title: string;
              description: string;
              inputSchema: Record<string, unknown>;
              annotations: {
                readOnlyHint: boolean;
                untrustedContentHint: boolean;
              };
              execute: (input: unknown) => unknown;
            },
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    const register = (tool: Parameters<typeof context.registerTool>[0]) => {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => undefined);
    };

    register({
      name: 'set_palette_color',
      title: 'Set palette color',
      description:
        'Change one visible Neovim palette token to a six-digit hexadecimal color.',
      inputSchema: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        },
        required: ['token', 'color'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const candidate = input as { token?: string; color?: string };
        if (
          !candidate.token ||
          !(candidate.token in themeRef.current.palette) ||
          !candidate.color ||
          !isHex(candidate.color)
        ) {
          throw new Error(
            'A known palette token and six-digit hex color are required.',
          );
        }
        flushSync(() => {
          setSelectedToken(candidate.token!);
          setHexDraft(candidate.color!.slice(1).toUpperCase());
          dispatchPalette({
            type: 'set-color',
            token: candidate.token!,
            color: candidate.color!.toLowerCase(),
          });
          setNotice(`${candidate.token} updated`);
        });
        return { token: candidate.token, color: candidate.color.toLowerCase() };
      },
    });

    register({
      name: 'reset_palette',
      title: 'Reset palette',
      description:
        'Restore every visible color to the default Rosé Pine Moon palette.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute() {
        flushSync(() => {
          dispatchPalette({
            type: 'replace',
            theme: defaultTheme,
          });
          setSelectedToken(defaultTheme.roleMap.foam);
          setHexDraft(
            defaultTheme.palette[defaultTheme.roleMap.foam]
              .slice(1)
              .toUpperCase(),
          );
          setNotice('Palette reset');
        });
        return {
          reset: true,
          colors: Object.keys(defaultTheme.palette).length,
        };
      },
    });

    return () => lifecycle.abort();
  }, []);

  function updateColor(value: string, historyGroup?: string) {
    if (!isHex(value)) return;
    setHexDraft(value.slice(1).toUpperCase());
    dispatchPalette({
      type: 'set-color',
      token: selectedToken,
      color: value.toLowerCase(),
      group: historyGroup,
    });
    setNotice(`${selectedToken} updated`);
  }

  function selectToken(token: string) {
    setSelectedToken(token);
    setHexDraft(palette[token].slice(1).toUpperCase());
  }

  function selectRole(role: string) {
    const variable = theme.roleMap[role as SemanticRole];
    if (variable) selectToken(variable);
  }

  function activateTheme(nextTheme: ThemeDefinition, message: string) {
    const variable = nextTheme.roleMap[selectedRole] ?? nextTheme.roleMap.foam;
    dispatchPalette({ type: 'replace', theme: nextTheme });
    setSelectedToken(variable);
    setHexDraft(nextTheme.palette[variable].slice(1).toUpperCase());
    setNotice(message);
  }

  function resetPalette() {
    const original =
      themeLibrary.find((candidate) => candidate.id === theme.id) ??
      defaultTheme;
    activateTheme(original, `${original.name} reset`);
  }

  function undoPalette() {
    if (past.length === 0) return;
    const previous = past.at(-1)!;
    const variable = previous.roleMap[selectedRole] ?? previous.roleMap.foam;
    dispatchPalette({ type: 'undo' });
    setSelectedToken(variable);
    setHexDraft(previous.palette[variable].slice(1).toUpperCase());
    setNotice('Undid last palette change');
  }

  function redoPalette() {
    if (future.length === 0) return;
    const next = future[0];
    const variable = next.roleMap[selectedRole] ?? next.roleMap.foam;
    dispatchPalette({ type: 'redo' });
    setSelectedToken(variable);
    setHexDraft(next.palette[variable].slice(1).toUpperCase());
    setNotice('Redid palette change');
  }

  useEffect(() => {
    function handleHistoryShortcut(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const hasModifier = event.metaKey || event.ctrlKey;
      const wantsUndo = hasModifier && key === 'z' && !event.shiftKey;
      const wantsRedo =
        hasModifier &&
        ((key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey));

      if (wantsUndo && past.length > 0) {
        const previous = past.at(-1)!;
        const variable =
          previous.roleMap[selectedRole] ?? previous.roleMap.foam;
        event.preventDefault();
        dispatchPalette({ type: 'undo' });
        setSelectedToken(variable);
        setHexDraft(previous.palette[variable].slice(1).toUpperCase());
        setNotice('Undid last palette change');
      } else if (wantsRedo && future.length > 0) {
        const next = future[0];
        const variable = next.roleMap[selectedRole] ?? next.roleMap.foam;
        event.preventDefault();
        dispatchPalette({ type: 'redo' });
        setSelectedToken(variable);
        setHexDraft(next.palette[variable].slice(1).toUpperCase());
        setNotice('Redid palette change');
      }
    }

    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, [future, past, selectedRole]);

  function exportJson() {
    downloadFile('theme-lab-palette.json', jsonCode, 'application/json');
    setNotice('JSON palette exported');
  }

  function exportLua() {
    downloadFile('colorscheme.lua', lazyCode, 'text/plain');
    setNotice('Neovim Lua exported');
  }

  async function copyCode(label: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice(`${label} copied`);
    } catch {
      setNotice('Could not copy code');
    }
  }

  function applyThemeImport(result: ThemeImportResult) {
    if (result.theme.family === 'Imported') {
      setThemeLibrary((current) => [
        ...current.filter((candidate) => candidate.id !== result.theme.id),
        result.theme,
      ]);
    }
    activateTheme(result.theme, `${result.theme.name} imported`);
  }

  function pasteThemeCode(value: string) {
    setImportCode(value);
    try {
      applyThemeImport(parseThemeInput(value));
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Could not read theme',
      );
    }
  }

  async function importThemeFile(file: File) {
    try {
      const contents = await file.text();
      setImportCode(contents);
      applyThemeImport(parseThemeInput(contents));
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Could not read theme',
      );
    }
  }

  return (
    <main className="theme-lab" style={themeStyle}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles aria-hidden="true" />
          </div>
          <div>
            <h1>Theme Lab</h1>
            <p>Neovim color studio</p>
          </div>
        </div>
        <Select
          value={theme.id}
          onValueChange={(id) => {
            const nextTheme = themeLibrary.find(
              (candidate) => candidate.id === id,
            );
            if (nextTheme)
              activateTheme(nextTheme, `${nextTheme.name} selected`);
          }}
        >
          <SelectTrigger className="theme-select" aria-label="Current theme">
            <span className="theme-orb" />
            <span className="theme-select-copy">
              <small>Current theme</small>
              <SelectValue>{themeName}</SelectValue>
            </span>
          </SelectTrigger>
          <SelectContent className="theme-menu">
            <SelectGroup>
              <SelectLabel>Popular themes</SelectLabel>
              {themeLibrary
                .filter(
                  (candidate) =>
                    !candidate.builtin && candidate.family !== 'Imported',
                )
                .map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    <i style={{ background: themeColors(candidate).foam }} />
                    {candidate.name}
                  </SelectItem>
                ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Neovim built-ins</SelectLabel>
              {themeLibrary
                .filter((candidate) => candidate.builtin)
                .map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    <i style={{ background: themeColors(candidate).foam }} />
                    {candidate.name}
                  </SelectItem>
                ))}
            </SelectGroup>
            {themeLibrary.some(
              (candidate) => candidate.family === 'Imported',
            ) && (
              <SelectGroup>
                <SelectLabel>Imported</SelectLabel>
                {themeLibrary
                  .filter((candidate) => candidate.family === 'Imported')
                  .map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      <i style={{ background: themeColors(candidate).foam }} />
                      {candidate.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <div className="topbar-actions">
          <span className="saved-state">
            <Check aria-hidden="true" /> {notice}
          </span>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>
              <Import data-icon="inline-start" /> Import
            </SheetTrigger>
            <SheetContent
              className="code-sheet import-sheet"
              style={themeStyle}
            >
              <SheetHeader className="code-sheet-header">
                <span className="eyebrow">Theme reader</span>
                <SheetTitle>Import a Neovim theme</SheetTitle>
                <SheetDescription>
                  Paste a supported GitHub repository link, Lazy.nvim spec, or
                  palette table. A valid paste applies immediately and remains
                  undoable.
                </SheetDescription>
              </SheetHeader>
              <div className="theme-import-body">
                <div className="theme-import-field">
                  <label htmlFor="theme-import-code">Theme code</label>
                  <Textarea
                    id="theme-import-code"
                    value={importCode}
                    spellCheck={false}
                    placeholder="https://github.com/catppuccin/nvim"
                    onChange={(event) => setImportCode(event.target.value)}
                    onPaste={(event) => {
                      const pasted = event.clipboardData.getData('text');
                      if (!pasted) return;
                      event.preventDefault();
                      pasteThemeCode(pasted);
                    }}
                  />
                </div>

                {importAnalysis.result ? (
                  <output className="theme-import-result">
                    <div className="import-swatch-row" aria-hidden="true">
                      {Object.entries(importAnalysis.result.theme.palette).map(
                        ([name, color]) => (
                          <i key={name} style={{ background: color }} />
                        ),
                      )}
                    </div>
                    <div>
                      <span>Detected</span>
                      <strong>{importAnalysis.result.theme.name}</strong>
                      <p>{importAnalysis.result.note}</p>
                    </div>
                  </output>
                ) : importAnalysis.error ? (
                  <div className="theme-import-error" role="alert">
                    {importAnalysis.error}
                  </div>
                ) : (
                  <div className="theme-import-empty">
                    Paste code above or choose a local Lua, Vim, or JSON file.
                  </div>
                )}

                <div className="supported-themes">
                  <span>Adapter registry</span>
                  <div>
                    {supportedThemeNames.map((name) => (
                      <small key={name}>{name}</small>
                    ))}
                  </div>
                </div>

                <div className="theme-import-actions">
                  <input
                    ref={importRef}
                    type="file"
                    accept=".lua,.vim,.json,.txt,text/plain,application/json"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void importThemeFile(file);
                      event.target.value = '';
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => importRef.current?.click()}
                  >
                    Choose file
                  </Button>
                  <Button
                    disabled={!importAnalysis.result}
                    onClick={() => {
                      if (importAnalysis.result)
                        applyThemeImport(importAnalysis.result);
                    }}
                  >
                    <Import data-icon="inline-start" /> Apply theme
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>
              <Code2 data-icon="inline-start" /> Live code
            </SheetTrigger>
            <SheetContent className="code-sheet" style={themeStyle}>
              <SheetHeader className="code-sheet-header">
                <span className="eyebrow">Synced output</span>
                <SheetTitle>Use your palette in Neovim</SheetTitle>
                <SheetDescription>
                  These files update instantly as you edit colors.
                </SheetDescription>
              </SheetHeader>
              <Tabs defaultValue="lazy" className="code-output-tabs">
                <TabsList aria-label="Code format">
                  <TabsTrigger value="lazy">Lazy.nvim</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="lazy">
                  <LiveCodePanel
                    filename="colorscheme.lua"
                    code={lazyCode}
                    onCopy={() => void copyCode('Lazy.nvim code', lazyCode)}
                  />
                </TabsContent>
                <TabsContent value="json">
                  <LiveCodePanel
                    filename="theme-lab-palette.json"
                    code={jsonCode}
                    onCopy={() => void copyCode('JSON', jsonCode)}
                  />
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
          <Button onClick={exportLua}>
            <Download data-icon="inline-start" /> Export Lua
          </Button>
        </div>
      </header>

      <section className="workspace">
        <aside className="palette-panel panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Foundation</span>
              <h2>Palette</h2>
            </div>
            <span className="count">{Object.keys(palette).length}</span>
          </div>
          <div className="search-wrap">
            <Search aria-hidden="true" />
            <Input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Find a color"
              aria-label="Search palette"
            />
          </div>
          <ScrollArea className="palette-scroll">
            <div className="palette-list">
              {filteredPalette.map(([name, value]) => (
                <button
                  key={name}
                  type="button"
                  className={`palette-row ${selectedToken === name ? 'is-active' : ''}`}
                  onClick={() => selectToken(name)}
                >
                  <span className="swatch" style={{ background: value }} />
                  <span className="palette-name">
                    <strong>{name}</strong>
                    <small>
                      {rolesForVariable(theme, name)
                        .map((role) => semanticRoleLabels[role])
                        .join(' · ') || 'Additional theme color'}
                    </small>
                  </span>
                  <code>{value}</code>
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="palette-footer">
            <Moon aria-hidden="true" />
            <span>
              <strong>{theme.family}</strong>
              <small>{theme.variant} · terminal true color</small>
            </span>
          </div>
        </aside>

        <section className="preview-column">
          <div className="preview-header">
            <div>
              <span className="eyebrow">Live canvas</span>
              <h2>See every change in context</h2>
            </div>
            <div className="preview-tools">
              <Button
                variant="ghost"
                size="sm"
                onClick={undoPalette}
                disabled={past.length === 0}
                title="Undo (Cmd/Ctrl+Z)"
              >
                <Undo2 data-icon="inline-start" /> Undo
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={redoPalette}
                disabled={future.length === 0}
                title="Redo (Cmd/Ctrl+Shift+Z or Ctrl+Y)"
                aria-label="Redo"
              >
                <Redo2 />
              </Button>
              <Button variant="ghost" size="sm" onClick={resetPalette}>
                <RotateCcw data-icon="inline-start" /> Reset
              </Button>
              <Button variant="outline" size="sm" onClick={exportJson}>
                <Braces data-icon="inline-start" /> JSON
              </Button>
            </div>
          </div>

          <Tabs
            value={previewLanguage}
            onValueChange={setPreviewLanguage}
            className="editor-shell"
          >
            <div className="editor-titlebar">
              <div className="window-controls" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <TabsList variant="line" aria-label="Preview language">
                <TabsTrigger value="lua">
                  <FileCode2 /> init.lua
                </TabsTrigger>
                <TabsTrigger value="python">
                  <FileCode2 /> palette.py
                </TabsTrigger>
                <TabsTrigger value="go">
                  <FileCode2 /> export.go
                </TabsTrigger>
              </TabsList>
              <span className="editor-meta">NORMAL&nbsp;&nbsp; UTF-8</span>
              <PaletteHotspot
                token="surface"
                onSelect={selectRole}
                className="hotspot-surface"
              />
            </div>
            <div className="editor-body">
              <PaletteHotspot
                token="base"
                onSelect={selectRole}
                className="hotspot-base"
              />
              <PaletteHotspot
                token="muted"
                onSelect={selectRole}
                className="hotspot-muted"
              />
              <TabsContent value="lua">
                <LuaPreview onSelect={selectRole} />
              </TabsContent>
              <TabsContent value="python">
                <PythonPreview onSelect={selectRole} />
              </TabsContent>
              <TabsContent value="go">
                <GoPreview onSelect={selectRole} />
              </TabsContent>
              {previewLanguage === 'lua' && (
                <div className="completion-menu">
                  <div className="completion-title">
                    <Code2 /> Blink completion <span>UI preview</span>
                  </div>
                  <PaletteHotspot
                    token="overlay"
                    onSelect={selectRole}
                    className="hotspot-overlay"
                  />
                  <button type="button" onClick={() => selectRole('foam')}>
                    <span className="kind function-kind">ƒ</span>
                    <strong style={{ color: rolePalette.foam }}>
                      nvim_set_hl
                    </strong>
                    <small>Function</small>
                  </button>
                  <button type="button" onClick={() => selectRole('foam')}>
                    <span className="kind function-kind">ƒ</span>
                    <strong style={{ color: rolePalette.foam }}>
                      nvim_get_hl
                    </strong>
                    <small>Function</small>
                  </button>
                  <button type="button" onClick={() => selectRole('pine')}>
                    <span className="kind type-kind">M</span>
                    <strong style={{ color: rolePalette.pine }}>
                      nvim_create_autocmd
                    </strong>
                    <small>Method</small>
                  </button>
                </div>
              )}
            </div>
            <div className="diagnostic-line">
              <span className="mode">NORMAL</span>
              <span>theme-lab/init.lua</span>
              <span className="diagnostic-spacer" />
              <span className="error-dot" /> 1<span className="warning-dot" /> 1
              <span>Lua</span>
              <span>15:10</span>
              <PaletteHotspot
                token="subtle"
                onSelect={selectRole}
                className="hotspot-subtle"
              />
            </div>
          </Tabs>

          <div className="ui-samples">
            <button type="button" onClick={() => selectRole('love')}>
              <span className="sample-icon error-sample">×</span>
              <span>
                <small>Diagnostic error</small>
                <strong>Undefined variable</strong>
              </span>
            </button>
            <button type="button" onClick={() => selectRole('gold')}>
              <span className="sample-icon warning-sample">!</span>
              <span>
                <small>Diagnostic warning</small>
                <strong>Unused local value</strong>
              </span>
            </button>
            <button type="button" onClick={() => selectRole('pine')}>
              <span className="sample-icon info-sample">i</span>
              <span>
                <small>Information</small>
                <strong>3 references found</strong>
              </span>
            </button>
          </div>
        </section>

        <aside className="inspector-panel panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Inspector</span>
              <h2>{selectedToken}</h2>
            </div>
            <span
              className="inspector-swatch"
              style={{ background: palette[selectedToken] }}
            />
          </div>
          <div className="control-group">
            <span className="control-label">Color map</span>
            <ColorMap value={palette[selectedToken]} onChange={updateColor} />
          </div>
          <div className="control-group">
            <label htmlFor="hex-value">Hex value</label>
            <div className="hex-field">
              <span>#</span>
              <Input
                id="hex-value"
                value={hexDraft}
                maxLength={6}
                spellCheck={false}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/[^0-9a-f]/gi, '')
                    .slice(0, 6)
                    .toUpperCase();
                  setHexDraft(value);
                  if (value.length === 6) updateColor(`#${value}`);
                }}
              />
              <button
                type="button"
                aria-label="Copy hex value"
                onClick={() =>
                  void navigator.clipboard?.writeText(palette[selectedToken])
                }
              >
                <Check aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="relationship-card">
            <span className="eyebrow">This color controls</span>
            <div className="usage-tags">
              {[
                ...new Set(
                  selectedRoles.flatMap((role) => paletteUsages[role]),
                ),
              ].map((usage) => (
                <span key={usage}>{usage}</span>
              ))}
            </div>
            <p>
              {selectedRoles.length > 0
                ? selectedRoles
                    .map((role) => semanticRoleLabels[role])
                    .join(', ')
                : 'This native theme color is not assigned to the current preview'}
              . Click any matching item in the preview to return here.
            </p>
          </div>
          <div className="contrast-card">
            <div
              className="contrast-preview"
              style={{
                color: contrastForeground,
                background: contrastBackground,
              }}
            >
              Aa
            </div>
            <div>
              <small>
                {selectedIsSurface
                  ? `Default text on “${selectedToken}”`
                  : `${selectedToken} on the editor background`}
              </small>
              <strong>
                {selectedContrast.toFixed(2)}:1 ·{' '}
                {selectedContrast >= 4.5
                  ? 'Readable at normal size'
                  : 'Low text contrast'}
              </strong>
            </div>
            <span
              className={`pass-badge ${selectedContrast >= 4.5 ? '' : 'is-low'}`}
            >
              {selectedContrast >= 4.5 && <Check />}{' '}
              {selectedContrast >= 4.5 ? 'AA' : 'LOW'}
            </span>
          </div>
          <div className="inspector-note">
            <Sparkles aria-hidden="true" />
            <p>
              <strong>Tip</strong> Click syntax directly in the editor to jump
              to its palette color.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
