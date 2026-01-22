import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, User } from '../../entities';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    applicationId?: string;
    link?: string;
  }) {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'INFO',
      applicationId: data.applicationId,
      link: data.link,
    });

    return this.notificationRepository.save(notification);
  }

  async createBulk(
    userIds: string[],
    data: {
      title: string;
      message: string;
      type?: string;
      applicationId?: string;
      link?: string;
    },
  ) {
    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        applicationId: data.applicationId,
        link: data.link,
      }),
    );

    return this.notificationRepository.save(notifications);
  }

  async findByUser(userId: string, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async delete(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
    return { message: 'Notification deleted' };
  }

  // Helper methods for common notification types
  async notifyApplicationSubmitted(userId: string, applicationNumber: string) {
    return this.create({
      userId,
      title: 'Başvuru Alındı',
      message: `${applicationNumber} numaralı başvurunuz başarıyla alınmıştır.`,
      type: 'SUCCESS',
      link: '/student/applications',
    });
  }

  async notifyApplicationStatusChange(
    userId: string,
    applicationNumber: string,
    newStatus: string,
    details?: string,
  ) {
    const statusMessages: Record<string, string> = {
      OIDB_REVIEW: 'Başvurunuz ÖİDB tarafından inceleniyor.',
      FACULTY_ROUTING: `Başvurunuz ${details || 'fakülteye'} yönlendirildi.`,
      DEPARTMENT_ROUTING: `Başvurunuz ${details || 'bölüme'} yönlendirildi.`,
      YGK_EVALUATION: 'Başvurunuz YGK tarafından değerlendiriliyor.',
      RANKED: 'Başvurunuz sıralamaya alındı.',
      APPROVED: 'Başvurunuz onaylandı! Tebrikler!',
      REJECTED: details ? `Başvurunuz reddedildi. Sebep: ${details}` : 'Başvurunuz reddedildi.',
      WAITLISTED: 'Başvurunuz yedek listeye alındı.',
    };

    return this.create({
      userId,
      title: 'Başvuru Durumu Güncellendi',
      message: `${applicationNumber}: ${statusMessages[newStatus] || 'Durum güncellendi.'}`,
      type: newStatus === 'APPROVED' ? 'SUCCESS' : newStatus === 'REJECTED' ? 'ERROR' : 'INFO',
      link: '/student/applications',
    });
  }

  async notifyResultsPublished(userIds: string[], department: string) {
    return this.createBulk(userIds, {
      title: 'Sonuçlar Yayınlandı',
      message: `${department} bölümü yatay geçiş sonuçları yayınlandı.`,
      type: 'INFO',
      link: '/results',
    });
  }

  // Document fetch notifications
  async notifyDocumentFetched(
    userId: string,
    source: string,
    documentType: string,
    isValid: boolean,
  ) {
    const sourceNames: Record<string, string> = {
      UBYS: 'UBYS',
      OSYM: 'ÖSYM',
      YOKSIS: 'YÖKSİS',
      EDEVLET: 'e-Devlet',
    };

    const documentNames: Record<string, string> = {
      TRANSCRIPT: 'Transkript',
      OSYM_RESULT: 'ÖSYM Sonuç Belgesi',
      ENGLISH_PROFICIENCY: 'İngilizce Yeterlilik Belgesi',
      IDENTITY: 'Kimlik Bilgisi',
    };

    const sourceName = sourceNames[source] || source;
    const docName = documentNames[documentType] || documentType;

    return this.create({
      userId,
      title: `${docName} Getirildi`,
      message: `${sourceName} üzerinden ${docName.toLowerCase()} başarıyla getirildi.${!isValid ? ' (Doğrulama başarısız)' : ''}`,
      type: isValid ? 'SUCCESS' : 'WARNING',
      link: '/student/new-application',
    });
  }

  async notifyAllDocumentsFetched(
    userId: string,
    successCount: number,
    totalCount: number,
  ) {
    const allSuccess = successCount === totalCount;

    return this.create({
      userId,
      title: 'Belgeler Getirildi',
      message: `${totalCount} belgeden ${successCount} tanesi başarıyla getirildi.${!allSuccess ? ' Bazı belgelerde sorun oluştu.' : ''}`,
      type: allSuccess ? 'SUCCESS' : 'WARNING',
      link: '/student/new-application',
    });
  }

  // Faculty Board Decision notifications
  async notifyFacultyBoardDecision(
    userId: string,
    applicationNumber: string,
    decision: string,
    meetingNumber?: string,
    notes?: string,
  ) {
    const decisionMessages: Record<string, { title: string; message: string; type: string }> = {
      APPROVED: {
        title: 'Fakülte Kurulu Kararı - Kabul',
        message: `${applicationNumber} numaralı başvurunuz Fakülte Kurulu${meetingNumber ? ` (${meetingNumber})` : ''} tarafından onaylandı. Tebrikler!`,
        type: 'SUCCESS',
      },
      REJECTED: {
        title: 'Fakülte Kurulu Kararı - Red',
        message: `${applicationNumber} numaralı başvurunuz Fakülte Kurulu tarafından reddedildi.${notes ? ` Sebep: ${notes}` : ''}`,
        type: 'ERROR',
      },
      CONDITIONAL: {
        title: 'Fakülte Kurulu Kararı - Şartlı Kabul',
        message: `${applicationNumber} numaralı başvurunuz Fakülte Kurulu tarafından şartlı olarak kabul edildi.${notes ? ` Koşullar: ${notes}` : ''}`,
        type: 'WARNING',
      },
    };

    const notification = decisionMessages[decision] || {
      title: 'Fakülte Kurulu Kararı',
      message: `${applicationNumber} numaralı başvurunuz hakkında Fakülte Kurulu kararı verildi.`,
      type: 'INFO',
    };

    return this.create({
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: '/student/applications',
    });
  }

  // Intibak (Course Equivalence) notifications
  async notifyIntibakCreated(userId: string, applicationNumber: string) {
    return this.create({
      userId,
      title: 'İntibak Tablosu Oluşturuldu',
      message: `${applicationNumber} numaralı başvurunuz için ders denklik (intibak) tablosu oluşturuldu.`,
      type: 'INFO',
      link: '/student/intibak',
    });
  }

  async notifyIntibakApproved(userId: string, applicationNumber: string) {
    return this.create({
      userId,
      title: 'İntibak Tablosu Onaylandı',
      message: `${applicationNumber} numaralı başvurunuzun ders denklik tablosu onaylandı.`,
      type: 'SUCCESS',
      link: '/student/intibak',
    });
  }

  // Registration notifications
  async notifyRegistrationOpen(
    userId: string,
    applicationNumber: string,
    startDate: Date,
    endDate: Date,
  ) {
    const formatDate = (date: Date) =>
      date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    return this.create({
      userId,
      title: 'Kayıt Dönemi Başladı',
      message: `${applicationNumber} numaralı başvurunuz için kayıt dönemi başlamıştır. Kayıt tarihleri: ${formatDate(startDate)} - ${formatDate(endDate)}`,
      type: 'INFO',
      link: '/registration',
    });
  }

  // Reminder notifications
  async notifyDeadlineReminder(
    userId: string,
    deadlineType: string,
    deadlineDate: Date,
    daysRemaining: number,
  ) {
    const formatDate = (date: Date) =>
      date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    const deadlineNames: Record<string, string> = {
      APPLICATION: 'Başvuru',
      DOCUMENT_UPLOAD: 'Belge Yükleme',
      REGISTRATION: 'Kayıt',
    };

    const deadlineName = deadlineNames[deadlineType] || 'Son Tarih';

    return this.create({
      userId,
      title: `${deadlineName} Son Tarihi Yaklaşıyor`,
      message: `${deadlineName} için son tarih ${formatDate(deadlineDate)} (${daysRemaining} gün kaldı).`,
      type: 'WARNING',
      link: '/student/applications',
    });
  }

  // OIDB Staff notifications
  async notifyNewApplicationForReview(staffUserIds: string[], applicationNumber: string, department: string) {
    return this.createBulk(staffUserIds, {
      title: 'Yeni Başvuru İnceleme Bekliyor',
      message: `${applicationNumber} numaralı başvuru (${department}) inceleme bekliyor.`,
      type: 'INFO',
      link: '/oidb/applications',
    });
  }

  // YGK notifications
  async notifyNewApplicationForEvaluation(ygkUserIds: string[], applicationNumber: string, department: string) {
    return this.createBulk(ygkUserIds, {
      title: 'Yeni Başvuru Değerlendirme Bekliyor',
      message: `${applicationNumber} numaralı başvuru (${department}) YGK değerlendirmesi bekliyor.`,
      type: 'INFO',
      link: '/ygk/evaluations',
    });
  }

  /**
   * YGK Sıralama Sonucu Bildirimi
   * Tüm başvuru sahiplerine sıralama sonucunu bildirir
   */
  async notifyRankingResult(
    userId: string,
    applicationNumber: string,
    department: string,
    result: {
      rank?: number;
      totalApplicants: number;
      quota: number;
      status: 'PRIMARY' | 'WAITLISTED' | 'NOT_ELIGIBLE';
      score?: number;
      reason?: string;
    },
  ) {
    let title: string;
    let message: string;
    let type: string;

    switch (result.status) {
      case 'PRIMARY':
        title = 'Sıralama Sonucu - Asil Liste';
        message = `${applicationNumber} numaralı başvurunuz ${department} bölümü sıralamasında ${result.rank}. sırada yer almaktadır. Toplam ${result.totalApplicants} başvuru arasından ${result.quota} kişilik kontenjan için ASİL LİSTEDE bulunmaktasınız. Puanınız: ${result.score?.toFixed(2)}`;
        type = 'SUCCESS';
        break;
      case 'WAITLISTED':
        title = 'Sıralama Sonucu - Yedek Liste';
        message = `${applicationNumber} numaralı başvurunuz ${department} bölümü sıralamasında ${result.rank}. sırada yer almaktadır. Toplam ${result.totalApplicants} başvuru arasından ${result.quota} kişilik kontenjan için YEDEK LİSTEDE bulunmaktasınız. Yedek sıranız: ${result.rank! - result.quota}. Puanınız: ${result.score?.toFixed(2)}`;
        type = 'WARNING';
        break;
      case 'NOT_ELIGIBLE':
        title = 'Sıralama Sonucu - Değerlendirme Dışı';
        message = `${applicationNumber} numaralı başvurunuz ${department} bölümü değerlendirmesinde uygunluk kriterlerini karşılamadığı için sıralamaya dahil edilememiştir.${result.reason ? ` Sebep: ${result.reason}` : ''}`;
        type = 'ERROR';
        break;
    }

    return this.create({
      userId,
      title,
      message,
      type,
      link: '/student/applications',
    });
  }

  /**
   * Toplu Sıralama Sonucu Bildirimi
   */
  async notifyRankingResultsBulk(
    results: Array<{
      userId: string;
      applicationNumber: string;
      department: string;
      result: {
        rank?: number;
        totalApplicants: number;
        quota: number;
        status: 'PRIMARY' | 'WAITLISTED' | 'NOT_ELIGIBLE';
        score?: number;
        reason?: string;
      };
    }>,
  ) {
    const notifications: Notification[] = [];
    for (const item of results) {
      const notification = await this.notifyRankingResult(
        item.userId,
        item.applicationNumber,
        item.department,
        item.result,
      );
      notifications.push(notification);
    }
    return notifications;
  }

  // Faculty Staff notifications
  async notifyDecisionsSentToOidb(facultyUserIds: string[], count: number, period: string) {
    return this.createBulk(facultyUserIds, {
      title: 'Kararlar ÖİDB\'ye Gönderildi',
      message: `${count} adet Fakülte Kurulu kararı ${period} dönemi için ÖİDB'ye iletildi.`,
      type: 'SUCCESS',
      link: '/faculty/board-decisions',
    });
  }
}
