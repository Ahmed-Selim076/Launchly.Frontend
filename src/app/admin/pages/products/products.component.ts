import {
  Component, ChangeDetectionStrategy, OnInit, inject,
  signal, computed, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductService, IProductsQuery } from '../../../core/admin/product.service';
import { CategoryService } from '../../../core/admin/category.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { IProduct, ICategory, IPagedResult } from '../../../core/models';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, ISelectOption } from '../../../shared/components/select/select.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ImageUploaderComponent } from '../../components/image-uploader/image-uploader.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/pipes';

// ─── Product List Page ────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonComponent, InputComponent, SelectComponent,
    EmptyStateComponent, BadgeComponent, SkeletonComponent,
    CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-bold text-ad-text-1">Products</h1>
          <p class="text-ad-text-3 text-sm mt-0.5">
            {{ pagedResult()?.totalCount ?? 0 }} total products
          </p>
        </div>
        <a routerLink="/admin/products/new">
          <app-button variant="primary" size="sm">
            + Add product
          </app-button>
        </a>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-[200px] max-w-xs">
          <app-input
            placeholder="Search products…"
            [formControl]="searchCtrl"
            [dark]="true"
          />
        </div>
        <app-select
          placeholder="All categories"
          [options]="categoryOptions()"
          [formControl]="categoryCtrl"
          [dark]="true"
          class="w-44"
        />
        <app-select
          placeholder="All status"
          [options]="statusOptions"
          [formControl]="statusCtrl"
          [dark]="true"
          class="w-36"
        />
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <app-skeleton [dark]="true" height="52px" />
          }
        </div>
      } @else if (errored()) {
        <app-empty-state
          icon="⚠️"
          title="Couldn't load products"
          description="Something went wrong. Please try again."
          actionLabel="Retry"
          [dark]="true"
          (actionClicked)="load()"
        />
      } @else if (!pagedResult()?.items?.length) {
        <app-empty-state
          icon="📦"
          title="No products yet"
          description="Add your first product to start selling."
          actionLabel="Add product"
          [dark]="true"
          (actionClicked)="goToNew()"
        />
      } @else {
        <!-- Product rows -->
        <div class="rounded-xl border border-ad-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-ad-border bg-ad-surface-2">
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium">Product</th>
                <th class="text-left px-4 py-3 text-ad-text-3 font-medium hidden sm:table-cell">Category</th>
                <th class="text-right px-4 py-3 text-ad-text-3 font-medium">Price</th>
                <th class="text-right px-4 py-3 text-ad-text-3 font-medium hidden md:table-cell">Stock</th>
                <th class="px-4 py-3 text-ad-text-3 font-medium hidden lg:table-cell">Status</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ad-border">
              @for (p of pagedResult()!.items; track p.id) {
                <tr class="bg-ad-surface hover:bg-ad-surface-2 transition-colors">
                  <!-- Product name + image -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-ad-surface-2 shrink-0 overflow-hidden">
                        @if (p.imageUrl) {
                          <img [src]="p.imageUrl" [alt]="p.name"
                               class="w-full h-full object-cover" loading="lazy" />
                        } @else {
                          <div class="w-full h-full flex items-center justify-center text-ad-text-3 text-lg">
                            📦
                          </div>
                        }
                      </div>
                      <div class="min-w-0">
                        <p class="font-medium text-ad-text-1 truncate max-w-[180px]">{{ p.name }}</p>
                        <p class="text-xs text-ad-text-3 truncate max-w-[180px]">{{ p.slug }}</p>
                      </div>
                    </div>
                  </td>
                  <!-- Category -->
                  <td class="px-4 py-3 hidden sm:table-cell">
                    <span class="text-ad-text-2">{{ p.categoryName ?? '—' }}</span>
                  </td>
                  <!-- Price -->
                  <td class="px-4 py-3 text-right font-mono text-ad-text-1">
                    {{ p.price | currencyFormat }}
                  </td>
                  <!-- Stock -->
                  <td class="px-4 py-3 text-right hidden md:table-cell">
                    <span [class.text-[var(--color-danger)]]="p.stock === 0"
                          [class.text-ad-text-1]="p.stock > 0">
                      {{ p.stock }}
                    </span>
                  </td>
                  <!-- Status badge -->
                  <td class="px-4 py-3 hidden lg:table-cell">
                    <app-badge [variant]="p.isActive ? 'success' : 'default'">
                      {{ p.isActive ? 'Active' : 'Inactive' }}
                    </app-badge>
                  </td>
                  <!-- Actions -->
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <a [routerLink]="['/admin/products', p.id]">
                        <app-button variant="ghost" size="sm">Edit</app-button>
                      </a>
                    </div>
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
  `,
})
export class ProductsComponent implements OnInit {
  private readonly productSvc  = inject(ProductService);
  private readonly categorySvc = inject(CategoryService);
  private readonly toast       = inject(ToastService);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);
  private readonly cdr         = inject(ChangeDetectorRef);

  readonly pagedResult = signal<IPagedResult<IProduct> | null>(null);
  readonly categories  = signal<ICategory[]>([]);
  readonly loading     = signal(true);
  readonly errored     = signal(false);
  readonly currentPage = signal(1);

  readonly searchCtrl   = this.fb.control('');
  readonly categoryCtrl = this.fb.control<string>('');
  readonly statusCtrl   = this.fb.control<string>('');

  readonly statusOptions: ISelectOption[] = [
    { value: 'true',  label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  readonly categoryOptions = computed<ISelectOption[]>(() => [
    { value: '', label: 'All categories' },
    ...this.categories().map(c => ({ value: c.id, label: c.name })),
  ]);

  ngOnInit(): void {
    this.#loadCategories();
    this.load();
    this.#watchFilters();
  }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);

    const q: IProductsQuery = {
      page: this.currentPage(),
      pageSize: 20,
      search:     this.searchCtrl.value || undefined,
      categoryId: this.categoryCtrl.value || undefined,
      isActive:   this.statusCtrl.value === '' ? undefined
                : this.statusCtrl.value === 'true',
    };

    this.productSvc.getAll(q).subscribe({
      next: res => {
        if (res.success && res.data) this.pagedResult.set(res.data);
        else this.errored.set(true);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  setPage(p: number): void {
    this.currentPage.set(p);
    this.load();
  }

  goToNew(): void {
    this.router.navigate(['/admin/products/new']);
  }

  #loadCategories(): void {
    this.categorySvc.getAll().subscribe({
      next: res => { if (res.success && res.data) this.categories.set(res.data); },
    });
  }

  #watchFilters(): void {
    this.searchCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => { this.currentPage.set(1); this.load(); });

    this.categoryCtrl.valueChanges.subscribe(() => { this.currentPage.set(1); this.load(); });
    this.statusCtrl.valueChanges.subscribe(() => { this.currentPage.set(1); this.load(); });
  }
}

// ─── Product Form Page (Create + Edit) ───────────────────────────────────────

@Component({
  selector: 'app-admin-product-form-page',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonComponent, InputComponent, SelectComponent,
    ModalComponent, ConfirmDialogComponent,
    BadgeComponent, ImageUploaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 max-w-2xl">

      <!-- Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/admin/products">
          <app-button variant="ghost" size="sm">← Back</app-button>
        </a>
        <h1 class="font-display text-2xl font-bold text-ad-text-1">
          {{ isEdit() ? 'Edit product' : 'New product' }}
        </h1>
      </div>

      @if (loadingProduct()) {
        <!-- Skeleton while loading existing product -->
        <div class="space-y-4 rounded-2xl border border-ad-border bg-ad-surface p-6">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="h-10 rounded-lg bg-ad-surface-2 animate-pulse"></div>
          }
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">

          <!-- Main card -->
          <div class="rounded-2xl border border-ad-border bg-ad-surface p-6 space-y-5">
            <h2 class="font-semibold text-ad-text-1">Product details</h2>

            <app-input
              formControlName="name"
              label="Name"
              placeholder="e.g. Leather Wallet"
              [required]="true"
              [dark]="true"
              [error]="fieldErr('name')"
            />

            <div>
              <label class="block text-sm font-medium text-ad-text-2 mb-1.5">
                Description
                <span class="text-ad-text-3 font-normal">(optional)</span>
              </label>
              <textarea
                formControlName="description"
                rows="4"
                placeholder="Describe your product…"
                class="w-full rounded-xl border border-ad-border bg-ad-surface-2 px-3 py-2
                       text-sm text-ad-text-1 placeholder:text-ad-text-3
                       focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-dim)]
                       focus:border-[var(--color-accent)] resize-none transition-colors"
              ></textarea>
              @if (fieldErr('description')) {
                <p class="mt-1 text-xs text-[var(--color-danger)]">{{ fieldErr('description') }}</p>
              }
            </div>

            <div class="grid grid-cols-2 gap-4">
              <app-input
                formControlName="price"
                label="Price (USD)"
                type="number"
                placeholder="0.00"
                [required]="true"
                [dark]="true"
                [error]="fieldErr('price')"
              />
              <app-input
                formControlName="stock"
                label="Stock"
                type="number"
                placeholder="0"
                [required]="true"
                [dark]="true"
                [error]="fieldErr('stock')"
              />
            </div>

            <app-select
              formControlName="categoryId"
              label="Category"
              placeholder="No category"
              [options]="categoryOptions()"
              [dark]="true"
            />

            <!-- Active toggle -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="form.value.isActive"
                class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none
                       focus:ring-2 focus:ring-[var(--color-accent-dim)] focus:ring-offset-1"
                [class.bg-[var(--color-accent)]]="form.value.isActive"
                [class.bg-ad-border]="!form.value.isActive"
                (click)="toggleActive()"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
                         transition-transform duration-200"
                  [class.translate-x-4]="form.value.isActive"
                ></span>
              </button>
              <span class="text-sm text-ad-text-2">
                {{ form.value.isActive ? 'Active — visible in store' : 'Inactive — hidden from store' }}
              </span>
            </div>
          </div>

          <!-- Image card -->
          <div class="rounded-2xl border border-ad-border bg-ad-surface p-6 space-y-4">
            <div>
              <h2 class="font-semibold text-ad-text-1">Product image</h2>
              <p class="text-xs text-ad-text-3 mt-0.5">Uploaded directly to Cloudinary. Max 5 MB.</p>
            </div>
            <app-image-uploader
              type="product"
              [currentUrl]="form.value.imageUrl"
              (uploaded)="onImageUploaded($event)"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between gap-4">
            <!-- Delete (edit mode only) -->
            @if (isEdit()) {
              <app-button
                variant="ghost" size="sm"
                type="button"
                (clicked)="confirmDelete.set(true)"
                class="text-[var(--color-danger)]"
              >
                Delete product
              </app-button>
            } @else {
              <span></span>
            }

            <div class="flex gap-3">
              <a routerLink="/admin/products">
                <app-button variant="ghost" type="button">Cancel</app-button>
              </a>
              <app-button
                variant="primary"
                type="submit"
                [loading]="saving()"
                [disabled]="form.invalid"
              >
                {{ isEdit() ? 'Save changes' : 'Create product' }}
              </app-button>
            </div>
          </div>
        </form>

        <!-- Delete confirm dialog -->
        @if (confirmDelete()) {
          <app-confirm-dialog
            title="Delete product?"
            message="This will soft-delete the product. It will no longer appear in your store. Existing order history is preserved."
            confirmLabel="Delete"
            [dangerous]="true"
            [loading]="deleting()"
            [dark]="true"
            (confirmed)="onDelete()"
            (cancelled)="confirmDelete.set(false)"
          />
        }
      }
    </div>
  `,
})
export class ProductFormPageComponent implements OnInit {
  private readonly productSvc  = inject(ProductService);
  private readonly categorySvc = inject(CategoryService);
  private readonly toast       = inject(ToastService);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);
  private readonly fb          = inject(FormBuilder);
  private readonly cdr         = inject(ChangeDetectorRef);

  readonly isEdit        = signal(false);
  readonly loadingProduct = signal(false);
  readonly saving        = signal(false);
  readonly deleting      = signal(false);
  readonly confirmDelete = signal(false);
  readonly categories    = signal<ICategory[]>([]);

  private productId: string | null = null;

  readonly form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(5000)]],
    price:       [0,  [Validators.required, Validators.min(0.01)]],
    stock:       [0,  [Validators.required, Validators.min(0)]],
    categoryId:  [''],
    imageUrl:    [''],
    isActive:    [true],
  });

  readonly categoryOptions = computed<ISelectOption[]>(() => [
    { value: '', label: 'No category' },
    ...this.categories().map(c => ({ value: c.id, label: c.name })),
  ]);

  ngOnInit(): void {
    this.#loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.productId = id;
      this.#loadProduct(id);
    }
  }

  toggleActive(): void {
    this.form.patchValue({ isActive: !this.form.value.isActive });
  }

  onImageUploaded(secureUrl: string): void {
    this.form.patchValue({ imageUrl: secureUrl });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    const val = this.form.getRawValue();

    const req = {
      name:        val.name!.trim(),
      description: val.description?.trim() || null,
      price:       Number(val.price),
      stock:       Number(val.stock),
      categoryId:  val.categoryId || null,
      imageUrl:    val.imageUrl   || null,
      isActive:    val.isActive!,
    };

    const call = this.isEdit()
      ? this.productSvc.update(this.productId!, req)
      : this.productSvc.create(req);

    call.subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success) {
          this.toast.success(
            this.isEdit() ? 'Product updated.' : 'Product created.',
          );
          this.router.navigate(['/admin/products']);
        } else {
          this.toast.error(res.message ?? 'Something went wrong.');
          this.#applyServerErrors(res.errors ?? undefined);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Network error. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  onDelete(): void {
    if (!this.productId || this.deleting()) return;
    this.deleting.set(true);

    this.productSvc.delete(this.productId).subscribe({
      next: res => {
        this.deleting.set(false);
        this.confirmDelete.set(false);
        if (res.success) {
          this.toast.success('Product deleted.');
          this.router.navigate(['/admin/products']);
        } else {
          this.toast.error(res.message ?? 'Delete failed.');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.deleting.set(false);
        this.confirmDelete.set(false);
        this.toast.error('Network error. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  fieldErr(field: string): string {
    const ctrl: AbstractControl | null = this.form.get(field);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return '';
    if (ctrl.errors['required'])   return 'This field is required.';
    if (ctrl.errors['maxlength'])  return `Maximum ${ctrl.errors['maxlength'].requiredLength} characters.`;
    if (ctrl.errors['min'])        return field === 'price'
                                     ? 'Price must be greater than 0.'
                                     : 'Stock cannot be negative.';
    if (ctrl.errors['serverError']) return ctrl.errors['serverError'];
    return 'Invalid value.';
  }

  #loadProduct(id: string): void {
    this.loadingProduct.set(true);
    this.productSvc.getById(id).subscribe({
      next: res => {
        this.loadingProduct.set(false);
        if (res.success && res.data) {
          const p = res.data;
          this.form.patchValue({
            name:        p.name,
            description: p.description ?? '',
            price:       p.price,
            stock:       p.stock,
            categoryId:  p.categoryId ?? '',
            imageUrl:    p.imageUrl   ?? '',
            isActive:    p.isActive,
          });
        } else {
          this.toast.error('Product not found.');
          this.router.navigate(['/admin/products']);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingProduct.set(false);
        this.toast.error('Failed to load product.');
        this.router.navigate(['/admin/products']);
        this.cdr.markForCheck();
      },
    });
  }

  #loadCategories(): void {
    this.categorySvc.getAll().subscribe({
      next: res => {
        if (res.success && res.data) this.categories.set(res.data);
        this.cdr.markForCheck();
      },
    });
  }

  #applyServerErrors(errors?: Record<string, string[]>): void {
    if (!errors) return;
    for (const [field, messages] of Object.entries(errors)) {
      const ctrl = this.form.get(field.toLowerCase());
      if (ctrl) ctrl.setErrors({ serverError: messages[0] });
    }
  }
}
