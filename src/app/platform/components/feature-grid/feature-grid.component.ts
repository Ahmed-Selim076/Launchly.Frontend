import {
  Component, AfterViewInit, ElementRef, ViewChildren,
  QueryList, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-feature-grid',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="features" class="py-24 px-6 scroll-mt-20">
      <div class="max-w-7xl mx-auto">
        <!-- Section header -->
        <div class="text-center mb-16">
          <h2 class="font-display text-4xl font-bold text-sf-text-1 tracking-tight mb-4">
            Everything you need to sell online
          </h2>
          <p class="text-sf-text-3 text-lg max-w-xl mx-auto">
            Three store types, nine templates, one platform — built for businesses that
            care about their brand.
          </p>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            #featureCard
            *ngFor="let f of features; let i = index"
            class="reveal bg-sf-bg rounded-lg p-6 border border-sf-border hover:border-sf-border-2
                   transition-colors duration-[220ms] group"
            [style.transition-delay]="(i * 60) + 'ms'"
          >
            <div class="w-11 h-11 rounded-md bg-accent-dim flex items-center justify-center
                        text-xl mb-4 group-hover:bg-accent group-hover:text-white
                        transition-colors duration-[220ms]">
              {{ f.icon }}
            </div>
            <h3 class="font-display text-lg font-semibold text-sf-text-1 mb-2">
              {{ f.title }}
            </h3>
            <p class="text-sf-text-3 text-sm leading-relaxed">
              {{ f.description }}
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class FeatureGridComponent implements AfterViewInit {
  @ViewChildren('featureCard') cards!: QueryList<ElementRef<HTMLDivElement>>;

  readonly features: Feature[] = [
    {
      icon: '🛍️',
      title: 'Ecommerce',
      description: 'Sell physical or digital products with inventory tracking, orders, and a smooth checkout experience.',
    },
    {
      icon: '📅',
      title: 'Bookings',
      description: 'Let clients book appointments online. Manage your calendar, services, and availability with ease.',
    },
    {
      icon: '🍽️',
      title: 'Restaurant',
      description: 'Take food orders online with a beautiful menu. Manage categories, items, and order status in real time.',
    },
    {
      icon: '🎨',
      title: '9 Unique Templates',
      description: 'Every store type has three distinct layouts — Minimal, Bold, and Editorial. Not just colours, real layout differences.',
    },
    {
      icon: '🔗',
      title: 'Custom Subdomain',
      description: 'Your store lives at yourbrand.launchly.com — available instantly when you sign up.',
    },
    {
      icon: '📊',
      title: 'Built-in Analytics',
      description: 'Track revenue, orders, visitors, and top products — all inside your admin dashboard.',
    },
  ];

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    this.cards.forEach(card => observer.observe(card.nativeElement));
  }
}
