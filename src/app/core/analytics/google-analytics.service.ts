import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * GoogleAnalyticsService
 *
 * Injects GA4 gtag.js dynamically from the tenant's googleAnalyticsId
 * (from store settings). Called by TenantThemeService after settings load:
 *   this.ga.init(settings.googleAnalyticsId);
 *
 * Production-only — no tracking on localhost.
 * Initialized once per session. Tracks route changes automatically.
 */
@Injectable({ providedIn: 'root' })
export class GoogleAnalyticsService {
  private readonly router = inject(Router);

  private trackingId: string | null = null;
  private initialized = false;

  /** Initialize with tenant's GA4 tracking ID. Safe to call multiple times. */
  init(trackingId: string | null | undefined): void {
    if (!trackingId || this.initialized || !this.isProduction()) return;

    this.trackingId  = trackingId;
    this.initialized = true;

    this.injectGtag(trackingId);
    this.trackRouteChanges();
  }

  /**
   * Fire a custom GA4 event.
   * Example: this.ga.trackEvent('add_to_cart', { item_id: id, value: price });
   */
  trackEvent(eventName: string, params?: Record<string, unknown>): void {
    if (!this.initialized || !this.gtag) return;
    this.gtag('event', eventName, params ?? {});
  }

  private injectGtag(id: string): void {
    if (document.getElementById('ga-script')) return;

    const script   = document.createElement('script');
    script.id      = 'ga-script';
    script.async   = true;
    script.src     = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    const inline   = document.createElement('script');
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', '${id}', { anonymize_ip: true, send_page_view: false });
    `;
    document.head.appendChild(inline);
  }

  private trackRouteChanges(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => {
        const nav = e as NavigationEnd;
        if (this.gtag) {
          this.gtag('event', 'page_view', {
            page_path:     nav.urlAfterRedirects,
            page_location: window.location.href,
          });
        }
      });
  }

  private isProduction(): boolean {
    const host = window.location.hostname;
    return host !== 'localhost' && !host.startsWith('127.');
  }

  private get gtag(): ((...args: unknown[]) => void) | null {
    return (window as Window & { gtag?: (...args: unknown[]) => void }).gtag ?? null;
  }
}
