import {
  Component, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../sidebar/sidebar.component';
import { AdminTopbarComponent } from '../topbar/topbar.component';

/**
 * AdminShellComponent
 *
 * Root layout for the tenant admin section.
 * Desktop: sidebar fixed left, main content scrolls right.
 * Mobile: sidebar is an off-canvas drawer, topbar shows hamburger.
 *
 * All admin pages render inside <router-outlet> in the main area.
 * No page-specific logic here — this is layout only.
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminSidebarComponent, AdminTopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen bg-ad-bg overflow-hidden">

      <!-- ── Desktop sidebar (always visible ≥ lg) ── -->
      <div class="hidden lg:flex">
        <app-admin-sidebar />
      </div>

      <!-- ── Mobile sidebar drawer ── -->
      @if (mobileMenuOpen()) {
        <!-- Backdrop -->
        <div
          class="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-hidden="true"
          (click)="mobileMenuOpen.set(false)"
          style="animation: fadeIn 120ms var(--ease-out-expo) both;"
        ></div>

        <!-- Drawer -->
        <div
          class="fixed inset-y-0 left-0 z-40 lg:hidden"
          style="animation: slideInLeft 220ms var(--ease-out-expo) both;"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <app-admin-sidebar />
        </div>
      }

      <!-- ── Main content area ── -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <!-- Mobile topbar -->
        <app-admin-topbar
          [pageTitle]="'Admin'"
          (menuToggle)="mobileMenuOpen.set(true)"
        />

        <!-- Page content -->
        <main
          class="flex-1 overflow-y-auto p-6"
          id="admin-main-content"
          aria-label="Admin content"
        >
          <div class="max-w-7xl mx-auto page-enter">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideInLeft {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }
  `],
})
export class AdminShellComponent {
  readonly mobileMenuOpen = signal(false);
}
