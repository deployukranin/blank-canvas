// Apply cached theme BEFORE React renders to prevent FOUC.
// Kept external (not inline) so we can drop 'unsafe-inline' from script-src.
(function () {
  try {
    var seg = (location.pathname.split('/').filter(Boolean)[0] || '__global').toLowerCase();
    var isTenantRoute = seg !== '__global' && !['admin', 'super-admin', 'entrar', 'auth', 'setup'].includes(seg);
    var cached = localStorage.getItem('whitelabel_cache_' + seg);
    if (!cached && !isTenantRoute) cached = localStorage.getItem('whitelabel_config_cache');
    if (!cached) return;

    var cfg = JSON.parse(cached);
    var colors = cfg && cfg.colors;
    if (!colors) return;

    var r = document.documentElement;
    var p = colors.primary || '263 70% 58%';
    var parts = p.split(/\s+/);
    var hue = parts[0] || '263';
    var isLight = colors.mode === 'light';
    var modeClass = isLight ? 'light' : 'dark';

    r.classList.remove('dark', 'light', 'theme-dark', 'theme-light');
    r.classList.add(modeClass, isLight ? 'theme-light' : 'theme-dark');

    if (isLight) {
      r.style.setProperty('--background', '0 0% 98%');
      r.style.setProperty('--foreground', '0 0% 5%');
      r.style.setProperty('--card', '0 0% 100%');
      r.style.setProperty('--card-foreground', '0 0% 5%');
      r.style.setProperty('--popover', '0 0% 100%');
      r.style.setProperty('--popover-foreground', '0 0% 5%');
      r.style.setProperty('--secondary', '0 0% 94%');
      r.style.setProperty('--secondary-foreground', '0 0% 8%');
      r.style.setProperty('--muted', '0 0% 94%');
      r.style.setProperty('--muted-foreground', '0 0% 30%');
      r.style.setProperty('--border', '0 0% 85%');
      r.style.setProperty('--input', '0 0% 88%');
      r.style.setProperty('--accent-foreground', '0 0% 5%');
      r.style.setProperty('--sidebar-background', '0 0% 97%');
      r.style.setProperty('--sidebar-foreground', '0 0% 15%');
      r.style.setProperty('--sidebar-accent', hue + ' 30% 94%');
      r.style.setProperty('--sidebar-accent-foreground', '0 0% 5%');
      r.style.setProperty('--sidebar-border', '0 0% 88%');
      r.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(' + p + '), hsl(' + hue + ' 60% 45%))');
      r.style.setProperty('--gradient-accent', 'linear-gradient(135deg, hsl(' + hue + ' 50% 55%), hsl(' + hue + ' 40% 45%))');
      r.style.setProperty('--shadow-glass', '0 4px 24px hsl(0 0% 0% / 0.06), inset 0 1px 0 hsl(0 0% 100% / 0.6)');
      r.style.setProperty('--shadow-glow', '0 0 30px hsl(' + hue + ' 70% 58% / 0.08)');
      r.style.setProperty('--shadow-card', '0 2px 12px hsl(0 0% 0% / 0.06)');
      r.style.setProperty('--glass-border', 'hsl(' + hue + ' 30% 50% / 0.12)');
      r.style.setProperty('--glass-highlight', 'hsl(' + hue + ' 30% 50% / 0.06)');
      r.style.setProperty('--gradient-mesh', 'none');
    } else {
      r.style.setProperty('--background', '0 0% 4%');
      r.style.setProperty('--foreground', '0 0% 95%');
      r.style.setProperty('--card', '0 0% 8%');
      r.style.setProperty('--card-foreground', '0 0% 95%');
      r.style.setProperty('--popover', '0 0% 7%');
      r.style.setProperty('--popover-foreground', '0 0% 95%');
      r.style.setProperty('--secondary', '0 0% 14%');
      r.style.setProperty('--secondary-foreground', '0 0% 95%');
      r.style.setProperty('--muted', '0 0% 12%');
      r.style.setProperty('--muted-foreground', '0 0% 55%');
      r.style.setProperty('--border', '0 0% 16%');
      r.style.setProperty('--input', '0 0% 12%');
      r.style.setProperty('--accent-foreground', '0 0% 95%');
      r.style.setProperty('--sidebar-background', '0 0% 6%');
      r.style.setProperty('--sidebar-foreground', '0 0% 90%');
      r.style.setProperty('--sidebar-accent', hue + ' 50% 15%');
      r.style.setProperty('--sidebar-accent-foreground', '0 0% 95%');
      r.style.setProperty('--sidebar-border', '0 0% 14%');
      r.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(' + p + '), hsl(' + hue + ' 50% 35%))');
      r.style.setProperty('--gradient-accent', 'linear-gradient(135deg, hsl(' + hue + ' 60% 50%), hsl(' + hue + ' 40% 30%))');
      r.style.setProperty('--shadow-glass', '0 8px 32px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(' + hue + ' 70% 58% / 0.05)');
      r.style.setProperty('--shadow-glow', '0 0 40px hsl(' + hue + ' 70% 58% / 0.12)');
      r.style.setProperty('--shadow-card', '0 4px 24px hsl(0 0% 0% / 0.6)');
      r.style.setProperty('--glass-border', 'hsl(' + hue + ' 70% 58% / 0.12)');
      r.style.setProperty('--glass-highlight', 'hsl(' + hue + ' 70% 58% / 0.06)');
      r.style.setProperty(
        '--gradient-mesh',
        'radial-gradient(ellipse at 18% 18%, hsl(' + hue + ' 70% 58% / 0.08) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 82% 78%, hsl(' + hue + ' 50% 40% / 0.06) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 50% 55%, hsl(' + hue + ' 30% 20% / 0.04) 0%, transparent 70%)'
      );
    }

    r.style.setProperty('--primary', p);
    r.style.setProperty('--primary-foreground', '0 0% 100%');
    r.style.setProperty('--accent', isLight ? hue + ' 40% 92%' : (colors.accent || '263 50% 25%'));
    r.style.setProperty('--ring', p);
    r.style.setProperty('--sidebar-primary', p);
    r.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
    r.style.setProperty('--sidebar-ring', p);
  } catch (e) {}
})();
