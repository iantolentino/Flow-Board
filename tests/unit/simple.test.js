describe('Simple Tests', () => {
  test('Environment variables are loaded', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('Math works', () => {
    expect(2 + 2).toBe(4);
  });

  test('String operations work', () => {
    const text = 'Hello World';
    expect(text.includes('World')).toBe(true);
  });
});