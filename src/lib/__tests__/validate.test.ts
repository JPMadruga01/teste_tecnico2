import { inputSchema } from '../validate';

describe('inputSchema', () => {
  test('accepts valid input', () => {
    const valid = {
      subject: 'Matemática',
      topic: 'Frações',
      school_year: '5º ano',
      duration_minutes: 45,
    };

    expect(() => inputSchema.parse(valid)).not.toThrow();
  });

  test('rejects missing required fields', () => {
    const invalid = {
      subject: '',
      topic: '',
    };
    expect(() => inputSchema.parse(invalid as any)).toThrow();
  });
});
