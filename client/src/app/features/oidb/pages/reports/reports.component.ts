import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApplicationService } from '../../../../core/services';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, ChartModule, TableModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="grid">
            <div class="col-12 md:col-6 lg:col-4">
                <p-card styleClass="mb-3 h-full surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Toplam Başvuru</span>
                            <div class="text-900 font-medium text-xl">{{ stats().total }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-file text-blue-500 text-xl"></i>
                        </div>
                    </div>
                </p-card>
            </div>
            <div class="col-12 md:col-6 lg:col-4">
                <p-card styleClass="mb-3 h-full surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Onaylanan</span>
                            <div class="text-900 font-medium text-xl">{{ getApprovedCount() }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-check-circle text-green-500 text-xl"></i>
                        </div>
                    </div>
                </p-card>
            </div>
            <div class="col-12 md:col-6 lg:col-4">
                <p-card styleClass="mb-3 h-full surface-card shadow-2 p-3 border-round">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-500 font-medium mb-3">Reddedilen</span>
                            <div class="text-900 font-medium text-xl">{{ getRejectedCount() }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center bg-red-100 border-round" style="width:2.5rem;height:2.5rem">
                            <i class="pi pi-times-circle text-red-500 text-xl"></i>
                        </div>
                    </div>
                </p-card>
            </div>

            <div class="col-12 lg:col-6">
                <p-card header="Fakülte Bazlı Başvurular" styleClass="h-full shadow-2">
                    <div class="chart-wrapper">
                        <p-chart type="bar" [data]="facultyChartData()" [options]="barChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>

            <div class="col-12 lg:col-6">
                <p-card header="Başvuru Durumları" styleClass="h-full shadow-2">
                    <div class="chart-wrapper flex justify-content-center">
                        <p-chart type="doughnut" [data]="statusChartData()" [options]="pieChartOptions"></p-chart>
                    </div>
                </p-card>
            </div>
            <div class="col-12">
                <p-card header="Rapor İndirme Merkezi" styleClass="shadow-2">
                    <div class="flex flex-wrap gap-3">
                        <p-button label="Tüm Başvurular (Excel)" icon="pi pi-file-excel" severity="success" (onClick)="exportReport('excel')"></p-button>
                        <p-button label="Özet Rapor (PDF)" icon="pi pi-file-pdf" severity="danger" (onClick)="exportReport('pdf')"></p-button>
                        <p-button label="İstatistikler (CSV)" icon="pi pi-download" severity="info" (onClick)="exportReport('csv')"></p-button>
                    </div>
                </p-card>
            </div>
        </div>
    `,
    styles: [`
        .chart-wrapper {
            position: relative;
            height: 250px;
            width: 100%;
        }

        :host ::ng-deep canvas {
            max-height: 250px !important;
            width: auto !important;
            margin: 0 auto;
        }
    `]
})
export class ReportsComponent implements OnInit {
    stats = signal<any>({ total: 0, byStatus: [], byFaculty: [] });
    facultyChartData = signal<any>({});
    statusChartData = signal<any>({});

    barChartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    };

    pieChartOptions = {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
    };

    constructor(
        private applicationService: ApplicationService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadStats();
    }

    private loadStats() {
        this.applicationService.getStatistics().subscribe(data => {
            this.stats.set(data);
            this.buildCharts(data);
        });
    }

    private buildCharts(data: any) {
        // Faculty Chart
        const faculties = data.byFaculty.map((f: any) => f.faculty);
        const facultyCounts = data.byFaculty.map((f: any) => parseInt(f.count));

        this.facultyChartData.set({
            labels: faculties,
            datasets: [{
                label: 'Başvuru Sayısı',
                data: facultyCounts,
                backgroundColor: '#42A5F5'
            }]
        });

        // Status Chart
        const statuses = data.byStatus.map((s: any) => this.getStatusLabel(s.status));
        const statusCounts = data.byStatus.map((s: any) => parseInt(s.count));

        this.statusChartData.set({
            labels: statuses,
            datasets: [{
                data: statusCounts,
                backgroundColor: ['#66BB6A', '#FFA726', '#EF5350', '#42A5F5', '#AB47BC']
            }]
        });
    }

    exportReport(type: string) {
        this.messageService.add({
            severity: 'success',
            summary: 'Rapor Oluşturuluyor',
            detail: `${type.toUpperCase()} formatında rapor hazırlanıyor...`
        });
        // Mock download delay
        setTimeout(() => {
            this.messageService.add({
                severity: 'info',
                summary: 'İndirme Başladı',
                detail: 'Dosya indiriliyor.'
            });
        }, 1500);
    }

    getApprovedCount(): number {
        const byStatus = this.stats().byStatus;
        const nextStages = ['FACULTY_ROUTING', 'DEPARTMENT_ROUTING', 'YGK_EVALUATION', 'RANKED', 'APPROVED'];
        return byStatus
            .filter((s: any) => nextStages.includes(s.status))
            .reduce((acc: number, curr: any) => acc + parseInt(curr.count), 0);
    }

    getRejectedCount(): number {
        const rejected = this.stats().byStatus.find((s: any) => s.status === 'REJECTED');
        return rejected ? parseInt(rejected.count) : 0;
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'DRAFT': 'Taslak',
            'SUBMITTED': 'Yeni Başvuru',
            'OIDB_REVIEW': 'İnceleniyor',
            'FACULTY_ROUTING': 'Fakültede',
            'YGK_EVALUATION': 'Değerlendirmede',
            'APPROVED': 'Onaylandı',
            'REJECTED': 'Reddedildi'
        };
        return labels[status] || status;
    }
}
