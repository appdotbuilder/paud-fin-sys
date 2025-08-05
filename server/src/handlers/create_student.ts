
import { db } from '../db';
import { studentsTable, usersTable, classesTable } from '../db/schema';
import { type CreateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const createStudent = async (input: CreateStudentInput): Promise<Student> => {
  try {
    // Validate parent exists and has 'parent' role
    const parent = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.parent_id))
      .execute();

    if (parent.length === 0) {
      throw new Error('Parent not found');
    }

    if (parent[0].role !== 'parent') {
      throw new Error('User is not a parent');
    }

    // Validate class exists and is active
    const classRecord = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classRecord.length === 0) {
      throw new Error('Class not found');
    }

    if (!classRecord[0].is_active) {
      throw new Error('Class is not active');
    }

    // Check if student_id is unique
    const existingStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.student_id, input.student_id))
      .execute();

    if (existingStudent.length > 0) {
      throw new Error('Student ID already exists');
    }

    // Create student record - convert Date objects to strings for date columns
    const result = await db.insert(studentsTable)
      .values({
        student_id: input.student_id,
        full_name: input.full_name,
        date_of_birth: input.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        parent_id: input.parent_id,
        class_id: input.class_id,
        enrollment_date: input.enrollment_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        is_active: input.is_active ?? true
      })
      .returning()
      .execute();

    // Convert date strings back to Date objects
    const student = result[0];
    return {
      ...student,
      date_of_birth: new Date(student.date_of_birth),
      enrollment_date: new Date(student.enrollment_date)
    };
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
};
