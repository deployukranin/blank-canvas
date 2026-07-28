/**
 * Vercel Edge Middleware — SSR-injects the tenant theme into index.html
 * BEFORE the browser paints, eliminating any color flash on first load.
 *
 * Runs only for HTML navigations (matcher excludes assets, api, files with extensions).
 * Resolves store slug from pathname → fetches white_label_config via PostgREST →
 * injects <html class>, a <style id="ssr-theme"> with the critical CSS vars,
 * and a <meta name="theme-bootstrap"> with the full config JSON so
 * public/theme-init.js can seed localStorage for subsequent loads.
 */

export const config = {
  // Match any path that doesn't contain a dot (no extensions) and isn't /api or /assets
  matcher: ['/((?!api/|assets/|_vercel/|.*\\..*).*)'],
};

const RESERVED = new Set([
  '', '__global', 'admin', 'super-admin', 'admin-master', 'entrar', 'auth',
  'setup', 'api', 'assets', 'vip', 'checkout', 'dashboard', 'ajuda', 'legal',
]);

const SUPABASE_URL = 'https://lkwvlzcapuptcxvwukcm.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3ZsemNhcHVwdGN4dnd1a2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjExNTQsImV4cCI6MjA4NDQ5NzE1NH0.owIJ82z7AxBazVKp2UxU_44WC2myqjL8ThX7ixNcDq8';

type ThemeConfig = {
  colors?: {
    primary?: string;
    accent?: string;
    mode?: 'dark' | 'light';
  };
};

async function fetchTheme(slug: string | null): Promise<ThemeConfig | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 400);
    const url = slug
      ? `${SUPABASE_URL}/rest/v1/stores?slug=eq.${encodeURIComponent(slug)}&select=id,app_configurations(config_value,config_key)&app_configurations.config_key=eq.white_label_config`
      : `${SUPABASE_URL}/rest/v1/app_configurations?store_id=is.null&config_key=eq.white_label_config&select=config_value`;
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        apikey: SUPABASE_ANON,
        authorization: `Bearer ${SUPABASE_ANON}`,
        accept: 'application/json',
      },
      // Edge cache: theme changes rarely; SWR keeps first paint instant.
      // @ts-ignore Vercel-specific cache directives
      cache: 'force-cache',
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data: any = await res.json();
    if (slug) {
      const cfg = data?.[0]?.app_configurations?.[0]?.config_value;
      return cfg ?? null;
    }
    return data?.[0]?.config_value ?? null;
  } catch {
    return null;
  }
}

function buildStyle(cfg: ThemeConfig): { css: string; mode: 'dark' | 'light'; hue: string } {
  const colors = cfg.colors || {};
  const primary = colors.primary || '263 70% 58%';
  const hue = (primary.split(/\s+/)[0] || '263').trim();
  const isLight = colors.mode === 'light';
  const mode: 'dark' | 'light' = isLight ? 'light' : 'dark';

  const dark = `--background:0 0% 4%;--foreground:0 0% 95%;--card:0 0% 8%;--card-foreground:0 0% 95%;--popover:0 0% 7%;--popover-foreground:0 0% 95%;--secondary:0 0% 14%;--secondary-foreground:0 0% 95%;--muted:0 0% 12%;--muted-foreground:0 0% 55%;--border:0 0% 16%;--input:0 0% 12%;--accent-foreground:0 0% 95%;--gradient-mesh:radial-gradient(ellipse at 18% 18%, hsl(${hue} 70% 58% / 0.08) 0%, transparent 55%),radial-gradient(ellipse at 82% 78%, hsl(${hue} 50% 40% / 0.06) 0%, transparent 55%),radial-gradient(ellipse at 50% 55%, hsl(${hue} 30% 20% / 0.04) 0%, transparent 70%);`;
  const light = `--background:0 0% 98%;--foreground:0 0% 5%;--card:0 0% 100%;--card-foreground:0 0% 5%;--popover:0 0% 100%;--popover-foreground:0 0% 5%;--secondary:0 0% 94%;--secondary-foreground:0 0% 8%;--muted:0 0% 94%;--muted-foreground:0 0% 30%;--border:0 0% 85%;--input:0 0% 88%;--accent-foreground:0 0% 5%;--gradient-mesh:none;`;

  const shared = `--primary:${primary};--primary-foreground:0 0% 100%;--accent:${
    isLight ? `${hue} 40% 92%` : colors.accent || '263 50% 25%'
  };--ring:${primary};`;

  const css = `:root{${isLight ? light : dark}${shared}}`;
  return { css, mode, hue };
}

export default async function middleware(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const seg = (url.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
  const slug = seg && !RESERVED.has(seg) ? seg : null;

  // Fetch the built index.html from the same deployment
  const assetRes = await fetch(new URL('/index.html', url.origin), {
    headers: { 'x-mw-passthrough': '1' },
  });
  if (!assetRes.ok || !assetRes.headers.get('content-type')?.includes('text/html')) {
    return assetRes;
  }
  let html = await assetRes.text();

  const cfg = await fetchTheme(slug);
  if (cfg && cfg.colors) {
    const { css, mode } = buildStyle(cfg);
    const themeClass = `${mode} theme-${mode}`;
    // Add class to <html>
    html = html.replace(/<html([^>]*)>/i, (m, attrs) => {
      if (/\sclass=/.test(attrs)) {
        return `<html${attrs.replace(/class="([^"]*)"/, `class="$1 ${themeClass}"`)}>`;
      }
      return `<html${attrs} class="${themeClass}">`;
    });
    // Inject <style> + <meta> before </head>
    const bootstrap = JSON.stringify(cfg).replace(/</g, '\\u003c');
    const injection =
      `<style id="ssr-theme">${css}</style>` +
      `<meta name="theme-bootstrap" content='${bootstrap.replace(/'/g, '&#39;')}'>`;
    html = html.replace('</head>', `${injection}</head>`);
  }

  const headers = new Headers(assetRes.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store, no-cache, must-revalidate');
  headers.delete('content-length');
  return new Response(html, { status: 200, headers });
}
