export type ThemePalette = Record<string, string>;

export type SemanticRole =
  | 'base'
  | 'surface'
  | 'overlay'
  | 'muted'
  | 'subtle'
  | 'text'
  | 'love'
  | 'gold'
  | 'rose'
  | 'pine'
  | 'foam'
  | 'iris';

export type ThemeDefinition = {
  id: string;
  name: string;
  family: string;
  variant: string;
  repository?: string;
  colorscheme: string;
  builtin?: boolean;
  palette: ThemePalette;
  roleMap: Record<SemanticRole, string>;
};

export type ThemeImportResult = {
  theme: ThemeDefinition;
  matchedColors: number;
  note: string;
};

const roles = (
  base: string,
  surface: string,
  overlay: string,
  muted: string,
  subtle: string,
  text: string,
  love: string,
  gold: string,
  rose: string,
  pine: string,
  foam: string,
  iris: string,
): Record<SemanticRole, string> => ({
  base,
  surface,
  overlay,
  muted,
  subtle,
  text,
  love,
  gold,
  rose,
  pine,
  foam,
  iris,
});

const rosePineRoles = roles(
  'base',
  'surface',
  'overlay',
  'muted',
  'subtle',
  'text',
  'love',
  'gold',
  'rose',
  'pine',
  'foam',
  'iris',
);

const catppuccinRoles = roles(
  'base',
  'mantle',
  'surface0',
  'overlay0',
  'subtext0',
  'text',
  'red',
  'yellow',
  'peach',
  'blue',
  'teal',
  'mauve',
);

const tokyoNightRoles = roles(
  'bg',
  'bg_dark',
  'bg_highlight',
  'comment',
  'fg_dark',
  'fg',
  'red',
  'yellow',
  'orange',
  'blue',
  'cyan',
  'magenta',
);

const builtinRoles = roles(
  'Normal.bg',
  'StatusLineNC.bg',
  'Pmenu.bg',
  'Comment.fg',
  'LineNr.fg',
  'Normal.fg',
  'DiagnosticError.fg',
  'String.fg',
  'Number.fg',
  'Type.fg',
  'Function.fg',
  'Keyword.fg',
);

