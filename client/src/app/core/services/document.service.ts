import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Document, DocumentType } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly API_URL = 'http://localhost:5001/api/documents';

  constructor(private http: HttpClient) {}

  upload(applicationId: string, file: File, type: DocumentType): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return this.http.post<Document>(`${this.API_URL}/${applicationId}`, formData);
  }

  getByApplication(applicationId: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.API_URL}/application/${applicationId}`);
  }

  getById(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.API_URL}/${id}`);
  }

  download(id: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${id}/download`, {
      responseType: 'blob',
    });
  }

  verify(id: string, notes?: string): Observable<Document> {
    return this.http.post<Document>(`${this.API_URL}/${id}/verify`, { notes });
  }

  unverify(id: string): Observable<Document> {
    return this.http.post<Document>(`${this.API_URL}/${id}/unverify`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
