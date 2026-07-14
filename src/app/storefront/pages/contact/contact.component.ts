import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TenantService }       from '../../../core/tenant/tenant.service';
import { ProductStoreService } from '../../../core/storefront/store.service';
import { ToastService }        from '../../../shared/components/toast/toast.service';
import { StoreNavComponent }   from '../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../layout/store-footer/store-footer.component';

/**
 * Shared "Contact" page — layout is a 1:1 port of smart-vibe's Contact.tsx
 * (hero + 4 channel cards + form/info split), wired to the real
 * POST /store/contact endpoint and the merchant's own contact details from
 * Settings. Channel cards only render for channels the merchant actually
 * filled in — no placeholder phone numbers or fake addresses.
 */
@Component({
  selector: 'app-storefront-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StoreNavComponent, StoreFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex flex-col">
      <app-store-nav />

      <!-- Hero -->
      <section class="bg-tenant-mesh border-b border-sf-border">
        <div class="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20 text-center">
          <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-3">
            Get in touch
          </p>
          <h1 class="font-display text-3xl sm:text-5xl text-sf-text-1 mb-4">
            Contact {{ tenant()?.storeName ?? 'us' }}
          </h1>
          <p class="text-sf-text-2 max-w-lg mx-auto">
            Questions about an order or a product? We're happy to help.
          </p>
        </div>
      </section>

      <main class="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-14 sm:py-20">

        <!-- Channel cards — only the ones the merchant filled in -->
        @if (hasAnyChannel()) {
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
            @if (tenant()?.contactPhone) {
              <a [href]="'tel:' + tenant()!.contactPhone" class="channel-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-5 h-5 mb-2" style="color: var(--tenant-primary);">
                  <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.5 2.1L8 9.7a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.9.3 1.8.5 2.7.6a2 2 0 011.7 2z"/>
                </svg>
                <p class="text-xs font-semibold text-sf-text-1">Call us</p>
                <p class="text-xs text-sf-text-3 truncate w-full">{{ tenant()!.contactPhone }}</p>
              </a>
            }
            @if (tenant()?.whatsappNumber) {
              <a [href]="whatsappLink()" target="_blank" rel="noopener noreferrer" class="channel-card">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mb-2" style="color: var(--tenant-primary);">
                  <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1-.2-.1-1-.4-2-1.2-.7-.6-1.2-1.4-1.4-1.7-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4-.1-.1-.5-1.3-.7-1.8-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1 0-.1-.2-.2-.4-.3z"/>
                </svg>
                <p class="text-xs font-semibold text-sf-text-1">WhatsApp</p>
                <p class="text-xs text-sf-text-3 truncate w-full">{{ tenant()!.whatsappNumber }}</p>
              </a>
            }
            @if (tenant()?.contactEmail) {
              <a [href]="'mailto:' + tenant()!.contactEmail" class="channel-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-5 h-5 mb-2" style="color: var(--tenant-primary);">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 6l-10 7L2 6"/>
                </svg>
                <p class="text-xs font-semibold text-sf-text-1">Email</p>
                <p class="text-xs text-sf-text-3 truncate w-full">{{ tenant()!.contactEmail }}</p>
              </a>
            }
            @if (tenant()?.contactAddress) {
              <div class="channel-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-5 h-5 mb-2" style="color: var(--tenant-primary);">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <p class="text-xs font-semibold text-sf-text-1">Visit us</p>
                <p class="text-xs text-sf-text-3">{{ tenant()!.contactAddress }}</p>
              </div>
            }
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12">
          <!-- Form -->
          <div>
            @if (sent()) {
              <div class="rounded-xl border border-sf-border p-8 text-center">
                <p class="font-display text-xl text-sf-text-1 mb-2">Message sent ✓</p>
                <p class="text-sf-text-3 text-sm">Thanks for reaching out — we'll reply soon.</p>
              </div>
            } @else {
              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-sf-text-1 mb-1.5">Name</label>
                    <input type="text" formControlName="name" class="field-input" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-sf-text-1 mb-1.5">Email</label>
                    <input type="email" formControlName="email" class="field-input" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-sf-text-1 mb-1.5">
                    Phone <span class="text-sf-text-3 font-normal">(optional)</span>
                  </label>
                  <input type="tel" formControlName="phone" class="field-input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-sf-text-1 mb-1.5">
                    Subject <span class="text-sf-text-3 font-normal">(optional)</span>
                  </label>
                  <input type="text" formControlName="subject" class="field-input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-sf-text-1 mb-1.5">Message</label>
                  <textarea formControlName="message" rows="5" class="field-input resize-none"></textarea>
                  @if (form.controls.message.touched && form.controls.message.errors?.['minlength']) {
                    <p class="mt-1 text-xs text-danger">Please write at least 10 characters.</p>
                  }
                </div>
                <button
                  type="submit"
                  [disabled]="form.invalid || sending()"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white
                         disabled:opacity-40 transition-opacity bg-tenant-gradient shadow-tenant-glow"
                >
                  {{ sending() ? 'Sending…' : 'Send message' }}
                </button>
              </form>
            }
          </div>

          <!-- Info sidebar -->
          <aside class="space-y-6">
            <div class="rounded-xl border border-sf-border p-5">
              <h3 class="font-display text-sf-text-1 mb-3">Hours</h3>
              <ul class="space-y-1.5 text-sm text-sf-text-2">
                <li class="flex justify-between"><span>Sat – Thu</span><span>10am – 10pm</span></li>
                <li class="flex justify-between"><span>Friday</span><span>2pm – 10pm</span></li>
              </ul>
            </div>
            <div class="rounded-xl p-5 text-white bg-tenant-gradient">
              <h3 class="font-display mb-1.5">Need a fast answer?</h3>
              <p class="text-sm opacity-90">
                @if (tenant()?.whatsappNumber) {
                  Message us on WhatsApp for the quickest reply.
                } @else {
                  Send us a message and we'll get back to you shortly.
                }
              </p>
            </div>
          </aside>
        </div>
      </main>

      <app-store-footer />
    </div>

    <style>
      .channel-card {
        display: flex; flex-direction: column; align-items: flex-start;
        padding: 1rem; border-radius: 1rem; border: 1px solid var(--color-sf-border);
        background: var(--color-sf-surface); transition: border-color .2s, box-shadow .2s;
      }
      .channel-card:hover { border-color: color-mix(in srgb, var(--tenant-primary) 50%, transparent); }
      .field-input {
        width: 100%; border-radius: 0.5rem; border: 1px solid var(--color-sf-border);
        background: var(--color-sf-bg); padding: 0.625rem 0.875rem; font-size: 0.875rem;
        color: var(--color-sf-text-1);
      }
      .field-input:focus { outline: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--tenant-primary) 40%, transparent); }
    </style>
  `,
})
export class StorefrontContactComponent {
  private readonly fb  = inject(FormBuilder);
  private readonly productSvc = inject(ProductStoreService);
  private readonly toast      = inject(ToastService);
  readonly tenant = inject(TenantService).currentTenant;
  readonly sent    = signal(false);
  readonly sending = signal(false);

  readonly hasAnyChannel = () => !!(
    this.tenant()?.contactPhone || this.tenant()?.whatsappNumber ||
    this.tenant()?.contactEmail || this.tenant()?.contactAddress
  );

  readonly whatsappLink = () => {
    const digits = (this.tenant()?.whatsappNumber ?? '').replace(/[^\d]/g, '');
    return `https://wa.me/${digits}`;
  };

  readonly form = this.fb.nonNullable.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    phone:   [''],
    subject: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.sending.set(true);
    this.productSvc.sendContactMessage({
      name: v.name, email: v.email,
      phone: v.phone || null, subject: v.subject || null,
      message: v.message,
    }).subscribe({
      next: res => {
        this.sending.set(false);
        if (res.success) {
          this.sent.set(true);
        } else {
          this.toast.error(res.message ?? 'Could not send your message. Please try again.');
        }
      },
      error: () => {
        this.sending.set(false);
        this.toast.error('Network error. Please try again.');
      },
    });
  }
}
