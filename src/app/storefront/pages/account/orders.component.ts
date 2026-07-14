import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ProductStoreService } from '../../../core/storefront/store.service';
import { ICustomerOrder } from '../../../core/models';
import { CurrencyFormatPipe } from '../../../shared/pipes/pipes';
import { StoreNavComponent } from '../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../layout/store-footer/store-footer.component';

/**
 * Shared "My Orders" page. Was previously wired nowhere (no component, no
 * route, and the backend had no list endpoint either — only "place order"
 * and "get one order by id" existed) so this 404'd unconditionally. Backed
 * by the new GET /api/v1/store/orders endpoint.
 */
@Component({
  selector: 'app-storefront-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyFormatPipe, StoreNavComponent, StoreFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex flex-col">
      <app-store-nav />

      <main class="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-16 sm:py-20">
        <h1 class="font-display text-3xl text-sf-text-1 mb-10">My orders</h1>

        @if (!auth.isAuthenticated()) {
          <div class="text-center py-16">
            <p class="text-sf-text-3 text-sm mb-8">Sign in to see your order history.</p>
            <a
              routerLink="/login"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white"
              style="background: var(--tenant-primary, #15140F);"
            >
              Sign in
            </a>
          </div>
        } @else if (loading()) {
          <div class="space-y-4">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-24 rounded-xl bg-sf-surface animate-pulse"></div>
            }
          </div>
        } @else if (orders().length) {
          <div class="space-y-4">
            @for (order of orders(); track order.id) {
              <div class="rounded-xl border border-sf-border p-5">
                <div class="flex items-start justify-between mb-3 gap-4">
                  <div>
                    <p class="font-mono text-xs text-sf-text-3 mb-1">#{{ order.id.slice(0, 8) }}</p>
                    <p class="text-sf-text-1 text-sm">{{ order.createdAt | date:'mediumDate' }}</p>
                  </div>
                  <span
                    class="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                    [style.background]="statusBg(order.status)"
                    [style.color]="statusColor(order.status)"
                  >
                    {{ order.status }}
                  </span>
                </div>
                <div class="border-t border-sf-border pt-3 space-y-1.5">
                  @for (item of order.items; track item.name) {
                    <div class="flex justify-between text-sm text-sf-text-2">
                      <span>{{ item.quantity }}× {{ item.name }}</span>
                      <span class="font-mono">{{ item.lineTotal | currencyFormat }}</span>
                    </div>
                  }
                </div>
                <div class="flex justify-between text-sm font-semibold text-sf-text-1 mt-3 pt-3 border-t border-sf-border">
                  <span>Total</span>
                  <span class="font-mono">{{ order.totalAmount | currencyFormat }}</span>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-sf-border-2 py-20 text-center">
            <p class="text-sf-text-3 text-sm mb-6">You haven't placed any orders yet.</p>
            <a
              routerLink="/products"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white"
              style="background: var(--tenant-primary, #15140F);"
            >
              Start shopping
            </a>
          </div>
        }
      </main>

      <app-store-footer />
    </div>
  `,
})
export class StorefrontOrdersComponent implements OnInit {
  readonly auth       = inject(AuthService);
  private readonly productSvc = inject(ProductStoreService);

  readonly orders  = signal<ICustomerOrder[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.loading.set(false);
      return;
    }
    this.productSvc.getOrders().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) this.orders.set(res.data);
      },
      error: () => this.loading.set(false),
    });
  }

  statusBg(status: string): string {
    const map: Record<string, string> = {
      Pending:   'color-mix(in srgb, #F59E0B 15%, var(--color-sf-bg))',
      Confirmed: 'color-mix(in srgb, #3B82F6 15%, var(--color-sf-bg))',
      Completed: 'color-mix(in srgb, #22C55E 15%, var(--color-sf-bg))',
      Cancelled: 'color-mix(in srgb, #EF4444 15%, var(--color-sf-bg))',
    };
    return map[status] ?? 'var(--color-sf-surface)';
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      Pending: '#B45309', Confirmed: '#1D4ED8', Completed: '#15803D', Cancelled: '#B91C1C',
    };
    return map[status] ?? 'var(--color-sf-text-2)';
  }
}
