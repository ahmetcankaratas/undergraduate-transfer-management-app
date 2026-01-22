import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ApplicationService } from '../../../../core/services';
import { Application, ApplicationStatus } from '../../../../core/models';

@Component({
    selector: 'app-review-applications',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, TableModule, ButtonModule, TagModule, DialogModule, TextareaModule, ToastModule, FormsModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="grid">
            <div class="col-12">
                <p-card header="İnceleme Bekleyen Başvurular">
                    <p-table [value]="applications()" [paginator]="true" [rows]="10">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Başvuru No</th>
                                <th>Öğrenci</th>
                                <th>Hedef Fakülte</th>
                                <th>Hedef Bölüm</th>
                                <th>GPA</th>
                                <th>ÖSYM</th>
                                <th>Tarih</th>
                                <th>İşlemler</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-app>
                            <tr>
                                <td>{{ app.applicationNumber }}</td>
                                <td>{{ app.student?.user?.firstName }} {{ app.student?.user?.lastName }}</td>
                                <td>{{ app.targetFaculty }}</td>
                                <td>{{ app.targetDepartment }}</td>
                                <td>{{ app.declaredGpa }}</td>
                                <td>{{ app.declaredOsymScore }}</td>
                                <td>{{ app.submittedAt | date:'dd.MM.yyyy' }}</td>
                                <td>
                                    <p-button label="İncele" icon="pi pi-search" [routerLink]="['/oidb/applications', app.id]"></p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="8" class="text-center p-4">
                                    <i class="pi pi-check-circle text-4xl text-green-300 mb-3"></i>
                                    <p class="text-500">İnceleme bekleyen başvuru bulunmuyor.</p>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>
    `
})
export class ReviewApplicationsComponent implements OnInit {
    applications = signal<Application[]>([]);

    constructor(
        private applicationService: ApplicationService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadApplications();
    }

    private loadApplications() {
        this.applicationService.getAll({ status: ApplicationStatus.SUBMITTED }).subscribe(apps => {
            this.applications.set(apps);
        });
    }
}
