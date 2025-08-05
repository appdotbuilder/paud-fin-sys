
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    // Insert class record
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        description: input.description || null,
        monthly_fee: input.monthly_fee.toString(), // Convert number to string for numeric column
        is_active: input.is_active ?? true // Apply default if not provided
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const classRecord = result[0];
    return {
      ...classRecord,
      monthly_fee: parseFloat(classRecord.monthly_fee) // Convert string back to number
    };
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};
