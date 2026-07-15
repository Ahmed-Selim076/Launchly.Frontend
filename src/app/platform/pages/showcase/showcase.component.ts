import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformNavComponent } from '../../components/nav/platform-nav.component';
import { PlatformFooterComponent } from '../../components/footer/platform-footer.component';
import { TenantService } from '../../../core/tenant/tenant.service';
import { environment } from '@env/environment';

interface ShowcaseEntry {
  storeType: 'Ecommerce' | 'Restaurant' | 'Booking';
  templateId: 1 | 2 | 3;
  subdomain: string;
  name: string;
  icon: string;
  color: string;
  templateLabel: string;
}

/**
 * /showcase — lets a visitor open any of the 9 real (storeType × template)
 * combinations live, with real seeded demo data, WITHOUT signing up or
 * creating a store. Each card opens the actual live tenant subdomain in a
 * new tab — same rendering path a real customer would see, not a
 * screenshot or a mock.
 */
@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [CommonModule, PlatformNavComponent, PlatformFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col bg-sf-bg">
      <app-platform-nav></app-platform-nav>

      <main class="flex-1 max-w-7xl mx-auto px-6 py-20 w-full">
        <div class="text-center mb-16">
          <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-3">
            Live demos
          </p>
          <h1 class="font-display font-bold text-4xl sm:text-5xl text-sf-text-1 tracking-tight mb-4">
            See every design, live
          </h1>
          <p class="text-sf-text-3 text-lg max-w-xl mx-auto">
            Nine real storefronts with real sample data — no sign-up needed.
            Click any card to open it exactly as a customer would see it.
          </p>
        </div>

        @for (group of groups; track group.storeType) {
          <div class="mb-16">
            <div class="flex items-center gap-3 mb-6">
              <span class="text-2xl">{{ group.icon }}</span>
              <h2 class="font-display font-semibold text-2xl text-sf-text-1">{{ group.label }}</h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
              @for (entry of group.entries; track entry.subdomain) {
                
                  [href]="buildUrl(entry.subdomain)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group relative rounded-2xl border border-sf-border bg-sf-surface overflow-hidden
                         transition-all duration-220 hover:border-sf-border-2 hover:shadow-lg"
                >
                  <div class="h-28 flex items-center justify-center relative overflow-hidden"
                       [style.background]="entry.color + '1a'">
                    <span class="text-4xl transition-transform duration-300 group-hover:scale-110">{{ entry.icon }}</span>
                    <span class="absolute top-3 end-3 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full text-white"
                          [style.background]="entry.color">
                      {{ entry.templateLabel }}
                    </span>
                  </div>
                  <div class="p-5">
                    <p class="font-display font-semibold text-sf-text-1 mb-1">{{ entry.name }}</p>
                    <p class="text-xs text-sf-text-3 mb-3">/store/{{ entry.subdomain }}</p>
                    <span class="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1"
                          [style.color]="entry.color">
                      Open live demo
                      <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                        <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/>
                      </svg>
                    </span>
                  </div>
                </a>
              }
            </div>
          </div>
        }
      </main>

      <app-platform-footer></app-platform-footer>
    </div>
  `,
})
export class ShowcaseComponent {
  private readonly tenantSvc = inject(TenantService);
  readonly platformDomain = environment.platformDomain;

  private readonly entries: ShowcaseEntry[] = [
    { storeType: 'Ecommerce', templateId: 1, subdomain: 'demo-ecommerce-1', name: 'Aura Goods',   icon: '🛍️', color: '#C1522A', templateLabel: 'Template 1' },
    { storeType: 'Ecommerce', templateId: 2, subdomain: 'demo-ecommerce-2', name: 'Voltage',       icon: '🛍️', color: '#6D28D9', templateLabel: 'Template 2' },
    { storeType: 'Ecommerce', templateId: 3, subdomain: 'demo-ecommerce-3', name: 'The Atelier',   icon: '🛍️', color: '#1F2937', templateLabel: 'Template 3' },

    { storeType: 'Restaurant', templateId: 1, subdomain: 'demo-restaurant-1', name: 'Molina',      icon: '🍽️', color: '#C1522A', templateLabel: 'Template 1' },
    { storeType: 'Restaurant', templateId: 2, subdomain: 'demo-restaurant-2', name: 'Ember & Oak',  icon: '🍽️', color: '#6D28D9', templateLabel: 'Template 2' },
    { storeType: 'Restaurant', templateId: 3, subdomain: 'demo-restaurant-3', name: 'Bistro Noir',  icon: '🍽️', color: '#1F2937', templateLabel: 'Template 3' },

    { storeType: 'Booking', templateId: 1, subdomain: 'demo-booking-1', name: 'Willow Spa',        icon: '📅', color: '#C1522A', templateLabel: 'Template 1' },
    { storeType: 'Booking', templateId: 2, subdomain: 'demo-booking-2', name: 'PowerHouse Fit',     icon: '📅', color: '#6D28D9', templateLabel: 'Template 2' },
    { storeType: 'Booking', templateId: 3, subdomain: 'demo-booking-3', name: 'Clarity Coaching',   icon: '📅', color: '#1F2937', templateLabel: 'Template 3' },
  ];

  readonly groups = [
    { storeType: 'Ecommerce',  label: 'Ecommerce',  icon: '🛍️', entries: this.entries.filter(e => e.storeType === 'Ecommerce') },
    { storeType: 'Restaurant', label: 'Restaurant', icon: '🍽️', entries: this.entries.filter(e => e.storeType === 'Restaurant') },
    { storeType: 'Booking',    label: 'Bookings',   icon: '📅', entries: this.entries.filter(e => e.storeType === 'Booking') },
  ];

  buildUrl(subdomain: string): string {
    return this.tenantSvc.buildTenantUrl(subdomain, '/');
  }
}
