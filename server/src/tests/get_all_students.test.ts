
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { getAllStudents } from '../handlers/get_all_students';

describe('getAllStudents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no students exist', async () => {
    const result = await getAllStudents();
    expect(result).toEqual([]);
  });

  it('should return all students', async () => {
    // Create parent user
    const [parent] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    // Create class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Grade 1',
        description: 'First grade class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    // Create students
    await db.insert(studentsTable)
      .values([
        {
          student_id: 'STU001',
          full_name: 'John Doe',
          date_of_birth: '2015-05-15',
          parent_id: parent.id,
          class_id: testClass.id,
          enrollment_date: '2023-01-15',
          is_active: true
        },
        {
          student_id: 'STU002',
          full_name: 'Jane Smith',
          date_of_birth: '2016-03-20',
          parent_id: parent.id,
          class_id: testClass.id,
          enrollment_date: '2023-01-15',
          is_active: false
        }
      ])
      .execute();

    const result = await getAllStudents();

    expect(result).toHaveLength(2);
    
    // Check first student
    const john = result.find(s => s.student_id === 'STU001');
    expect(john).toBeDefined();
    expect(john!.full_name).toEqual('John Doe');
    expect(john!.date_of_birth).toEqual(new Date('2015-05-15'));
    expect(john!.enrollment_date).toEqual(new Date('2023-01-15'));
    expect(john!.parent_id).toEqual(parent.id);
    expect(john!.class_id).toEqual(testClass.id);
    expect(john!.is_active).toBe(true);
    expect(john!.created_at).toBeInstanceOf(Date);
    expect(john!.updated_at).toBeInstanceOf(Date);

    // Check second student
    const jane = result.find(s => s.student_id === 'STU002');
    expect(jane).toBeDefined();
    expect(jane!.full_name).toEqual('Jane Smith');
    expect(jane!.date_of_birth).toEqual(new Date('2016-03-20'));
    expect(jane!.is_active).toBe(false);
  });

  it('should return students ordered by creation time', async () => {
    // Create parent user
    const [parent] = await db.insert(usersTable)
      .values({
        email: 'parent@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Parent',
        role: 'parent',
        is_active: true
      })
      .returning()
      .execute();

    // Create class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Grade 1',
        description: 'First grade class',
        monthly_fee: '100.00',
        is_active: true
      })
      .returning()
      .execute();

    // Create first student
    await db.insert(studentsTable)
      .values({
        student_id: 'STU001',
        full_name: 'First Student',
        date_of_birth: '2015-01-01',
        parent_id: parent.id,
        class_id: testClass.id,
        enrollment_date: '2023-01-01',
        is_active: true
      })
      .execute();

    // Small delay to ensure different creation times
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second student
    await db.insert(studentsTable)
      .values({
        student_id: 'STU002',
        full_name: 'Second Student',
        date_of_birth: '2015-01-01',
        parent_id: parent.id,
        class_id: testClass.id,
        enrollment_date: '2023-01-01',
        is_active: true
      })
      .execute();

    const result = await getAllStudents();

    expect(result).toHaveLength(2);
    expect(result[0].full_name).toEqual('First Student');
    expect(result[1].full_name).toEqual('Second Student');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
