import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  User,
  Student,
  Staff,
  Application,
  Document,
  Evaluation,
  Ranking,
  ProgramBaseScore,
  Quota,
  IntibakTable,
  Course,
  CourseEquivalence,
  Notification,
  AuditLog,
  DepartmentRequirement,
  FacultyBoardDecision,
} from '../../entities';
import { UserRole, ApplicationStatus } from '../../common/enums';

const DEFAULT_PASSWORD = '123456';

/**
 * GPA'yı 100'lük sisteme dönüştür (YÖK tablosu)
 */
function convertGpaTo100Scale(gpa: number): number {
  if (gpa >= 4.0) return 100;
  if (gpa >= 3.5) return 85 + (gpa - 3.5) * 30;
  if (gpa >= 3.0) return 70 + (gpa - 3.0) * 30;
  if (gpa >= 2.5) return 60 + (gpa - 2.5) * 20;
  if (gpa >= 2.0) return 50 + (gpa - 2.0) * 20;
  return 0;
}

/**
 * Mevcut başvuru dönemini hesapla
 * (applications.service.ts ile aynı mantık)
 */
function getCurrentApplicationPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-indexed
  // Güz dönemi: Ağustos-Ocak, Bahar dönemi: Şubat-Temmuz
  const semester = month >= 8 || month <= 1 ? 'Güz' : 'Bahar';
  const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  return `${academicYear}-${semester}`;
}

/**
 * Yatay geçiş puanı hesapla (Yönerge MADDE 9-4)
 */
function calculateTransferScore(osymScore: number, baseScore: number, gpa100: number): number {
  const osymComponent = (osymScore / baseScore) * 100 * 0.9;
  const gpaComponent = gpa100 * 0.1;
  return Number((osymComponent + gpaComponent).toFixed(4));
}

// Mock öğrenci verileri - farklı üniversitelerden
const mockStudents = [
  {
    email: 'ayse.yilmaz@itu.edu.tr',
    firstName: 'Ayşe',
    lastName: 'Yılmaz',
    university: 'İstanbul Teknik Üniversitesi',
    gpa: 3.65,
    osymScore: 420.5,
    osymRank: 45000,
    osymYear: 2022,
  },
  {
    email: 'mehmet.kaya@boun.edu.tr',
    firstName: 'Mehmet',
    lastName: 'Kaya',
    university: 'Boğaziçi Üniversitesi',
    gpa: 3.45,
    osymScore: 405.2,
    osymRank: 62000,
    osymYear: 2022,
  },
  {
    email: 'zeynep.demir@hacettepe.edu.tr',
    firstName: 'Zeynep',
    lastName: 'Demir',
    university: 'Hacettepe Üniversitesi',
    gpa: 3.80,
    osymScore: 435.8,
    osymRank: 35000,
    osymYear: 2023,
  },
  {
    email: 'can.ozturk@ankara.edu.tr',
    firstName: 'Can',
    lastName: 'Öztürk',
    university: 'Ankara Üniversitesi',
    gpa: 3.25,
    osymScore: 385.0,
    osymRank: 85000,
    osymYear: 2022,
  },
  {
    email: 'elif.sahin@metu.edu.tr',
    firstName: 'Elif',
    lastName: 'Şahin',
    university: 'Orta Doğu Teknik Üniversitesi',
    gpa: 3.55,
    osymScore: 412.3,
    osymRank: 52000,
    osymYear: 2023,
  },
  {
    email: 'burak.celik@yildiz.edu.tr',
    firstName: 'Burak',
    lastName: 'Çelik',
    university: 'Yıldız Teknik Üniversitesi',
    gpa: 3.35,
    osymScore: 395.7,
    osymRank: 72000,
    osymYear: 2022,
  },
];

