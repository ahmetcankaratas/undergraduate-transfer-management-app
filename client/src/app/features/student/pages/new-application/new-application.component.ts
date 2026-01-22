import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, MenuItem } from 'primeng/api';
import { ApplicationService, DocumentService, IntegrationService, ExternalDocumentData, University, UbysTranscriptData, OsymScoreData, YoksisEnglishData, EDevletIdentityData } from '../../../../core/services';
import { DocumentType } from '../../../../core/models';

interface UploadedDocument {
    file: File;
    type: DocumentType;
    name: string;
}

interface FetchedDocument {
    source: string;
    type: string;
    data: any;
    isValid: boolean;
    validationMessage?: string;
    fetchedAt: Date;
}

@Component({
    selector: 'app-new-application',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule, CardModule, StepsModule, ButtonModule,
        InputTextModule, InputNumberModule, SelectModule, TextareaModule,
        FileUploadModule, MessageModule, ToastModule, ProgressSpinnerModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="application-container">
            <div class="steps-section">
                <p-steps [model]="steps" [activeIndex]="activeStep()" [readonly]="true"></p-steps>
            </div>

            <!-- Step 1: Bilgi Getir (Fetch External Data) -->
            <div class="step-card" *ngIf="activeStep() === 0">
                <h2 class="step-title">Harici Sistemlerden Bilgi Getir</h2>
                <p class="step-description">TC Kimlik numaranızı ve üniversite bilgilerinizi girerek belgelerinizi otomatik olarak getirebilirsiniz.</p>

                <div class="form-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label>TC Kimlik Numarası *</label>
                            <input pInputText [(ngModel)]="tcKimlikNo" placeholder="11 haneli TC Kimlik No" maxlength="11" class="w-full" />
                        </div>
                        <div class="form-group">
                            <label>Mevcut Üniversite *</label>
                            <p-select
                                [(ngModel)]="selectedUniversity"
                                [options]="universities()"
                                optionLabel="name"
                                optionValue="code"
                                placeholder="Üniversite Seçin"
                                styleClass="w-full"
                            ></p-select>
                        </div>
                        <div class="form-group">
                            <label>ÖSYM Sınav Yılı *</label>
                            <p-inputNumber [(ngModel)]="osymYear" [min]="2019" [max]="2026" [useGrouping]="false" styleClass="w-full"></p-inputNumber>
                        </div>
                    </div>
                </div>

                <!-- Fetch Buttons -->
                <div class="fetch-section">
                    <h3>Belge Getir</h3>
                    <div class="fetch-buttons">
                        <button class="fetch-btn ubys" (click)="fetchTranscript()" [disabled]="!canFetch() || fetching.transcript">
                            <i class="pi" [class.pi-spin]="fetching.transcript" [class.pi-spinner]="fetching.transcript" [class.pi-file]="!fetching.transcript"></i>
                            <span>UBYS - Transkript</span>
                            <i class="pi pi-check status-icon" *ngIf="fetchedDocs.transcript"></i>
                        </button>
                        <button class="fetch-btn osym" (click)="fetchOsymScore()" [disabled]="!canFetch() || fetching.osym">
                            <i class="pi" [class.pi-spin]="fetching.osym" [class.pi-spinner]="fetching.osym" [class.pi-chart-bar]="!fetching.osym"></i>
                            <span>ÖSYM - Sınav Sonucu</span>
                            <i class="pi pi-check status-icon" *ngIf="fetchedDocs.osym"></i>
                        </button>
                        <button class="fetch-btn yoksis" (click)="fetchEnglishCert()" [disabled]="!canFetch() || fetching.english">
                            <i class="pi" [class.pi-spin]="fetching.english" [class.pi-spinner]="fetching.english" [class.pi-globe]="!fetching.english"></i>
                            <span>YÖKSİS - İngilizce Belgesi</span>
                            <i class="pi pi-check status-icon" *ngIf="fetchedDocs.english"></i>
                        </button>
                        <button class="fetch-btn edevlet" (click)="fetchIdentity()" [disabled]="!canFetch() || fetching.identity">
                            <i class="pi" [class.pi-spin]="fetching.identity" [class.pi-spinner]="fetching.identity" [class.pi-id-card]="!fetching.identity"></i>
                            <span>e-Devlet - Kimlik Bilgisi</span>
                            <i class="pi pi-check status-icon" *ngIf="fetchedDocs.identity"></i>
                        </button>
                    </div>
                    <button class="fetch-all-btn" (click)="fetchAllDocuments()" [disabled]="!canFetch() || fetchingAll">
                        <i class="pi" [class.pi-spin]="fetchingAll" [class.pi-spinner]="fetchingAll" [class.pi-download]="!fetchingAll"></i>
                        {{ fetchingAll ? 'Getiriliyor...' : 'Tümünü Getir' }}
                    </button>
                </div>

                <!-- Fetched Data Display -->
                <div class="fetched-data-section" *ngIf="hasFetchedData()">
                    <h3>Getirilen Bilgiler</h3>

                    <!-- Transcript Data -->
                    <div class="fetched-card" *ngIf="fetchedDocs.transcript">
                        <div class="fetched-header">
                            <div class="fetched-title">
                                <i class="pi pi-file"></i>
                                <span>Transkript (UBYS)</span>
                            </div>
                            <span class="validation-badge" [class.valid]="fetchedDocs.transcript.isValid" [class.invalid]="!fetchedDocs.transcript.isValid">
                                {{ fetchedDocs.transcript.isValid ? 'Uygun' : 'Uygun Değil' }}
                            </span>
                        </div>
                        <div class="fetched-content">
                            <div class="data-row">
                                <span class="data-label">Üniversite:</span>
                                <span class="data-value">{{ getTranscriptData()?.universityName }}</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Bölüm:</span>
                                <span class="data-value">{{ getTranscriptData()?.departmentName }}</span>
                            </div>
                            <div class="data-row highlight">
                                <span class="data-label">GPA:</span>
                                <span class="data-value">{{ getTranscriptData()?.gpa }} / {{ getTranscriptData()?.gpaScale }}</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Toplam Kredi:</span>
                                <span class="data-value">{{ getTranscriptData()?.totalCredits }}</span>
                            </div>
                        </div>
                        <div class="validation-message">{{ fetchedDocs.transcript.validationMessage }}</div>
                    </div>

                    <!-- ÖSYM Data -->
                    <div class="fetched-card" *ngIf="fetchedDocs.osym">
                        <div class="fetched-header">
                            <div class="fetched-title">
                                <i class="pi pi-chart-bar"></i>
                                <span>ÖSYM Sonucu</span>
                            </div>
                            <span class="validation-badge valid">Geçerli</span>
                        </div>
                        <div class="fetched-content">
                            <div class="data-row">
                                <span class="data-label">Sınav Yılı:</span>
                                <span class="data-value">{{ getOsymData()?.examYear }} {{ getOsymData()?.examType }}</span>
                            </div>
                            <div class="scores-grid">
                                <div class="score-item" *ngFor="let score of getOsymData()?.scores || []">
                                    <span class="score-type">{{ score.scoreType }}</span>
                                    <span class="score-value">{{ score.score | number:'1.3-3' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="validation-message">{{ fetchedDocs.osym.validationMessage }}</div>
                    </div>

                    <!-- English Data -->
                    <div class="fetched-card" *ngIf="fetchedDocs.english">
                        <div class="fetched-header">
                            <div class="fetched-title">
                                <i class="pi pi-globe"></i>
                                <span>İngilizce Yeterlilik (YÖKSİS)</span>
                            </div>
                            <span class="validation-badge" [class.valid]="getEnglishData()?.isExempt" [class.invalid]="!getEnglishData()?.isExempt">
                                {{ getEnglishData()?.isExempt ? 'Muaf' : 'Muaf Değil' }}
                            </span>
                        </div>
                        <div class="fetched-content">
                            <div class="data-row">
                                <span class="data-label">Sınav Türü:</span>
                                <span class="data-value">{{ getEnglishData()?.examType }}</span>
                            </div>
                            <div class="data-row highlight">
                                <span class="data-label">Puan:</span>
                                <span class="data-value">{{ getEnglishData()?.score }}</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Geçerlilik:</span>
                                <span class="data-value">{{ getEnglishData()?.validUntil }}</span>
                            </div>
                        </div>
                        <div class="validation-message">{{ fetchedDocs.english.validationMessage }}</div>
                    </div>

                    <!-- Identity Data -->
                    <div class="fetched-card" *ngIf="fetchedDocs.identity">
                        <div class="fetched-header">
                            <div class="fetched-title">
                                <i class="pi pi-id-card"></i>
                                <span>Kimlik Bilgisi (e-Devlet)</span>
                            </div>
                            <span class="validation-badge valid">Doğrulandı</span>
                        </div>
                        <div class="fetched-content">
                            <div class="data-row">
                                <span class="data-label">Ad Soyad:</span>
                                <span class="data-value">{{ getIdentityData()?.firstName }} {{ getIdentityData()?.lastName }}</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Doğum Tarihi:</span>
                                <span class="data-value">{{ getIdentityData()?.birthDate }}</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Doğum Yeri:</span>
                                <span class="data-value">{{ getIdentityData()?.birthPlace }}</span>
                            </div>
                        </div>
                        <div class="validation-message">{{ fetchedDocs.identity.validationMessage }}</div>
                    </div>
                </div>

                <div class="step-actions">
                    <div></div>
                    <p-button label="İleri" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextStep()"></p-button>
                </div>
            </div>

            <!-- Step 2: Hedef Program -->
            <div class="step-card" *ngIf="activeStep() === 1">
                <h2 class="step-title">Hedef Program Seçimi</h2>
                <form [formGroup]="applicationForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Hedef Fakülte *</label>
                            <p-select
                                formControlName="targetFaculty"
                                [options]="faculties"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Fakülte Seçin"
                                styleClass="w-full"
                                (onChange)="onFacultyChange($event)"
                            ></p-select>
                        </div>
                        <div class="form-group">
                            <label>Hedef Bölüm *</label>
                            <p-select
                                formControlName="targetDepartment"
                                [options]="departments()"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Bölüm Seçin"
                                styleClass="w-full"
                            ></p-select>
                        </div>
                    </div>
                </form>
                <div class="step-actions">
                    <p-button label="Geri" icon="pi pi-arrow-left" severity="secondary" (onClick)="prevStep()"></p-button>
                    <p-button label="İleri" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextStep()"></p-button>
                </div>
            </div>

            <!-- Step 3: Akademik Bilgiler -->
            <div class="step-card" *ngIf="activeStep() === 2">
                <h2 class="step-title">Akademik Bilgiler</h2>
                <p-message *ngIf="hasFetchedData()" severity="info" text="Harici sistemlerden getirilen bilgiler otomatik olarak doldurulmuştur."></p-message>
                <form [formGroup]="applicationForm" class="mt-3">
                    <div class="form-row">
                        <div class="form-group">
                            <label>GPA (4.00 üzerinden) *</label>
                            <p-inputNumber
                                formControlName="declaredGpa"
                                [min]="0"
                                [max]="4"
                                [minFractionDigits]="2"
                                [maxFractionDigits]="2"
                                mode="decimal"
                                styleClass="w-full"
                            ></p-inputNumber>
                            <small class="text-500">Minimum 2.50 olmalıdır</small>
                        </div>
                        <div class="form-group">
                            <label>ÖSYM/YKS Puanı</label>
                            <p-inputNumber
                                formControlName="declaredOsymScore"
                                [min]="0"
                                [max]="600"
                                [minFractionDigits]="2"
                                [maxFractionDigits]="5"
                                styleClass="w-full"
                            ></p-inputNumber>
                        </div>
                        <div class="form-group">
                            <label>Başarı Sıralaması</label>
                            <p-inputNumber
                                formControlName="declaredOsymRank"
                                [min]="1"
                                [useGrouping]="true"
                                placeholder="Örn: 150000"
                                styleClass="w-full"
                            ></p-inputNumber>
                        </div>
                        <div class="form-group">
                            <label>ÖSYM/YKS Yılı</label>
                            <p-inputNumber
                                formControlName="declaredOsymYear"
                                [min]="2015"
                                [max]="2030"
                                [useGrouping]="false"
                                styleClass="w-full"
                            ></p-inputNumber>
                        </div>
                    </div>
                    <div class="form-group full-width">
                        <label>Notlar</label>
                        <textarea pTextarea formControlName="notes" rows="3" class="w-full"></textarea>
                    </div>
                </form>
                <div class="step-actions">
                    <p-button label="Geri" icon="pi pi-arrow-left" severity="secondary" (onClick)="prevStep()"></p-button>
                    <p-button label="İleri" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextStep()"></p-button>
                </div>
            </div>

            <!-- Step 4: Belge Yükleme -->
            <div class="step-card" *ngIf="activeStep() === 3">
                <h2 class="step-title">Belge Yükleme</h2>
                <p-message severity="info" text="Başvurunuz için gerekli belgeleri aşağıdan yükleyebilir veya harici sistemlerden çekebilirsiniz."></p-message>

                <div class="documents-grid mt-4">
                    <!-- Transkript -->
                    <div class="document-item-card" [class.completed]="isDocReady('TRANSCRIPT')">
                        <div class="doc-header">
                            <div class="doc-title">
                                <i class="pi pi-file"></i>
                                <span>Transkript</span>
                                <span class="required-badge">*</span>
                            </div>
                            <span class="status-badge" [class.success]="isDocReady('TRANSCRIPT')" [class.pending]="!isDocReady('TRANSCRIPT')">
                                {{ isDocReady('TRANSCRIPT') ? 'Tamamlandı' : 'Bekleniyor' }}
                            </span>
                        </div>
                        <div class="doc-content">
                            <div *ngIf="fetchedDocs.transcript" class="fetched-info">
                                <i class="pi pi-cloud-download"></i>
                                <span>UBYS'den çekildi</span>
                                <button class="btn-icon-danger ml-auto" (click)="removeFetchedDoc('TRANSCRIPT')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div *ngIf="getManualDoc('TRANSCRIPT') as doc" class="manual-info">
                                <i class="pi pi-paperclip"></i>
                                <span>{{ doc.name }}</span>
                                <button class="btn-icon-danger" (click)="removeDocument('TRANSCRIPT')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div *ngIf="!isDocReady('TRANSCRIPT')" class="doc-actions">
                                <button class="btn-small secondary" (click)="fetchTranscript()" [disabled]="fetching.transcript">
                                    <i class="pi pi-refresh" [class.pi-spin]="fetching.transcript"></i>
                                    UBYS Getir
                                </button>
                                <span class="separator">veya</span>
                                <input #fileTranscript type="file" hidden accept=".pdf" (change)="onFileSelected($event, 'TRANSCRIPT')" />
                                <button class="btn-small primary" (click)="fileTranscript.click()">
                                    <i class="pi pi-upload"></i>
                                    Yükle
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- OSYM Sonuç -->
                    <div class="document-item-card" [class.completed]="isDocReady('OSYM_RESULT')">
                        <div class="doc-header">
                            <div class="doc-title">
                                <i class="pi pi-chart-bar"></i>
                                <span>ÖSYM Sonuç Belgesi</span>
                                <span class="required-badge">*</span>
                            </div>
                            <span class="status-badge" [class.success]="isDocReady('OSYM_RESULT')" [class.pending]="!isDocReady('OSYM_RESULT')">
                                {{ isDocReady('OSYM_RESULT') ? 'Tamamlandı' : 'Bekleniyor' }}
                            </span>
                        </div>
                        <div class="doc-content">
                            <div *ngIf="fetchedDocs.osym" class="fetched-info">
                                <i class="pi pi-cloud-download"></i>
                                <span>ÖSYM'den çekildi</span>
                                <button class="btn-icon-danger ml-auto" (click)="removeFetchedDoc('OSYM_RESULT')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div *ngIf="getManualDoc('OSYM_RESULT') as doc" class="manual-info">
                                <i class="pi pi-paperclip"></i>
                                <span>{{ doc.name }}</span>
                                <button class="btn-icon-danger" (click)="removeDocument('OSYM_RESULT')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div class="doc-actions">
                                <button class="btn-small secondary" (click)="fetchOsymScore()" [disabled]="fetching.osym">
                                    <i class="pi pi-refresh" [class.pi-spin]="fetching.osym"></i>
                                    ÖSYM Getir
                                </button>
                                <span class="separator">veya</span>
                                <input #fileOsym type="file" hidden accept=".pdf" (change)="onFileSelected($event, 'OSYM_RESULT')" />
                                <button class="btn-small primary" (click)="fileOsym.click()">
                                    <i class="pi pi-upload"></i>
                                    Yükle
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- İngilizce Yeterlilik -->
                    <div class="document-item-card" [class.completed]="isDocReady('ENGLISH_PROFICIENCY')">
                        <div class="doc-header">
                            <div class="doc-title">
                                <i class="pi pi-globe"></i>
                                <span>İngilizce Yeterlilik</span>
                                <span class="required-badge">*</span>
                            </div>
                            <span class="status-badge" [class.success]="isDocReady('ENGLISH_PROFICIENCY')" [class.pending]="!isDocReady('ENGLISH_PROFICIENCY')">
                                {{ isDocReady('ENGLISH_PROFICIENCY') ? 'Tamamlandı' : 'Bekleniyor' }}
                            </span>
                        </div>
                        <div class="doc-content">
                            <div *ngIf="fetchedDocs.english" class="fetched-info">
                                <i class="pi pi-cloud-download"></i>
                                <span>YÖKSİS'ten çekildi</span>
                                <button class="btn-icon-danger ml-auto" (click)="removeFetchedDoc('ENGLISH_PROFICIENCY')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div *ngIf="getManualDoc('ENGLISH_PROFICIENCY') as doc" class="manual-info">
                                <i class="pi pi-paperclip"></i>
                                <span>{{ doc.name }}</span>
                                <button class="btn-icon-danger" (click)="removeDocument('ENGLISH_PROFICIENCY')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div class="doc-actions">
                                <button class="btn-small secondary" (click)="fetchEnglishCert()" [disabled]="fetching.english">
                                    <i class="pi pi-refresh" [class.pi-spin]="fetching.english"></i>
                                    YÖKSİS Getir
                                </button>
                                <span class="separator">veya</span>
                                <input #fileEnglish type="file" hidden accept=".pdf" (change)="onFileSelected($event, 'ENGLISH_PROFICIENCY')" />
                                <button class="btn-small primary" (click)="fileEnglish.click()">
                                    <i class="pi pi-upload"></i>
                                    Yükle
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Kimlik Belgesi -->
                    <div class="document-item-card" [class.completed]="isDocReady('IDENTITY')">
                        <div class="doc-header">
                            <div class="doc-title">
                                <i class="pi pi-id-card"></i>
                                <span>Kimlik Belgesi</span>
                                <span class="required-badge">*</span>
                            </div>
                            <span class="status-badge" [class.success]="isDocReady('IDENTITY')" [class.pending]="!isDocReady('IDENTITY')">
                                {{ isDocReady('IDENTITY') ? 'Tamamlandı' : 'Bekleniyor' }}
                            </span>
                        </div>
                        <div class="doc-content">
                            <div *ngIf="fetchedDocs.identity" class="fetched-info">
                                <i class="pi pi-cloud-download"></i>
                                <span>e-Devlet'ten çekildi</span>
                                <button class="btn-icon-danger ml-auto" (click)="removeFetchedDoc('IDENTITY')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div *ngIf="getManualDoc('IDENTITY') as doc" class="manual-info">
                                <i class="pi pi-paperclip"></i>
                                <span>{{ doc.name }}</span>
                                <button class="btn-icon-danger" (click)="removeDocument('IDENTITY')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div class="doc-actions">
                                <button class="btn-small secondary" (click)="fetchIdentity()" [disabled]="fetching.identity">
                                    <i class="pi pi-refresh" [class.pi-spin]="fetching.identity"></i>
                                    e-Devlet Getir
                                </button>
                                <span class="separator">veya</span>
                                <input #fileIdentity type="file" hidden accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelected($event, 'IDENTITY')" />
                                <button class="btn-small primary" (click)="fileIdentity.click()">
                                    <i class="pi pi-upload"></i>
                                    Yükle
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Öğrenci Belgesi -->
                    <div class="document-item-card" [class.completed]="isDocReady('STUDENT_CERTIFICATE')">
                        <div class="doc-header">
                            <div class="doc-title">
                                <i class="pi pi-book"></i>
                                <span>Öğrenci Belgesi</span>
                                <span class="required-badge">*</span>
                            </div>
                            <span class="status-badge" [class.success]="isDocReady('STUDENT_CERTIFICATE')" [class.pending]="!isDocReady('STUDENT_CERTIFICATE')">
                                {{ isDocReady('STUDENT_CERTIFICATE') ? 'Tamamlandı' : 'Bekleniyor' }}
                            </span>
                        </div>
                        <div class="doc-content">
                            <div *ngIf="getManualDoc('STUDENT_CERTIFICATE') as doc" class="manual-info">
                                <i class="pi pi-paperclip"></i>
                                <span>{{ doc.name }}</span>
                                <button class="btn-icon-danger" (click)="removeDocument('STUDENT_CERTIFICATE')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div class="doc-actions">
                                <input #fileStudentCert type="file" hidden accept=".pdf" (change)="onFileSelected($event, 'STUDENT_CERTIFICATE')" />
                                <button class="btn-small primary" (click)="fileStudentCert.click()">
                                    <i class="pi pi-upload"></i>
                                    Yükle
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Ders İçerikleri -->
                    <div class="document-item-card" [class.completed]="isDocReady('COURSE_CONTENTS')">
                        <div class="doc-header">
                            <div class="doc-title">
                                <i class="pi pi-list"></i>
                                <span>Ders İçerikleri (Onaylı)</span>
                                <span class="required-badge">*</span>
                            </div>
                            <span class="status-badge" [class.success]="isDocReady('COURSE_CONTENTS')" [class.pending]="!isDocReady('COURSE_CONTENTS')">
                                {{ isDocReady('COURSE_CONTENTS') ? 'Tamamlandı' : 'Bekleniyor' }}
                            </span>
                        </div>
                        <div class="doc-content">
                            <div *ngIf="getManualDoc('COURSE_CONTENTS') as doc" class="manual-info">
                                <i class="pi pi-paperclip"></i>
                                <span>{{ doc.name }}</span>
                                <button class="btn-icon-danger" (click)="removeDocument('COURSE_CONTENTS')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div class="doc-actions">
                                <input #fileCourseContents type="file" hidden accept=".pdf,.zip,.rar" (change)="onFileSelected($event, 'COURSE_CONTENTS')" />
                                <button class="btn-small primary" (click)="fileCourseContents.click()">
                                    <i class="pi pi-upload"></i>
                                    Yükle
                                </button>
                                <small class="ml-2 text-500">(PDF veya ZIP)</small>
                            </div>
                        </div>
                    </div>

                    <!-- ÖSYM Yerleştirme Sonucu -->
                    <div class="document-item-card" [class.completed]="isDocReady('OSYM_PLACEMENT')">
                        <div class="doc-header">
                            <div class="doc-title">
                                <i class="pi pi-external-link"></i>
                                <span>ÖSYM Yerleştirme Sonuç Belgesi</span>
                                <span class="required-badge">*</span>
                            </div>
                            <span class="status-badge" [class.success]="isDocReady('OSYM_PLACEMENT')" [class.pending]="!isDocReady('OSYM_PLACEMENT')">
                                {{ isDocReady('OSYM_PLACEMENT') ? 'Tamamlandı' : 'Bekleniyor' }}
                            </span>
                        </div>
                        <div class="doc-content">
                            <div *ngIf="getManualDoc('OSYM_PLACEMENT') as doc" class="manual-info">
                                <i class="pi pi-paperclip"></i>
                                <span>{{ doc.name }}</span>
                                <button class="btn-icon-danger" (click)="removeDocument('OSYM_PLACEMENT')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div class="doc-actions">
                                <input #fileOsymPlace type="file" hidden accept=".pdf" (change)="onFileSelected($event, 'OSYM_PLACEMENT')" />
                                <button class="btn-small primary" (click)="fileOsymPlace.click()">
                                    <i class="pi pi-upload"></i>
                                    Yükle
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- İntibak Belgesi -->
                    <div class="document-item-card" [class.completed]="isDocReady('INTIBAK')">
                        <div class="doc-header">
                            <div class="doc-title">
                                <i class="pi pi-copy"></i>
                                <span>İntibak Belgesi</span>
                                <span class="required-badge">*</span>
                            </div>
                            <span class="status-badge" [class.success]="isDocReady('INTIBAK')" [class.pending]="!isDocReady('INTIBAK')">
                                {{ isDocReady('INTIBAK') ? 'Tamamlandı' : 'Bekleniyor' }}
                            </span>
                        </div>
                        <div class="doc-content">
                            <div *ngIf="getManualDoc('INTIBAK') as doc" class="manual-info">
                                <i class="pi pi-paperclip"></i>
                                <span>{{ doc.name }}</span>
                                <button class="btn-icon-danger" (click)="removeDocument('INTIBAK')">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div class="doc-actions">
                                <input #fileIntibak type="file" hidden accept=".pdf" (change)="onFileSelected($event, 'INTIBAK')" />
                                <button class="btn-small primary" (click)="fileIntibak.click()">
                                    <i class="pi pi-upload"></i>
                                    Yükle
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Ek Belgeler (Opsiyonel) -->
                    <div class="document-item-card">
                        <div class="doc-header">
                            <div class="doc-title">
                                <i class="pi pi-folder-open"></i>
                                <span>Diğer Belgeler (Opsiyonel)</span>
                            </div>
                        </div>
                        <div class="doc-content">
                            <div *ngFor="let doc of getOtherDocs(); let i = index" class="manual-info mb-2">
                                <i class="pi pi-paperclip"></i>
                                <span>{{ doc.name }}</span>
                                <button class="btn-icon-danger" (click)="removeOtherDoc(i)">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                            <div class="doc-actions">
                                <input #fileOther type="file" hidden accept=".pdf,.doc,.docx" (change)="onFileSelected($event, 'OTHER')" />
                                <button class="btn-small secondary" (click)="fileOther.click()">
                                    <i class="pi pi-plus"></i>
                                    Ek Belge Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <p-button label="Geri" icon="pi pi-arrow-left" severity="secondary" (onClick)="prevStep()"></p-button>
                    <p-button label="İleri" icon="pi pi-arrow-right" iconPos="right" (onClick)="nextStep()"></p-button>
                </div>
            </div>

            <!-- Step 5: Özet -->
            <div class="step-card" *ngIf="activeStep() === 4">
                <h2 class="step-title">Başvuru Özeti</h2>
                <div class="summary-grid">
                    <div class="summary-card">
                        <h4>Hedef Program</h4>
                        <p><strong>Fakülte:</strong> {{ applicationForm.get('targetFaculty')?.value }}</p>
                        <p><strong>Bölüm:</strong> {{ applicationForm.get('targetDepartment')?.value }}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Akademik Bilgiler</h4>
                        <p><strong>GPA:</strong> {{ applicationForm.get('declaredGpa')?.value }}</p>
                        <p><strong>ÖSYM Puanı:</strong> {{ applicationForm.get('declaredOsymScore')?.value }}</p>
                        <p><strong>ÖSYM Yılı:</strong> {{ applicationForm.get('declaredOsymYear')?.value }}</p>
                    </div>
                    <div class="summary-card full-width">
                        <h4>Belgeler ({{ getTotalDocCount() }})</h4>
                        <div class="doc-summary-list">
                            <span *ngIf="fetchedDocs.transcript" class="doc-badge auto">Transkript (Otomatik)</span>
                            <span *ngIf="fetchedDocs.osym" class="doc-badge auto">ÖSYM Sonucu (Otomatik)</span>
                            <span *ngIf="fetchedDocs.english" class="doc-badge auto">İngilizce Belgesi (Otomatik)</span>
                            <span *ngIf="fetchedDocs.identity" class="doc-badge auto">Kimlik (Otomatik)</span>
                            <span *ngFor="let doc of uploadedDocuments()" class="doc-badge manual">{{ doc.name }}</span>
                        </div>
                    </div>
                </div>

                <p-message severity="warn" styleClass="mt-4" text="Başvurunuzu gönderdikten sonra bilgilerinizi değiştiremezsiniz."></p-message>

                <div class="step-actions">
                    <p-button label="Geri" icon="pi pi-arrow-left" severity="secondary" (onClick)="prevStep()"></p-button>
                    <div class="flex gap-2">
                        <p-button label="Taslak Olarak Kaydet" icon="pi pi-save" severity="info" (onClick)="saveAsDraft()"></p-button>
                        <p-button label="Başvuruyu Gönder" icon="pi pi-send" (onClick)="submitApplication()"></p-button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .application-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 1rem;
        }

        .steps-section {
            background: #fff;
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .step-card {
            background: #fff;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .step-title {
            color: #8B1538;
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
        }

        .step-description {
            color: #666;
            margin: 0 0 1.5rem 0;
        }

        .form-section {
            margin-bottom: 2rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-group.full-width {
            grid-column: 1 / -1;
        }

        .form-group label {
            font-weight: 500;
            color: #333;
        }

        /* Fetch Section */
        .fetch-section {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .fetch-section h3 {
            margin: 0 0 1rem 0;
            color: #333;
        }

        .fetch-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .fetch-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            border: 2px solid;
            border-radius: 10px;
            background: #fff;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
            position: relative;
        }

        .fetch-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .fetch-btn .status-icon {
            position: absolute;
            right: 0.75rem;
            color: #388e3c;
        }

        .fetch-btn.ubys { border-color: #1976d2; color: #1976d2; }
        .fetch-btn.ubys:hover:not(:disabled) { background: #e3f2fd; }

        .fetch-btn.osym { border-color: #7b1fa2; color: #7b1fa2; }
        .fetch-btn.osym:hover:not(:disabled) { background: #f3e5f5; }

        .fetch-btn.yoksis { border-color: #388e3c; color: #388e3c; }
        .fetch-btn.yoksis:hover:not(:disabled) { background: #e8f5e9; }

        .fetch-btn.edevlet { border-color: #d32f2f; color: #d32f2f; }
        .fetch-btn.edevlet:hover:not(:disabled) { background: #ffebee; }

        .fetch-all-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            padding: 0.875rem;
            background: #8B1538;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }

        .fetch-all-btn:hover:not(:disabled) {
            background: #6d1029;
        }

        .fetch-all-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        /* Fetched Data */
        .fetched-data-section {
            margin-top: 2rem;
        }

        .fetched-data-section h3 {
            margin: 0 0 1rem 0;
            color: #333;
        }

        .fetched-card {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            margin-bottom: 1rem;
            overflow: hidden;
        }

        .fetched-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            background: #f5f5f5;
            border-bottom: 1px solid #e0e0e0;
        }

        .fetched-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            color: #333;
        }

        .validation-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .validation-badge.valid { background: #e8f5e9; color: #388e3c; }
        .validation-badge.invalid { background: #ffebee; color: #d32f2f; }

        .fetched-content {
            padding: 1rem;
        }

        .data-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .data-row:last-child {
            border-bottom: none;
        }

        .data-row.highlight .data-value {
            color: #8B1538;
            font-weight: 600;
            font-size: 1.1rem;
        }

        .data-label {
            color: #666;
        }

        .data-value {
            font-weight: 500;
            color: #333;
        }

        .scores-grid {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-top: 0.5rem;
        }

        .score-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5rem 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .score-type {
            font-size: 0.8rem;
            color: #666;
        }

        .score-value {
            font-weight: 600;
            color: #8B1538;
        }

        .validation-message {
            padding: 0.75rem 1rem;
            background: #fafafa;
            color: #666;
            font-size: 0.875rem;
            border-top: 1px solid #e0e0e0;
        }

        /* Document Upload Styles */
        .doc-checklist {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .doc-check-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #666;
        }

        .doc-check-item.completed { color: #388e3c; }
        .doc-check-item.completed .pi-check-circle { color: #388e3c; }
        .doc-check-item .pi-circle { color: #ccc; }

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
        }

        .doc-type-option input[type="radio"] { accent-color: #8B1538; }

        .upload-area {
            border: 2px dashed #ccc;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .upload-area:hover, .upload-area.drag-over {
            border-color: #8B1538;
            background: #fef7f8;
        }

        .upload-icon { font-size: 2.5rem; color: #8B1538; }
        .upload-text { margin: 0.5rem 0; color: #333; }
        .upload-subtext { margin: 0; color: #666; font-size: 0.9rem; }

        .select-files-btn {
            margin-top: 0.75rem;
            padding: 0.5rem 1.5rem;
            background: #8B1538;
            color: #fff;
            border: none;
            border-radius: 20px;
            cursor: pointer;
        }

        .upload-hint { margin-top: 0.75rem; color: #999; font-size: 0.8rem; }

        .uploaded-docs-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .uploaded-doc-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .doc-info { display: flex; align-items: center; gap: 0.75rem; }
        .doc-info .pi-file-pdf { font-size: 1.5rem; color: #8B1538; }
        .doc-details { display: flex; flex-direction: column; }
        .doc-name { font-weight: 500; }
        .doc-type-label { font-size: 0.8rem; color: #666; }

        .remove-doc-btn {
            padding: 0.5rem;
            background: #ffebee;
            color: #d32f2f;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }

        .documents-grid {
            display: grid;
            gap: 1rem;
        }

        .document-item-card {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.2s;
        }

        .document-item-card.completed {
            border-color: #388e3c;
            background: #f1f8e9;
        }

        .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: rgba(0,0,0,0.02);
            border-bottom: 1px solid #f0f0f0;
        }

        .doc-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            color: #333;
        }

        .required-badge {
            color: #d32f2f;
            font-size: 1.2rem;
            margin-left: 0.2rem;
        }

        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .status-badge.success { background: #e8f5e9; color: #388e3c; }
        .status-badge.pending { background: #fff3e0; color: #ef6c00; }

        .doc-content {
            padding: 1rem;
        }

        .fetched-info, .manual-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #4caf50;
            font-weight: 500;
        }
        
        .manual-info { color: #555; justify-content: space-between; }

        .doc-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .separator { color: #999; font-size: 0.9rem; }

        .btn-small {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            border: 1px solid;
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            transition: all 0.2s;
        }

        .btn-small.primary {
            background: #8B1538;
            border-color: #8B1538;
            color: #fff;
        }
        .btn-small.primary:hover { background: #6d1029; }

        .btn-small.secondary {
            background: #fff;
            border-color: #ccc;
            color: #333;
        }
        .btn-small.secondary:hover { background: #f5f5f5; }

        .btn-icon-danger {
            background: transparent;
            border: none;
            color: #d32f2f;
            cursor: pointer;
            padding: 0.25rem;
        }
        .btn-icon-danger:hover { background: #ffebee; border-radius: 4px; }

        /* Summary */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }

        .summary-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 1rem;
        }

        .summary-card.full-width { grid-column: 1 / -1; }
        .summary-card h4 { margin: 0 0 0.75rem 0; color: #8B1538; }
        .summary-card p { margin: 0.25rem 0; color: #555; }

        .doc-summary-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .doc-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
        }

        .doc-badge.auto { background: #e3f2fd; color: #1976d2; }
        .doc-badge.manual { background: #f3e5f5; color: #7b1fa2; }

        /* Actions */
        .step-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #eee;
        }

        @media (max-width: 768px) {
            .fetch-buttons { grid-template-columns: 1fr; }
            .form-row { grid-template-columns: 1fr; }
        }
    `]
})
export class NewApplicationComponent implements OnInit {
    applicationForm: FormGroup;
    activeStep = signal(0);
    uploadedDocuments = signal<UploadedDocument[]>([]);
    selectedDocType: DocumentType = DocumentType.OTHER;
    isDragOver = false;

    // External fetch
    tcKimlikNo = '';
    selectedUniversity = '';
    osymYear = new Date().getFullYear();
    universities = signal<University[]>([]);

    fetching = {
        transcript: false,
        osym: false,
        english: false,
        identity: false
    };
    fetchingAll = false;

    fetchedDocs: {
        transcript: ExternalDocumentData | null;
        osym: ExternalDocumentData | null;
        english: ExternalDocumentData | null;
        identity: ExternalDocumentData | null;
    } = {
        transcript: null,
        osym: null,
        english: null,
        identity: null
    };

    steps: MenuItem[] = [
        { label: 'Bilgi Getir' },
        { label: 'Hedef Program' },
        { label: 'Akademik Bilgiler' },
        { label: 'Belgeler' },
        { label: 'Özet' }
    ];

    documentTypeOptions = [
        { label: 'Transkript', value: DocumentType.TRANSCRIPT },
        { label: 'ÖSYM Sonuç Belgesi', value: DocumentType.OSYM_RESULT },
        { label: 'İngilizce Yeterlilik', value: DocumentType.ENGLISH_PROFICIENCY },
        { label: 'Kimlik Belgesi', value: DocumentType.IDENTITY },
        { label: 'Diğer', value: DocumentType.OTHER }
    ];

    faculties = [
        { label: 'Fen Fakültesi', value: 'Fen Fakültesi' },
        { label: 'Mühendislik Fakültesi', value: 'Mühendislik Fakültesi' },
        { label: 'Mimarlık Fakültesi', value: 'Mimarlık Fakültesi' }
    ];

    departmentsByFaculty: Record<string, { label: string; value: string }[]> = {
        'Fen Fakültesi': [
            { label: 'Matematik', value: 'Matematik' },
            { label: 'Fizik', value: 'Fizik' },
            { label: 'Kimya', value: 'Kimya' },
            { label: 'Moleküler Biyoloji ve Genetik', value: 'Moleküler Biyoloji ve Genetik' }
        ],
        'Mühendislik Fakültesi': [
            { label: 'Bilgisayar Mühendisliği', value: 'Bilgisayar Mühendisliği' },
            { label: 'Elektrik-Elektronik Mühendisliği', value: 'Elektrik-Elektronik Mühendisliği' },
            { label: 'Makine Mühendisliği', value: 'Makine Mühendisliği' },
            { label: 'İnşaat Mühendisliği', value: 'İnşaat Mühendisliği' },
            { label: 'Kimya Mühendisliği', value: 'Kimya Mühendisliği' }
        ],
        'Mimarlık Fakültesi': [
            { label: 'Mimarlık', value: 'Mimarlık' },
            { label: 'Şehir ve Bölge Planlama', value: 'Şehir ve Bölge Planlama' },
            { label: 'Endüstriyel Tasarım', value: 'Endüstriyel Tasarım' }
        ]
    };

    departments = signal<{ label: string; value: string }[]>([]);

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private applicationService: ApplicationService,
        private documentService: DocumentService,
        private integrationService: IntegrationService,
        private messageService: MessageService
    ) {
        this.applicationForm = this.fb.group({
            targetFaculty: ['', Validators.required],
            targetDepartment: ['', Validators.required],
            declaredGpa: [null, [Validators.required, Validators.min(0), Validators.max(4)]],
            declaredOsymScore: [null, [Validators.required, Validators.min(0), Validators.max(600)]],
            declaredOsymRank: [null, [Validators.required, Validators.min(1)]],
            declaredOsymYear: [null, [Validators.required, Validators.min(2010), Validators.max(new Date().getFullYear())]],
            notes: ['']
        });
    }

    ngOnInit() {
        this.loadUniversities();

        const editId = this.route.snapshot.queryParams['edit'];
        if (editId) {
            this.loadApplication(editId);
        }
    }

    private loadUniversities() {
        this.integrationService.getUniversities().subscribe({
            next: (unis) => this.universities.set(unis),
            error: () => {
                // Use fallback list
                this.universities.set([
                    { code: 'ITU', name: 'İstanbul Teknik Üniversitesi' },
                    { code: 'BOUN', name: 'Boğaziçi Üniversitesi' },
                    { code: 'METU', name: 'Orta Doğu Teknik Üniversitesi' },
                    { code: 'HACETTEPE', name: 'Hacettepe Üniversitesi' },
                    { code: 'ANKARA', name: 'Ankara Üniversitesi' }
                ]);
            }
        });
    }

    private loadApplication(id: string) {
        this.applicationService.getById(id).subscribe(app => {
            this.applicationForm.patchValue({
                targetFaculty: app.targetFaculty,
                targetDepartment: app.targetDepartment,
                declaredGpa: app.declaredGpa,
                declaredOsymScore: app.declaredOsymScore,
                declaredOsymYear: app.declaredOsymYear,
                notes: app.notes
            });
            this.onFacultyChange({ value: app.targetFaculty });
        });
    }

    canFetch(): boolean {
        return this.tcKimlikNo.length === 11 && this.selectedUniversity !== '';
    }

    hasFetchedData(): boolean {
        return !!(this.fetchedDocs.transcript || this.fetchedDocs.osym || this.fetchedDocs.english || this.fetchedDocs.identity);
    }

    fetchTranscript() {
        this.fetching.transcript = true;
        this.integrationService.fetchTranscript(this.tcKimlikNo, this.selectedUniversity).subscribe({
            next: (data) => {
                this.fetchedDocs.transcript = data;
                this.fetching.transcript = false;
                this.autoFillFromFetchedData();
                this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Transkript bilgisi getirildi.' });
            },
            error: (err) => {
                this.fetching.transcript = false;
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: err.error?.message || 'Transkript getirilemedi.' });
            }
        });
    }

    fetchOsymScore() {
        this.fetching.osym = true;
        this.integrationService.fetchOsymScore(this.tcKimlikNo, this.osymYear).subscribe({
            next: (data) => {
                this.fetchedDocs.osym = data;
                this.fetching.osym = false;
                this.autoFillFromFetchedData();
                this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'ÖSYM sonucu getirildi.' });
            },
            error: (err) => {
                this.fetching.osym = false;
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: err.error?.message || 'ÖSYM sonucu getirilemedi.' });
            }
        });
    }

    fetchEnglishCert() {
        this.fetching.english = true;
        this.integrationService.fetchEnglishCert(this.tcKimlikNo).subscribe({
            next: (data) => {
                this.fetchedDocs.english = data;
                this.fetching.english = false;
                this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'İngilizce belgesi getirildi.' });
            },
            error: (err) => {
                this.fetching.english = false;
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: err.error?.message || 'İngilizce belgesi getirilemedi.' });
            }
        });
    }

    fetchIdentity() {
        this.fetching.identity = true;
        this.integrationService.fetchIdentity(this.tcKimlikNo).subscribe({
            next: (data) => {
                this.fetchedDocs.identity = data;
                this.fetching.identity = false;
                this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Kimlik bilgisi getirildi.' });
            },
            error: (err) => {
                this.fetching.identity = false;
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: err.error?.message || 'Kimlik bilgisi getirilemedi.' });
            }
        });
    }

    fetchAllDocuments() {
        this.fetchingAll = true;
        this.integrationService.fetchAllDocuments(this.tcKimlikNo, this.selectedUniversity, this.osymYear).subscribe({
            next: (docs) => {
                docs.forEach(doc => {
                    if (doc.type === 'TRANSCRIPT') this.fetchedDocs.transcript = doc;
                    if (doc.type === 'OSYM_RESULT') this.fetchedDocs.osym = doc;
                    if (doc.type === 'ENGLISH_PROFICIENCY') this.fetchedDocs.english = doc;
                    if (doc.type === 'IDENTITY') this.fetchedDocs.identity = doc;
                });
                this.fetchingAll = false;
                this.autoFillFromFetchedData();
                this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: `${docs.length} belge getirildi.` });
            },
            error: (err) => {
                this.fetchingAll = false;
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Belgeler getirilemedi.' });
            }
        });
    }

    private autoFillFromFetchedData() {
        if (this.fetchedDocs.transcript) {
            const transcript = this.getTranscriptData();
            if (transcript) {
                this.applicationForm.patchValue({ declaredGpa: transcript.gpa });
            }
        }
        if (this.fetchedDocs.osym) {
            const osym = this.getOsymData();
            if (osym) {
                const sayScore = osym.scores?.find(s => s.scoreType === 'SAY');
                if (sayScore) {
                    this.applicationForm.patchValue({
                        declaredOsymScore: sayScore.score,
                        declaredOsymRank: sayScore.rank, // Başarı sıralaması da doldurulacak
                        declaredOsymYear: osym.examYear
                    });
                }
            }
        }
    }

    // Type-safe getters for fetched data
    getTranscriptData(): UbysTranscriptData | null {
        return this.fetchedDocs.transcript?.data as UbysTranscriptData || null;
    }

    getOsymData(): OsymScoreData | null {
        return this.fetchedDocs.osym?.data as OsymScoreData || null;
    }

    getEnglishData(): YoksisEnglishData | null {
        return this.fetchedDocs.english?.data as YoksisEnglishData || null;
    }

    getIdentityData(): EDevletIdentityData | null {
        return this.fetchedDocs.identity?.data as EDevletIdentityData || null;
    }

    getTotalDocCount(): number {
        let count = 0;
        if (this.fetchedDocs.transcript) count++;
        if (this.fetchedDocs.osym) count++;
        if (this.fetchedDocs.english) count++;
        if (this.fetchedDocs.identity) count++;
        count += this.uploadedDocuments().length;
        return count;
    }

    onFacultyChange(event: any) {
        const faculty = event.value;
        this.departments.set(this.departmentsByFaculty[faculty] || []);
        this.applicationForm.patchValue({ targetDepartment: '' });
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.activeStep.update(s => s + 1);
        }
    }

    prevStep() {
        this.activeStep.update(s => s - 1);
    }

    // Updated Validation
    private validateCurrentStep(): boolean {
        const step = this.activeStep();
        if (step === 1) {
            if (!this.applicationForm.get('targetFaculty')?.value || !this.applicationForm.get('targetDepartment')?.value) {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Lütfen fakülte ve bölüm seçin.' });
                return false;
            }
        } else if (step === 2) {
            const gpa = this.applicationForm.get('declaredGpa')?.value;
            const osym = this.applicationForm.get('declaredOsymScore')?.value;
            if (!gpa || !osym) {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Lütfen GPA ve ÖSYM puanını girin.' });
                return false;
            }
            if (gpa < 2.5) {
                this.messageService.add({ severity: 'warn', summary: 'Uyarı', detail: 'GPA minimum 2.50 olmalıdır.' });
                return false;
            }
        } else if (step === 3) {
            const missingDocs: string[] = [];
            
            if (!this.isDocReady('TRANSCRIPT')) missingDocs.push('Transkript');
            if (!this.isDocReady('OSYM_RESULT')) missingDocs.push('ÖSYM Sonuç Belgesi');
            if (!this.isDocReady('ENGLISH_PROFICIENCY')) missingDocs.push('İngilizce Yeterlilik');
            if (!this.isDocReady('IDENTITY')) missingDocs.push('Kimlik Belgesi');
            if (!this.isDocReady('STUDENT_CERTIFICATE')) missingDocs.push('Öğrenci Belgesi');
            if (!this.isDocReady('COURSE_CONTENTS')) missingDocs.push('Ders İçerikleri (Katalog)');
            if (!this.isDocReady('OSYM_PLACEMENT')) missingDocs.push('ÖSYM Yerleştirme Sonuç Belgesi');
            if (!this.isDocReady('INTIBAK')) missingDocs.push('İntibak Belgesi');

            if (missingDocs.length > 0) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Eksik Belgeler',
                    detail: `Lütfen şu belgeleri tamamlayın: ${missingDocs.join(', ')}`
                });
                return false;
            }
        }
        return true;
    }

    // Helper methods for new document UI
    isDocReady(type: string): boolean {
        // Check fetched
        if (type === 'TRANSCRIPT' && this.fetchedDocs.transcript) return true;
        if (type === 'OSYM_RESULT' && this.fetchedDocs.osym) return true;
        if (type === 'ENGLISH_PROFICIENCY' && this.fetchedDocs.english) return true;
        if (type === 'IDENTITY' && this.fetchedDocs.identity) return true;

        // Check manual upload
        return this.uploadedDocuments().some(d => d.type === type);
    }

    getManualDoc(type: string): UploadedDocument | undefined {
        return this.uploadedDocuments().find(d => d.type === type);
    }

    getOtherDocs(): UploadedDocument[] {
        return this.uploadedDocuments().filter(d => d.type === DocumentType.OTHER);
    }

    // Updated File Selection
    onFileSelected(event: Event, type: string) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // Validation
            if (file.size > 10 * 1024 * 1024) {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Dosya boyutu 10MB\'dan küçük olmalıdır.' });
                return;
            }
            const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!allowedTypes.includes(ext)) {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Geçersiz dosya türü.' });
                return;
            }

            // Remove existing manual doc of same type if not OTHER
            if (type !== DocumentType.OTHER) {
                this.uploadedDocuments.update(docs => docs.filter(d => d.type !== type));
            }

            this.uploadedDocuments.update(docs => [...docs, { 
                file,
                type: type as DocumentType,
                name: file.name 
            }]);
            
            this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: `${file.name} yüklendi.` });
            input.value = ''; // Reset input
        }
    }

    removeDocument(type: string) {
        this.uploadedDocuments.update(docs => docs.filter(d => d.type !== type));
    }

    removeFetchedDoc(type: string) {
        if (type === 'TRANSCRIPT') this.fetchedDocs.transcript = null;
        if (type === 'OSYM_RESULT') this.fetchedDocs.osym = null;
        if (type === 'ENGLISH_PROFICIENCY') this.fetchedDocs.english = null;
        if (type === 'IDENTITY') this.fetchedDocs.identity = null;
        this.messageService.add({ severity: 'info', summary: 'Bilgi', detail: 'Otomatik veri kaldırıldı.' });
    }

    removeOtherDoc(index: number) {
        // Filter OTHER docs, get the one at index, remove it from main list
        const otherDocs = this.getOtherDocs();
        if (index >= 0 && index < otherDocs.length) {
            const targetDoc = otherDocs[index];
            this.uploadedDocuments.update(docs => docs.filter(d => d !== targetDoc));
        }
    }

    hasDocument(type: string): boolean {
        return this.uploadedDocuments().some(d => d.type === type);
    }

    getDocTypeLabel(type: DocumentType): string {
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

    saveAsDraft() {
        const formData = this.applicationForm.value;
        this.applicationService.create(formData).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Başvuru taslak olarak kaydedildi.' });
                this.router.navigate(['/student/my-applications']);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Başvuru kaydedilemedi.' });
            }
        });
    }

    submitApplication() {
        const formData = this.applicationForm.value;
        this.applicationService.create(formData).subscribe({
            next: (app) => {
                this.uploadDocumentsToApplication(app.id).then(() => {
                    this.applicationService.submit(app.id).subscribe({
                        next: () => {
                            this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Başvurunuz gönderildi!' });
                            setTimeout(() => this.router.navigate(['/student/my-applications']), 1500);
                        },
                        error: () => {
                            this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Başvuru gönderilemedi.' });
                        }
                    });
                });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Başvuru oluşturulamadı.' });
            }
        });
    }

    private async uploadDocumentsToApplication(applicationId: string): Promise<void> {
        const docs = this.uploadedDocuments();
        for (const doc of docs) {
            try {
                await this.documentService.upload(applicationId, doc.file, doc.type).toPromise();
            } catch (error) {
                console.error('Document upload failed:', error);
            }
        }
    }
    
    // Document upload methods
    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragOver = false;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            // For drag and drop, we default to OTHER or handle logic
            // Since we moved to specific uploads, generic drop might be ambiguous
            // Let's treat dropped files as 'OTHER' for now or show warning
             this.messageService.add({ severity: 'info', summary: 'Bilgi', detail: 'Lütfen ilgili belge alanındaki "Yükle" butonunu kullanın.' });
        }
    }
}