import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';

// ─── DTOs (mirrors SuperAdminDTOs.cs) ─────────────────────────────────────────

interface PlanBreakdownDto {
  plan:  string;
  count: number;
}

interface StoreTypeBreakdownDto {
  storeType: string;
  count:     number;
}

interface PlatformStatsDto {
  totalTenants:        number;
  activeTenants:       number;
  totalUsers:          number;
  totalOrders:         number;
  totalRevenue:        number;
  newTenantsThisMonth: number;
  planBreakdown:       PlanBreakdownDto[];
  storeTypeBreakdown:  StoreTypeBreakdownDto[];
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message: string | null;
  errors:  string[] | null;
}

interface DonutSlice {
  label: string;
  count: number;
  pct: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

/**
 * Super Admin — Platform Analytics (/analytics)
 *
 * Endpoint: GET ${environment.apiUrl}/v1/super/analytics
 *
 * Real interactive charts (hand-rolled SVG — no charting library wired into
 * the app yet, and adding one just for this one page wasn't worth the
 * bundle/provider setup risk): a hoverable donut for plan distribution and
 * an animated horizontal bar chart for store type distribution. KPI cards
 * show only what the backend actually returns — no fabricated trend
 * percentages, since PlatformStatsDto has no historical series to compare
 * against.
 */
@Component({
  selector: 'app-super-analytics',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-5 lg:px-8 py-8 max-w-7xl mx-auto">

      <!-- Loading -->
      @if (isLoading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="h-28 rounded-2xl bg-sup-surface animate-pulse"></div>
          }
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="h-80 rounded-2xl bg-sup-surface animate-pulse"></div>
          <div class="h-80 rounded-2xl bg-sup-surface animate-pulse"></div>
        </div>
      }

      <!-- Error -->
      @if (!isLoading() && loadError()) {
        <div class="rounded-2xl border border-sup-border bg-sup-surface py-20 text-center">
          <p class="text-sup-text-3 text-sm mb-3">{{ loadError() }}</p>
          <button type="button" (click)="load()" class="text-sm font-semibold text-supa-light hover:text-supa transition-colors">
            Try again
          </button>
        </div>
      }

      @if (!isLoading() && !loadError() && stats(); as s) {

        <!-- ① KPI cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          @for (kpi of kpiCards(); track kpi.label) {
            <div class="rounded-2xl border border-sup-border bg-sup-surface p-5 relative overflow-hidden group hover:border-sup-border-2 transition-colors">
              <div
                class="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"
                [style.background]="kpi.color"
              ></div>
              <div class="relative">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  [style.background]="kpi.color + '1F'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" class="w-4 h-4" [style.color]="kpi.color" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="kpi.icon"/>
                  </svg>
                </div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-sup-text-3 mb-1">
                  {{ kpi.label }}
                </p>
                <p class="text-2xl font-bold text-sup-text-1 tabular-nums font-mono">
                  {{ kpi.value }}
                </p>
                @if (kpi.sub) {
                  <p class="text-xs text-sup-text-3 mt-0.5">{{ kpi.sub }}</p>
                }
              </div>
            </div>
          }
        </div>

        <!-- ② Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <!-- Plan distribution — donut -->
          <div class="rounded-2xl border border-sup-border bg-sup-surface p-6">
            <h2 class="text-sm font-semibold text-sup-text-1 mb-1">Plan Distribution</h2>
            <p class="text-xs text-sup-text-3 mb-6">Active subscriptions by plan</p>

            @if (planSlices().length) {
              <div class="flex flex-col sm:flex-row items-center gap-8">
                <div class="relative w-44 h-44 flex-shrink-0">
                  <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                    @for (slice of planSlices(); track slice.label) {
                      <circle
                        cx="50" cy="50" r="38" fill="none"
                        [attr.stroke]="slice.color"
                        stroke-width="14"
                        [attr.stroke-dasharray]="slice.dashArray"
                        [attr.stroke-dashoffset]="slice.dashOffset"
                        class="donut-slice"
                        [class.donut-slice-dim]="hoveredPlan() && hoveredPlan() !== slice.label"
                        (mouseenter)="hoveredPlan.set(slice.label)"
                        (mouseleave)="hoveredPlan.set(null)"
                      />
                    }
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    @if (hoveredPlan(); as hp) {
                      <p class="text-2xl font-bold text-sup-text-1 font-mono">{{ hoveredPlanPct() }}%</p>
                      <p class="text-[11px] text-sup-text-3">{{ hp }}</p>
                    } @else {
                      <p class="text-2xl font-bold text-sup-text-1 font-mono">{{ s.totalTenants }}</p>
                      <p class="text-[11px] text-sup-text-3">tenants</p>
                    }
                  </div>
                </div>

                <div class="flex-1 w-full space-y-3">
                  @for (slice of planSlices(); track slice.label) {
                    <div
                      class="flex items-center justify-between gap-3 cursor-default rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                      [class.bg-sup-surface-2]="hoveredPlan() === slice.label"
                      (mouseenter)="hoveredPlan.set(slice.label)"
                      (mouseleave)="hoveredPlan.set(null)"
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" [style.background]="slice.color"></span>
                        <span class="text-sm text-sup-text-2 font-medium truncate">{{ slice.label }}</span>
                      </div>
                      <span class="text-sm font-semibold text-sup-text-1 font-mono flex-shrink-0">{{ slice.count }}</span>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <p class="text-sm text-sup-text-3 py-16 text-center">No data yet</p>
            }
          </div>

          <!-- Store type distribution — bar -->
          <div class="rounded-2xl border border-sup-border bg-sup-surface p-6">
            <h2 class="text-sm font-semibold text-sup-text-1 mb-1">Store Type Distribution</h2>
            <p class="text-xs text-sup-text-3 mb-6">Tenants by business category</p>

            @if (s.storeTypeBreakdown.length) {
              <div class="space-y-5">
                @for (item of s.storeTypeBreakdown; track item.storeType) {
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-sm text-sup-text-2 font-medium">{{ item.storeType }}</span>
                      <span class="text-sm font-semibold text-sup-text-1 font-mono">
                        {{ item.count }}
                        <span class="text-xs text-sup-text-3 font-normal">({{ storeTypePct(item.count) }}%)</span>
                      </span>
                    </div>
                    <div class="h-2.5 rounded-full bg-sup-surface-2 overflow-hidden">
                      <div
                        class="h-full rounded-full bar-fill"
                        style="background: linear-gradient(90deg, #7C6CF6, #A79AFA);"
                        [style.width.%]="storeTypePct(item.count)"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-sm text-sup-text-3 py-16 text-center">No data yet</p>
            }
          </div>
        </div>
      }
    </div>

    <style>
      .donut-slice {
        transition: stroke-width 160ms ease, opacity 160ms ease;
        cursor: pointer;
      }
      .donut-slice:hover { stroke-width: 17; }
      .donut-slice-dim { opacity: 0.35; }
      .bar-fill {
        width: 0;
        animation: barGrow 700ms var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1)) forwards;
      }
      @keyframes barGrow {
        from { width: 0 !important; }
      }
    </style>
  `,
})
export class SuperAnalyticsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly isLoading  = signal(true);
  readonly loadError  = signal<string | null>(null);
  readonly stats      = signal<PlatformStatsDto | null>(null);
  readonly hoveredPlan = signal<string | null>(null);

  private readonly PALETTE = ['#7C6CF6', '#4FD1C5', '#F6AD55', '#FC8181', '#63B3ED', '#B794F4'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.http
      .get<ApiResponse<PlatformStatsDto>>(`${environment.apiUrl}/v1/super/analytics`)
      .subscribe({
        next: res => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.stats.set(res.data);
          } else {
            this.loadError.set(res.message ?? 'Failed to load analytics.');
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.loadError.set('Could not reach the server. Please try again.');
        },
      });
  }

  readonly kpiCards = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const suspended = s.totalTenants - s.activeTenants;
    return [
      { label: 'Total Tenants', value: s.totalTenants.toLocaleString(), sub: null, color: '#7C6CF6',
        icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18' },
      { label: 'Active', value: s.activeTenants.toLocaleString(), sub: `${suspended} suspended`, color: '#4FD1C5',
        icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { label: 'New This Month', value: s.newTenantsThisMonth.toLocaleString(), sub: null, color: '#F6AD55',
        icon: 'M12 4.5v15m7.5-7.5h-15' },
      { label: 'Total Users', value: s.totalUsers.toLocaleString(), sub: null, color: '#63B3ED',
        icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
      { label: 'Total Orders', value: s.totalOrders.toLocaleString(), sub: null, color: '#FC8181',
        icon: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z' },
      { label: 'Total Revenue', value: '$' + s.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: null, color: '#B794F4',
        icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ];
  });

  readonly planSlices = computed<DonutSlice[]>(() => {
    const s = this.stats();
    if (!s || !s.planBreakdown.length) return [];
    const total = s.planBreakdown.reduce((sum, p) => sum + p.count, 0);
    if (!total) return [];

    const circumference = 2 * Math.PI * 38;
    let cumulative = 0;

    return s.planBreakdown.map((p, i) => {
      const pct = p.count / total;
      const dash = pct * circumference;
      const slice: DonutSlice = {
        label: p.plan,
        count: p.count,
        pct: Math.round(pct * 100),
        color: this.PALETTE[i % this.PALETTE.length],
        dashArray: `${dash} ${circumference - dash}`,
        dashOffset: -cumulative,
      };
      cumulative += dash;
      return slice;
    });
  });

  readonly hoveredPlanPct = computed(() => {
    const label = this.hoveredPlan();
    return this.planSlices().find(s => s.label === label)?.pct ?? 0;
  });

  storeTypePct(count: number): number {
    const total = this.stats()?.totalTenants ?? 0;
    return total ? Math.round((count / total) * 100) : 0;
  }
}
