import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../../core/services';
import { Notification } from '../../../../core/models';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule],
    template: `
        <div class="notifications-container">
            <div class="notifications-header">
                <h2>Bildirimlerim</h2>
                <button
                    *ngIf="hasUnread()"
                    class="mark-all-btn"
                    (click)="markAllAsRead()"
                >
                    <i class="pi pi-check-circle"></i>
                    Tümünü Okundu İşaretle
                </button>
            </div>

            <div class="notifications-list" *ngIf="notifications().length > 0">
                <div
                    *ngFor="let notification of notifications()"
                    class="notification-card"
                    [class.unread]="!notification.isRead"
                    (click)="markAsRead(notification)"
                >
                    <div class="notification-icon" [class]="getIconClass(notification)">
                        <i [class]="getNotificationIcon(notification)"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-header">
                            <span class="notification-title">{{ notification.title }}</span>
                            <span class="notification-badge" *ngIf="!notification.isRead">Yeni</span>
                        </div>
                        <p class="notification-message">{{ notification.message }}</p>
                        <span class="notification-time">{{ notification.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                    </div>
                    <div class="notification-actions">
                        <button
                            *ngIf="notification.link"
                            class="action-btn view"
                            [routerLink]="notification.link"
                            (click)="$event.stopPropagation()"
                            title="Görüntüle"
                        >
                            <i class="pi pi-eye"></i>
                        </button>
                        <button
                            class="action-btn delete"
                            (click)="deleteNotification(notification, $event)"
                            title="Sil"
                        >
                            <i class="pi pi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="empty-state" *ngIf="notifications().length === 0">
                <i class="pi pi-bell-slash"></i>
                <p>Henüz bildiriminiz bulunmuyor.</p>
            </div>
        </div>
    `,
    styles: [`
        .notifications-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 1.5rem;
        }

        .notifications-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .notifications-header h2 {
            margin: 0;
            color: #333;
            font-size: 1.5rem;
        }

        .mark-all-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: none;
            border: none;
            color: #8B1538;
            font-size: 0.9rem;
            cursor: pointer;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            transition: background 0.2s;
        }

        .mark-all-btn:hover {
            background: #fef7f8;
        }

        .notifications-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .notification-card {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            background: #ffffff;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            cursor: pointer;
            transition: all 0.2s;
            border-left: 4px solid transparent;
        }

        .notification-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .notification-card.unread {
            background: #fef7f8;
            border-left-color: #8B1538;
        }

        .notification-icon {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .notification-icon i {
            font-size: 1.25rem;
        }

        .notification-icon.success {
            background: #e8f5e9;
            color: #388e3c;
        }

        .notification-icon.error {
            background: #ffebee;
            color: #d32f2f;
        }

        .notification-icon.warning {
            background: #fff3e0;
            color: #f57c00;
        }

        .notification-icon.info {
            background: #e3f2fd;
            color: #1976d2;
        }

        .notification-content {
            flex: 1;
            min-width: 0;
        }

        .notification-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
        }

        .notification-title {
            font-weight: 600;
            color: #333;
        }

        .notification-badge {
            background: #8B1538;
            color: #fff;
            font-size: 0.7rem;
            padding: 0.15rem 0.5rem;
            border-radius: 10px;
            font-weight: 500;
        }

        .notification-message {
            color: #666;
            font-size: 0.9rem;
            margin: 0 0 0.5rem 0;
            line-height: 1.4;
        }

        .notification-time {
            color: #999;
            font-size: 0.8rem;
        }

        .notification-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
        }

        .action-btn {
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .action-btn.view {
            background: #e3f2fd;
            color: #1976d2;
        }

        .action-btn.view:hover {
            background: #bbdefb;
        }

        .action-btn.delete {
            background: #ffebee;
            color: #d32f2f;
        }

        .action-btn.delete:hover {
            background: #ffcdd2;
        }

        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .empty-state i {
            font-size: 4rem;
            color: #ccc;
            margin-bottom: 1rem;
        }

        .empty-state p {
            color: #666;
            font-size: 1rem;
            margin: 0;
        }
    `]
})
export class NotificationsComponent implements OnInit {
    notifications = signal<Notification[]>([]);

    constructor(private notificationService: NotificationService) {}

    ngOnInit() {
        this.loadNotifications();
    }

    private loadNotifications() {
        this.notificationService.getAll().subscribe(notifications => {
            this.notifications.set(notifications);
        });
    }

    hasUnread(): boolean {
        return this.notifications().some(n => !n.isRead);
    }

    markAsRead(notification: Notification) {
        if (!notification.isRead) {
            this.notificationService.markAsRead(notification.id).subscribe(() => {
                this.notifications.update(notifications =>
                    notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
            });
        }
    }

    markAllAsRead() {
        this.notificationService.markAllAsRead().subscribe(() => {
            this.notifications.update(notifications =>
                notifications.map(n => ({ ...n, isRead: true }))
            );
        });
    }

    deleteNotification(notification: Notification, event: Event) {
        event.stopPropagation();
        this.notificationService.delete(notification.id).subscribe(() => {
            this.notifications.update(notifications =>
                notifications.filter(n => n.id !== notification.id)
            );
        });
    }

    getNotificationIcon(notification: Notification): string {
        // Application-specific icons based on title
        if (notification.title.includes('Başvuru Alındı')) {
            return 'pi pi-send';
        }
        if (notification.title.includes('Onaylandı')) {
            return 'pi pi-check-circle';
        }
        if (notification.title.includes('Reddedildi')) {
            return 'pi pi-times-circle';
        }
        if (notification.title.includes('Durum') || notification.title.includes('Güncellendi')) {
            return 'pi pi-sync';
        }
        if (notification.title.includes('Sonuç')) {
            return 'pi pi-chart-bar';
        }

        // Default icons by type
        const icons: Record<string, string> = {
            'INFO': 'pi pi-info-circle',
            'SUCCESS': 'pi pi-check-circle',
            'WARN': 'pi pi-exclamation-triangle',
            'ERROR': 'pi pi-times-circle'
        };
        return icons[notification.type] || 'pi pi-bell';
    }

    getIconClass(notification: Notification): string {
        const typeClasses: Record<string, string> = {
            'INFO': 'info',
            'SUCCESS': 'success',
            'WARN': 'warning',
            'ERROR': 'error'
        };
        return typeClasses[notification.type] || 'info';
    }
}
