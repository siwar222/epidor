import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Location } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { HttpErrorResponse } from '@angular/common/http';

interface VisitType {
  VisitTypeId?: number; 
  name: string;
  description: string;
  hasDependencies: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

@Component({
  selector: 'app-visit-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visit-types.html',
  styleUrls: ['./visit-types.css'],
  providers: [ApiService]
})
export class VisitTypesComponent implements OnInit {

  private module: string = 'visit-types';
  isDateConflict: boolean = false;

  constructor(private apiService: ApiService, private location: Location) { }

  allVisits: VisitType[] = [];
  filteredVisits: VisitType[] = [];
  visits: VisitType[] = [];

  VisitTypeToDelete: VisitType | null = null; // <--- corrigé
  private deleteModal: bootstrap.Modal | null = null;
  private hasDependenciesDeleteModal: bootstrap.Modal | null = null;

  visitType: VisitType = { VisitTypeId: 0, name: '', description: '', hasDependencies: false }; // <--- corrigé
  isEditing = false;
  isNew = true;

  page = 1;
  pageSize = 10;
  pageSizes = [10, 25, 50, 75, 100];
  totalItems = 0;
  searchQuery: string = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnInit() {
    this.getAllVisits();

    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    if (confirmDeleteModal) {
      this.deleteModal = new bootstrap.Modal(confirmDeleteModal);
    }

    const hasDependenciesDeleteModal = document.getElementById('hasDependenciesDeleteModal');
    if (hasDependenciesDeleteModal) {
      this.hasDependenciesDeleteModal = new bootstrap.Modal(hasDependenciesDeleteModal);
    }
  }

  private normalizeVisit(raw: any): VisitType {
    return {
      VisitTypeId: raw?.VisitTypeId ?? raw?.id ?? 0,
      name: raw?.name ?? '',
      description: raw?.description ?? '',
      hasDependencies: Boolean(raw?.hasDependencies)
    };
  }

  openDeleteModal(visit: VisitType) {
    this.VisitTypeToDelete = visit; // <--- corrigé
    if (this.VisitTypeToDelete.hasDependencies) {
      this.hasDependenciesDeleteModal?.show();
      return;
    };
    this.deleteModal?.show();
  }

  confirmDelete() {
    if (this.VisitTypeToDelete && this.VisitTypeToDelete.VisitTypeId) {
      this.apiService.delete(this.module, this.VisitTypeToDelete.VisitTypeId.toString()).subscribe({
        next: () => {
          const index = this.allVisits.findIndex(
            (l: VisitType) => l.VisitTypeId === this.VisitTypeToDelete!.VisitTypeId
          );
          if (index !== -1) {
            this.allVisits.splice(index, 1);
            this.getAllVisits();
            this.updateFilteredVisits();
            this.updatePage();
          }
          this.VisitTypeToDelete = null;
          this.deleteModal?.hide();
          this.successMessage = 'Type de visite supprimée avec succès !';
          setTimeout(() => (this.successMessage = null), 3000);
        },
        error: () => {
          this.deleteModal?.hide();
          this.errorMessage =
            'Vous ne pouvez pas supprimer ce type de visite car elle est utilisée par une autre entité.';
          setTimeout(() => (this.errorMessage = null), 5000);
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }

  getAllVisits(): void {
    this.apiService
      .getPaginated<PaginatedResponse<any>>(this.module, this.page, this.pageSize)
      .subscribe({
        next: (response) => {
          this.allVisits = Array.isArray(response.items)
            ? response.items.map((v: any) => this.normalizeVisit(v))
            : [];
          this.totalItems = response.totalCount;
          this.updateFilteredVisits(false);
        },
        error: (err) => {
          console.error('Erreur API', err);
        }
      });
  }

  updatePage() {
    const start = (this.page - 1) * this.pageSize;
    this.visits = [...this.filteredVisits];
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.getAllVisits();
  }

  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.getAllVisits();
  }

  addNew() {
    this.isNew = true;
    this.isEditing = true;
    this.visitType = { VisitTypeId: 0, name: '', description: '', hasDependencies: false }; // <--- corrigé
  }

  edit(visit: VisitType) {
    this.isNew = false;
    this.isEditing = true;
    this.visitType = this.normalizeVisit(visit); // <--- corrigé
  }

  cancel() {
    this.isEditing = false;
  }

  onSubmit() {
    if (this.isNew) {
      delete this.visitType.VisitTypeId; // <--- corrigé
      this.apiService.create(this.module, this.visitType).subscribe({
        next: (newVisit: any) => {
          this.handleSuccess(true, newVisit);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de l\'ajout', err);
          this.handleError();
        }
      });
    } else {
      if (!this.visitType.VisitTypeId) { // <--- corrigé
        console.error("Erreur : VisitTypeId est undefined !");
        return;
      }
      this.apiService.update(this.module, this.visitType.VisitTypeId.toString(), this.visitType).subscribe({
        next: (updatedVisit: any) => {
          this.handleSuccess(false, this.normalizeVisit(updatedVisit ?? this.visitType)); // <--- corrigé
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de la modification', err);
          this.handleError();
        }
      });
    }
  }

  private handleSuccess(isNew: boolean, visit: VisitType): void {
    const normalized = this.normalizeVisit(visit);
    if (isNew) {
      this.allVisits.push(normalized);
    } else if (normalized && normalized.VisitTypeId) {
      const index = this.allVisits.findIndex((l: VisitType) => l.VisitTypeId === normalized.VisitTypeId);
      if (index !== -1) this.allVisits[index] = { ...normalized };
    }
    this.getAllVisits();
    this.updateFilteredVisits();
    this.cancel();

    this.successMessage = isNew
      ? 'Type de visite ajouté avec succès !'
      : 'Type de visite modifié avec succès !';

    setTimeout(() => (this.successMessage = null), 5000);
  }

  private handleError(): void {
    this.errorMessage =
      'Une erreur est survenue. Merci de vérifier vos données.';
    this.isDateConflict = true;

    setTimeout(() => {
      this.errorMessage = null;
      this.isDateConflict = false;
    }, 5000);
  }

  updateFilteredVisits(resetPage: boolean = false) {
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      this.filteredVisits = this.allVisits.filter((loc: VisitType) =>
        loc.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    } else {
      this.filteredVisits = [...this.allVisits];
    }

    if (this.sortColumn) {
      this.filteredVisits.sort((a, b) => {
        const valA = (a as any)[this.sortColumn] ?? '';
        const valB = (b as any)[this.sortColumn] ?? '';

        if (typeof valA === 'string' && typeof valB === 'string') {
          return this.sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return 0;
      });
    }

    if (resetPage) {
      this.page = 1;
    }
    this.updatePage();
  }

  filterVisits() {
    this.updateFilteredVisits(false);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get pages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.page;
    const pages: (number | string)[] = [];

    if (total <= 10) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) {
        if (i > 1 && i < total) pages.push(i);
      }
      if (current < total - 3) pages.push('...');
      pages.push(total);
    }

    return pages;
  }

  asNumber(value: any): number {
    return Number(value);
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredVisits.sort((a, b) => {
      const valA = (a as any)[column] ?? '';
      const valB = (b as any)[column] ?? '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return this.sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return 0;
    });

    this.updatePage();
  }
}
