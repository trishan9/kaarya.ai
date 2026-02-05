import deepResolvePromises from 'src/utils/deep-resolver';

describe('deepResolvePromises', () => {
  it('should resolve nested promises in arrays and objects', async () => {
    const date = new Date('2020-01-01T00:00:00.000Z');

    class Custom {
      constructor(private value: string) {}
      toJSON() {
        return { value: Promise.resolve(this.value) };
      }
    }

    const input = {
      a: Promise.resolve(1),
      b: [Promise.resolve(2), { c: Promise.resolve(3) }],
      d: date,
      e: new Custom('done'),
    };

    const result = await deepResolvePromises(input);

    expect(result).toEqual({
      a: 1,
      b: [2, { c: 3 }],
      d: date,
      e: { value: 'done' },
    });
    expect(result.d).toBe(date);
  });
});
