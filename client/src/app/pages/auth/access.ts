import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [ButtonModule, RouterModule],
    template: `
        <div class="access-container">
            <div class="access-card">
                <div class="icon-container">
                    <i class="pi pi-lock"></i>
                </div>
                <h1 class="access-title">Access Denied</h1>
                <p class="access-message">You do not have the necessary permissions to access this page.</p>
                <p class="access-message">Please contact the administrator if you believe this is an error.</p>
                <p-button
                    label="Return to Login"
                    routerLink="/auth/login"
                    styleClass="return-button"
                ></p-button>
            </div>
        </div>
    `,
    styles: [`
        .access-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            padding: 1rem;
        }

        .access-card {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: 3rem;
            width: 100%;
            max-width: 480px;
            text-align: center;
        }

        .icon-container {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #fff3e0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
        }

        .icon-container i {
            font-size: 2.5rem;
            color: #f57c00;
        }

        .access-title {
            color: #333;
            font-size: 2rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
        }

        .access-message {
            color: #666;
            font-size: 1rem;
            margin: 0 0 0.5rem 0;
            line-height: 1.5;
        }

        :host ::ng-deep .return-button {
            margin-top: 2rem;
            background-color: #8B1538 !important;
            border-color: #8B1538 !important;
            border-radius: 24px !important;
            padding: 0.875rem 2rem !important;
        }

        :host ::ng-deep .return-button:hover {
            background-color: #6d1029 !important;
            border-color: #6d1029 !important;
        }
    `]
})
export class Access {}
