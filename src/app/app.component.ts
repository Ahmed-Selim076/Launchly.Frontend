import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';

/**
 * Tenant route registration (subdomain detection, loading tenant data,
 * and resetConfig with the storefront/admin routes) happens once, in
 * app.config.ts's APP_INITIALIZER — which runs and fully resolves before
 * Angular's initial navigation fires. That guarantees canMatch guards
 * always see a populated currentTenant() on the first navigation attempt.
 *
 * AppComponent no longer duplicates that logic: by the time this component
 * exists, routing is already correctly configured, so there's no separate
 * "ready" gate needed here — the router-outlet can render immediately.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet></router-outlet>
    <app-toast-container></app-toast-container>
  `,
})
export class AppComponent {}