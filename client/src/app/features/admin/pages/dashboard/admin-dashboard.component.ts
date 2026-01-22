import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <h2>Admin Dashboard</h2>
            </div>

            <div class="col-12 lg:col-6" style="margin-bottom: 24px;">
                <p-card header="Yönetim İşlemleri">
                    <div class="flex flex-column gap-2">
                        <p-button label="Kullanıcı Yönetimi" icon="pi pi-users" styleClass="w-full" routerLink="/admin/users"></p-button>
                        <p-button label="Kontenjan Yönetimi" icon="pi pi-sliders-h" styleClass="w-full" severity="secondary" routerLink="/admin/quotas"></p-button>
                    </div>
                </p-card>
            </div>

            <div class="col-12 lg:col-6" style="margin-bottom: 24px;">
                <p-card header="Diğer Modüller">
                    <div class="flex flex-column gap-2">
                        <p-button label="ÖIDB İşlemleri" icon="pi pi-building" styleClass="w-full" severity="info" routerLink="/oidb"></p-button>
                        <p-button label="Fakülte İşlemleri" icon="pi pi-sitemap" styleClass="w-full" severity="info" routerLink="/faculty"></p-button>
                        <p-button label="YGK İşlemleri" icon="pi pi-chart-bar" styleClass="w-full" severity="info" routerLink="/ygk"></p-button>
                    </div>
                </p-card>
            </div>
        </div>
    `
})
export class AdminDashboardComponent {}
