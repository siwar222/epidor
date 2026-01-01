import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.backendBaseUrl;

  constructor(private http: HttpClient) { }

  getPaginated<T>(module: string, page: number, pageSize: number): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${module}?PageNumber=${page}&PageSize=${pageSize}`);
  }

  getAll<T>(module: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseUrl}/${module}`);
  }

  getById<T>(module: string, id: number): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${module}/${id}`);
  }

  create<T>(module: string, data: T): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${module}`, data);
  }

  update<T>(module: string, id: string, data: T): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${module}/${id}`, data);
  }

  delete<T>(module: string, id: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${module}/${id}`);
  }

  getCustom<T>(url: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${url}`);
  }

  patchCustom<T>(url: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${url}`, body);
  }
}
