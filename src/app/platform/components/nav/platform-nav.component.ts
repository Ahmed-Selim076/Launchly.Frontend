import {
  Component, inject, signal, HostListener,
  ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';

interface NavLink {
  label: string;
  /** Route path — used for pages like /pricing. */
  path?: string;
  /** Section id on the home page — scrolled to + tracked via scrollspy. */
  fragment?: string;
}

@Component({
  selector: 'app-platform-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="fixed top-0 inset-x-0 z-50 transition-all duration-[220ms]"
      [class.bg-sf-bg]="scrolled()"
      [class.shadow-sm]="scrolled()"
      [class.border-b]="scrolled()"
      [class.border-sf-border]="scrolled()"
    >
      <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <!-- Logo -->
        <a routerLink="/" fragment="top" class="font-display font-bold text-xl text-sf-text-1 tracking-tight">
          Launchly
        </a>

        <!-- Desktop Links -->
        <ul #linkList class="hidden md:flex items-center gap-1 relative" role="list">
          <li
            *ngIf="indicatorStyle() as s"
            class="absolute bottom-0 h-0.5 bg-accent rounded-full transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            [style.left.px]="s.left"
            [style.width.px]="s.width"
          ></li>

          <li *ngFor="let link of navLinks">
            <a
              [routerLink]="link.path ?? '/'"
              [fragment]="link.fragment"
              [attr.data-fragment]="link.fragment ?? null"
              [class.text-sf-text-1]="isActive(link)"
              [class.text-sf-text-3]="!isActive(link)"
              class="relative px-4 py-2 text-sm font-medium rounded-md transition-colors duration-[120ms]
                     hover:text-sf-text-1"
              (mouseenter)="onLinkHover($event)"
              (mouseleave)="onLinkLeave()"
              (click)="onLinkClick(link)"
            >
              {{ link.label }}
            </a>
          </li>
        </ul>

        <!-- CTA -->
        <div class="hidden md:flex items-center gap-3">
          <ng-container *ngIf="auth.isAuthenticated(); else guestCta">
            <a
              routerLink="/admin"
              class="text-sm font-medium text-sf-text-2 hover:text-sf-text-1 transition-colors"
            >
              Dashboard
            </a>
          </ng-container>

          <ng-template #guestCta>
            <a
              routerLink="/login"
              class="text-sm font-medium text-sf-text-2 hover:text-sf-text-1 transition-colors"
            >
              Sign in
            </a>
            <app-button variant="primary" size="sm" routerLink="/signup">
              Get started free
            </app-button>
          </ng-template>
        </div>

        <!-- Mobile hamburger -->
        <button
          class="md:hidden p-2 rounded-md text-sf-text-2 hover:text-sf-text-1 hover:bg-sf-surface
                 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          (click)="mobileOpen.set(!mobileOpen())"
          [attr.aria-expanded]="mobileOpen()"
          aria-label="Toggle menu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path *ngIf="!mobileOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"/>
            <path *ngIf="mobileOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </nav>

      <!-- Mobile menu -->
      <div
        *ngIf="mobileOpen()"
        class="md:hidden border-t border-sf-border bg-sf-bg px-6 py-4 flex flex-col gap-1"
      >
        <a
          *ngFor="let link of navLinks"
          [routerLink]="link.path ?? '/'"
          [fragment]="link.fragment"
          (click)="mobileOpen.set(false)"
          class="px-3 py-2.5 rounded-md text-sm font-medium text-sf-text-2
                 hover:bg-sf-surface hover:text-sf-text-1 transition-colors"
        >
          {{ link.label }}
        </a>
        <div class="border-t border-sf-border mt-3 pt-3 flex flex-col gap-2">
          <a routerLink="/login" (click)="mobileOpen.set(false)"
            class="px-3 py-2.5 text-sm font-medium text-sf-text-2 hover:text-sf-text-1">
            Sign in
          </a>
          <app-button variant="primary" size="sm" routerLink="/signup"
            (clicked)="mobileOpen.set(false)">
            Get started free
          </app-button>
        </div>
      </div>
    </header>

    <!-- Spacer to offset fixed nav -->
    <div class="h-16"></div>
  `,
})
export class PlatformNavComponent implements AfterViewInit, OnDestroy {
  readonly auth       = inject(AuthService);
  private readonly router = inject(Router);
  readonly scrolled   = signal(false);
  readonly mobileOpen = signal(false);

  readonly indicatorStyle = signal<{ left: number; width: number } | null>(null);
  readonly activeFragment = signal<string | null>(null);

  @ViewChild('linkList') linkListRef!: ElementRef<HTMLUListElement>;

  private observer: IntersectionObserver | null = null;

  readonly navLinks: NavLink[] = [
    { label: 'Home',          fragment: 'top' },
    { label: 'Store types',   fragment: 'store-types' },
    { label: 'How it works',  fragment: 'how-it-works' },
    { label: 'Features',      fragment: 'features' },
    { label: 'FAQ',           fragment: 'faq' },
    { label: 'Live demos',    path: '/showcase' },
    { label: 'Pricing',       path: '/pricing' },
  ];

  isActive(link: NavLink): boolean {
    if (link.path) return this.router.url.split('#')[0].split('?')[0] === link.path;
    if (this.router.url.split('#')[0].split('?')[0] !== '/') return false;
    return this.activeFragment() === link.fragment;
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.#updateIndicatorToActive(), 50);
    this.#setupScrollSpy();

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      setTimeout(() => {
        this.#setupScrollSpy();
        this.#updateIndicatorToActive();
      }, 100);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }

  onLinkClick(link: NavLink): void {
    if (link.fragment) this.activeFragment.set(link.fragment);
  }

  onLinkHover(e: MouseEvent): void {
    const el   = e.currentTarget as HTMLElement;
    const list = this.linkListRef.nativeElement;
    const listRect = list.getBoundingClientRect();
    const elRect   = el.getBoundingClientRect();
    this.indicatorStyle.set({
      left:  elRect.left - listRect.left + 16,
      width: elRect.width - 32,
    });
  }

  onLinkLeave(): void {
    this.#updateIndicatorToActive();
  }

  #updateIndicatorToActive(): void {
    if (!this.linkListRef) return;
    const list    = this.linkListRef.nativeElement;
    const active  = list.querySelector('a.text-sf-text-1') as HTMLElement | null;
    if (!active) { this.indicatorStyle.set(null); return; }
    const listRect = list.getBoundingClientRect();
    const elRect   = active.getBoundingClientRect();
    this.indicatorStyle.set({
      left:  elRect.left - listRect.left + 16,
      width: elRect.width - 32,
    });
  }

  /** Tracks which home-page section is currently in view so the nav
   *  highlights the right link while scrolling, not just on click. */
  #setupScrollSpy(): void {
    this.observer?.disconnect();

    const fragments = this.navLinks.filter(l => l.fragment).map(l => l.fragment!);
    const sections = fragments
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (!sections.length) return;

    this.observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) {
          const topMost = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          this.activeFragment.set(topMost.target.id);
          this.#updateIndicatorToActive();
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(s => this.observer!.observe(s));
  }
}
