import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * SuperAdminShellComponent
 *
 * Root layout for the Super Admin panel — deliberately its own visual
 * identity (new sup-x / supa tokens defined in tailwind.config.js), not a
 * reskin of the tenant admin's espresso theme or any tenant's own brand
 * color. This is Launchly's own control room: every tenant admin panel on
 * the platform looks different (merchant-driven colors); this one always
 * looks like this, on purpose — it's the one screen where "which store am
 * I looking at" should never be a question.
 */
@Component({
  selector: 'app-super-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen bg-sup-bg overflow-hidden font-body">

      <!-- Desktop sidebar -->
      <aside
        class="hidden lg:flex flex-col h-full bg-sup-surface border-r border-sup-border
               w-[264px] flex-shrink-0"
        aria-label="Super Admin navigation"
      >
        <ng-container *ngTemplateOutlet="sidebarContent" />
      </aside>

      <!-- Mobile drawer -->
      @if (mobileMenuOpen()) {
        <div
          class="fixed inset-0 z-30 bg-black/70 lg:hidden"
          aria-hidden="true"
          (click)="mobileMenuOpen.set(false)"
          style="animation: fadeIn 120ms var(--ease-out-expo) both;"
        ></div>

        <div
          class="fixed inset-y-0 left-0 z-40 lg:hidden"
          style="animation: slideInLeft 220ms var(--ease-out-expo) both;"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <aside class="flex flex-col h-full bg-sup-surface border-r border-sup-border w-[264px]">
            <ng-container *ngTemplateOutlet="sidebarContent" />
          </aside>
        </div>
      }

      <!-- Main column -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">

        <!-- Topbar -->
        <header class="flex items-center gap-4 px-5 lg:px-8 h-16 flex-shrink-0
                       bg-sup-bg border-b border-sup-border">
          <button
            type="button"
            (click)="mobileMenuOpen.set(true)"
            class="lg:hidden text-sup-text-2 hover:text-sup-text-1 transition-colors"
            aria-label="Open navigation menu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
            </svg>
          </button>

          <h1 class="text-sup-text-1 font-semibold text-[15px] tracking-tight">
            {{ pageTitle() }}
          </h1>

          <div class="flex-1"></div>

          <!-- Live status pill -->
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-sup-surface border border-sup-border">
            <span class="relative flex h-1.5 w-1.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
            </span>
            <span class="text-xs font-medium text-sup-text-2">All systems operational</span>
          </div>

          <!-- Avatar -->
          <div class="relative">
            <button
              type="button"
              (click)="menuOpen.set(!menuOpen())"
              class="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                     bg-supa flex-shrink-0"
            >
              {{ initials() }}
            </button>
            @if (menuOpen()) {
              <div
                class="absolute right-0 top-full mt-2 w-52 rounded-xl border border-sup-border
                       bg-sup-surface shadow-2xl py-1.5 z-50"
                style="animation: fadeIn 120ms var(--ease-out-expo) both;"
              >
                <p class="px-3.5 py-2 text-xs text-sup-text-3 truncate border-b border-sup-border mb-1">
                  {{ authSvc.currentUser()?.email ?? '' }}
                </p>
                <button
                  type="button"
                  (click)="logout()"
                  class="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-sup-text-2
                         hover:bg-sup-surface-2 hover:text-red-400 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
                  </svg>
                  Log out
                </button>
              </div>
            }
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto" id="super-admin-main-content" aria-label="Super Admin content">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (menuOpen()) {
      <div class="fixed inset-0 z-40" (click)="menuOpen.set(false)"></div>
    }

    <!-- Sidebar template -->
    <ng-template #sidebarContent>

      <!-- Brand -->
      <div class="flex items-center gap-2.5 px-5 h-16 border-b border-sup-border flex-shrink-0">
        <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-supa">
          <svg viewBox="0 0 24 24" fill="none" class="w-4 h-4 text-white">
            <path d="M13 2L3 14h7l-1 8 11-14h-8l1-6z" fill="currentColor"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-sup-text-1 font-display italic font-medium text-base leading-tight">Launchly</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto px-3 py-5 space-y-0.5" aria-label="Super Admin navigation">
        <p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sup-text-3">
          Platform
        </p>
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-supa/10 text-sup-text-1 nav-active"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sup-text-2 text-sm font-medium
                   transition-colors duration-120 hover:bg-sup-surface-2 hover:text-sup-text-1
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-supa"
            [attr.aria-label]="item.label"
            (click)="mobileMenuOpen.set(false)"
          >
            <svg class="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon"/>
            </svg>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- Footer -->
      <div class="border-t border-sup-border px-3 py-4 flex-shrink-0">
        <div class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-sup-surface-2">
          <div class="h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold bg-supa flex-shrink-0">
            {{ initials() }}
          </div>
          <div class="min-w-0">
            <p class="text-sup-text-1 text-xs font-medium truncate">Super Admin</p>
            <p class="text-sup-text-3 text-[11px] truncate">{{ authSvc.currentUser()?.email ?? '' }}</p>
          </div>
        </div>
      </div>

    </ng-template>
  `,
  styles: [`
    .nav-active::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 18px;
      border-radius: 2px;
      background: #7C6CF6;
    }
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
export class SuperAdminShellComponent {
  readonly authSvc        = inject(AuthService);
  private readonly router = inject(Router);

  readonly mobileMenuOpen = signal(false);
  readonly menuOpen       = signal(false);

  readonly navItems = [
    {
      label: 'Tenants',
      route: '/super/tenants',
      exact: false,
      icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z',
    },
    {
      label: 'Analytics',
      route: '/super/analytics',
      exact: false,
      icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    },
    {
      label: 'Audit Log',
      route: '/super/audit-log',
      exact: false,
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
  ];

  readonly initials = () => {
    const email = this.authSvc.currentUser()?.email ?? 'SA';
    return email.slice(0, 2).toUpperCase();
  };

  /** Derives the page title from the active route so the topbar doesn't
   *  need each page to pass one in manually. */
  readonly pageTitle = () => {
    const path = this.router.url;
    if (path.includes('/tenants/')) return 'Tenant Details';
    if (path.includes('/tenants'))  return 'Tenants';
    if (path.includes('/analytics'))return 'Analytics';
    if (path.includes('/audit-log'))return 'Audit Log';
    return 'Super Admin';
  };

  logout(): void {
    this.authSvc.logout();
  }
}
