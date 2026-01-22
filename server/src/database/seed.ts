import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  User,
  Student,
  Staff,
  Application,
  Document,
  Evaluation,
  Ranking,
  Notification,
  AuditLog,
  Course,
  IntibakTable,
  CourseEquivalence,
} from '../entities';
import { UserRole } from '../common/enums';

const DEFAULT_PASSWORD = '123456';

interface SeedUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  faculty?: string;
  department?: string;
  title?: string;
}

const seedUsers: SeedUser[] = [
  // Admin
  {
    email: 'admin@iyte.edu.tr',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    department: 'Bilgi İşlem',
    title: 'Sistem Yöneticisi',
  },
  // Student
  {
    email: 'ali.veli@metu.edu.tr',
    firstName: 'Ali',
    lastName: 'Veli',
    role: UserRole.STUDENT,
  },
  // OIDB Staff
  {
    email: 'oidb@iyte.edu.tr',
    firstName: 'Mehmet',
    lastName: 'Yılmaz',
    role: UserRole.OIDB_STAFF,
    department: 'Öğrenci İşleri Daire Başkanlığı',
    title: 'Uzman',
  },
  // Faculty Staff - Mühendislik Fakültesi
  {
    email: 'muhendislik@iyte.edu.tr',
    firstName: 'Ayşe',
    lastName: 'Demir',
    role: UserRole.FACULTY_STAFF,
    faculty: 'Mühendislik Fakültesi',
    department: 'Dekanlık',
    title: 'Fakülte Sekreteri',
  },
  // Faculty Staff - Mimarlık Fakültesi
  {
    email: 'mimarlik@iyte.edu.tr',
    firstName: 'Zeynep',
    lastName: 'Arslan',
    role: UserRole.FACULTY_STAFF,
    faculty: 'Mimarlık Fakültesi',
    department: 'Dekanlık',
    title: 'Fakülte Sekreteri',
  },
  // Faculty Staff - Fen Fakültesi
  {
    email: 'fen@iyte.edu.tr',
    firstName: 'Hakan',
    lastName: 'Özdemir',
    role: UserRole.FACULTY_STAFF,
    faculty: 'Fen Fakültesi',
    department: 'Dekanlık',
    title: 'Fakülte Sekreteri',
  },
  // YGK Member - Bilgisayar Mühendisliği
  {
    email: 'ygk@iyte.edu.tr',
    firstName: 'Fatma',
    lastName: 'Kaya',
    role: UserRole.YGK_MEMBER,
    faculty: 'Mühendislik Fakültesi',
    department: 'Bilgisayar Mühendisliği',
    title: 'YGK Üyesi',
  },
];

async function seed() {
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
      Notification,
      AuditLog,
      Course,
      IntibakTable,
      CourseEquivalence,
    ],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database connection established');

  const userRepository = dataSource.getRepository(User);
  const studentRepository = dataSource.getRepository(Student);
  const staffRepository = dataSource.getRepository(Staff);

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const seedUser of seedUsers) {
    const existingUser = await userRepository.findOne({
      where: { email: seedUser.email },
    });

    if (existingUser) {
      console.log(`User ${seedUser.email} already exists, skipping...`);
      continue;
    }

    const user = userRepository.create({
      email: seedUser.email,
      password: hashedPassword,
      firstName: seedUser.firstName,
      lastName: seedUser.lastName,
      role: seedUser.role,
      isActive: true,
    });

    const savedUser = await userRepository.save(user);
    console.log(`Created user: ${seedUser.email} (${seedUser.role})`);

    // Create associated profile based on role
    if (savedUser.role === UserRole.STUDENT) {
      const student = studentRepository.create({
        userId: savedUser.id,
        currentUniversity: 'Orta Doğu Teknik Üniversitesi',
        currentDepartment: 'Bilgisayar Mühendisliği',
        currentFaculty: 'Mühendislik Fakültesi',
        gpa: 3.50,
      });
      await studentRepository.save(student);
      console.log(`  -> Created student profile`);
    } else {
      const staff = staffRepository.create({
        userId: savedUser.id,
        department: seedUser.department,
        faculty: seedUser.faculty,
        title: seedUser.title,
      });
      await staffRepository.save(staff);
      console.log(`  -> Created staff profile (${seedUser.faculty || 'N/A'})`);
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('\nTest credentials:');
  console.log('─'.repeat(70));
  console.log('Role'.padEnd(15) + ' | ' + 'Email'.padEnd(30) + ' | Password');
  console.log('─'.repeat(70));
  for (const user of seedUsers) {
    const facultyInfo = user.faculty ? ` (${user.faculty})` : '';
    console.log(`${user.role.padEnd(15)} | ${user.email.padEnd(30)} | ${DEFAULT_PASSWORD}${facultyInfo}`);
  }
  console.log('─'.repeat(70));

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
