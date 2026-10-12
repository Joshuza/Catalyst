import { Component, type ReactNode } from 'react';
import styles from './canvas.module.css';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // No telemetry or automatic network reporting.
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className={styles.errorScreen}>
        <p className={styles.eyebrow}>CATALYST</p>
        <h1>The canvas could not open.</h1>
        <p>Reload to try again. Your browser data will stay in place.</p>
        <button
          className={styles.textButton}
          onClick={() => window.location.reload()}
        >
          Reload canvas
        </button>
      </main>
    );
  }
}
