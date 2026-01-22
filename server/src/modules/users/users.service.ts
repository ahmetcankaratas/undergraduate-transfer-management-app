import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Student, Staff } from '../../entities';
import { UserRole } from '../../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {}

  async findAll(role?: UserRole) {
    const where = role ? { role } : {};
    return this.userRepository.find({
      where,
      relations: ['student', 'staff'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['student', 'staff'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async updateStudent(userId: string, updateData: Partial<Student>) {
    const student = await this.studentRepository.findOne({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    Object.assign(student, updateData);
    return this.studentRepository.save(student);
  }

  async updateStaff(userId: string, updateData: Partial<Staff>) {
    const staff = await this.staffRepository.findOne({
      where: { userId },
    });

    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    Object.assign(staff, updateData);
    return this.staffRepository.save(staff);
  }

  async deactivate(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    return this.userRepository.save(user);
  }

  async activate(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    return this.userRepository.save(user);
  }
}
