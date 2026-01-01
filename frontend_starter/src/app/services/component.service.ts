import { inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../services/api.service';
import { Location } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { Router } from '@angular/router';

export abstract class ComponentService<T extends { id?: string, hasDependencies?: boolean }> {
  protected apiService = inject(ApiService);
  protected location = inject(Location);
  protected router = inject(Router);

  module!: string;

  isDateConflict = signal(false);
  isNewMode = signal(false);
  isEditMode = signal(false);
  isViewMode = signal(false);
  isLoading = signal(true);

  item = signal<T | null>(null);
  itemToDelete = signal<T | null>(null);

  allItems = signal<T[]>([]);
  filteredItems = signal<T[]>([]);
  items = signal<T[]>([]);

  page = signal(1);
  pageSize = signal(10);
  pageSizes = [10, 25, 50, 75, 100];
  totalItems = signal(0);
  searchQuery = signal('');
  sortColumn = signal('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  backendValidationErrors = signal<{ [key: string]: string[] }>({});
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  deleteModal: bootstrap.Modal | null = null;
  hasDependenciesDeleteModal: bootstrap.Modal | null = null;

  constructor() { }

  initializeComponent() {
      this.initModals('confirmDeleteModal', 'hasDependenciesDeleteModal');
      this.getAll();
  }

  initModals(deleteId: string, dependenciesId: string) {
    const del = document.getElementById(deleteId);
    const dep = document.getElementById(dependenciesId);
    this.deleteModal = del ? new bootstrap.Modal(del) : null;
    this.hasDependenciesDeleteModal = dep ? new bootstrap.Modal(dep) : null;
  }

  abstract newItem(): T;

  addNew() {
    this.isNewMode.set(true);
    this.isEditMode.set(true);
    this.isViewMode.set(false);
    this.item.set(this.newItem());
    this.clearAllErrors();
  }

  edit(item: T) {
    this.isNewMode.set(false);
    this.isEditMode.set(true);
    this.isViewMode.set(false);
    this.item.set({ ...item });
    this.clearAllErrors();
  }

  view(item: T) {
    this.isNewMode.set(false);
    this.isEditMode.set(true);
    this.isViewMode.set(true);
    this.item.set({ ...item });
    this.clearAllErrors();
  }

  cancel() {
    this.isNewMode.set(false);
    this.isEditMode.set(false);
    this.isViewMode.set(false);
    this.clearAllErrors();
  }

  enableEditing() {
    this.isViewMode.set(false);
    this.isEditMode.set(true);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  setField(field: string, value: any) {
    const current = this.item();
    if (!current) return;
    const updated = { ...(current as any), [field]: value };
    this.item.set(updated as T);
    this.clearFieldError(field);
  }

  onSubmit() {
    this.clearAllErrors();
    const current = this.item();
    if (!current) return;

    if (this.isNewMode() && current.id !== undefined) {
      const copy = { ...current };
      delete (copy as any).id;
      this.item.set(copy);
    }

    const request$ = this.isNewMode()
      ? this.apiService.create(this.module, this.item()!)
      : this.apiService.update(this.module, this.item()!.id!, this.item()!);

    request$.subscribe({
      next: res => this.handleSuccess(this.isNewMode(), res ?? this.item()!),
      error: (err: HttpErrorResponse) => this.handleErrorResponse(err)
    });
  }

  handleSuccess(isNew: boolean, item: T) {
    if (isNew) {
      this.allItems.set([...this.allItems(), item]);
    } else {
      const idx = this.allItems().findIndex(i => i.id === item.id);
      if (idx !== -1) {
        const arr = [...this.allItems()];
        arr[idx] = { ...item };
        this.allItems.set(arr);
      }
    }
    this.getAll();
    this.cancel();
    this.successMessage.set(isNew ? 'Ajouté avec succès !' : 'Modifié avec succès !');
    setTimeout(() => this.successMessage.set(null), 5000);
  }

  clearFieldError(field: string) {
    const errors = { ...this.backendValidationErrors() };
    if (errors[field]) {
      delete errors[field];
      this.backendValidationErrors.set(errors);
    }
  }

  clearAllErrors() {
    this.backendValidationErrors.set({});
    this.errorMessage.set(null);
  }

  openDeleteModal(item: T) {
    this.itemToDelete.set(item);
    if (item.hasDependencies) this.hasDependenciesDeleteModal?.show();
    else this.deleteModal?.show();
  }

  confirmDelete() {
    const toDelete = this.itemToDelete();
    if (!toDelete) return;
    this.apiService.delete(this.module, toDelete.id!).subscribe({
      next: () => {
        this.allItems.set(this.allItems().filter(i => i.id !== toDelete.id));
        this.getAll();
        this.updateFiltered(false);
        this.updatePage();
        this.itemToDelete.set(null);
        this.deleteModal?.hide();
        this.successMessage.set('Supprimé avec succès !');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.deleteModal?.hide();
        this.handleError('Impossible de supprimer cet élément car il est utilisé ailleurs.');
      }
    });
  }

  getAll(): void {
    this.isLoading.set(true);
    this.apiService.getPaginated<any>(this.module, this.page(), this.pageSize())
      .subscribe({
        next: res => {
          this.allItems.set(res.items);
          this.totalItems.set(res.totalCount);
          this.filteredItems.set([...res.items]);
          this.items.set([...res.items]);
          this.isLoading.set(false);
        },
        error: err => {
          console.error(err);
          this.isLoading.set(false);
        }
      });
  }

  updatePage() {
    this.items.set([...this.filteredItems()]);
  }

  updateFiltered(resetPage = false) {
    const query = this.searchQuery().trim().toLowerCase();
    const filtered = query
      ? this.allItems().filter(i => (i as any).name?.toLowerCase().includes(query))
      : [...this.allItems()];

    if (this.sortColumn()) {
      filtered.sort((a, b) => {
        const valA = (a as any)[this.sortColumn()] ?? '';
        const valB = (b as any)[this.sortColumn()] ?? '';
        return typeof valA === 'string' && typeof valB === 'string'
          ? (this.sortDirection() === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA))
          : 0;
      });
    }

    if (resetPage) this.page.set(1);
    this.filteredItems.set(filtered);
    this.updatePage();
  }

  changePageSize(size: number) {
    this.pageSize.set(size);
    this.page.set(1);
    this.getAll();
  }

  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages()) return;
    this.page.set(newPage);
    this.getAll();
  }

  sortData(column: string) {
    if (this.sortColumn() === column) this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.updateFiltered();
  }

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: (number | string)[] = [];

    if (total <= 10) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');
      for (let i = current - 1; i <= current + 1; i++)
        if (i > 1 && i < total) pages.push(i);
      if (current < total - 3) pages.push('...');
      pages.push(total);
    }

    return pages;
  });

  private errorTranslations: Record<string, string> = {
    "The end date must be greater than or equal to the start date.": "La date de fin doit être supérieure ou égale à la date de début.",
    "The field Name must be a string or array type with a maximum length of '100'.": "Le nom doit contenir au maximum 100 caractères.",
    "One or more validation errors occurred.": "Une ou plusieurs erreurs de validation se sont produites.",
    "This period overlaps with another existing session.": "Cette période chevauche une autre session existante.",
    "This session name is already used.": "Ce nom de session est déjà utilisé."
  };

  handleErrorResponse(err: HttpErrorResponse) {
    this.backendValidationErrors.set(this.normalizeBackendKeys(err.error?.errors || {}));
    this.translateBackendErrors();

    const messages: string[] = [];
    for (const key in this.backendValidationErrors()) {
      this.backendValidationErrors()[key]?.forEach((msg: string) => messages.push(msg));
    }
    this.handleError(messages.join('\n'));
  }

  handleError(message = 'Une erreur est survenue.'): void {
    this.errorMessage.set(message);
    this.isDateConflict.set(true);
    setTimeout(() => { this.errorMessage.set(null); this.isDateConflict.set(false); }, 5000);
  }

  private translateBackendErrors() {
    const errors = { ...this.backendValidationErrors() };
    for (const key in errors) {
      if (errors.hasOwnProperty(key)) {
        errors[key] = errors[key].map((msg: string) => this.errorTranslations[msg] || msg);
      }
    }
    this.backendValidationErrors.set(errors);
  }

  private normalizeBackendKeys(errors: { [key: string]: string[] }): { [key: string]: string[] } {
    const normalized: { [key: string]: string[] } = {};
    for (const key in errors) {
      if (errors.hasOwnProperty(key)) {
        const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
        normalized[normalizedKey] = errors[key];
      }
    }
    return normalized;
  }
}
