
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { type CreateUserInput, type CreateClassInput, type CreateStudentInput } from '../schema';
import { getStudentsByParent } from '../handlers/get_students_by_parent';

// Test data
const testParent: CreateUserInput = {
  email: 'parent@test.com',
  password: 'password123',
  full_name: 'Test Parent',
  role: 'parent',
  is_active: true
};

const testClass: CreateClassInput = {
  name: 'Grade 1A',
  description: 'First grade class A',
  monthly_fee: 150.00,
  is_active: true
};

const testStudent1: CreateStudentInput = {
  student_id: 'STU001',
  full_name: 'Test Student 1',
  date_of_birth: new Date('2015-05-15'),
  parent_id: 0, // Will be set after parent creation
  class_id: 0, // Will be set after class creation
  enrollment_date: new Date('2023-01-15'),
  is_active: true
};

const testStudent2: CreateStudentInput = {
  student_id: 'STU002',
  full_name: 'Test Student 2',
  date_of_birth: new Date('2016-08-20'),
  parent_id: 0, // Will be set after parent creation
  class_id: 0, // Will be set after class creation
  enrollment_date: new Date('2023-02-10'),
  is_active: true
};

describe('getStudentsByParent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return students for a specific parent', async () => {
    // Create parent
    const parentResult = await db.insert(usersTable)
      .values({
        email: testParent.email,
        password_hash: 'hashed_password',
        full_name: testParent.full_name,
        role: testParent.role,
        is_active: testParent.is_active
      })
      .returning()
      .execute();
    const parentId = parentResult[0].id;

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: testClass.name,
        description: testClass.description,
        monthly_fee: testClass.monthly_fee.toString(),
        is_active: testClass.is_active
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create students - insert individually
    await db.insert(studentsTable)
      .values({
        student_id: testStudent1.student_id,
        full_name: testStudent1.full_name,
        date_of_birth: testStudent1.date_of_birth.toISOString().split('T')[0], // Convert to string
        parent_id: parentId,
        class_id: classId,
        enrollment_date: testStudent1.enrollment_date.toISOString().split('T')[0], // Convert to string
        is_active: testStudent1.is_active
      })
      .execute();

    await db.insert(studentsTable)
      .values({
        student_id: testStudent2.student_id,
        full_name: testStudent2.full_name,
        date_of_birth: testStudent2.date_of_birth.toISOString().split('T')[0], // Convert to string
        parent_id: parentId,
        class_id: classId,
        enrollment_date: testStudent2.enrollment_date.toISOString().split('T')[0], // Convert to string
        is_active: testStudent2.is_active
      })
      .execute();

    const result = await getStudentsByParent(parentId);

    expect(result).toHaveLength(2);
    expect(result[0].student_id).toEqual('STU001');
    expect(result[0].full_name).toEqual('Test Student 1');
    expect(result[0].parent_id).toEqual(parentId);
    expect(result[0].class_id).toEqual(classId);
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
    expect(result[0].enrollment_date).toBeInstanceOf(Date);
    expect(result[0].is_active).toBe(true);

    expect(result[1].student_id).toEqual('STU002');
    expect(result[1].full_name).toEqual('Test Student 2');
    expect(result[1].parent_id).toEqual(parentId);
    expect(result[1].class_id).toEqual(classId);
  });

  it('should return empty array for parent with no students', async () => {
    // Create parent without students
    const parentResult = await db.insert(usersTable)
      .values({
        email: testParent.email,
        password_hash: 'hashed_password',
        full_name: testParent.full_name,
        role: testParent.role,
        is_active: testParent.is_active
      })
      .returning()
      .execute();
    const parentId = parentResult[0].id;

    const result = await getStudentsByParent(parentId);

    expect(result).toHaveLength(0);
  });

  it('should only return students for the specified parent', async () => {
    // Create two parents
    const parent1Result = await db.insert(usersTable)
      .values({
        email: 'parent1@test.com',
        password_hash: 'hashed_password',
        full_name: 'Parent 1',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();
    const parent1Id = parent1Result[0].id;

    const parent2Result = await db.insert(usersTable)
      .values({
        email: 'parent2@test.com',
        password_hash: 'hashed_password',
        full_name: 'Parent 2',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();
    const parent2Id = parent2Result[0].id;

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: testClass.name,
        description: testClass.description,
        monthly_fee: testClass.monthly_fee.toString(),
        is_active: testClass.is_active
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create students for both parents
    await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Student of Parent 1',
        date_of_birth: '2015-05-15',
        parent_id: parent1Id,
        class_id: classId,
        enrollment_date: '2023-01-15',
        is_active: true
      })
      .execute();

    await db.insert(studentsTable)
      .values({
        student_id: 'STU002',
        full_name: 'Student of Parent 2',
        date_of_birth: '2016-08-20',
        parent_id: parent2Id,
        class_id: classId,
        enrollment_date: '2023-02-10',
        is_active: true
      })
      .execute();

    const result = await getStudentsByParent(parent1Id);

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toEqual('Student of Parent 1');
    expect(result[0].parent_id).toEqual(parent1Id);
  });

  it('should return both active and inactive students', async () => {
    // Create parent
    const parentResult = await db.insert(usersTable)
      .values({
        email: testParent.email,
        password_hash: 'hashed_password',
        full_name: testParent.full_name,
        role: testParent.role,
        is_active: testParent.is_active
      })
      .returning()
      .execute();
    const parentId = parentResult[0].id;

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: testClass.name,
        description: testClass.description,
        monthly_fee: testClass.monthly_fee.toString(),
        is_active: testClass.is_active
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create active and inactive students
    await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'Active Student',
        date_of_birth: '2015-05-15',
        parent_id: parentId,
        class_id: classId,
        enrollment_date: '2023-01-15',
        is_active: true
      })
      .execute();

    await db.insert(studentsTable)
      .values({
        student_id: 'STU002',
        full_name: 'Inactive Student',
        date_of_birth: '2016-08-20',
        parent_id: parentId,
        class_id: classId,
        enrollment_date: '2023-02-10',
        is_active: false
      })
      .execute();

    const result = await getStudentsByParent(parentId);

    expect(result).toHaveLength(2);
    const activeStudent = result.find(s => s.full_name === 'Active Student');
    const inactiveStudent = result.find(s => s.full_name === 'Inactive Student');
    
    expect(activeStudent?.is_active).toBe(true);
    expect(inactiveStudent?.is_active).toBe(false);
  });
});
