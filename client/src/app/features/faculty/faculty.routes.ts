import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/models';

export const FACULTY_ROUTES: Routes = [
    {
        path: '',
        data: { roles: [UserRole.FACULTY_STAFF, UserRole.ADMIN] },
        canActivate: [roleGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/faculty-dashboard.component').then(m => m.FacultyDashboardComponent)
            },
            {
                path: 'routing',
                loadComponent: () => import('./pages/routing/routing.component').then(m => m.RoutingComponent)
            },
            {
                path: 'department-routing',
                loadComponent: () => import('./pages/department-routing/department-routing.component').then(m => m.DepartmentRoutingComponent)
            },
            {
                path: 'board-decisions',
                loadComponent: () => import('./pages/board-decisions/board-decisions.component').then(m => m.BoardDecisionsComponent)
            }
        ]
    }
];