function define(
  definition: Omit<ThemeDefinition, 'id'> & { id?: string },
): ThemeDefinition {
  return {
    ...definition,
    id:
      definition.id ??
      `${definition.family}-${definition.variant}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),
  };
}

function rosePine(
  variant: string,
  name: string,
  palette: ThemePalette,
): ThemeDefinition {
  return define({
    name,
    family: 'Rosé Pine',
    variant,
    repository: 'rose-pine/neovim',
    colorscheme: variant === 'main' ? 'rose-pine' : `rose-pine-${variant}`,
    palette,
    roleMap: rosePineRoles,
  });
}

function catppuccin(variant: string, palette: ThemePalette): ThemeDefinition {
  const displayVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
  return define({
    name: `Catppuccin ${displayVariant}`,
    family: 'Catppuccin',
    variant,
    repository: 'catppuccin/nvim',
    colorscheme: `catppuccin-${variant}`,
    palette,
    roleMap: catppuccinRoles,
  });
}

function tokyoNight(
  variant: string,
  name: string,
  palette: ThemePalette,
): ThemeDefinition {
  return define({
    name,
    family: 'Tokyo Night',
    variant,
    repository: 'folke/tokyonight.nvim',
    colorscheme: `tokyonight-${variant}`,
    palette,
    roleMap: tokyoNightRoles,
  });
}

function builtin(name: string, palette: Record<SemanticRole, string>) {
  const native: ThemePalette = {};
  for (const role of Object.keys(builtinRoles) as SemanticRole[]) {
    native[builtinRoles[role]] = palette[role];
  }
  return define({
    id: `builtin-${name}`,
    name: `Neovim ${name}`,
    family: 'Neovim built-in',
    variant: name,
    colorscheme: name,
    builtin: true,
    palette: native,
    roleMap: builtinRoles,
  });
}

export const themeRegistry: ThemeDefinition[] = [
  rosePine('moon', 'Rosé Pine Moon', {
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
  }),
  rosePine('main', 'Rosé Pine', {
    base: '#191724',
    surface: '#1f1d2e',
    overlay: '#26233a',
    muted: '#6e6a86',
    subtle: '#908caa',
    text: '#e0def4',
    love: '#eb6f92',
    gold: '#f6c177',
    rose: '#ebbcba',
    pine: '#31748f',
    foam: '#9ccfd8',
    iris: '#c4a7e7',
  }),
  rosePine('dawn', 'Rosé Pine Dawn', {
    base: '#faf4ed',
    surface: '#fffaf3',
    overlay: '#f2e9e1',
    muted: '#9893a5',
    subtle: '#797593',
    text: '#464261',
    love: '#b4637a',
    gold: '#ea9d34',
    rose: '#d7827e',
    pine: '#286983',
    foam: '#56949f',
    iris: '#907aa9',
  }),
  catppuccin('mocha', {
    base: '#1e1e2e',
    mantle: '#181825',
    surface0: '#313244',
    overlay0: '#6c7086',
    subtext0: '#a6adc8',
    text: '#cdd6f4',
    red: '#f38ba8',
    yellow: '#f9e2af',
    peach: '#fab387',
    blue: '#89b4fa',
    teal: '#94e2d5',
    mauve: '#cba6f7',
  }),
  catppuccin('macchiato', {
    base: '#24273a',
    mantle: '#1e2030',
    surface0: '#363a4f',
    overlay0: '#6e738d',
    subtext0: '#a5adcb',
    text: '#cad3f5',
    red: '#ed8796',
    yellow: '#eed49f',
    peach: '#f5a97f',
    blue: '#8aadf4',
    teal: '#8bd5ca',
    mauve: '#c6a0f6',
  }),
  catppuccin('frappe', {
    base: '#303446',
    mantle: '#292c3c',
    surface0: '#414559',
    overlay0: '#737994',
    subtext0: '#a5adce',
    text: '#c6d0f5',
    red: '#e78284',
    yellow: '#e5c890',
    peach: '#ef9f76',
    blue: '#8caaee',
    teal: '#81c8be',
    mauve: '#ca9ee6',
  }),
  catppuccin('latte', {
    base: '#eff1f5',
    mantle: '#e6e9ef',
    surface0: '#ccd0da',
    overlay0: '#9ca0b0',
    subtext0: '#6c6f85',
    text: '#4c4f69',
    red: '#d20f39',
    yellow: '#df8e1d',
    peach: '#fe640b',
    blue: '#1e66f5',
    teal: '#179299',
    mauve: '#8839ef',
  }),
  tokyoNight('moon', 'Tokyo Night Moon', {
    bg: '#222436',
    bg_dark: '#1e2030',
    bg_highlight: '#2f334d',
    comment: '#636da6',
    fg_dark: '#828bb8',
    fg: '#c8d3f5',
    red: '#ff757f',
    yellow: '#ffc777',
    orange: '#ff966c',
    blue: '#82aaff',
    cyan: '#86e1fc',
    magenta: '#c099ff',
  }),
  tokyoNight('night', 'Tokyo Night', {
    bg: '#1a1b26',
    bg_dark: '#16161e',
    bg_highlight: '#292e42',
    comment: '#565f89',
    fg_dark: '#a9b1d6',
    fg: '#c0caf5',
    red: '#f7768e',
    yellow: '#e0af68',
    orange: '#ff9e64',
    blue: '#7aa2f7',
    cyan: '#7dcfff',
    magenta: '#bb9af7',
  }),
  tokyoNight('storm', 'Tokyo Night Storm', {
    bg: '#24283b',
    bg_dark: '#1f2335',
    bg_highlight: '#292e42',
    comment: '#545c7e',
    fg_dark: '#a9b1d6',
    fg: '#c0caf5',
    red: '#f7768e',
    yellow: '#e0af68',
    orange: '#ff9e64',
    blue: '#7aa2f7',
    cyan: '#7dcfff',
    magenta: '#bb9af7',
  }),
  tokyoNight('day', 'Tokyo Night Day', {
    bg: '#e1e2e7',
    bg_dark: '#d0d5e3',
    bg_highlight: '#c4c8da',
    comment: '#848cb5',
    fg_dark: '#6172b0',
    fg: '#3760bf',
    red: '#f52a65',
    yellow: '#8c6c3e',
    orange: '#b15c00',
    blue: '#2e7de9',
    cyan: '#007197',
    magenta: '#7847bd',
  }),
  define({
    name: 'Kanagawa Wave',
    family: 'Kanagawa',
    variant: 'wave',
    repository: 'rebelot/kanagawa.nvim',
    colorscheme: 'kanagawa-wave',
    palette: {
      sumiInk3: '#1f1f28',
      sumiInk4: '#2a2a37',
      sumiInk5: '#363646',
      fujiGray: '#727169',
      oldWhite: '#c8c093',
      fujiWhite: '#dcd7ba',
      waveRed: '#e46876',
      carpYellow: '#e6c384',
      surimiOrange: '#ffa066',
      springBlue: '#7fb4ca',
      waveAqua2: '#7aa89f',
      oniViolet: '#957fb8',
    },
    roleMap: roles(
      'sumiInk3',
      'sumiInk4',
      'sumiInk5',
      'fujiGray',
      'oldWhite',
      'fujiWhite',
      'waveRed',
      'carpYellow',
      'surimiOrange',
      'springBlue',
      'waveAqua2',
      'oniViolet',
    ),
  }),
  define({
    name: 'Kanagawa Dragon',
    family: 'Kanagawa',
    variant: 'dragon',
    repository: 'rebelot/kanagawa.nvim',
    colorscheme: 'kanagawa-dragon',
    palette: {
      dragonBlack3: '#181616',
      dragonBlack2: '#1d1c19',
      dragonBlack4: '#282727',
      dragonAsh: '#737c73',
      dragonGray: '#a6a69c',
      dragonWhite: '#c5c9c5',
      dragonRed: '#c4746e',
      dragonYellow: '#c4b28a',
      dragonOrange: '#b6927b',
      dragonBlue2: '#8ba4b0',
      dragonAqua: '#8ea4a2',
      dragonViolet: '#8992a7',
    },
    roleMap: roles(
      'dragonBlack3',
      'dragonBlack2',
      'dragonBlack4',
      'dragonAsh',
      'dragonGray',
      'dragonWhite',
      'dragonRed',
      'dragonYellow',
      'dragonOrange',
      'dragonBlue2',
      'dragonAqua',
      'dragonViolet',
    ),
  }),
  define({
    name: 'Gruvbox Dark',
    family: 'Gruvbox',
    variant: 'dark',
    repository: 'ellisonleao/gruvbox.nvim',
    colorscheme: 'gruvbox',
    palette: {
      dark0: '#282828',
      dark1: '#1d2021',
      dark2: '#3c3836',
      gray: '#665c54',
      light4: '#a89984',
      light1: '#ebdbb2',
      bright_red: '#fb4934',
      bright_yellow: '#fabd2f',
      bright_orange: '#fe8019',
      bright_blue: '#83a598',
      bright_aqua: '#8ec07c',
      bright_purple: '#d3869b',
    },
    roleMap: roles(
      'dark0',
      'dark1',
      'dark2',
      'gray',
      'light4',
      'light1',
      'bright_red',
      'bright_yellow',
      'bright_orange',
      'bright_blue',
      'bright_aqua',
      'bright_purple',
    ),
  }),
  define({
    name: 'Everforest Dark',
    family: 'Everforest',
    variant: 'medium',
    repository: 'sainnhe/everforest',
    colorscheme: 'everforest',
    palette: {
      bg0: '#2d353b',
      bg1: '#343f44',
      bg2: '#3d484d',
      grey0: '#7a8478',
      grey1: '#9da9a0',
      fg: '#d3c6aa',
      red: '#e67e80',
      yellow: '#dbbc7f',
      orange: '#e69875',
      blue: '#7fbbb3',
      aqua: '#83c092',
      purple: '#d699b6',
    },
    roleMap: roles(
      'bg0',
      'bg1',
      'bg2',
      'grey0',
      'grey1',
      'fg',
      'red',
      'yellow',
      'orange',
      'blue',
      'aqua',
      'purple',
    ),
  }),
  define({
    name: 'Nord',
    family: 'Nord',
    variant: 'dark',
    repository: 'shaunsingh/nord.nvim',
    colorscheme: 'nord',
    palette: {
      nord0: '#2e3440',
      nord1: '#3b4252',
      nord2: '#434c5e',
      nord3: '#4c566a',
      nord4: '#d8dee9',
      nord6: '#eceff4',
      nord11: '#bf616a',
      nord13: '#ebcb8b',
      nord12: '#d08770',
      nord9: '#81a1c1',
      nord8: '#88c0d0',
      nord15: '#b48ead',
    },
    roleMap: roles(
      'nord0',
      'nord1',
      'nord2',
      'nord3',
      'nord4',
      'nord6',
      'nord11',
      'nord13',
      'nord12',
      'nord9',
      'nord8',
      'nord15',
    ),
  }),
  builtin('default', {
    base: '#14161b',
    surface: '#2c2e33',
    overlay: '#2c2e33',
    muted: '#9b9ea4',
    subtle: '#4f5258',
    text: '#e0e2ea',
    love: '#ffc0b9',
    gold: '#b3f6c0',
    rose: '#e0e2ea',
    pine: '#e0e2ea',
    foam: '#8cf8f7',
    iris: '#e0e2ea',
  }),
  builtin('habamax', {
    base: '#1c1c1c',
    surface: '#767676',
    overlay: '#3a3a3a',
    muted: '#767676',
    subtle: '#585858',
    text: '#c7c7c7',
    love: '#ff0000',
    gold: '#5faf5f',
    rose: '#d75f87',
    pine: '#5f87af',
    foam: '#87afaf',
    iris: '#af87af',
  }),
  builtin('lunaperche', {
    base: '#000000',
    surface: '#000000',
    overlay: '#303030',
    muted: '#5fafff',
    subtle: '#585858',
    text: '#c6c6c6',
    love: '#ff0000',
    gold: '#ffd787',
    rose: '#ff87ff',
    pine: '#5fd75f',
    foam: '#00ffff',
    iris: '#e4e4e4',
  }),
  builtin('quiet', {
    base: '#000000',
    surface: '#000000',
    overlay: '#a8a8a8',
    muted: '#707070',
    subtle: '#585858',
    text: '#dadada',
    love: '#ff0000',
    gold: '#dadada',
    rose: '#dadada',
    pine: '#dadada',
    foam: '#dadada',
    iris: '#dadada',
  }),
  builtin('retrobox', {
    base: '#1c1c1c',
    surface: '#a89984',
    overlay: '#3c3836',
    muted: '#928374',
    subtle: '#7c6f64',
    text: '#ebdbb2',
    love: '#ff0000',
    gold: '#b8bb26',
    rose: '#d3869b',
    pine: '#fabd2f',
    foam: '#b8bb26',
    iris: '#fb5944',
  }),
  builtin('sorbet', {
    base: '#161821',
    surface: '#000000',
    overlay: '#a6a8b1',
    muted: '#af87d7',
    subtle: '#5f5f87',
    text: '#dadada',
    love: '#ff0000',
    gold: '#d7af5f',
    rose: '#d75f5f',
    pine: '#87afd7',
    foam: '#87d75f',
    iris: '#87afd7',
  }),
  builtin('unokai', {
    base: '#282923',
    surface: '#74705d',
    overlay: '#585858',
    muted: '#74705d',
    subtle: '#8a8a8a',
    text: '#f8f8f2',
    love: '#ff0000',
    gold: '#e6db74',
    rose: '#ae81ff',
    pine: '#fd971f',
    foam: '#a6e22e',
    iris: '#f92672',
  }),
];

export const defaultTheme = themeRegistry[0];

export const semanticRoleLabels: Record<SemanticRole, string> = {
  base: 'Editor background',
  surface: 'Panels and statusline',
  overlay: 'Popups and floating windows',
  muted: 'Comments and guides',
  subtle: 'Secondary text',
  text: 'Primary text',
  love: 'Errors and deletions',
  gold: 'Strings and warnings',
  rose: 'Numbers and constants',
  pine: 'Types and information',
  foam: 'Functions and methods',
  iris: 'Keywords and operators',
};

export function themeColors(theme: ThemeDefinition) {
  return Object.fromEntries(
    (Object.keys(theme.roleMap) as SemanticRole[]).map((role) => [
      role,
      theme.palette[theme.roleMap[role]],
    ]),
  ) as Record<SemanticRole, string>;
}

export function rolesForVariable(theme: ThemeDefinition, variable: string) {
  return (Object.keys(theme.roleMap) as SemanticRole[]).filter(
    (role) => theme.roleMap[role] === variable,
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findRepository(input: string) {
  const url = input.match(
    /https?:\/\/(?:www\.)?github\.com\/([\w.-]+\/[\w.-]+)/i,
  );
  if (url) return url[1].replace(/\.git$/i, '').toLowerCase();
  const lazy = input.match(/["']([\w.-]+\/[\w.-]+)["']/);
  return lazy?.[1].replace(/\.git$/i, '').toLowerCase();
}

function findColorscheme(input: string) {
  const patterns = [
    /colorscheme\s*\(?\s*["']?([\w-]+)/i,
    /vim\.cmd(?:\.colorscheme)?\s*\(?\s*["'](?:colorscheme\s+)?([\w-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1].toLowerCase();
  }
}

function findVariant(input: string) {
  return input
    .match(/(?:flavou?r|style|variant|theme)\s*=\s*["']([\w-]+)["']/i)?.[1]
    .toLowerCase();
}

function extractNamedColors(input: string) {
  const colors = new Map<string, { name: string; color: string }>();
  const assignment =
    /["']?([a-zA-Z@][\w.@-]*)["']?\s*[:=]\s*["'](#[\da-fA-F]{6})["']/g;
  for (const match of input.matchAll(assignment)) {
    colors.set(normalize(match[1]), {
      name: match[1],
      color: match[2].toLowerCase(),
    });
  }
  return colors;
}

function chooseRegisteredTheme(input: string, repository?: string) {
  const candidates = repository
    ? themeRegistry.filter(
        (theme) => theme.repository?.toLowerCase() === repository,
      )
    : themeRegistry;
  const colorscheme = findColorscheme(input);
  const variant = findVariant(input);
  if (!repository) {
    return candidates.find((theme) => theme.colorscheme === colorscheme);
  }
  const defaultVariants: Record<string, string> = {
    'rose-pine/neovim': 'main',
    'catppuccin/nvim': 'mocha',
    'folke/tokyonight.nvim': 'moon',
    'rebelot/kanagawa.nvim': 'wave',
  };
  const defaultVariant = repository ? defaultVariants[repository] : undefined;
  return (
    candidates.find((theme) => theme.colorscheme === colorscheme) ??
    candidates.find((theme) => theme.variant === variant) ??
    candidates.find((theme) => theme.variant === defaultVariant) ??
    candidates[0]
  );
}

const customAliases: Record<SemanticRole, string[]> = {
  base: ['base', 'base00', 'background', 'bg0', 'bg', 'normalbg'],
  surface: ['surface', 'mantle', 'base01', 'bg1', 'bgdark'],
  overlay: ['overlay', 'surface0', 'base02', 'bg2', 'bghighlight', 'bgfloat'],
  muted: ['muted', 'base03', 'comment', 'gray', 'grey', 'overlay0'],
  subtle: ['subtle', 'base04', 'subtext0', 'fgdark', 'fgsidebar'],
  text: ['text', 'base05', 'foreground', 'fg', 'fg1'],
  love: ['love', 'base08', 'red', 'error'],
  gold: ['gold', 'base0a', 'yellow', 'warning'],
  rose: ['rose', 'base09', 'orange', 'peach'],
  pine: ['pine', 'base0d', 'blue', 'info'],
  foam: ['foam', 'base0c', 'cyan', 'teal', 'aqua'],
  iris: ['iris', 'base0e', 'purple', 'magenta', 'mauve'],
};

function customTheme(
  input: string,
  colors: Map<string, { name: string; color: string }>,
): ThemeImportResult {
  const roleMap = {} as Record<SemanticRole, string>;
  for (const [role, aliases] of Object.entries(customAliases) as [
    SemanticRole,
    string[],
  ][]) {
    const value = aliases.map(normalize).find((alias) => colors.has(alias));
    if (value) roleMap[role] = colors.get(value)!.name;
  }
  const matchedColors = Object.keys(roleMap).length;
  if (matchedColors < 8 || !roleMap.base || !roleMap.text) {
    throw new Error(
      'This theme is not in the adapter registry and its code does not expose enough named hex colors—including a background and foreground—for a reliable preview.',
    );
  }

  const fallbackRoles: Record<SemanticRole, SemanticRole[]> = {
    base: ['text'],
    surface: ['base'],
    overlay: ['surface', 'base'],
    muted: ['subtle', 'text'],
    subtle: ['muted', 'text'],
    text: ['base'],
    love: ['rose', 'gold', 'text'],
    gold: ['rose', 'love', 'text'],
    rose: ['gold', 'love', 'text'],
    pine: ['foam', 'iris', 'text'],
    foam: ['pine', 'iris', 'text'],
    iris: ['pine', 'foam', 'text'],
  };
  for (const role of Object.keys(customAliases) as SemanticRole[]) {
    if (!roleMap[role]) {
      const fallback = fallbackRoles[role].find(
        (candidate) => roleMap[candidate],
      );
      if (fallback) roleMap[role] = roleMap[fallback];
    }
  }

  const palette = Object.fromEntries(
    [...colors.values()].map(({ name, color }) => [name, color]),
  );
  let name = findColorscheme(input) ?? 'Imported palette';
  try {
    const parsed = JSON.parse(input) as { name?: unknown };
    if (typeof parsed.name === 'string' && parsed.name.trim())
      name = parsed.name;
  } catch {
    // Lua and Vim files are valid import inputs too.
  }
  return {
    theme: define({
      id: `imported-${Date.now()}`,
      name,
      family: 'Imported',
      variant: 'custom',
      colorscheme: findColorscheme(input) ?? 'custom',
      palette,
      roleMap,
    }),
    matchedColors,
    note:
      matchedColors === 12
        ? 'Mapped every preview role from the theme’s own variables.'
        : `Mapped ${matchedColors} preview roles; closely related roles share the nearest theme variable.`,
  };
}

export function parseThemeInput(input: string): ThemeImportResult {
  if (!input.trim())
    throw new Error(
      'Paste a supported GitHub URL, Lazy.nvim spec, or palette.',
    );
  const repository = findRepository(input);
  const colors = extractNamedColors(input);

  if (repository) {
    const registered = chooseRegisteredTheme(input, repository);
    if (!registered) {
      if (colors.size >= 8) return customTheme(input, colors);
      throw new Error(
        `No Theme Lab adapter exists for ${repository}. Paste a palette containing named hex colors instead.`,
      );
    }
    const palette = { ...registered.palette };
    let overrides = 0;
    for (const variable of Object.keys(palette)) {
      const custom = colors.get(normalize(variable));
      if (custom) {
        palette[variable] = custom.color;
        overrides += 1;
      }
    }
    return {
      theme: { ...registered, palette },
      matchedColors: Object.keys(palette).length,
      note:
        overrides > 0
          ? `Matched ${registered.repository} and applied ${overrides} native palette override${overrides === 1 ? '' : 's'}.`
          : `Matched the ${registered.name} adapter from its GitHub repository.`,
    };
  }

  const registered = chooseRegisteredTheme(input);
  if (registered && (findColorscheme(input) || findVariant(input))) {
    const palette = { ...registered.palette };
    let overrides = 0;
    for (const variable of Object.keys(palette)) {
      const custom = colors.get(normalize(variable));
      if (custom) {
        palette[variable] = custom.color;
        overrides += 1;
      }
    }
    return {
      theme: { ...registered, palette },
      matchedColors: Object.keys(registered.palette).length,
      note:
        overrides > 0
          ? `Matched ${registered.name} and applied ${overrides} native palette override${overrides === 1 ? '' : 's'}.`
          : `Matched the bundled ${registered.name} adapter.`,
    };
  }

  return customTheme(input, colors);
}

export function createThemeJson(theme: ThemeDefinition) {
  return JSON.stringify(
    {
      name: theme.name,
      repository: theme.repository,
      colorscheme: theme.colorscheme,
      variant: theme.variant,
      palette: theme.palette,
      roleMap: theme.roleMap,
    },
    null,
    2,
  );
}

export function createLazyCode(theme: ThemeDefinition) {
  const semantic = themeColors(theme);
  const setup = theme.repository
    ? `  "${theme.repository}",\n  lazy = false,\n  priority = 1000,\n  config = function()`
    : `  dir = vim.env.VIMRUNTIME,\n  config = function()`;
  return `return {\n${setup}\n    vim.cmd.colorscheme("${theme.colorscheme}")\n\n    -- Theme Lab preview overrides\n    local colors = ${JSON.stringify(semantic, null, 6).replace(/"([^"]+)":/g, '$1 =')}\n    vim.api.nvim_set_hl(0, "Normal", { fg = colors.text, bg = colors.base })\n    vim.api.nvim_set_hl(0, "NormalFloat", { fg = colors.text, bg = colors.overlay })\n    vim.api.nvim_set_hl(0, "Comment", { fg = colors.muted })\n    vim.api.nvim_set_hl(0, "String", { fg = colors.gold })\n    vim.api.nvim_set_hl(0, "Number", { fg = colors.rose })\n    vim.api.nvim_set_hl(0, "Type", { fg = colors.pine })\n    vim.api.nvim_set_hl(0, "Function", { fg = colors.foam })\n    vim.api.nvim_set_hl(0, "Keyword", { fg = colors.iris })\n    vim.api.nvim_set_hl(0, "DiagnosticError", { fg = colors.love })\n  end,\n}\n`;
}

export const supportedThemeNames = [
  'GitHub links: Rosé Pine, Catppuccin, Tokyo Night, Kanagawa, Gruvbox, Everforest, Nord',
  'Built-ins: default, habamax, lunaperche, quiet, retrobox, sorbet, unokai',
];
