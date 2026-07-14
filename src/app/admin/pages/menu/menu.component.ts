import {
  Component, ChangeDetectionStrategy, OnInit, inject,
  signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import {
  RestaurantService,
  ICreateMenuCategoryRequest,
  ICreateMenuItemRequest,
  IUpdateMenuItemRequest,
} from '../../../core/admin/restaurant.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { IMenuCategory, IMenuItem } from '../../../core/models';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, ISelectOption } from '../../../shared/components/select/select.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ImageUploaderComponent } from '../../components/image-uploader/image-uploader.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/pipes';

type ActiveTab = 'items' | 'categories';
type ModalMode = 'item-create' | 'item-edit' | 'cat-create' | 'cat-edit' | null;

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonComponent, InputComponent, SelectComponent, ModalComponent,
    ConfirmDialogComponent, BadgeComponent, SkeletonComponent,
    EmptyStateComponent, ImageUploaderComponent, CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-bold text-ad-text-1">Menu</h1>
          <p class="text-ad-text-3 text-sm mt-0.5">
            {{ items().length }} item{{ items().length !== 1 ? 's' : '' }}
            in {{ categories().length }} categor{{ categories().length !== 1 ? 'ies' : 'y' }}
          </p>
        </div>
        <app-button
          variant="primary" size="sm"
          (clicked)="activeTab() === 'items' ? openItemCreate() : openCatCreate()"
        >
          + {{ activeTab() === 'items' ? 'Add item' : 'Add category' }}
        </app-button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-ad-border">
        <button
          *ngFor="let tab of tabs"
          (click)="setTab(tab.id)"
          class="px-4 py-2.5 text-sm font-medium transition-colors"
          [class.text-ad-text-1]="activeTab() === tab.id"
          [class.border-b-2]="activeTab() === tab.id"
          [class.border-[var(--color-primary)]]="activeTab() === tab.id"
          [class.-mb-px]="activeTab() === tab.id"
          [class.text-ad-text-3]="activeTab() !== tab.id"
          [class.hover:text-ad-text-2]="activeTab() !== tab.id"
        >{{ tab.label }}</button>
      </div>

      <!-- ── Items Tab ──────────────────────────────────────────────────────── -->
      @if (activeTab() === 'items') {

        <!-- Category filter chips -->
        @if (categories().length) {
          <div class="flex flex-wrap gap-2">
            <button
              (click)="selectedCategoryId.set(null)"
              class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              [class.bg-[var(--color-primary)]]="selectedCategoryId() === null"
              [class.text-white]="selectedCategoryId() === null"
              [class.bg-ad-surface-2]="selectedCategoryId() !== null"
              [class.text-ad-text-2]="selectedCategoryId() !== null"
            >All</button>
            @for (cat of categories(); track cat.id) {
              <button
                (click)="selectedCategoryId.set(cat.id)"
                class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                [class.bg-[var(--color-primary)]]="selectedCategoryId() === cat.id"
                [class.text-white]="selectedCategoryId() === cat.id"
                [class.bg-ad-surface-2]="selectedCategoryId() !== cat.id"
                [class.text-ad-text-2]="selectedCategoryId() !== cat.id"
              >{{ cat.name }}</button>
            }
          </div>
        }

        @if (loading()) {
          <div class="space-y-2">
            @for (_ of [1,2,3,4]; track $index) {
              <app-skeleton [dark]="true" height="64px" />
            }
          </div>
        } @else if (errored()) {
          <app-empty-state icon="⚠️" title="Couldn't load menu" description="Please try again."
            actionLabel="Retry" [dark]="true" (actionClicked)="load()" />
        } @else if (!filteredItems().length) {
          <app-empty-state icon="🍽️" title="No menu items"
            description="Add your first dish or drink to the menu."
            actionLabel="Add item" [dark]="true" (actionClicked)="openItemCreate()" />
        } @else {
          <div class="rounded-xl border border-ad-border overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-ad-border bg-ad-surface-2">
                  <th class="text-left px-4 py-3 text-ad-text-3 font-medium">Item</th>
                  <th class="text-left px-4 py-3 text-ad-text-3 font-medium hidden sm:table-cell">Category</th>
                  <th class="text-right px-4 py-3 text-ad-text-3 font-medium">Price</th>
                  <th class="px-4 py-3 text-ad-text-3 font-medium hidden md:table-cell">Status</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ad-border">
                @for (item of filteredItems(); track item.id) {
                  <tr class="bg-ad-surface hover:bg-ad-surface-2 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-ad-surface-2 shrink-0 overflow-hidden">
                          @if (item.imageUrl) {
                            <img [src]="item.imageUrl" [alt]="item.name"
                                 class="w-full h-full object-cover" loading="lazy" />
                          } @else {
                            <div class="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                          }
                        </div>
                        <div class="min-w-0">
                          <p class="font-medium text-ad-text-1 truncate max-w-[180px]">{{ item.name }}</p>
                          @if (item.description) {
                            <p class="text-xs text-ad-text-3 truncate max-w-[180px]">{{ item.description }}</p>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 hidden sm:table-cell text-ad-text-2">
                      {{ item.categoryName ?? '—' }}
                    </td>
                    <td class="px-4 py-3 text-right font-mono text-ad-text-1">
                      {{ item.price | currencyFormat }}
                    </td>
                    <td class="px-4 py-3 hidden md:table-cell">
                      <app-badge [variant]="item.isActive ? 'success' : 'default'">
                        {{ item.isActive ? 'Available' : 'Unavailable' }}
                      </app-badge>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <app-button variant="ghost" size="sm" (clicked)="openItemEdit(item)">Edit</app-button>
                        <app-button variant="ghost" size="sm" (clicked)="deleteItemTarget.set(item)">Delete</app-button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- ── Categories Tab ─────────────────────────────────────────────────── -->
      @if (activeTab() === 'categories') {
        @if (loading()) {
          <div class="space-y-2">
            @for (_ of [1,2,3]; track $index) {
              <app-skeleton [dark]="true" height="56px" />
            }
          </div>
        } @else if (!categories().length) {
          <app-empty-state icon="📂" title="No categories"
            description="Organise your menu by creating categories."
            actionLabel="Add category" [dark]="true" (actionClicked)="openCatCreate()" />
        } @else {
          <div class="rounded-xl border border-ad-border overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-ad-border bg-ad-surface-2">
                  <th class="text-left px-4 py-3 text-ad-text-3 font-medium">Category</th>
                  <th class="text-right px-4 py-3 text-ad-text-3 font-medium hidden sm:table-cell">Items</th>
                  <th class="text-right px-4 py-3 text-ad-text-3 font-medium hidden md:table-cell">Sort</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ad-border">
                @for (cat of categories(); track cat.id) {
                  <tr class="bg-ad-surface hover:bg-ad-surface-2 transition-colors">
                    <td class="px-4 py-3 font-medium text-ad-text-1">{{ cat.name }}</td>
                    <td class="px-4 py-3 text-right hidden sm:table-cell text-ad-text-2">{{ cat.itemCount }}</td>
                    <td class="px-4 py-3 text-right hidden md:table-cell text-ad-text-3">{{ cat.sortOrder }}</td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <app-button variant="ghost" size="sm" (clicked)="openCatEdit(cat)">Edit</app-button>
                        <app-button variant="ghost" size="sm" (clicked)="deleteCatTarget.set(cat)">Delete</app-button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>

    <!-- ── Item Modal ──────────────────────────────────────────────────────── -->
    @if (modalMode() === 'item-create' || modalMode() === 'item-edit') {
      <app-modal
        [title]="modalMode() === 'item-edit' ? 'Edit Menu Item' : 'New Menu Item'"
        [dark]="true"
        (closed)="closeModal()"
      >
        <div class="space-y-4" [formGroup]="itemForm">
          <app-input label="Name" placeholder="e.g. Margherita Pizza"
            formControlName="name" [dark]="true" [error]="(itemFieldError('name') ?? \'\')" />
          <app-input label="Description (optional)" placeholder="Short description"
            formControlName="description" [dark]="true" />
          <div class="grid grid-cols-2 gap-4">
            <app-input label="Price" type="number" placeholder="0.00"
              formControlName="price" [dark]="true" [error]="(itemFieldError('price') ?? \'\')" />
            <app-select label="Category (optional)" [options]="categoryOptions()"
              formControlName="categoryId" [dark]="true" class="w-full" />
          </div>

          <!-- Image upload -->
          <div>
            <label class="block text-xs font-medium text-ad-text-2 mb-1.5">Image (optional)</label>
            <app-image-uploader
              type="product"
              [currentUrl]="itemForm.get('imageUrl')?.value ?? null"
              (uploaded)="onItemImageUploaded($event)"
            />
          </div>

          @if (modalMode() === 'item-edit') {
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" formControlName="isActive"
                     class="w-4 h-4 rounded border-ad-border accent-[var(--color-primary)]" />
              <span class="text-sm text-ad-text-2">Available (shown to customers)</span>
            </label>
          }
        </div>

        <div slot="footer" class="flex justify-end gap-3">
          <app-button variant="ghost" [dark]="true" (clicked)="closeModal()">Cancel</app-button>
          <app-button variant="primary" [loading]="saving()" [disabled]="itemForm.invalid"
            (clicked)="submitItemForm()">
            {{ modalMode() === 'item-edit' ? 'Save changes' : 'Add to menu' }}
          </app-button>
        </div>
      </app-modal>
    }

    <!-- ── Category Modal ─────────────────────────────────────────────────── -->
    @if (modalMode() === 'cat-create' || modalMode() === 'cat-edit') {
      <app-modal
        [title]="modalMode() === 'cat-edit' ? 'Edit Category' : 'New Category'"
        [dark]="true"
        (closed)="closeModal()"
      >
        <div class="space-y-4" [formGroup]="catForm">
          <app-input label="Name" placeholder="e.g. Starters"
            formControlName="name" [dark]="true" [error]="(catFieldError('name') ?? \'\')" />
          <app-input label="Sort order" type="number" placeholder="0"
            formControlName="sortOrder" [dark]="true" [error]="(catFieldError('sortOrder') ?? \'\')" />
        </div>

        <div slot="footer" class="flex justify-end gap-3">
          <app-button variant="ghost" [dark]="true" (clicked)="closeModal()">Cancel</app-button>
          <app-button variant="primary" [loading]="saving()" [disabled]="catForm.invalid"
            (clicked)="submitCatForm()">
            {{ modalMode() === 'cat-edit' ? 'Save changes' : 'Create category' }}
          </app-button>
        </div>
      </app-modal>
    }

    <!-- ── Delete Confirms ────────────────────────────────────────────────── -->
    @if (deleteItemTarget()) {
      <app-confirm-dialog
        title="Delete menu item?"
        [message]="'Permanently delete &quot;' + deleteItemTarget()!.name + '&quot;?'"
        confirmLabel="Delete"
        [dark]="true"
        [loading]="saving()"
        (confirmed)="executeItemDelete()"
        (cancelled)="deleteItemTarget.set(null)"
      />
    }

    @if (deleteCatTarget()) {
      <app-confirm-dialog
        title="Delete category?"
        [message]="'Delete &quot;' + deleteCatTarget()!.name + '&quot;? Its items will become uncategorised.'"
        confirmLabel="Delete"
        [dark]="true"
        [loading]="saving()"
        (confirmed)="executeCatDelete()"
        (cancelled)="deleteCatTarget.set(null)"
      />
    }
  `,
})
export class MenuComponent implements OnInit {
  private readonly svc   = inject(RestaurantService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  readonly tabs = [
    { id: 'items' as ActiveTab,      label: 'Menu Items' },
    { id: 'categories' as ActiveTab, label: 'Categories' },
  ];

  readonly activeTab         = signal<ActiveTab>('items');
  readonly selectedCategoryId = signal<string | null>(null);
  readonly loading            = signal(false);
  readonly errored            = signal(false);
  readonly saving             = signal(false);
  readonly items              = signal<IMenuItem[]>([]);
  readonly categories         = signal<IMenuCategory[]>([]);
  readonly modalMode          = signal<ModalMode>(null);
  readonly editingItem        = signal<IMenuItem | null>(null);
  readonly editingCat         = signal<IMenuCategory | null>(null);
  readonly deleteItemTarget   = signal<IMenuItem | null>(null);
  readonly deleteCatTarget    = signal<IMenuCategory | null>(null);

  readonly filteredItems = computed(() => {
    const catId = this.selectedCategoryId();
    if (!catId) return this.items();
    return this.items().filter(i => i.categoryId === catId);
  });

  readonly categoryOptions = computed<ISelectOption[]>(() => [
    { value: '', label: 'No category' },
    ...this.categories().map(c => ({ value: c.id, label: c.name })),
  ]);

  readonly itemForm = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    price:       [0,  [Validators.required, Validators.min(0.01)]],
    categoryId:  [''],
    imageUrl:    [''],
    isActive:    [true],
  });

  readonly catForm = this.fb.group({
    name:      ['', [Validators.required, Validators.maxLength(80)]],
    sortOrder: [0,  [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    // Load both in parallel via individual subscriptions (no forkJoin needed)
    let itemsDone = false, catsDone = false;
    const tryDone = () => { if (itemsDone && catsDone) this.loading.set(false); };

    this.svc.getItems().subscribe({
      next: res => { this.items.set(res.data ?? []); itemsDone = true; tryDone(); },
      error: ()  => { this.errored.set(true); this.loading.set(false); },
    });

    this.svc.getCategories().subscribe({
      next: res => { this.categories.set(res.data ?? []); catsDone = true; tryDone(); },
      error: ()  => { this.errored.set(true); this.loading.set(false); },
    });
  }

  setTab(t: ActiveTab): void { this.activeTab.set(t); }

  // ── Item Modal ─────────────────────────────────────────────────────────────

  openItemCreate(): void {
    this.editingItem.set(null);
    this.itemForm.reset({ name: '', description: '', price: 0, categoryId: '', imageUrl: '', isActive: true });
    this.modalMode.set('item-create');
  }

  openItemEdit(item: IMenuItem): void {
    this.editingItem.set(item);
    this.itemForm.reset({
      name: item.name, description: item.description ?? '',
      price: item.price, categoryId: item.categoryId ?? '',
      imageUrl: item.imageUrl ?? '', isActive: item.isActive,
    });
    this.modalMode.set('item-edit');
  }

  onItemImageUploaded(url: string): void {
    this.itemForm.patchValue({ imageUrl: url });
  }

  submitItemForm(): void {
    if (this.itemForm.invalid) { this.itemForm.markAllAsTouched(); return; }
    const v = this.itemForm.getRawValue();
    const editing = this.editingItem();
    const req: ICreateMenuItemRequest = {
      name: v.name!, description: v.description || null,
      price: Number(v.price),
      categoryId: v.categoryId || null,
      imageUrl: v.imageUrl || null,
      isActive: v.isActive ?? true,
    };

    this.saving.set(true);
    const call = editing
      ? this.svc.updateItem(editing.id, req as IUpdateMenuItemRequest)
      : this.svc.createItem(req);

    call.subscribe({
      next: res => {
        this.saving.set(false);
        if (editing) {
          this.items.update(list => list.map(i => i.id === editing.id ? res.data! : i));
          this.toast.success('Menu item updated.');
        } else {
          this.items.update(list => [...list, res.data!]);
          this.toast.success('Menu item added.');
        }
        this.closeModal();
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to save menu item.');
      },
    });
  }

  // ── Category Modal ─────────────────────────────────────────────────────────

  openCatCreate(): void {
    this.editingCat.set(null);
    this.catForm.reset({ name: '', sortOrder: 0 });
    this.modalMode.set('cat-create');
  }

  openCatEdit(cat: IMenuCategory): void {
    this.editingCat.set(cat);
    this.catForm.reset({ name: cat.name, sortOrder: cat.sortOrder });
    this.modalMode.set('cat-edit');
  }

  submitCatForm(): void {
    if (this.catForm.invalid) { this.catForm.markAllAsTouched(); return; }
    const v = this.catForm.getRawValue();
    const editing = this.editingCat();
    const req: ICreateMenuCategoryRequest = { name: v.name!, sortOrder: Number(v.sortOrder) };

    this.saving.set(true);
    const call = editing
      ? this.svc.updateCategory(editing.id, req)
      : this.svc.createCategory(req);

    call.subscribe({
      next: res => {
        this.saving.set(false);
        if (editing) {
          this.categories.update(list => list.map(c => c.id === editing.id ? res.data! : c));
          this.toast.success('Category updated.');
        } else {
          this.categories.update(list => [...list, res.data!]);
          this.toast.success('Category created.');
        }
        this.closeModal();
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to save category.');
      },
    });
  }

  closeModal(): void { this.modalMode.set(null); this.editingItem.set(null); this.editingCat.set(null); }

  // ── Deletes ─────────────────────────────────────────────────────────────────

  executeItemDelete(): void {
    const target = this.deleteItemTarget();
    if (!target) return;
    this.saving.set(true);
    this.svc.deleteItem(target.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.items.update(list => list.filter(i => i.id !== target.id));
        this.toast.success('Menu item deleted.');
        this.deleteItemTarget.set(null);
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to delete menu item.');
      },
    });
  }

  executeCatDelete(): void {
    const target = this.deleteCatTarget();
    if (!target) return;
    this.saving.set(true);
    this.svc.deleteCategory(target.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.categories.update(list => list.filter(c => c.id !== target.id));
        // Unassign local items too (backend already did it)
        this.items.update(list => list.map(i =>
          i.categoryId === target.id ? { ...i, categoryId: null, categoryName: null } : i
        ));
        this.toast.success('Category deleted.');
        this.deleteCatTarget.set(null);
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to delete category.');
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  itemFieldError(name: string): string | null {
    const ctrl = this.itemForm.get(name);
    if (!ctrl?.touched || ctrl.valid) return null;
    if (ctrl.hasError('required'))  return 'Required.';
    if (ctrl.hasError('maxlength')) return `Max ${ctrl.errors?.['maxlength'].requiredLength} chars.`;
    if (ctrl.hasError('min'))       return `Must be > ${ctrl.errors?.['min'].min}.`;
    return 'Invalid.';
  }

  catFieldError(name: string): string | null {
    const ctrl = this.catForm.get(name);
    if (!ctrl?.touched || ctrl.valid) return null;
    if (ctrl.hasError('required'))  return 'Required.';
    if (ctrl.hasError('maxlength')) return `Max ${ctrl.errors?.['maxlength'].requiredLength} chars.`;
    if (ctrl.hasError('min'))       return 'Cannot be negative.';
    return 'Invalid.';
  }
}
