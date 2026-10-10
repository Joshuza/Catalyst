import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('Phase 0 canvas', () => {
  it('starts with exactly three clearly labeled sample tiles and no invented records', () => {
    render(<App />);
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getAllByText('Sample')).toHaveLength(3);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.length).toBe(1);
  });
  it('expands, collapses, and dims a tile through accessible buttons', () => {
    render(<App />);
    const expand = screen.getAllByRole('button', { name: 'Expand tile' })[0];
    if (!expand) throw new Error('Missing tile control.');
    fireEvent.click(expand);
    expect(
      screen.getByRole('button', { name: 'Collapse tile' }),
    ).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Collapse tile' }));
    expect(screen.getAllByRole('button', { name: 'Expand tile' })).toHaveLength(
      3,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Dim A place to bring it together.' }),
    );
    expect(
      screen.getByRole('button', {
        name: 'Restore A place to bring it together.',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
  it('persists only the theme setting and restores it on reload', () => {
    localStorage.setItem('nexus.theme', 'dark');
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(screen.getByRole('radio', { name: 'Light theme' }));
    expect(localStorage.getItem('nexus.theme')).toBe('light');
  });
  it('falls back to the system theme for invalid saved settings', () => {
    localStorage.setItem('nexus.theme', 'unexpected');
    render(<App />);
    expect(screen.getByRole('radio', { name: 'System theme' })).toBeChecked();
  });
});
