import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/models';

export const YGK_ROUTES: Routes = [
    {
        path: '',
        data: { roles: [UserRole.YGK_MEMBER, UserRole.ADMIN] },
        canActivate: [roleGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/ygk-dashboard.component').then(m => m.YgkDashboardComponent)
            },
            {
                path: 'pending',
                loadComponent: () => import('./pages/pending/pending.component').then(m => m.PendingComponent)
            },
            {
                path: 'evaluate',
                loadComponent: () => import('./pages/evaluate/evaluate.component').then(m => m.EvaluateComponent)
            },
            {
                path: 'rankings',
                loadComponent: () => import('./pages/rankings/rankings.component').then(m => m.RankingsComponent)
            },
            {
                path: 'results',
                loadComponent: () => import('./pages/results/results.component').then(m => m.ResultsComponent)
            }
        ]
    }
];
