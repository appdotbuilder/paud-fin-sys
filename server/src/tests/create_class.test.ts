
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateClassInput = {
  name: 'Test Class',
  description: 'A class for testing',
  monthly_fee: 299.99,
  is_active: true
};

// Test input with minimal fields
const minimalInput: CreateClassInput = {
  name: 'Minimal Class',
  monthly_fee: 150.00
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class with all fields', async () => {
    const result = await createClass(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Class');
    expect(result.description).toEqual('A class for testing');
    expect(result.monthly_fee).toEqual(299.99);
    expect(typeof result.monthly_fee).toBe('number');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a class with minimal fields and apply defaults', async () => {
    const result = await createClass(minimalInput);

    expect(result.name).toEqual('Minimal Class');
    expect(result.description).toBeNull();
    expect(result.monthly_fee).toEqual(150.00);
    expect(typeof result.monthly_fee).toBe('number');
    expect(result.is_active).toEqual(true); // Default should be applied
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    const result = await createClass(testInput);

    // Query using proper drizzle syntax
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Test Class');
    expect(classes[0].description).toEqual('A class for testing');
    expect(parseFloat(classes[0].monthly_fee)).toEqual(299.99);
    expect(classes[0].is_active).toEqual(true);
    expect(classes[0].created_at).toBeInstanceOf(Date);
    expect(classes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const inputWithNullDescription: CreateClassInput = {
      name: 'Class with null description',
      description: null,
      monthly_fee: 200.00,
      is_active: false
    };

    const result = await createClass(inputWithNullDescription);

    expect(result.name).toEqual('Class with null description');
    expect(result.description).toBeNull();
    expect(result.monthly_fee).toEqual(200.00);
    expect(result.is_active).toEqual(false);

    // Verify in database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes[0].description).toBeNull();
    expect(classes[0].is_active).toEqual(false);
  });

  it('should handle decimal amounts correctly', async () => {
    const inputWithDecimal: CreateClassInput = {
      name: 'Decimal Test Class',
      monthly_fee: 123.45
    };

    const result = await createClass(inputWithDecimal);

    expect(result.monthly_fee).toEqual(123.45);
    expect(typeof result.monthly_fee).toBe('number');

    // Verify precision is maintained in database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(parseFloat(classes[0].monthly_fee)).toEqual(123.45);
  });
});
