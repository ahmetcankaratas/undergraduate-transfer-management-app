import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ApplicationService } from '../../../../core/services';

@Component({
    selector: 'app-oidb-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, ChartModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <h2>ÖİDB Dashboard</h2>
            </div>

            <div class="col-12 md:col-6 lg:col-3" style="margin-bottom: 24px;">
                <p-card styleClass="h-full">
                    <div class="flex flex-column align-items-center">
                        <span class="text-4xl font-bold text-primary" style="margin-right: 8px;">{{ stats().total }}</span>
                        <span class="text-500 mt-2">Toplam Başvuru</span>
                    </div>
                </p-card>
            </div>

            <div class="col-12 md:col-6 lg:col-3" style="margin-bottom: 24px;">
                <p-card styleClass="h-full">
                    <div class="flex flex-column align-items-center">
                        <span class="text-4xl font-bold text-orange-500" style="margin-right: 8px;">{{ getPendingReviewCount() }}</span>
                        <span class="text-500 mt-2">İnceleme Bekleyen</span>
                    </div>
                </p-card>
            </div>

            <div class="col-12 md:col-6 lg:col-3" style="margin-bottom: 24px;">
                <p-card styleClass="h-full">
                    <div class="flex flex-column align-items-center">
                        <span class="text-4xl font-bold text-green-500" style="margin-right: 8px;">{{ getApprovedCount() }}</span>
                        <span class="text-500 mt-2">Onaylanan</span>
                    </div>
                </p-card>
            </div>

            <div class="col-12 md:col-6 lg:col-3" style="margin-bottom: 24px;">
                <p-card styleClass="h-full">
                    <div class="flex flex-column align-items-center">
                        <span class="text-4xl font-bold text-red-500" style="margin-right: 8px;">{{ getRejectedCount() }}</span>
                        <span class="text-500 mt-2">Reddedilen</span>
                    </div>
                </p-card>
            </div>

            <div class="col-12 lg:col-6" style="margin-bottom: 24px;">
                <p-card header="Durum Dağılımı">
                    <div class="chart-container">
                        <p-chart type="pie" [data]="statusChartData()" [options]="chartOptions"></p-chart>
                    </div>
                </p-card>
            </div>

            <div class="col-12 lg:col-6" style="margin-bottom: 24px;">
                <p-card header="Hızlı İşlemler">
                    <div class="flex flex-column gap-2">
                        <p-button label="Başvuruları İncele" icon="pi pi-search" styleClass="w-full" routerLink="/oidb/review"></p-button>
                        <p-button label="Tüm Başvurular" icon="pi pi-list" styleClass="w-full" severity="secondary" routerLink="/oidb/applications"></p-button>
                        <p-button label="Sonuç Duyurusu" icon="pi pi-megaphone" styleClass="w-full" severity="info" routerLink="/oidb/announcements"></p-button>
                        <p-button label="Raporlar" icon="pi pi-chart-bar" styleClass="w-full" severity="help" routerLink="/oidb/reports"></p-button>
                    </div>
                </p-card>
            </div>
        </div>
    `,
    styles: [`
        .chart-container {
            max-width: 300px;
            max-height: 300px;
            margin: 0 auto;
        }

        :host ::ng-deep .chart-container canvas {
            max-width: 100% !important;
            max-height: 280px !important;
        }
    `]
})
export class OidbDashboardComponent implements OnInit {
    stats = signal<any>({ total: 0, byStatus: [], byFaculty: [] });
    statusChartData = signal<any>({});

    chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    constructor(private applicationService: ApplicationService) {}

    ngOnInit() {
        this.loadStats();
    }

    private loadStats() {
        this.applicationService.getStatistics().subscribe(data => {
            this.stats.set(data);
            this.buildChartData(data);
        });
    }

    private buildChartData(data: any) {
        const labels = data.byStatus.map((s: any) => this.getStatusLabel(s.status));
        const values = data.byStatus.map((s: any) => parseInt(s.count));

        this.statusChartData.set({
            labels,
            datasets: [{
                data: values,
                backgroundColor: ['#64B5F6', '#81C784', '#FFD54F', '#FF8A65', '#BA68C8', '#4DB6AC']
            }]
        });
    }

    getPendingReviewCount(): number {
        const byStatus = this.stats().byStatus;
        return byStatus
            .filter((s: any) => ['SUBMITTED', 'OIDB_REVIEW'].includes(s.status))
            .reduce((acc: number, curr: any) => acc + parseInt(curr.count), 0);
    }

    getApprovedCount(): number {
        const byStatus = this.stats().byStatus;
        // Onaylanıp bir sonraki aşamaya geçenler
        const nextStages = [
            'FACULTY_ROUTING', 
            'DEPARTMENT_ROUTING', 
            'YGK_EVALUATION', 
            'RANKED', 
            'FACULTY_BOARD', 
            'APPROVED', 
            'WAITLISTED'
        ];
        return byStatus
            .filter((s: any) => nextStages.includes(s.status))
            .reduce((acc: number, curr: any) => acc + parseInt(curr.count), 0);
    }

    getRejectedCount(): number {
        const byStatus = this.stats().byStatus;
        const rejected = byStatus.find((s: any) => s.status === 'REJECTED');
        return rejected ? parseInt(rejected.count) : 0;
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'DRAFT': 'Taslak',
            'SUBMITTED': 'Gönderildi',
            'OIDB_REVIEW': 'İnceleniyor',
            'FACULTY_ROUTING': 'Fakültede',
            'DEPARTMENT_ROUTING': 'Bölümde',
            'YGK_EVALUATION': 'Değerlendirmede',
            'RANKED': 'Sıralandı',
            'FACULTY_BOARD': 'Kurulda',
            'APPROVED': 'Onaylandı',
            'REJECTED': 'Reddedildi',
            'WAITLISTED': 'Yedek Liste'
        };
        return labels[status] || status;
    }
}
