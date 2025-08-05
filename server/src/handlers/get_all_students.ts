
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type Student } from '../schema';

export const getAllStudents = async (): Promise<Student[]> => {
  try {
    const results = await db.select()
      .from(studentsTable)
      .execute();

    // Convert date fields and return
    return results.map(student => ({
      ...student,
      date_of_birth: new Date(student.date_of_birth),
      enrollment_date: new Date(student.enrollment_date),
      created_at: new Date(student.created_at),
      updated_at: new Date(student.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch all students:', error);
    throw error;
  }
};
