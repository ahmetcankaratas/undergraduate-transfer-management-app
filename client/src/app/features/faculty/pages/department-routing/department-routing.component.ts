import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApplicationService } from '../../../../core/services';
import { Application, ApplicationStatus } from '../../../../core/models';

@Component({
    selector: 'app-department-routing',
    standalone: true,
    imports: [CommonModule, CardModule, TableModule, ButtonModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="grid">
            <div class="col-12">
                <p-card header="Bölüme Yönlendirilmiş Başvurular">
                    <p-table [value]="applications()" [paginator]="true" [rows]="10">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Başvuru No</th>
                                <th>Öğrenci</th>
                                <th>Hedef Bölüm</th>
                                <th>GPA</th>
                                <th>Yönlendirme Tarihi</th>
                                <th>İşlem</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-app>
                            <tr>
                                <td>{{ app.applicationNumber }}</td>
                                <td>{{ app.student?.user?.firstName }} {{ app.student?.user?.lastName }}</td>
                                <td>{{ app.targetDepartment }}</td>
                                <td>{{ app.declaredGpa }}</td>
                                <td>{{ app.routedToDepartmentAt | date:'dd.MM.yyyy' }}</td>
                                <td>
                                    <p-button
                                        label="Değerlendirmeye Gönder"
                                        icon="pi pi-check"
                                        size="small"
                                        (onClick)="setForEvaluation(app)"
                                    ></p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center p-4">
                                    <p class="text-500">Bölüme yönlendirilmiş başvuru bulunmuyor.</p>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>
    `
})
export class DepartmentRoutingComponent implements OnInit {
    applications = signal<Application[]>([]);

    constructor(
        private applicationService: ApplicationService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadApplications();
    }

    private loadApplications() {
        this.applicationService.getAll({ status: ApplicationStatus.DEPARTMENT_ROUTING }).subscribe(apps => {
            this.applications.set(apps);
        });
    }

    setForEvaluation(app: Application) {
        this.applicationService.setForEvaluation(app.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Başvuru değerlendirmeye gönderildi.' });
                this.loadApplications();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'İşlem başarısız.' });
            }
        });
    }
}
