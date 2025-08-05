
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { getClasses } from '../handlers/get_classes';

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no classes exist', async () => {
    const result = await getClasses();
    expect(result).toEqual([]);
  });

  it('should return all active classes', async () => {
    // Create test classes
    await db.insert(classesTable)
      .values([
        {
          name: 'Class A',
          description: 'First class',
          monthly_fee: '100.50',
          is_active: true
        },
        {
          name: 'Class B',
          description: 'Second class',
          monthly_fee: '200.75',
          is_active: true
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(2);
    
    // Verify first class
    const classA = result.find(c => c.name === 'Class A');
    expect(classA).toBeDefined();
    expect(classA!.description).toEqual('First class');
    expect(classA!.monthly_fee).toEqual(100.50);
    expect(typeof classA!.monthly_fee).toBe('number');
    expect(classA!.is_active).toBe(true);
    expect(classA!.id).toBeDefined();
    expect(classA!.created_at).toBeInstanceOf(Date);
    expect(classA!.updated_at).toBeInstanceOf(Date);

    // Verify second class
    const classB = result.find(c => c.name === 'Class B');
    expect(classB).toBeDefined();
    expect(classB!.description).toEqual('Second class');
    expect(classB!.monthly_fee).toEqual(200.75);
    expect(typeof classB!.monthly_fee).toBe('number');
    expect(classB!.is_active).toBe(true);
  });

  it('should exclude inactive classes', async () => {
    // Create both active and inactive classes
    await db.insert(classesTable)
      .values([
        {
          name: 'Active Class',
          description: 'This class is active',
          monthly_fee: '100.00',
          is_active: true
        },
        {
          name: 'Inactive Class',
          description: 'This class is inactive',
          monthly_fee: '150.00',
          is_active: false
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Class');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle classes with null description', async () => {
    // Create class with null description
    await db.insert(classesTable)
      .values({
        name: 'No Description Class',
        description: null,
        monthly_fee: '75.25',
        is_active: true
      })
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('No Description Class');
    expect(result[0].description).toBeNull();
    expect(result[0].monthly_fee).toEqual(75.25);
    expect(typeof result[0].monthly_fee).toBe('number');
  });
});
