import type { Theme } from './theme';
import { navigation } from './product/navigation';
import { NavIcon } from './product/NavIcon';
import { Icon } from './icons';
import s from './product/product.module.css';

export function Sidebar({
  mobile,
  petEnabled,
  deep,
  displayPage,
  theme,
  setTheme,
  onClose,
}: {
  mobile: boolean;
  petEnabled: boolean;
  deep: boolean;
  displayPage: string;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onClose: () => void;
}) {
  return (
    <aside
      className={s.sidebar}
      data-open={mobile}
      aria-label="Workspace sidebar"
    >
      <a className={s.brand} href="#briefing">
        <span className={s.logo}>C</span>
        <span className={s.brandText}>Catalyst</span>
      </a>
      <nav aria-label="Catalyst pages">
        {navigation.map((group) => (
          <div className={s.navGroup} key={group.group}>
            <p className={s.navLabel}>{group.group}</p>
            {group.links
              .filter((l) => l[0] !== 'pet' || petEnabled)
              .map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  title={label}
                  className={s.navLink}
                  data-dim={
                    deep &&
                    ![
                      'briefing',
                      'tasks',
                      'calendar',
                      'records',
                      'profile',
                    ].includes(id ?? '')
                  }
                  aria-current={displayPage === id ? 'page' : undefined}
                  onClick={() => onClose()}
                >
                  <span className={s.navIcon} aria-hidden="true">
                    <NavIcon page={id ?? 'briefing'} />
                  </span>
                  <span className={s.navText}>{label}</span>
                </a>
              ))}
          </div>
        ))}
      </nav>
      <div className={s.sidebarFoot}>
        <p>LOCAL / PRIVATE / YOURS</p>
        <fieldset className={s.theme}>
          <legend>Theme</legend>
          {(['system', 'light', 'dark'] as Theme[]).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="theme"
                checked={theme === value}
                onChange={() => setTheme(value)}
              />
              <span className={s.srOnly}>
                {value.charAt(0).toUpperCase() + value.slice(1)} theme
              </span>
              <span aria-hidden="true" className={s.themeGlyph}>
                <Icon
                  name={
                    value === 'light'
                      ? 'sun'
                      : value === 'dark'
                        ? 'moon'
                        : 'system'
                  }
                />
              </span>
              <span aria-hidden="true" className={s.themeText}>
                {value}
              </span>
            </label>
          ))}
        </fieldset>
        <p>Your records stay on this device.</p>
        <button
          type="button"
          className={s.mobileMenu}
          onClick={() => onClose()}
        >
          Close navigation
        </button>
      </div>
    </aside>
  );
}
