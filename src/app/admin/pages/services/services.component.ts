import {
  Component, ChangeDetectionStrategy, OnInit, inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { BookingService, ICreateServiceRequest, IUpdateServiceRequest } from '../../../core/admin/booking.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { IService } from '../../../core/models';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ImageUploaderComponent } from '../../components/image-uploader/image-uploader.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/pipes';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonComponent, InputComponent, ModalComponent, ConfirmDialogComponent,
    BadgeComponent, SkeletonComponent, EmptyStateComponent, ImageUploaderComponent,
    CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-bold text-ad-text-1">Services</h1>
          <p class="text-ad-text-3 text-sm mt-0.5">
            {{ services().length }} service{{ services().length !== 1 ? 's' : '' }}
          </p>
        </div>
        <app-button variant="primary" size="sm" (clicked)="openCreate()">
          + Add service
        </app-button>
      </div>

      <!-- List -->
      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3]; track $index) {
            <app-skeleton [dark]="true" height="72px" />
          }
        </div>
      } @else if (errored()) {
        <app-empty-state
          icon="⚠️"
          title="Couldn't load services"
          description="Something went wrong. Please try again."
          actionLabel="Retry"
          [dark]="true"
          (actionClicked)="load()"
        />
      } @else if (!services().length) {
        <app-empty-state
          icon="✂️"
          title="No services yet"
          description="Add your first service so customers can book appointments."
          actionLabel="Add service"
          [dark]="true"
          (actionClicked)="openCreate()"
        />
      } @else {
        <div class="rounded-xl border border-ad-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-ad-border bg-ad-surface-2">
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium">Service</th>
                <th class="text-right px-4 py-3 text-ad-text-3 font-medium">Duration</th>
                <th class="text-right px-4 py-3 text-ad-text-3 font-medium">Price</th>
                <th class="px-4 py-3 text-ad-text-3 font-medium hidden md:table-cell">Status</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ad-border">
              @for (s of services(); track s.id) {
                <tr class="bg-ad-surface hover:bg-ad-surface-2 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg overflow-hidden bg-ad-surface-2 flex-shrink-0 flex items-center justify-center">
                        @if (s.imageUrl) {
                          <img [src]="s.imageUrl" [alt]="s.name" class="w-full h-full object-cover" />
                        } @else {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-4 h-4 text-ad-text-3">
                            <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                          </svg>
                        }
                      </div>
                      <div>
                        <p class="font-medium text-ad-text-1">{{ s.name }}</p>
                        @if (s.description) {
                          <p class="text-xs text-ad-text-3 mt-0.5 truncate max-w-[220px]">{{ s.description }}</p>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right text-ad-text-2">{{ s.durationMins }} min</td>
                  <td class="px-4 py-3 text-right font-mono text-ad-text-1">{{ s.price | currencyFormat }}</td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <app-badge [variant]="s.isActive ? 'success' : 'default'">
                      {{ s.isActive ? 'Active' : 'Inactive' }}
                    </app-badge>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <app-button variant="ghost" size="sm" (clicked)="openEdit(s)">Edit</app-button>
                      <app-button variant="ghost" size="sm" (clicked)="confirmDelete(s)">Delete</app-button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- ── Create / Edit Modal ─────────────────────────────────────────────── -->
    @if (modalOpen()) {
      <app-modal
        [title]="editingService() ? 'Edit Service' : 'New Service'"
        [dark]="true"
        (closed)="closeModal()"
      >
        <div class="space-y-4" [formGroup]="form">
          <app-input
            label="Name"
            placeholder="e.g. Haircut & Style"
            formControlName="name"
            [dark]="true"
            [error]="(fieldError('name') ?? \'\')"
          />
          <app-input
            label="Description (optional)"
            placeholder="Short description for customers"
            formControlName="description"
            [dark]="true"
          />
          <div class="grid grid-cols-2 gap-4">
            <app-input
              label="Duration (minutes)"
              type="number"
              placeholder="60"
              formControlName="durationMins"
              [dark]="true"
              [error]="(fieldError('durationMins') ?? \'\')"
            />
            <app-input
              label="Price"
              type="number"
              placeholder="0.00"
              formControlName="price"
              [dark]="true"
              [error]="(fieldError('price') ?? \'\')"
            />
          </div>
          @if (editingService()) {
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" formControlName="isActive"
                     class="w-4 h-4 rounded border-ad-border accent-[var(--color-primary)]" />
              <span class="text-sm text-ad-text-2">Active (visible to customers)</span>
            </label>
          }
          <div>
            <label class="block text-sm font-medium text-ad-text-2 mb-1.5">Photo (optional)</label>
            <app-image-uploader
              type="service"
              [currentUrl]="form.value.imageUrl ?? null"
              (uploaded)="onImageUploaded($event)"
            />
          </div>
        </div>

        <div slot="footer" class="flex justify-end gap-3">
          <app-button variant="ghost" [dark]="true" (clicked)="closeModal()">Cancel</app-button>
          <app-button
            variant="primary"
            [loading]="saving()"
            [disabled]="form.invalid"
            (clicked)="submitForm()"
          >
            {{ editingService() ? 'Save changes' : 'Create service' }}
          </app-button>
        </div>
      </app-modal>
    }

    <!-- ── Delete Confirm ──────────────────────────────────────────────────── -->
    @if (deleteTarget()) {
      <app-confirm-dialog
        title="Delete service?"
        [message]="'This will permanently delete &quot;' + deleteTarget()!.name + '&quot;. Existing appointments are kept.'"
        confirmLabel="Delete"
        [dark]="true"
        [loading]="saving()"
        (confirmed)="executeDelete()"
        (cancelled)="deleteTarget.set(null)"
      />
    }
  `,
})
export class ServicesComponent implements OnInit {
  private readonly svc   = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  readonly loading        = signal(false);
  readonly errored        = signal(false);
  readonly saving         = signal(false);
  readonly services       = signal<IService[]>([]);
  readonly modalOpen      = signal(false);
  readonly editingService = signal<IService | null>(null);
  readonly deleteTarget   = signal<IService | null>(null);

  readonly form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    durationMins:[1,  [Validators.required, Validators.min(1), Validators.max(480)]],
    price:       [0,  [Validators.required, Validators.min(0)]],
    isActive:    [true],
    imageUrl:    [''],
  });

  onImageUploaded(secureUrl: string): void {
    this.form.patchValue({ imageUrl: secureUrl });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    this.svc.getServices().subscribe({
      next: res => {
        this.services.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingService.set(null);
    this.form.reset({ name: '', description: '', durationMins: 60, price: 0, isActive: true });
    this.modalOpen.set(true);
  }

  openEdit(s: IService): void {
    this.editingService.set(s);
    this.form.reset({
      name: s.name, description: s.description ?? '',
      durationMins: s.durationMins, price: s.price, isActive: s.isActive,
      imageUrl: s.imageUrl ?? '',
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingService.set(null);
  }

  submitForm(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const editing = this.editingService();

    this.saving.set(true);

    if (editing) {
      const req: IUpdateServiceRequest = {
        name: v.name!, description: v.description || null,
        durationMins: Number(v.durationMins), price: Number(v.price),
        isActive: v.isActive ?? true, imageUrl: v.imageUrl || null,
      };
      this.svc.updateService(editing.id, req).subscribe({
        next: res => {
          this.saving.set(false);
          this.services.update(list => list.map(s => s.id === editing.id ? res.data! : s));
          this.toast.success('Service updated.');
          this.closeModal();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.message ?? 'Failed to update service.');
        },
      });
    } else {
      const req: ICreateServiceRequest = {
        name: v.name!, description: v.description || null,
        durationMins: Number(v.durationMins), price: Number(v.price),
        imageUrl: v.imageUrl || null,
      };
      this.svc.createService(req).subscribe({
        next: res => {
          this.saving.set(false);
          this.services.update(list => [...list, res.data!]);
          this.toast.success('Service created.');
          this.closeModal();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.message ?? 'Failed to create service.');
        },
      });
    }
  }

  confirmDelete(s: IService): void { this.deleteTarget.set(s); }

  executeDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.saving.set(true);
    this.svc.deleteService(target.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.services.update(list => list.filter(s => s.id !== target.id));
        this.toast.success('Service deleted.');
        this.deleteTarget.set(null);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to delete service.');
      },
    });
  }

  fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl?.touched || ctrl.valid) return null;
    if (ctrl.hasError('required'))   return 'This field is required.';
    if (ctrl.hasError('maxlength'))  return `Max ${ctrl.errors?.['maxlength'].requiredLength} characters.`;
    if (ctrl.hasError('min'))        return `Must be at least ${ctrl.errors?.['min'].min}.`;
    if (ctrl.hasError('max'))        return `Must be at most ${ctrl.errors?.['max'].max}.`;
    return 'Invalid value.';
  }
}