async function seedMockEvaluatedApplications() {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: process.env.DATABASE_PATH || './data/utms.db',
    entities: [
      User,
      Student,
      Staff,
      Application,
      Document,
      Evaluation,
      Ranking,
      ProgramBaseScore,
      Quota,
      IntibakTable,
      Course,
      CourseEquivalence,
      Notification,
      AuditLog,
      DepartmentRequirement,
      FacultyBoardDecision,
    ],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database bağlantısı kuruldu');

  const userRepository = dataSource.getRepository(User);
  const studentRepository = dataSource.getRepository(Student);
  const staffRepository = dataSource.getRepository(Staff);
  const applicationRepository = dataSource.getRepository(Application);
  const documentRepository = dataSource.getRepository(Document);
  const evaluationRepository = dataSource.getRepository(Evaluation);
  const rankingRepository = dataSource.getRepository(Ranking);
  const intibakRepository = dataSource.getRepository(IntibakTable);
  const notificationRepository = dataSource.getRepository(Notification);
  const baseScoreRepository = dataSource.getRepository(ProgramBaseScore);

  // ═══════════════════════════════════════════════════════════════════
  // TÜM ESKİ VERİLERİ SİL (Sıfırdan başlamak için)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🧹 Tüm eski veriler temizleniyor...');

  // 1. Tüm sıralamaları sil
  const deletedRankings = await rankingRepository
    .createQueryBuilder()
    .delete()
    .from(Ranking)
    .execute();
  console.log(`  ✓ Tüm sıralamalar silindi (${deletedRankings.affected || 0} kayıt)`);

  // 2. Tüm değerlendirmeleri sil
  const deletedEvaluations = await evaluationRepository
    .createQueryBuilder()
    .delete()
    .from(Evaluation)
    .execute();
  console.log(`  ✓ Tüm değerlendirmeler silindi (${deletedEvaluations.affected || 0} kayıt)`);

  // 3. Tüm belgeleri sil
  const deletedDocuments = await documentRepository
    .createQueryBuilder()
    .delete()
    .from(Document)
    .execute();
  console.log(`  ✓ Tüm belgeler silindi (${deletedDocuments.affected || 0} kayıt)`);

  // 4. Tüm intibak tablolarını sil
  const deletedIntibak = await intibakRepository
    .createQueryBuilder()
    .delete()
    .from(IntibakTable)
    .execute();
  console.log(`  ✓ Tüm intibak tabloları silindi (${deletedIntibak.affected || 0} kayıt)`);

  // 5. Tüm başvuruları sil
  const deletedApplications = await applicationRepository
    .createQueryBuilder()
    .delete()
    .from(Application)
    .execute();
  console.log(`  ✓ Tüm başvurular silindi (${deletedApplications.affected || 0} kayıt)`);

  // 6. Öğrenci bildirimlerini sil
  const deletedNotifications = await notificationRepository
    .createQueryBuilder()
    .delete()
    .from(Notification)
    .execute();
  console.log(`  ✓ Tüm bildirimler silindi (${deletedNotifications.affected || 0} kayıt)`);

  // 7. Öğrenci rolündeki kullanıcıları ve profillerini sil
  // (admin, oidb, faculty, ygk ve ali.veli@metu.edu.tr korunur)
  const protectedEmails = ['ali.veli@metu.edu.tr'];
  const studentUsers = await userRepository.find({
    where: { role: UserRole.STUDENT },
  });

  // Korunan kullanıcıları filtrele
  const studentsToDelete = studentUsers.filter(u => !protectedEmails.includes(u.email));
  const studentUserIds = studentsToDelete.map(u => u.id);

  if (studentUserIds.length > 0) {
    // Öğrenci profillerini sil
    await studentRepository
      .createQueryBuilder()
      .delete()
      .from(Student)
      .where('userId IN (:...userIds)', { userIds: studentUserIds })
      .execute();
    console.log(`  ✓ Öğrenci profilleri silindi (${studentUserIds.length} kayıt)`);

    // Öğrenci kullanıcılarını sil
    await userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('id IN (:...userIds)', { userIds: studentUserIds })
      .execute();
    console.log(`  ✓ Öğrenci kullanıcıları silindi (${studentUserIds.length} kayıt)`);
  }

  console.log(`  ℹ Korunan kullanıcılar: ${protectedEmails.join(', ')}`)

  console.log('✅ Temizlik tamamlandı\n');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // YGK üyesini bul
  const ygkStaff = await staffRepository.findOne({
    where: { department: 'Bilgisayar Mühendisliği' },
  });

  if (!ygkStaff) {
    console.error('YGK üyesi bulunamadı! Önce ana seed çalıştırın.');
    await dataSource.destroy();
    return;
  }

  // Program taban puanını bul
  const baseScore = await baseScoreRepository.findOne({
    where: {
      department: 'Bilgisayar Mühendisliği',
      faculty: 'Mühendislik Fakültesi',
      year: 2022,
      isActive: true,
    },
  });

  if (!baseScore) {
    console.error('Program taban puanı bulunamadı!');
    await dataSource.destroy();
    return;
  }

  console.log(`\nTaban puan: ${baseScore.baseScore} (${baseScore.year})`);

  // Mevcut başvuru dönemini hesapla
  const applicationPeriod = getCurrentApplicationPeriod();
  console.log(`Başvuru dönemi: ${applicationPeriod}`);
  console.log('\nMock başvurular oluşturuluyor...\n');

  let applicationNumber = 1000;

  for (const studentData of mockStudents) {
    // Kullanıcı oluştur
    const user = userRepository.create({
      email: studentData.email,
      password: hashedPassword,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      role: UserRole.STUDENT,
      isActive: true,
    });
    const savedUser = await userRepository.save(user);

    // Öğrenci profili oluştur
    const student = studentRepository.create({
      userId: savedUser.id,
      currentUniversity: studentData.university,
      currentDepartment: 'Bilgisayar Mühendisliği',
      currentFaculty: 'Mühendislik Fakültesi',
      gpa: studentData.gpa,
    });
    const savedStudent = await studentRepository.save(student);

    // Başvuru oluştur
    applicationNumber++;
    const application = applicationRepository.create({
      applicationNumber: `YG-2026-${applicationNumber}`,
      studentId: savedStudent.id,
      applicationPeriod: applicationPeriod,
      targetFaculty: 'Mühendislik Fakültesi',
      targetDepartment: 'Bilgisayar Mühendisliği',
      status: ApplicationStatus.YGK_EVALUATION,
      declaredGpa: studentData.gpa,
      declaredOsymScore: studentData.osymScore,
      declaredOsymRank: studentData.osymRank,
      declaredOsymYear: studentData.osymYear,
      submittedAt: new Date(),
      reviewedAt: new Date(),
      routedToFacultyAt: new Date(),
      routedToDepartmentAt: new Date(),
    });

    const savedApplication = await applicationRepository.save(application);

    // Değerlendirme için hazır başvuru - tamamlanmamış değerlendirme oluşturma
    // Kullanıcı manuel olarak YGK panelinden değerlendirebilir
    const gpa100 = convertGpaTo100Scale(studentData.gpa);
    const estimatedScore = calculateTransferScore(
      studentData.osymScore,
      baseScore.baseScore,
      gpa100,
    );

    console.log(
      `✓ ${studentData.firstName} ${studentData.lastName} (${studentData.university})`,
    );
    console.log(
      `  GPA: ${studentData.gpa} (${gpa100.toFixed(1)}/100) | ÖSYM: ${studentData.osymScore} | Sıra: ${studentData.osymRank}`,
    );
    console.log(`  → Tahmini Yatay Geçiş Puanı: ${estimatedScore.toFixed(2)}`);
    console.log('  ⏳ Değerlendirme bekleniyor (YGK panelinden yapılacak)');
    console.log('');
  }

  // Özet bilgi
  const totalApps = await applicationRepository.count({
    where: {
      targetDepartment: 'Bilgisayar Mühendisliği',
      status: ApplicationStatus.YGK_EVALUATION,
    },
  });

  const pendingEvaluations = await applicationRepository.count({
    where: {
      status: ApplicationStatus.YGK_EVALUATION,
    },
  });

  console.log('═'.repeat(60));
  console.log('ÖZET');
  console.log('═'.repeat(60));
  console.log(`Toplam Başvuru (YGK_EVALUATION): ${totalApps}`);
  console.log(`Değerlendirme Bekleyen: ${pendingEvaluations}`);
  console.log('');
  console.log('📋 SIRADAKI ADIMLAR:');
  console.log('1. YGK panelinden (/ygk/evaluate) başvuruları değerlendirin');
  console.log('2. Değerlendirme sonrası "Sıralama Oluştur" ile sıralama yapın');
  console.log('3. OIDB panelinden (/oidb/announcements) duyuru yayınlayın');
  console.log('═'.repeat(60));

  await dataSource.destroy();
}

seedMockEvaluatedApplications().catch((error) => {
  console.error('Seed başarısız:', error);
  process.exit(1);
});
