import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Location } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { HttpErrorResponse } from '@angular/common/http';

interface Visitor {
  id?: string;
  FirstName: string;
  LastName: string;
  MobileNumber:string;
  Email: string;
  hasDependencies: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

@Component({
  selector: 'app-visitors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visitors.html',
  styleUrls: ['./visitors.css'],
  providers: [ApiService]
})
export class VisitorsComponent implements OnInit {

  private module: string = 'Visitors';
  isDateConflict: boolean = false;

  constructor(private apiService: ApiService, private location: Location) { }

  allVisitors: Visitor[] = [];
  filteredVisitors: Visitor[] = [];
  visitors: Visitor[] = [];

  visitorToDelete: Visitor | null = null;
  private deleteModal: bootstrap.Modal | null = null;
  private hasDependenciesDeleteModal: bootstrap.Modal | null = null;

  visitor: Visitor = { id: '', FirstName: '', LastName: '', MobileNumber: '', Email: '', hasDependencies: false };
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
    this.getAllVisitors();

    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    if (confirmDeleteModal) this.deleteModal = new bootstrap.Modal(confirmDeleteModal);

    const hasDependenciesDeleteModal = document.getElementById('hasDependenciesDeleteModal');
    if (hasDependenciesDeleteModal) this.hasDependenciesDeleteModal = new bootstrap.Modal(hasDependenciesDeleteModal);
  }

  openDeleteModal(visitor: Visitor) {
    this.visitorToDelete = visitor;
    if (this.visitorToDelete.hasDependencies) {
      this.hasDependenciesDeleteModal?.show();
      return;
    }
    this.deleteModal?.show();
  }

  confirmDelete() {
    if (this.visitorToDelete) {
      this.apiService.delete(this.module, String(this.visitorToDelete.id)).subscribe({
        next: () => {
          const index = this.allVisitors.findIndex(v => v.id === this.visitorToDelete!.id);
          if (index !== -1) this.allVisitors.splice(index, 1);
          this.updateFilteredVisitors(true);
          this.cancel();
          this.visitorToDelete = null;
          this.deleteModal?.hide();
          this.successMessage = 'Visiteur supprimé avec succès !';
          setTimeout(() => (this.successMessage = null), 3000);
        },
        error: () => {
          this.deleteModal?.hide();
          this.errorMessage = 'Vous ne pouvez pas supprimer ce visiteur car il est utilisé par une autre entité.';
          setTimeout(() => (this.errorMessage = null), 5000);
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }

  getAllVisitors(): void {
    this.apiService.getPaginated<PaginatedResponse<Visitor>>(this.module, this.page, this.pageSize)
      .subscribe({
        next: (response) => {
          this.allVisitors = response.items ?? [];
          this.totalItems = response.totalCount ?? 0;
          this.updateFilteredVisitors(false);
        },
        error: (err) => console.error('Erreur API', err)
      });
  }

  updatePage() {
    const start = (this.page - 1) * this.pageSize;
    this.visitors = [...this.filteredVisitors].slice(start, start + this.pageSize);
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.getAllVisitors();
  }

  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.getAllVisitors();
  }

  addNew() {
    this.isNew = true;
    this.isEditing = true;
    this.visitor = { id: '', FirstName: '', LastName: '', MobileNumber: '', Email: '', hasDependencies: false };  }

  edit(visitor: Visitor) {
    this.isNew = false;
    this.isEditing = true;
    this.visitor = { ...visitor };
  }

  cancel() {
    this.isEditing = false;
  }

  onSubmit() {
    if (this.isNew) {
      delete this.visitor.id;
      this.apiService.create(this.module, this.visitor).subscribe({
        next: (newVisitor: Visitor) => this.handleSuccess(true, newVisitor),
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de l\'ajout', err);
          this.handleError();
        }
      });
    } else {
      this.apiService.update(this.module, String(this.visitor.id), this.visitor).subscribe({
        next: (updatedVisitor: Visitor) => this.handleSuccess(false, updatedVisitor ?? this.visitor),
        error: (err: HttpErrorResponse) => {
          console.error('Erreur lors de la modification', err);
          this.handleError();
        }
      });
    }
  }

  private handleSuccess(isNew: boolean, visitor: Visitor): void {
    if (isNew) {
      this.allVisitors.unshift(visitor); // ajout en tête pour le voir directement
    } else if (visitor && visitor.id) {
      const index = this.allVisitors.findIndex(v => v.id === visitor.id);
      if (index !== -1) this.allVisitors[index] = { ...visitor };
    }
    this.updateFilteredVisitors(true);
    this.cancel();

    this.successMessage = isNew
      ? 'Visiteur ajouté avec succès !'
      : 'Visiteur modifié avec succès !';

    setTimeout(() => (this.successMessage = null), 5000);
  }

  private handleError(): void {
    this.errorMessage = 'Une erreur est survenue. Merci de vérifier vos données.';
    this.isDateConflict = true;
    setTimeout(() => {
      this.errorMessage = null;
      this.isDateConflict = false;
    }, 5000);
  }

  updateFilteredVisitors(resetPage: boolean = false) {
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      this.filteredVisitors = this.allVisitors.filter(v =>
        (v.LastName + ' ' + v.FirstName).toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    } else {
      this.filteredVisitors = [...this.allVisitors];
    }

    if (this.sortColumn) {
      this.filteredVisitors.sort((a, b) => {
        const valA = (a as any)[this.sortColumn] ?? '';
        const valB = (b as any)[this.sortColumn] ?? '';
        return (typeof valA === 'string' && typeof valB === 'string')
          ? (this.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA))
          : 0;
      });
    }

    if (resetPage) this.page = 1;
    this.updatePage();
  }

  filterVisitors() {
    this.updateFilteredVisitors(false);
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
      for (let i = current - 1; i <= current + 1; i++) if (i > 1 && i < total) pages.push(i);
      if (current < total - 3) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  asNumber(value: any): number {
    return Number(value);
  }

  sortData(column: string): void {
    if (this.sortColumn === column) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else { this.sortColumn = column; this.sortDirection = 'asc'; }

    this.filteredVisitors.sort((a, b) => {
      const valA = (a as any)[column] ?? '';
      const valB = (b as any)[column] ?? '';
      return (typeof valA === 'string' && typeof valB === 'string')
        ? (this.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA))
        : 0;
    });

    this.updatePage();
  }
}
