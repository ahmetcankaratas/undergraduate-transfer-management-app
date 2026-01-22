import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface HomeResponse {
    message: string;
    timestamp: string;
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class HomeService {
    private readonly apiUrl = 'http://localhost:5001';

    constructor(private http: HttpClient) {}

    getHome(): Observable<HomeResponse> {
        return this.http.get<HomeResponse>(`${this.apiUrl}/home`);
    }
}
