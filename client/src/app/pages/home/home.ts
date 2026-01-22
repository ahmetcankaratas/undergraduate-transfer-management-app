import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeService, HomeResponse } from '../../services/home.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="p-4">
            <h1 class="text-2xl font-bold mb-4">Welcome to Undergraduate Transfer Management</h1>
            
            @if (loading) {
                <p>Loading data from server...</p>
            }
            
            @if (error) {
                <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
                    <p class="font-bold">Error:</p>
                    <p>{{ error }}</p>
                </div>
            }
            
            @if (homeData) {
                <div class="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    <p class="font-bold">Server Response:</p>
                    <p>{{ homeData.message }}</p>
                    <p class="text-sm mt-2">Timestamp: {{ homeData.timestamp }}</p>
                    <p class="text-sm">Status: {{ homeData.status }}</p>
                </div>
            }
        </div>
    `
})
export class Home implements OnInit {
    homeData: HomeResponse | null = null;
    loading = false;
    error: string | null = null;

    constructor(private homeService: HomeService) {}

    ngOnInit() {
        this.loadHomeData();
    }

    loadHomeData() {
        this.loading = true;
        this.error = null;
        
        this.homeService.getHome().subscribe({
            next: (data) => {
                this.homeData = data;
                this.loading = false;
            },
            error: (err) => {
                this.error = err.message || 'Failed to load data from server';
                this.loading = false;
                console.error('Error loading home data:', err);
            }
        });
    }
}
