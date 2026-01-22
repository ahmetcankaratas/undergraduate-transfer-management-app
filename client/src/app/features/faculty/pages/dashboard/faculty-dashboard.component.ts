import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-faculty-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <h2>Fakülte Dekanlığı Dashboard</h2>
            </div>

            <div class="col-12 lg:col-6" style="margin-bottom: 24px;">
                <p-card header="Hızlı İşlemler">
                    <div class="flex flex-column gap-2">
                        <p-button label="Başvuruları Yönlendir" icon="pi pi-directions" styleClass="w-full" routerLink="/faculty/routing"></p-button>
                        <p-button label="Bölümlere Gönder" icon="pi pi-send" styleClass="w-full" severity="secondary" routerLink="/faculty/department-routing"></p-button>
                        <p-button label="Kurul Kararları" icon="pi pi-check-square" styleClass="w-full" severity="info" routerLink="/faculty/board-decisions"></p-button>
                    </div>
                </p-card>
            </div>
        </div>
    `
})
export class FacultyDashboardComponent {}
