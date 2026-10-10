import { Icon } from './icons';
import { Tile } from './Tile';
import { useTheme, type Theme } from './theme';
import styles from './canvas.module.css';
import { LocalWorkspace } from './local/LocalWorkspace';

const themes: Theme[] = ['system', 'light', 'dark'];

export function App() {
  const { theme, setTheme, storageWarning } = useTheme();
  return (
    <div className={styles.app}>
      <a href="#canvas" className={styles.skipLink}>
        Skip to canvas
      </a>
      <header className={styles.header}>
        <a href="#canvas" className={styles.brand} aria-label="Nexus OS canvas">
          <span className={styles.logo}>N</span>Nexus
          <span className={styles.os}>OS</span>
        </a>
        <span className={styles.headerLabel}>
          <Icon name="grid" />
          Your canvas
        </span>
        <fieldset className={styles.themeControl}>
          <legend className={styles.srOnly}>Theme</legend>
          {themes.map((value) => (
            <label
              key={value}
              title={`${value.charAt(0).toUpperCase()}${value.slice(1)} theme`}
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => setTheme(value)}
              />
              <span>
                <Icon
                  name={
                    value === 'light'
                      ? 'sun'
                      : value === 'dark'
                        ? 'moon'
                        : 'system'
                  }
                />
                <span className={styles.srOnly}>
                  {value.charAt(0).toUpperCase()}
                  {value.slice(1)} theme
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      </header>
      <main id="canvas" className={styles.main} tabIndex={-1}>
        <div className={styles.introduction}>
          <div>
            <p className={styles.eyebrow}>SPACE TO THINK, ROOM TO ACT</p>
            <h1>
              A little room
              <br />
              for everything.
            </h1>
          </div>
          <div className={styles.introAside}>
            <span className={styles.phase}>LOCAL / PRIVATE</span>
            <p>
              One calm canvas.
              <br />
              Ready to grow with your day.
            </p>
          </div>
        </div>
        <div className={styles.canvasHeading}>
          <p>
            <Icon name="grid" />
            The starting point
          </p>
          <span>3 sample tiles</span>
        </div>
        <section aria-label="Sample canvas" className={styles.canvas}>
          <Tile
            id="workspace"
            title="A place to bring it together."
            label="01 / WORKSPACE"
            description="An open space for the things that matter. Expand a tile when you need more room."
            wide
          >
            <div className={styles.workspaceSketch}>
              <div className={styles.sketchLabel}>YOUR SPACE, TAKING SHAPE</div>
              <div className={styles.sketchRows}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.sketchCircle}>
                <Icon name="expand" />
              </div>
            </div>
          </Tile>
          <Tile
            id="rhythm"
            title="Room to focus."
            label="02 / RHYTHM"
            description="A quieter canvas starts with a little breathing room."
          >
            <div className={styles.rhythmSketch}>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </Tile>
          <Tile
            id="horizon"
            title="Space for what comes next."
            label="03 / HORIZON"
            description="The foundation is here. Your modules will find their place in later phases."
          >
            <div className={styles.horizonSketch}>
              <span />
              <span />
              <span />
            </div>
          </Tile>
        </section>
        <LocalWorkspace />
        {storageWarning && (
          <p role="status" className={styles.notice}>
            Your theme works for this visit. Browser storage is unavailable, so
            it cannot be saved.
          </p>
        )}
        <footer className={styles.footer}>
          <span>
            <span className={styles.statusDot} />
            Designed for local-first use
          </span>
          <span>Your records stay on this device.</span>
          <span>NEXUS OS / 0.1</span>
        </footer>
      </main>
    </div>
  );
}
