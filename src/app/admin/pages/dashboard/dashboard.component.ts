import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/admin/dashboard.service';
import { OnboardingService } from '../../../core/admin/onboarding.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { StoreType, IDashboard, IOnboardingStatus } from '../../../core/models';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { OnboardingChecklistComponent } from '../../components/onboarding-checklist/onboarding-checklist.component';
import { HealthScoreComponent } from '../../components/health-score/health-score.component';

/**
 * Per-StoreType copy for the generically-named DashboardDto fields.
 * Backend keeps field names storeType-neutral (totalOrders/totalCatalogItems/
 * pendingOrders) on purpose — see core/models.ts IDashboard doc comment.
 * This is the one place the frontend decides what those numbers are CALLED
 * for the tenant currently logged in.
 */
interface IDashboardCopy {
  orderLabel: string;
  pendingLabel: string;
  catalogLabel: string;
}

const DASHBOARD_COPY: Record<StoreType, IDashboardCopy> = {
  [StoreType.Ecommerce]: {
    orderLabel: 'Total Orders',
    pendingLabel: 'Pending Orders',
    catalogLabel: 'Active Products',
  },
  [StoreType.Booking]: {
    orderLabel: 'Total Appointments',
    pendingLabel: 'Pending Appointments',
    catalogLabel: 'Active Services',
  },
  [StoreType.Restaurant]: {
    orderLabel: 'Total Orders',
    pendingLabel: 'Pending Orders',
    catalogLabel: 'Active Menu Items',
  },
};

// Lucide-compatible single-path `d` values — same convention as Sidebar/Topbar.
const ICONS = {
  orders:    'M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6',
  revenue:   'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  catalog:   'M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16ZM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  pending:   'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
} as const;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, EmptyStateComponent,
            OnboardingChecklistComponent, HealthScoreComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-bold text-ad-text-1">Dashboard</h1>
        <p class="text-ad-text-3 text-sm mt-1">Welcome back — here's what's happening with your store.</p>
      </div>

      @if (errored()) {
        <app-empty-state
          icon="⚠️"
          title="Couldn't load your dashboard"
          description="Something went wrong while fetching your store's stats. Please try again."
          actionLabel="Retry"
          [dark]="true"
          (actionClicked)="retry()"
        />
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <app-stat-card
            [label]="copy().orderLabel"
            [value]="dashboard()?.totalOrders ?? 0"
            [icon]="icons.orders"
            [loading]="loading()"
          />
          <app-stat-card
            label="Total Revenue"
            [value]="dashboard()?.totalRevenue ?? 0"
            prefix="$"
            [icon]="icons.revenue"
            [loading]="loading()"
          />
          <app-stat-card
            [label]="copy().catalogLabel"
            [value]="dashboard()?.totalCatalogItems ?? 0"
            [icon]="icons.catalog"
            [loading]="loading()"
          />
          <app-stat-card
            label="Total Customers"
            [value]="dashboard()?.totalCustomers ?? 0"
            [icon]="icons.customers"
            [loading]="loading()"
          />
          <app-stat-card
            [label]="copy().pendingLabel"
            [value]="dashboard()?.pendingOrders ?? 0"
            [icon]="icons.pending"
            [loading]="loading()"
          />
        </div>

        <!-- Onboarding Checklist + Health Score -->
        @if (!onboarding()?.isFullyComplete || onboardingLoading()) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-2">
              <app-onboarding-checklist />
            </div>
            <div>
              <app-health-score
                [status]="onboarding()"
                [loading]="onboardingLoading()"
              />
            </div>
          </div>
        } @else {
          <!-- Once fully onboarded, show health score alone in a compact row -->
          <div class="max-w-xs">
            <app-health-score [status]="onboarding()" [loading]="false" />
          </div>
        }
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService  = inject(DashboardService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly tenantService     = inject(TenantService);

  readonly icons = ICONS;

  readonly dashboard = signal<IDashboard | null>(null);
  readonly loading   = signal(true);
  readonly errored   = signal(false);

  readonly onboarding        = signal<IOnboardingStatus | null>(null);
  readonly onboardingLoading = signal(true);

  /** Defaults to Ecommerce copy only as a render-before-tenant-loads fallback — never used to decide real values. */
  readonly copy = computed<IDashboardCopy>(() =>
    DASHBOARD_COPY[this.tenantService.currentTenant()?.storeType ?? StoreType.Ecommerce]
  );

  ngOnInit(): void {
    this.#load();
    this.#loadOnboarding();
  }

  retry(): void {
    this.#load();
  }

  #load(): void {
    this.loading.set(true);
    this.errored.set(false);

    this.dashboardService.getDashboard().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.dashboard.set(res.data);
        } else {
          this.errored.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  #loadOnboarding(): void {
    this.onboardingLoading.set(true);
    this.onboardingService.getStatus().subscribe({
      next: res => {
        if (res.success && res.data) this.onboarding.set(res.data);
        this.onboardingLoading.set(false);
      },
      error: () => {
        // Non-critical — don't block the dashboard, just hide the section
        this.onboardingLoading.set(false);
      },
    });
  }
}
