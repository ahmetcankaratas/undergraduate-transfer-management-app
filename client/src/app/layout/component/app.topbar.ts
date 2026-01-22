import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../core/services';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, ButtonModule, InputTextModule, MenuModule],
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <div class="logo-circle">
                        <span class="logo-text">IYT</span>
                    </div>
                    <div class="logo-titles">
                        <span class="logo-main">IZTECH</span>
                        <span class="logo-subtitle">Undergraduate Management System</span>
                    </div>
                </a>
            </div>

            <div class="layout-topbar-actions">
                <div class="search-container">
                    <span class="p-input-icon-left">
                        <input type="text" pInputText placeholder="Search..." class="topbar-search" />
                    </span>
                </div>

                <button class="layout-topbar-menu-button layout-topbar-action" (click)="menu.toggle($event)">
                    <i class="pi pi-user"></i>
                </button>

                <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>
            </div>
        </div>
    `,
    styles: [`
        .layout-topbar {
            background-color: #8B1538 !important;
        }

        .layout-topbar-logo-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .layout-menu-button {
            color: #ffffff !important;
            background: transparent !important;
            border: none !important;
        }

        .layout-menu-button:hover {
            background: rgba(255,255,255,0.1) !important;
        }

        .layout-topbar-logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
        }

        .logo-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .logo-text {
            color: #8B1538;
            font-weight: 700;
            font-size: 0.75rem;
        }

        .logo-titles {
            display: flex;
            flex-direction: column;
        }

        .logo-main {
            color: #ffffff;
            font-weight: 700;
            font-size: 1.25rem;
            line-height: 1.2;
        }

        .logo-subtitle {
            color: rgba(255,255,255,0.8);
            font-size: 0.7rem;
            line-height: 1.2;
        }

        .layout-topbar-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .search-container {
            display: none;
        }

        @media (min-width: 992px) {
            .search-container {
                display: block;
            }
        }

        :host ::ng-deep .topbar-search {
            background: rgba(255,255,255,0.1) !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
            color: #ffffff !important;
            border-radius: 20px !important;
            padding: 0.5rem 1rem 0.5rem 2.5rem !important;
            width: 200px;
        }

        :host ::ng-deep .topbar-search::placeholder {
            color: rgba(255,255,255,0.6) !important;
        }

        :host ::ng-deep .p-input-icon-left > i {
            color: rgba(255,255,255,0.6) !important;
        }

        .layout-topbar-action {
            color: #ffffff !important;
            background: transparent !important;
            border: none !important;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }

        .layout-topbar-action:hover {
            background: rgba(255,255,255,0.1) !important;
        }
    `]
})
export class AppTopbar {
    layoutService = inject(LayoutService);
    authService = inject(AuthService);
    router = inject(Router);

    menuItems: MenuItem[] = [
        {
            label: 'Profile',
            icon: 'pi pi-user',
            command: () => {
                // Navigate to profile
            }
        },
        {
            separator: true
        },
        {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => {
                this.logout();
            }
        }
    ];

    logout() {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}
