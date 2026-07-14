import {
  Component, ChangeDetectionStrategy, OnInit, inject,
  signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

import { OrderService, IOrdersQuery } from '../../../core/admin/order.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { IOrder, IPagedResult } from '../../../core/models';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SelectComponent, ISelectOption } from '../../../shared/components/select/select.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/pipes';

// Status int → label (must mirror OrderStatus enum in backend)
const STATUS_LABELS: Record<number, string> = {
  0: 'Pending',
  1: 'Confirmed',
  2: 'Shipped',
  3: 'Delivered',
  4: 'Cancelled',
};

const STATUS_OPTIONS: ISelectOption[] = [
  { value: '0', label: 'Pending'   },
  { value: '1', label: 'Confirmed' },
  { value: '2', label: 'Shipped'   },
  { value: '3', label: 'Delivered' },
  { value: '4', label: 'Cancelled' },
];

const FILTER_OPTIONS: ISelectOption[] = [
  { value: '', label: 'All statuses' },
  ...STATUS_OPTIONS,
];

const STATUS_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  Pending:   'warning',
  Confirmed: 'default',
  Shipped:   'default',
  Delivered: 'success',
  Cancelled: 'danger',
};

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonComponent, SelectComponent, ModalComponent,
    BadgeComponent, SkeletonComponent, EmptyStateComponent,
    CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-bold text-ad-text-1">Orders</h1>
          <p class="text-ad-text-3 text-sm mt-0.5">
            {{ pagedResult()?.totalCount ?? 0 }} total orders
          </p>
        </div>
      </div>

      <!-- Filter -->
      <div class="flex flex-wrap gap-3">
        <app-select
          placeholder="All statuses"
          [options]="filterOptions"
          [formControl]="statusFilterCtrl"
          [dark]="true"
          class="w-44"
        />
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3,4,5]; track $index) {
            <app-skeleton [dark]="true" height="52px" />
          }
        </div>
      } @else if (errored()) {
        <app-empty-state
          icon="⚠️"
          title="Couldn't load orders"
          description="Something went wrong. Please try again."
          actionLabel="Retry"
          [dark]="true"
          (actionClicked)="load()"
        />
      } @else if (!pagedResult()?.items?.length) {
        <app-empty-state
          icon="🛍️"
          title="No orders yet"
          description="Orders placed by customers will appear here."
          [dark]="true"
        />
      } @else {
        <div class="rounded-xl border border-ad-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-ad-border bg-ad-surface-2">
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium">Order</th>
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium hidden sm:table-cell">Customer</th>
                <th class="text-right px-4 py-3 text-ad-text-3 font-medium">Total</th>
                <th class="px-4 py-3 text-ad-text-3 font-medium">Status</th>
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium hidden md:table-cell">Date</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ad-border">
              @for (order of pagedResult()!.items; track order.id) {
                <tr class="bg-ad-surface hover:bg-ad-surface-2 transition-colors">
                  <!-- Order ID -->
                  <td class="px-4 py-3">
                    <span class="font-mono text-xs text-ad-text-2">
                      #{{ order.id.slice(0, 8).toUpperCase() }}
                    </span>
                    @if (order.items.length) {
                      <p class="text-xs text-ad-text-3 mt-0.5">
                        {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}
                      </p>
                    }
                  </td>
                  <!-- Customer -->
                  <td class="px-4 py-3 hidden sm:table-cell text-ad-text-2">
                    {{ order.customerName || '—' }}
                  </td>
                  <!-- Total -->
                  <td class="px-4 py-3 text-right font-mono text-ad-text-1">
                    {{ order.totalAmount | currencyFormat }}
                  </td>
                  <!-- Status badge -->
                  <td class="px-4 py-3">
                    <app-badge [variant]="badgeVariant(order.status)">
                      {{ order.status }}
                    </app-badge>
                  </td>
                  <!-- Date -->
                  <td class="px-4 py-3 hidden md:table-cell text-ad-text-3 text-xs">
                    {{ order.createdAt | date:'dd MMM yyyy' }}
                  </td>
                  <!-- Actions -->
                  <td class="px-4 py-3 text-right">
                    <app-button
                      variant="ghost" size="sm"
                      [disabled]="order.status === 'Delivered' || order.status === 'Cancelled'"
                      (clicked)="openStatusModal(order)"
                    >Update</app-button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if ((pagedResult()?.totalPages ?? 1) > 1) {
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-ad-text-3">
              Page {{ currentPage() }} of {{ pagedResult()?.totalPages }}
            </p>
            <div class="flex gap-2">
              <app-button
                variant="ghost" size="sm"
                [disabled]="currentPage() <= 1"
                (clicked)="setPage(currentPage() - 1)"
              >← Prev</app-button>
              <app-button
                variant="ghost" size="sm"
                [disabled]="currentPage() >= (pagedResult()?.totalPages ?? 1)"
                (clicked)="setPage(currentPage() + 1)"
              >Next →</app-button>
            </div>
          </div>
        }
      }
    </div>

    <!-- ── Status Update Modal ─────────────────────────────────────────────── -->
    @if (statusModalOrder()) {
      <app-modal
        title="Update Order Status"
        [dark]="true"
        (closed)="closeStatusModal()"
      >
        <div class="space-y-4">
          <p class="text-sm text-ad-text-2">
            Order <span class="font-mono">#{{ statusModalOrder()!.id.slice(0,8).toUpperCase() }}</span>
            — current status:
            <app-badge [variant]="badgeVariant(statusModalOrder()!.status)">
              {{ statusModalOrder()!.status }}
            </app-badge>
          </p>

          <app-select
            label="New status"
            [options]="nextStatusOptions()"
            [formControl]="newStatusCtrl"
            [dark]="true"
          />
        </div>

        <div slot="footer" class="flex justify-end gap-3">
          <app-button variant="ghost" [dark]="true" (clicked)="closeStatusModal()">
            Cancel
          </app-button>
          <app-button
            variant="primary"
            [loading]="saving()"
            [disabled]="!newStatusCtrl.value"
            (clicked)="confirmStatusUpdate()"
          >
            Save
          </app-button>
        </div>
      </app-modal>
    }
  `,
})
export class OrdersComponent implements OnInit {
  private readonly svc   = inject(OrderService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  readonly filterOptions  = FILTER_OPTIONS;
  readonly statusFilterCtrl = this.fb.control<string>('');
  readonly newStatusCtrl    = this.fb.control<string>('');

  readonly loading       = signal(false);
  readonly errored       = signal(false);
  readonly saving        = signal(false);
  readonly pagedResult   = signal<IPagedResult<IOrder> | null>(null);
  readonly currentPage   = signal(1);
  readonly statusModalOrder = signal<IOrder | null>(null);

  readonly nextStatusOptions = computed<ISelectOption[]>(() => {
    const order = this.statusModalOrder();
    if (!order) return [];
    // Only show logically valid forward transitions + Cancelled
    const all = STATUS_OPTIONS.filter(o => o.label !== order.status);
    return all;
  });

  ngOnInit(): void {
    this.statusFilterCtrl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.load();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    const statusRaw = this.statusFilterCtrl.value;
    const query: IOrdersQuery = {
      page:     this.currentPage(),
      pageSize: 20,
      status:   statusRaw !== '' && statusRaw != null ? Number(statusRaw) : null,
    };
    this.svc.getAll(query).subscribe({
      next: res => {
        this.pagedResult.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  setPage(p: number): void {
    this.currentPage.set(p);
    this.load();
  }

  openStatusModal(order: IOrder): void {
    this.newStatusCtrl.reset('');
    this.statusModalOrder.set(order);
  }

  closeStatusModal(): void {
    this.statusModalOrder.set(null);
  }

  confirmStatusUpdate(): void {
    const order = this.statusModalOrder();
    const val   = this.newStatusCtrl.value;
    if (!order || val === '' || val == null) return;

    this.saving.set(true);
    this.svc.updateStatus(order.id, { status: Number(val) }).subscribe({
      next: res => {
        this.saving.set(false);
        this.toast.success(`Order status updated to ${res.data?.status ?? STATUS_LABELS[Number(val)]}.`);
        this.closeStatusModal();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Failed to update order status.';
        this.toast.error(msg);
      },
    });
  }

  badgeVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
    return STATUS_BADGE[status] ?? 'default';
  }
}
