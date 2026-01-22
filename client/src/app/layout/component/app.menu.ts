import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../core/services';
import { UserRole } from '../../core/models';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    constructor(private authService: AuthService) {}

    ngOnInit() {
        this.buildMenu();
    }

    private buildMenu() {
        const role = this.authService.userRole();

        switch (role) {
            case UserRole.STUDENT:
                this.model = this.getStudentMenu();
                break;
            case UserRole.OIDB_STAFF:
                this.model = this.getOidbMenu();
                break;
            case UserRole.FACULTY_STAFF:
                this.model = this.getFacultyMenu();
                break;
            case UserRole.YGK_MEMBER:
                this.model = this.getYgkMenu();
                break;
            case UserRole.ADMIN:
                this.model = this.getAdminMenu();
                break;
            default:
                this.model = this.getStudentMenu();
        }
    }

    private getStudentMenu(): MenuItem[] {
        return [
            {
                label: 'Ana Sayfa',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/student'] }
                ]
            },
            {
                label: 'Başvuru',
                items: [
                    { label: 'Yeni Başvuru', icon: 'pi pi-fw pi-plus', routerLink: ['/student/new-application'] },
                    { label: 'Başvurularım', icon: 'pi pi-fw pi-list', routerLink: ['/student/my-applications'] }
                ]
            },
            {
                label: 'Bildirimler',
                items: [
                    { label: 'Bildirimlerim', icon: 'pi pi-fw pi-bell', routerLink: ['/student/notifications'] }
                ]
            }
        ];
    }

    private getOidbMenu(): MenuItem[] {
        return [
            {
                label: 'Ana Sayfa',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/oidb'] }
                ]
            },
            {
                label: 'Başvuru Yönetimi',
                items: [
                    { label: 'Başvuruları İncele', icon: 'pi pi-fw pi-search', routerLink: ['/oidb/review'] },
                    { label: 'Tüm Başvurular', icon: 'pi pi-fw pi-list', routerLink: ['/oidb/applications'] }
                ]
            },
            {
                label: 'Sonuçlar',
                items: [
                    { label: 'Sonuç Duyurusu', icon: 'pi pi-fw pi-megaphone', routerLink: ['/oidb/announcements'] },
                    { label: 'Raporlar', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/oidb/reports'] }
                ]
            }
        ];
    }

    private getFacultyMenu(): MenuItem[] {
        return [
            {
                label: 'Ana Sayfa',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/faculty'] }
                ]
            },
            {
                label: 'Yönlendirme',
                items: [
                    { label: 'Başvuruları Yönlendir', icon: 'pi pi-fw pi-directions', routerLink: ['/faculty/routing'] },
                    { label: 'Bölümlere Gönder', icon: 'pi pi-fw pi-send', routerLink: ['/faculty/department-routing'] }
                ]
            },
            {
                label: 'Fakülte Kurulu',
                items: [
                    { label: 'Kurul Kararları', icon: 'pi pi-fw pi-check-square', routerLink: ['/faculty/board-decisions'] }
                ]
            }
        ];
    }

    private getYgkMenu(): MenuItem[] {
        return [
            {
                label: 'Ana Sayfa',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/ygk'] }
                ]
            },
            {
                label: 'Değerlendirme',
                items: [
                    { label: 'Başvuruları Değerlendir', icon: 'pi pi-fw pi-check', routerLink: ['/ygk/evaluate'] },
                    { label: 'Bekleyen Başvurular', icon: 'pi pi-fw pi-clock', routerLink: ['/ygk/pending'] }
                ]
            },
            {
                label: 'Sıralama',
                items: [
                    { label: 'Sıralama Oluştur', icon: 'pi pi-fw pi-sort-numeric-up', routerLink: ['/ygk/rankings'] },
                    { label: 'Sonuçları Görüntüle', icon: 'pi pi-fw pi-list', routerLink: ['/ygk/results'] }
                ]
            }
        ];
    }

    private getAdminMenu(): MenuItem[] {
        return [
            {
                label: 'Ana Sayfa',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/admin'] }
                ]
            },
            {
                label: 'Kullanıcı Yönetimi',
                items: [
                    { label: 'Kullanıcılar', icon: 'pi pi-fw pi-users', routerLink: ['/admin/users'] }
                ]
            },
            {
                label: 'Sistem',
                items: [
                    { label: 'Dönem Ayarları', icon: 'pi pi-fw pi-cog', routerLink: ['/admin/settings'] },
                    { label: 'Raporlar', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/admin/reports'] }
                ]
            }
        ];
    }
}
