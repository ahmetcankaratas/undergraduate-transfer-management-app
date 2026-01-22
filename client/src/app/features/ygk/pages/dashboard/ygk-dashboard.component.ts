import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-ygk-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <h2>YGK Dashboard</h2>
            </div>

            <div class="col-12 lg:col-6" style="margin-bottom: 24px;">
                <p-card header="Hızlı İşlemler">
                    <div class="flex flex-column gap-2">
                        <p-button label="Başvuruları Değerlendir" icon="pi pi-check-circle" styleClass="w-full" routerLink="/ygk/evaluate"></p-button>
                        <p-button label="Sıralama Listesi" icon="pi pi-list" styleClass="w-full" severity="secondary" routerLink="/ygk/rankings"></p-button>
                    </div>
                </p-card>
            </div>
        </div>
    `
})
export class YgkDashboardComponent {}
