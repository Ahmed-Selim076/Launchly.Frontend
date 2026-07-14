import { Injectable } from '@angular/core';
import { ITenant } from '../models';

@Injectable({ providedIn: 'root' })
export class TenantThemeService {
  /**
   * Injects --tenant-primary / --tenant-secondary (storefront tokens) AND
   * derives --color-accent + its hover/light/dim variants (admin-panel
   * tokens) from the same tenant.primaryColor. Before this, the admin
   * panel used a hardcoded orange regardless of the merchant's brand color
   * — now both surfaces share one source of truth.
   * Called once after TenantService.loadTenant() resolves.
   */
  applyTheme(tenant: Pick<ITenant, 'primaryColor' | 'secondaryColor'>): void {
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary',   tenant.primaryColor);
    root.style.setProperty('--tenant-secondary', tenant.secondaryColor);
    this.#applyAccentFrom(tenant.primaryColor);
  }

  /** Preview mode — used in Settings live preview panel */
  previewTheme(primary: string, secondary: string): void {
    document.documentElement.style.setProperty('--tenant-primary',   primary);
    document.documentElement.style.setProperty('--tenant-secondary', secondary);
    this.#applyAccentFrom(primary);
  }

  /** Reset to design-system defaults (used when leaving tenant context) */
  resetTheme(): void {
    const root = document.documentElement;
    root.style.removeProperty('--tenant-primary');
    root.style.removeProperty('--tenant-secondary');
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--color-accent-hover');
    root.style.removeProperty('--color-accent-light');
    root.style.removeProperty('--color-accent-dim');
    root.style.removeProperty('--color-accent-dim-txt');
  }

  // ─── Derivation ─────────────────────────────────────────────────────────

  #applyAccentFrom(hex: string): void {
    const hsl = this.#hexToHsl(hex);
    if (!hsl) return; // malformed hex mid-typing in Settings — keep last-good value
    const [h, s, l] = hsl;
    const root = document.documentElement;

    root.style.setProperty('--color-accent',         hex);
    root.style.setProperty('--color-accent-hover',    this.#hsl(h, s, Math.max(l - 10, 0)));
    root.style.setProperty('--color-accent-light',     this.#hsl(h, s, Math.min(l + 15, 90)));
    root.style.setProperty('--color-accent-dim',       this.#hsl(h, Math.min(s, 60), 95));
    root.style.setProperty('--color-accent-dim-txt',   this.#hsl(h, s, Math.max(l - 20, 15)));
  }

  #hexToHsl(hex: string): [number, number, number] | null {
    const m = /^#([A-Fa-f0-9]{6})$/.exec(hex);
    if (!m) return null;
    const r = parseInt(m[1].slice(0, 2), 16) / 255;
    const g = parseInt(m[1].slice(2, 4), 16) / 255;
    const b = parseInt(m[1].slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = 60 * (((g - b) / d) % 6); break;
        case g: h = 60 * ((b - r) / d + 2); break;
        default: h = 60 * ((r - g) / d + 4);
      }
    }
    if (h < 0) h += 360;
    return [h, s * 100, l * 100];
  }

  #hsl(h: number, s: number, l: number): string {
    return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  }
}
