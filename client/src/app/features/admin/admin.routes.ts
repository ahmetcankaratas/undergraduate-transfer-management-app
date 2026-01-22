import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/models';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        data: { roles: [UserRole.ADMIN] },
        canActivate: [roleGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
            },
            {
                path: 'users',
                loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent)
            },
            {
                path: 'quotas',
                loadComponent: () => import('./pages/quotas/quotas.component').then(m => m.QuotasComponent)
            }
        ]
    }
];
