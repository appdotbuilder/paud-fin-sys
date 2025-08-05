
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const getStudentsByParent = async (parentId: number): Promise<Student[]> => {
  try {
    const results = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.parent_id, parentId))
      .execute();

    return results.map(student => ({
      ...student,
      // Convert string dates to Date objects for date columns
      date_of_birth: new Date(student.date_of_birth),
      enrollment_date: new Date(student.enrollment_date),
      created_at: student.created_at,
      updated_at: student.updated_at
    }));
  } catch (error) {
    console.error('Failed to get students by parent:', error);
    throw error;
  }
};
