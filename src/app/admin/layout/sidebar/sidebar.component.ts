import {
  Component, inject, computed, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { StoreType } from '../../../core/models';

interface NavItem {
  label: string;
  icon: string;  // inline SVG path d= value
  route: string;
  storeTypes?: StoreType[];  // if set, only visible for these store types
  exact?: boolean;
}

/**
 * AdminSidebarComponent
 *
 * Dark Espresso-themed sidebar.
 * - nav items computed from TenantService.currentTenant().storeType
 * - items filtered at UI level (URL-level protection is in admin.routes.ts guards)
 * - collapsible on mobile via @Input() or internal toggle
 * - tenant store name + logo in header
 * - logout + "View Store" in footer
 */
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="flex flex-col h-full bg-ad-surface border-r border-ad-border w-64 flex-shrink-0"
      aria-label="Admin navigation"
    >
      <!-- ── Header: Store identity ── -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-ad-border">
        @if (tenant()?.logoUrl) {
          <img
            [src]="tenant()!.logoUrl!"
            [alt]="tenant()!.storeName"
            class="w-8 h-8 rounded-md object-cover flex-shrink-0"
          />
        } @else {
          <div
            class="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style="background: var(--color-accent);"
          >
            {{ storeInitial() }}
          </div>
        }
        <div class="min-w-0">
          <p class="text-ad-text-1 font-semibold text-sm truncate leading-tight">
            {{ tenant()?.storeName ?? 'My Store' }}
          </p>
          <p class="text-ad-text-3 text-xs truncate">{{ storeTypeLabel() }}</p>
        </div>
      </div>

      <!-- ── Nav items ── -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        @for (item of visibleNavItems(); track item.route) {
          
            [routerLink]="item.route"
            routerLinkActive="bg-ad-surface-2 text-ad-text-1"
            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            class="flex items-center gap-3 px-3 py-2.5 rounded-md text-ad-text-2 text-sm
                   transition-colors duration-120 hover:bg-ad-surface-2 hover:text-ad-text-1
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            [attr.aria-label]="item.label"
          >
            <!-- icon -->
            <svg
              class="w-4 h-4 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path [attr.d]="item.icon" />
            </svg>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- ── Footer: actions ── -->
      <div class="border-t border-ad-border px-3 py-4 space-y-0.5">
        <!-- View Store link -->
        
          [href]="storeUrl()"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-3 px-3 py-2.5 rounded-md text-ad-text-2 text-sm
                 transition-colors duration-120 hover:bg-ad-surface-2 hover:text-ad-text-1"
          aria-label="View your store (opens in new tab)"
        >
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
          </svg>
          <span>View Store</span>
        </a>

        <!-- Logout -->
        <button
          type="button"
          (click)="onLogout()"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-ad-text-2 text-sm
                 transition-colors duration-120 hover:bg-ad-surface-2 hover:text-danger
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Log out"
        >
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span>Logout</span>
        </button>

        <!-- Admin user identity -->
        <div class="flex items-center gap-3 px-3 pt-3 mt-1 border-t border-ad-border">
          <div
            class="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold"
            style="background: var(--color-accent);"
            aria-hidden="true"
          >
            @if (auth.avatarUrl(); as url) {
              <img [src]="url" alt="" class="h-full w-full object-cover" />
            } @else {
              {{ userInitial() }}
            }
          </div>
          <div class="min-w-0">
            <p class="text-ad-text-1 text-xs font-medium truncate">{{ userName() }}</p>
            <p class="text-ad-text-3 text-xs truncate">{{ userEmail() }}</p>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class AdminSidebarComponent {
  readonly auth          = inject(AuthService);
  private readonly tenantService = inject(TenantService);

  readonly tenant = this.tenantService.currentTenant;

  /** Dynamic "View Store" link — built from the current tenant subdomain,
   *  never hardcoded, so it always points to /store/:subdomain/ regardless
   *  of which domain the admin panel is currently loaded from. */
  readonly storeUrl = computed(() => {
    const subdomain = this.tenantService.getSubdomain();
    return subdomain ? this.tenantService.buildTenantUrl(subdomain, '/') : '/';
  });

  // ─── Nav definition ───────────────────────────────────────────────────────

  /**
   * Full nav list. Items with `storeTypes` are filtered by the tenant's storeType.
   * Icon paths are Lucide-compatible SVG path `d` values — single path per icon.
   */
  private readonly ALL_NAV: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      exact: true,
      icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
    },
    {
      label: 'Analytics',
      route: '/admin/analytics',
      icon: 'M18 20V10M12 20V4M6 20v-6',
    },
    {
      label: 'Products',
      route: '/admin/products',
      storeTypes: [StoreType.Ecommerce],
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
    {
      label: 'Orders',
      route: '/admin/orders',
      storeTypes: [StoreType.Ecommerce],
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    },
    {
      label: 'Services',
      route: '/admin/services',
      storeTypes: [StoreType.Booking],
      icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM12 22V12M3.27 6.96L12 12.01l8.73-5.05',
    },
    {
      label: 'Appointments',
      route: '/admin/appointments',
      storeTypes: [StoreType.Booking],
      icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    },
    {
      label: 'Menu',
      route: '/admin/menu',
      storeTypes: [StoreType.Restaurant],
      icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5A2.5 2.5 0 119.5 9a2.5 2.5 0 012.5 2.5z',
    },
    {
      label: 'Food Orders',
      route: '/admin/food-orders',
      storeTypes: [StoreType.Restaurant],
      icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
    },
    {
      label: 'Customers',
      route: '/admin/customers',
      icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    },
    {
      label: 'Audit Log',
      route: '/admin/audit-log',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    },
    {
      label: 'Settings',
      route: '/admin/settings',
      icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    },
  ];

  /** Filter nav items based on the current tenant's storeType (UI-level). */
  readonly visibleNavItems = computed<NavItem[]>(() => {
    const storeType = this.tenant()?.storeType;
    return this.ALL_NAV.filter(item => {
      if (!item.storeTypes) return true;          // shown for all store types
      if (storeType === undefined) return false;  // tenant not loaded yet
      return item.storeTypes.includes(storeType);
    });
  });

  // ─── Display helpers ───────────────────────────────────────────────────────

  readonly storeInitial = computed(() =>
    (this.tenant()?.storeName?.[0] ?? 'S').toUpperCase()
  );

  readonly storeTypeLabel = computed(() => {
    const map: Record<StoreType, string> = {
      [StoreType.Ecommerce]:  'E-commerce Store',
      [StoreType.Booking]:    'Booking Business',
      [StoreType.Restaurant]: 'Restaurant',
    };
    const t = this.tenant();
    return t !== null ? (map[t.storeType] ?? 'Store') : '';
  });

  readonly userName = computed(() => {
    const u = this.auth.currentUser();
    return u ? `${u.firstName} ${u.lastName}`.trim() : '';
  });

  readonly userEmail = computed(() =>
    this.auth.currentUser()?.email ?? ''
  );

  readonly userInitial = computed(() =>
    (this.auth.currentUser()?.firstName?.[0] ?? 'A').toUpperCase()
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  onLogout(): void {
    this.auth.logout().subscribe();
  }
}
