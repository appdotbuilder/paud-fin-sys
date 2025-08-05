
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, usersTable, classesTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { createStudent } from '../handlers/create_student';
import { eq } from 'drizzle-orm';

describe('createStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let parentId: number;
  let classId: number;

  const setupTestData = async () => {
    // Create a parent user
    const parentResult = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    parentId = parentResult[0].id;

    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Grade 1A',
        description: 'First grade class A',
        monthly_fee: '500.00',
        is_active: true
      })
      .returning()
      .execute();

    classId = classResult[0].id;
  };

  const testInput: CreateStudentInput = {
    student_id: 'STU001',
    full_name: 'Test Student',
    date_of_birth: new Date('2015-05-15'),
    parent_id: 0, // Will be set in tests
    class_id: 0, // Will be set in tests
    enrollment_date: new Date('2024-01-15'),
    is_active: true
  };

  it('should create a student successfully', async () => {
    await setupTestData();
    
    const input = {
      ...testInput,
      parent_id: parentId,
      class_id: classId
    };

    const result = await createStudent(input);

    expect(result.student_id).toEqual('STU001');
    expect(result.full_name).toEqual('Test Student');
    expect(result.date_of_birth).toEqual(new Date('2015-05-15'));
    expect(result.parent_id).toEqual(parentId);
    expect(result.class_id).toEqual(classId);
    expect(result.enrollment_date).toEqual(new Date('2024-01-15'));
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save student to database', async () => {
    await setupTestData();
    
    const input = {
      ...testInput,
      parent_id: parentId,
      class_id: classId
    };

    const result = await createStudent(input);

    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].student_id).toEqual('STU001');
    expect(students[0].full_name).toEqual('Test Student');
    expect(students[0].parent_id).toEqual(parentId);
    expect(students[0].class_id).toEqual(classId);
    expect(new Date(students[0].date_of_birth)).toEqual(new Date('2015-05-15'));
    expect(new Date(students[0].enrollment_date)).toEqual(new Date('2024-01-15'));
  });

  it('should use default is_active value when not provided', async () => {
    await setupTestData();
    
    const input = {
      student_id: 'STU002',
      full_name: 'Test Student 2',
      date_of_birth: new Date('2015-03-10'),
      parent_id: parentId,
      class_id: classId,
      enrollment_date: new Date('2024-01-15')
      // is_active not provided
    };

    const result = await createStudent(input);

    expect(result.is_active).toEqual(true);
  });

  it('should throw error when parent does not exist', async () => {
    await setupTestData();
    
    const input = {
      ...testInput,
      parent_id: 9999, // Non-existent parent
      class_id: classId
    };

    await expect(createStudent(input)).rejects.toThrow(/parent not found/i);
  });

  it('should throw error when parent is not a parent role', async () => {
    await setupTestData();
    
    // Create an admin user
    const adminResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Admin',
        role: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      parent_id: adminResult[0].id,
      class_id: classId
    };

    await expect(createStudent(input)).rejects.toThrow(/user is not a parent/i);
  });

  it('should throw error when class does not exist', async () => {
    await setupTestData();
    
    const input = {
      ...testInput,
      parent_id: parentId,
      class_id: 9999 // Non-existent class
    };

    await expect(createStudent(input)).rejects.toThrow(/class not found/i);
  });

  it('should throw error when class is not active', async () => {
    await setupTestData();
    
    // Create an inactive class
    const inactiveClassResult = await db.insert(classesTable)
      .values({
        name: 'Inactive Class',
        description: 'An inactive class',
        monthly_fee: '400.00',
        is_active: false
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      parent_id: parentId,
      class_id: inactiveClassResult[0].id
    };

    await expect(createStudent(input)).rejects.toThrow(/class is not active/i);
  });

  it('should throw error when student_id already exists', async () => {
    await setupTestData();
    
    // Create first student
    const input1 = {
      ...testInput,
      parent_id: parentId,
      class_id: classId
    };

    await createStudent(input1);

    // Try to create second student with same student_id
    const input2 = {
      ...testInput,
      full_name: 'Another Student',
      parent_id: parentId,
      class_id: classId
    };

    await expect(createStudent(input2)).rejects.toThrow(/student id already exists/i);
  });
});
