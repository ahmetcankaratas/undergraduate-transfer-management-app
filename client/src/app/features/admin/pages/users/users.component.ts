import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services';
import { User, UserRole } from '../../../../core/models';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule, ToastModule, TagModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="grid">
            <div class="col-12">
                <p-card header="Kullanıcı Yönetimi">
                    <div class="flex justify-content-end mb-3">
                        <p-button label="Yeni Kullanıcı" icon="pi pi-plus" (onClick)="showAddDialog()"></p-button>
                    </div>

                    <p-table [value]="users()" [paginator]="true" [rows]="10">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>ID</th>
                                <th>Ad</th>
                                <th>Soyad</th>
                                <th>E-posta</th>
                                <th>Rol</th>
                                <th>Durum</th>
                                <th>İşlem</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-user>
                            <tr>
                                <td>{{ user.id }}</td>
                                <td>{{ user.firstName }}</td>
                                <td>{{ user.lastName }}</td>
                                <td>{{ user.email }}</td>
                                <td>
                                    <p-tag [value]="getRoleLabel(user.role)" [severity]="getRoleSeverity(user.role)"></p-tag>
                                </td>
                                <td>
                                    <p-tag
                                        [value]="user.isActive ? 'Aktif' : 'Pasif'"
                                        [severity]="user.isActive ? 'success' : 'danger'"
                                    ></p-tag>
                                </td>
                                <td>
                                    <p-button icon="pi pi-pencil" size="small" [text]="true" (onClick)="showEditDialog(user)"></p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7" class="text-center p-4">
                                    <p class="text-500">Kullanıcı bulunamadı.</p>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>

        <p-dialog [header]="dialogMode === 'add' ? 'Yeni Kullanıcı' : 'Kullanıcı Düzenle'" [(visible)]="dialogVisible" [modal]="true" [style]="{width: '450px'}">
            <div class="p-fluid">
                <div class="field">
                    <label for="firstName">Ad</label>
                    <input pInputText id="firstName" [(ngModel)]="formData.firstName" />
                </div>
                <div class="field">
                    <label for="lastName">Soyad</label>
                    <input pInputText id="lastName" [(ngModel)]="formData.lastName" />
                </div>
                <div class="field">
                    <label for="email">E-posta</label>
                    <input pInputText id="email" [(ngModel)]="formData.email" type="email" />
                </div>
                <div class="field" *ngIf="dialogMode === 'add'">
                    <label for="password">Şifre</label>
                    <input pInputText id="password" [(ngModel)]="formData.password" type="password" />
                </div>
                <div class="field">
                    <label for="role">Rol</label>
                    <p-select id="role" [(ngModel)]="formData.role" [options]="roleOptions" placeholder="Rol Seçin"></p-select>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="İptal" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false"></p-button>
                <p-button label="Kaydet" icon="pi pi-check" (onClick)="saveUser()"></p-button>
            </ng-template>
        </p-dialog>
    `
})
export class UsersComponent implements OnInit {
    users = signal<User[]>([]);
    dialogVisible = false;
    dialogMode: 'add' | 'edit' = 'add';
    selectedUser: User | null = null;

    formData = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: ''
    };

    roleOptions = [
        { label: 'Öğrenci', value: UserRole.STUDENT },
        { label: 'ÖIDB Personeli', value: UserRole.OIDB_STAFF },
        { label: 'Fakülte Personeli', value: UserRole.FACULTY_STAFF },
        { label: 'YGK Üyesi', value: UserRole.YGK_MEMBER },
        { label: 'Admin', value: UserRole.ADMIN }
    ];

    constructor(
        private authService: AuthService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadUsers();
    }

    private loadUsers() {
        // This would typically call a user management service
        // For now, we'll show mock data
        this.users.set([]);
    }

    showAddDialog() {
        this.dialogMode = 'add';
        this.formData = { firstName: '', lastName: '', email: '', password: '', role: '' };
        this.dialogVisible = true;
    }

    showEditDialog(user: User) {
        this.dialogMode = 'edit';
        this.selectedUser = user;
        this.formData = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: '',
            role: user.role
        };
        this.dialogVisible = true;
    }

    saveUser() {
        // This would typically call a user management service
        this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Kullanıcı kaydedildi.' });
        this.dialogVisible = false;
        this.loadUsers();
    }

    getRoleLabel(role: string): string {
        const labels: Record<string, string> = {
            [UserRole.STUDENT]: 'Öğrenci',
            [UserRole.OIDB_STAFF]: 'ÖIDB',
            [UserRole.FACULTY_STAFF]: 'Fakülte',
            [UserRole.YGK_MEMBER]: 'YGK',
            [UserRole.ADMIN]: 'Admin'
        };
        return labels[role] || role;
    }

    getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
            [UserRole.STUDENT]: 'info',
            [UserRole.OIDB_STAFF]: 'success',
            [UserRole.FACULTY_STAFF]: 'warn',
            [UserRole.YGK_MEMBER]: 'contrast',
            [UserRole.ADMIN]: 'danger'
        };
        return severities[role] || 'secondary';
    }
}
