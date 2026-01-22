import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { ApplicationService, DocumentService } from '../../../../core/services';
import { Application, Document, ApplicationStatus, DocumentType } from '../../../../core/models';

@Component({
    selector: 'app-application-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, ToastModule, TableModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="detail-container">
            <!-- Back Button -->
            <div class="back-section">
                <a routerLink="/student/my-applications" class="back-link">
                    <i class="pi pi-arrow-left"></i>
                    Back to My Applications
                </a>
            </div>

            <!-- Application Info Card -->
            <div class="info-card">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Application Number</span>
                        <span class="info-value">{{ application()?.applicationNumber || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Faculty</span>
                        <span class="info-value">{{ application()?.targetFaculty || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Department</span>
                        <span class="info-value">{{ application()?.targetDepartment || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Program Language</span>
                        <span class="info-value">English</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">GPA</span>
                        <span class="info-value">{{ application()?.declaredGpa || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">ÖSYM Score</span>
                        <span class="info-value">{{ application()?.declaredOsymScore || '-' }}</span>
                    </div>
                </div>
                <div class="status-section">
                    <span class="status-badge" [class]="getStatusClass(application()?.status)">
                        {{ getStatusLabel(application()?.status) }}
                    </span>
                </div>
            </div>

            <!-- Ranking Info Card -->
            <div class="ranking-card" *ngIf="getRankingInfo() as rankInfo">
                <div class="ranking-header">
                    <i class="pi pi-chart-bar"></i>
                    <h3>Sıralama Sonucu</h3>
                </div>
                <div class="ranking-content">
                    <div class="ranking-main" *ngIf="rankInfo.rank > 0">
                        <div class="rank-badge" [class.primary]="rankInfo.isPrimary" [class.waitlisted]="rankInfo.isWaitlisted">
                            <span class="rank-number">{{ rankInfo.rank }}</span>
                            <span class="rank-label">. sıra</span>
                        </div>
                        <div class="rank-status">
                            <span class="status-text" [class.primary]="rankInfo.isPrimary" [class.waitlisted]="rankInfo.isWaitlisted">
                                {{ rankInfo.isPrimary ? 'ASİL LİSTE' : 'YEDEK LİSTE' }}
                            </span>
                            <span class="quota-info">Kontenjan: {{ rankInfo.quota }}</span>
                        </div>
                    </div>
                    <div class="ranking-main rejected" *ngIf="rankInfo.rank === 0">
                        <div class="rank-badge rejected">
                            <i class="pi pi-times-circle"></i>
                        </div>
                        <div class="rank-status">
                            <span class="status-text rejected">DEĞERLENDİRME DIŞI</span>
                            <span class="quota-info">Uygunluk kriterleri karşılanmadı</span>
                        </div>
                    </div>
                    <div class="ranking-details" *ngIf="rankInfo.rank > 0">
                        <div class="detail-item">
                            <span class="detail-label">Puanınız</span>
                            <span class="detail-value">{{ rankInfo.score | number:'1.2-2' }}</span>
                        </div>
                        <div class="detail-item" *ngIf="rankInfo.isWaitlisted">
                            <span class="detail-label">Yedek Sıranız</span>
                            <span class="detail-value">{{ rankInfo.rank - rankInfo.quota }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Uploaded Documents Section -->
            <div class="documents-section" *ngIf="documents().length > 0">
                <h3 class="section-title">Uploaded Documents</h3>
                <div class="documents-card">
                    <table class="documents-table">
                        <thead>
                            <tr>
                                <th>Document Type</th>
                                <th>File Name</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let doc of documents()">
                                <td>{{ getDocumentTypeLabel(doc.type) }}</td>
                                <td>{{ doc.originalName }}</td>
                                <td>
                                    <span class="doc-status" [class.verified]="doc.isVerified">
                                        {{ doc.isVerified ? 'Verified' : 'Pending' }}
                                    </span>
                                </td>
                                <td class="actions-cell">
                                    <button class="action-btn download" (click)="downloadDocument(doc)" title="Download">
                                        <i class="pi pi-download"></i>
                                    </button>
                                    <button
                                        *ngIf="canUploadDocuments()"
                                        class="action-btn delete"
                                        (click)="deleteDocument(doc)"
                                        title="Delete"
                                    >
                                        <i class="pi pi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- File Upload Section -->
            <div class="upload-section" *ngIf="canUploadDocuments()">
                <h3 class="section-title">add file:</h3>

                <div class="upload-area"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     [class.drag-over]="isDragOver"
                     (click)="fileInput.click()">
                    <input
                        #fileInput
                        type="file"
                        hidden
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        (change)="onFileSelected($event)"
                    />
                    <i class="pi pi-cloud-upload upload-icon"></i>
                    <p class="upload-text">Drag and drop files here</p>
                    <p class="upload-subtext">or</p>
                    <button class="select-files-btn" (click)="$event.stopPropagation(); fileInput.click()">
                        Select Files
                    </button>
                    <p class="upload-hint">Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
                </div>

                <!-- Document Type Selection -->
                <div class="doc-type-section">
                    <label class="doc-type-label">Document Type:</label>
                    <div class="doc-type-options">
                        <label *ngFor="let opt of documentTypeOptions" class="doc-type-option">
                            <input type="radio" name="docType" [value]="opt.value" [(ngModel)]="selectedDocType" />
                            <span>{{ opt.label }}</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Save Button -->
            <div class="save-section" *ngIf="canUploadDocuments()">
                <button class="save-btn" (click)="saveApplication()" [disabled]="saving">
                    {{ saving ? 'SAVING...' : 'SAVE' }}
                </button>
            </div>

            <!-- Timeline Section -->
            <div class="timeline-section">
                <h3 class="section-title">Application Timeline</h3>
                <div class="timeline-card">
                    <div class="timeline">
                        <div class="timeline-item" *ngFor="let event of getTimelineEvents()">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <span class="timeline-status">{{ event.status }}</span>
                                <span class="timeline-date">{{ event.date | date:'dd.MM.yyyy HH:mm' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .detail-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 1.5rem;
        }

        .back-section {
            margin-bottom: 1.5rem;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #8B1538;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }

        .back-link:hover {
            color: #6d1029;
        }

        /* Info Card */
        .info-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.25rem;
        }

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .info-label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-size: 1rem;
            color: #333;
            font-weight: 500;
        }

        .status-section {
            margin-top: 1.25rem;
            padding-top: 1.25rem;
            border-top: 1px solid #eee;
        }

        .status-badge {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
        }

        .status-badge.draft { background: #e0e0e0; color: #666; }
        .status-badge.submitted { background: #e3f2fd; color: #1976d2; }
        .status-badge.review { background: #fff3e0; color: #f57c00; }
        .status-badge.approved { background: #e8f5e9; color: #388e3c; }
        .status-badge.rejected { background: #ffebee; color: #d32f2f; }
        .status-badge.pending { background: #fce4ec; color: #8B1538; }

        /* Section Title */
        .section-title {
            font-size: 1rem;
            font-weight: 600;
            color: #333;
            margin: 0 0 1rem 0;
        }

        /* Documents Section */
        .documents-section {
            margin-bottom: 1.5rem;
        }

        .documents-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }

        .documents-table {
            width: 100%;
            border-collapse: collapse;
        }

        .documents-table th,
        .documents-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        .documents-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
            font-size: 0.875rem;
        }

        .documents-table td {
            color: #555;
            font-size: 0.9rem;
        }

        .documents-table tr:last-child td {
            border-bottom: none;
        }

        .doc-status {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
            background: #fff3e0;
            color: #f57c00;
        }

        .doc-status.verified {
            background: #e8f5e9;
            color: #388e3c;
        }

        .actions-cell {
            display: flex;
            gap: 0.5rem;
        }

        .action-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .action-btn.download {
            background: #e3f2fd;
            color: #1976d2;
        }

        .action-btn.download:hover {
            background: #bbdefb;
        }

        .action-btn.delete {
            background: #ffebee;
            color: #d32f2f;
        }

        .action-btn.delete:hover {
            background: #ffcdd2;
        }

        /* Upload Section */
        .upload-section {
            margin-bottom: 1.5rem;
        }

        .upload-area {
            background: #ffffff;
            border: 2px dashed #ccc;
            border-radius: 16px;
            padding: 3rem 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }

        .upload-area:hover,
        .upload-area.drag-over {
            border-color: #8B1538;
            background: #fef7f8;
        }

        .upload-icon {
            font-size: 3rem;
            color: #8B1538;
            margin-bottom: 1rem;
        }

        .upload-text {
            font-size: 1.1rem;
            color: #333;
            margin: 0 0 0.5rem 0;
        }

        .upload-subtext {
            font-size: 0.9rem;
            color: #666;
            margin: 0 0 1rem 0;
        }

        .select-files-btn {
            background: #8B1538;
            color: #ffffff;
            border: none;
            border-radius: 20px;
            padding: 0.625rem 1.5rem;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }

        .select-files-btn:hover {
            background: #6d1029;
        }

        .upload-hint {
            font-size: 0.8rem;
            color: #999;
            margin: 1rem 0 0 0;
        }

        /* Document Type Selection */
        .doc-type-section {
            margin-top: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 12px;
        }

        .doc-type-label {
            display: block;
            font-weight: 500;
            color: #333;
            margin-bottom: 0.75rem;
        }

        .doc-type-options {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .doc-type-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-size: 0.9rem;
            color: #555;
        }

        .doc-type-option input[type="radio"] {
            accent-color: #8B1538;
        }

        /* Save Section */
        .save-section {
            text-align: center;
            margin-bottom: 2rem;
        }

        .save-btn {
            background: #8B1538;
            color: #ffffff;
            border: none;
            border-radius: 24px;
            padding: 0.875rem 3rem;
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .save-btn:hover:not(:disabled) {
            background: #6d1029;
        }

        .save-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        /* Timeline Section */
        .timeline-section {
            margin-bottom: 2rem;
        }

        .timeline-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            padding: 1.5rem;
        }

        .timeline {
            position: relative;
            padding-left: 2rem;
        }

        .timeline::before {
            content: '';
            position: absolute;
            left: 7px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e0e0e0;
        }

        .timeline-item {
            position: relative;
            padding-bottom: 1.5rem;
        }

        .timeline-item:last-child {
            padding-bottom: 0;
        }

        .timeline-marker {
            position: absolute;
            left: -2rem;
            top: 0;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #8B1538;
            border: 3px solid #fff;
            box-shadow: 0 0 0 2px #8B1538;
        }

        .timeline-content {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .timeline-status {
            font-weight: 500;
            color: #333;
        }

        .timeline-date {
            font-size: 0.8rem;
            color: #666;
        }

        /* Ranking Card */
        .ranking-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 2px solid #e9ecef;
        }

        .ranking-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1.25rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #dee2e6;
        }

        .ranking-header i {
            font-size: 1.25rem;
            color: #8B1538;
        }

        .ranking-header h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
        }

        .ranking-content {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .ranking-main {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .rank-badge {
            display: flex;
            align-items: baseline;
            justify-content: center;
            min-width: 100px;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            background: #e8f5e9;
        }

        .rank-badge.primary {
            background: #e8f5e9;
        }

        .rank-badge.waitlisted {
            background: #fff3e0;
        }

        .rank-badge.rejected {
            background: #ffebee;
            min-width: auto;
            padding: 1rem;
        }

        .rank-badge.rejected i {
            font-size: 2rem;
            color: #d32f2f;
        }

        .rank-number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #2e7d32;
        }

        .rank-badge.waitlisted .rank-number {
            color: #f57c00;
        }

        .rank-label {
            font-size: 1.25rem;
            font-weight: 500;
            color: #2e7d32;
        }

        .rank-badge.waitlisted .rank-label {
            color: #f57c00;
        }

        .rank-status {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .status-text {
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .status-text.primary {
            color: #2e7d32;
        }

        .status-text.waitlisted {
            color: #f57c00;
        }

        .status-text.rejected {
            color: #d32f2f;
        }

        .quota-info {
            font-size: 0.9rem;
            color: #666;
        }

        .ranking-details {
            display: flex;
            gap: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #dee2e6;
        }

        .detail-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .detail-label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .detail-value {
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr 1fr;
            }

            .doc-type-options {
                flex-direction: column;
                gap: 0.5rem;
            }

            .documents-table th,
            .documents-table td {
                padding: 0.75rem 0.5rem;
                font-size: 0.8rem;
            }

            .ranking-main {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }

            .ranking-details {
                flex-direction: column;
                gap: 1rem;
            }
        }
    `]
})
export class ApplicationDetailComponent implements OnInit {
    application = signal<Application | null>(null);
    documents = signal<Document[]>([]);
    selectedDocType = 'TRANSCRIPT';
    isDragOver = false;
    saving = false;

    documentTypeOptions = [
        { label: 'Transcript', value: 'TRANSCRIPT' },
        { label: 'ÖSYM Result', value: 'OSYM_RESULT' },
        { label: 'English Proficiency', value: 'ENGLISH_PROFICIENCY' },
        { label: 'Identity Document', value: 'IDENTITY' },
        { label: 'Other', value: 'OTHER' }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private applicationService: ApplicationService,
        private documentService: DocumentService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        const id = this.route.snapshot.params['id'];
        this.loadApplication(id);
    }

    private loadApplication(id: string) {
        this.applicationService.getById(id).subscribe(app => {
            this.application.set(app);
            this.documents.set(app.documents || []);
        });
    }

    canUploadDocuments(): boolean {
        const status = this.application()?.status;
        return status === ApplicationStatus.DRAFT || status === ApplicationStatus.SUBMITTED;
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.uploadFile(files[0]);
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.uploadFile(input.files[0]);
            input.value = ''; // Reset input
        }
    }

    private uploadFile(file: File) {
        if (!this.application()) return;

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'File size must be less than 10MB.'
            });
            return;
        }

        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(ext)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG'
            });
            return;
        }

        this.documentService.upload(this.application()!.id, file, this.selectedDocType as DocumentType).subscribe({
            next: (doc) => {
                this.documents.update(docs => [...docs, doc]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Document uploaded successfully.'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to upload document.'
                });
            }
        });
    }

    downloadDocument(doc: Document) {
        this.documentService.download(doc.id).subscribe(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.originalName;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    deleteDocument(doc: Document) {
        this.documentService.delete(doc.id).subscribe({
            next: () => {
                this.documents.update(docs => docs.filter(d => d.id !== doc.id));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Document deleted successfully.'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete document.'
                });
            }
        });
    }

    saveApplication() {
        this.saving = true;
        // Simulate save action
        setTimeout(() => {
            this.saving = false;
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Application saved successfully.'
            });
        }, 1000);
    }

    getDocumentTypeLabel(type: DocumentType): string {
        const labels: Record<DocumentType, string> = {
            TRANSCRIPT: 'Transkript',
            OSYM_RESULT: 'ÖSYM Puan Belgesi',
            ENGLISH_PROFICIENCY: 'Yabancı Dil Belgesi',
            IDENTITY: 'Kimlik Belgesi',
            STUDENT_CERTIFICATE: 'Öğrenci Belgesi',
            COURSE_CONTENTS: 'Ders İçerikleri (Katalog)',
            OSYM_PLACEMENT: 'ÖSYM Yerleştirme Sonuç Belgesi',
            INTIBAK: 'İntibak Belgesi',
            OTHER: 'Diğer Belge'
        };
        return labels[type] || type;
    }

    getTimelineEvents() {
        const app = this.application();
        if (!app) return [];

        const events = [{ status: 'Application Created', date: app.createdAt }];

        if (app.submittedAt) events.push({ status: 'Submitted', date: app.submittedAt });
        if (app.reviewedAt) events.push({ status: 'Reviewed', date: app.reviewedAt });
        if (app.routedToFacultyAt) events.push({ status: 'Routed to Faculty', date: app.routedToFacultyAt });
        if (app.routedToDepartmentAt) events.push({ status: 'Routed to Department', date: app.routedToDepartmentAt });
        if (app.facultyBoardDecisionAt) events.push({ status: 'Board Decision', date: app.facultyBoardDecisionAt });

        return events;
    }

    getStatusLabel(status?: ApplicationStatus): string {
        if (!status) return '';
        const labels: Record<ApplicationStatus, string> = {
            [ApplicationStatus.DRAFT]: 'Draft',
            [ApplicationStatus.SUBMITTED]: 'Submitted',
            [ApplicationStatus.OIDB_REVIEW]: 'Under Review',
            [ApplicationStatus.FACULTY_ROUTING]: 'At Faculty',
            [ApplicationStatus.DEPARTMENT_ROUTING]: 'At Department',
            [ApplicationStatus.YGK_EVALUATION]: 'Evaluation',
            [ApplicationStatus.RANKED]: 'Ranked',
            [ApplicationStatus.FACULTY_BOARD]: 'At Board',
            [ApplicationStatus.APPROVED]: 'Approved',
            [ApplicationStatus.REJECTED]: 'Rejected',
            [ApplicationStatus.WAITLISTED]: 'Waitlisted'
        };
        return labels[status] || status;
    }

    getStatusClass(status?: ApplicationStatus): string {
        if (!status) return '';
        const classes: Record<ApplicationStatus, string> = {
            [ApplicationStatus.DRAFT]: 'draft',
            [ApplicationStatus.SUBMITTED]: 'submitted',
            [ApplicationStatus.OIDB_REVIEW]: 'review',
            [ApplicationStatus.FACULTY_ROUTING]: 'review',
            [ApplicationStatus.DEPARTMENT_ROUTING]: 'review',
            [ApplicationStatus.YGK_EVALUATION]: 'pending',
            [ApplicationStatus.RANKED]: 'pending',
            [ApplicationStatus.FACULTY_BOARD]: 'pending',
            [ApplicationStatus.APPROVED]: 'approved',
            [ApplicationStatus.REJECTED]: 'rejected',
            [ApplicationStatus.WAITLISTED]: 'pending'
        };
        return classes[status] || '';
    }

    getRankingInfo(): { rank: number; isPrimary: boolean; isWaitlisted: boolean; quota: number; score: number } | null {
        const app = this.application();
        if (!app?.rankings || app.rankings.length === 0) {
            return null;
        }
        const ranking = app.rankings[0];
        return {
            rank: ranking.rank,
            isPrimary: ranking.isPrimary,
            isWaitlisted: ranking.isWaitlisted,
            quota: ranking.quota || 0,
            score: ranking.score
        };
    }
}
