
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const getClasses = async (): Promise<Class[]> => {
  try {
    // Get all active classes
    const results = await db.select()
      .from(classesTable)
      .where(eq(classesTable.is_active, true))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(classItem => ({
      ...classItem,
      monthly_fee: parseFloat(classItem.monthly_fee) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};
