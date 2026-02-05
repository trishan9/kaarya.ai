import { IsInt, IsString, Min } from 'class-validator';
import validateConfig from 'src/utils/validate-config';

describe('validateConfig', () => {
  class EnvValidator {
    @IsString()
    NAME: string;

    @IsInt()
    @Min(1)
    COUNT: number;
  }

  it('should return validated config for valid input', () => {
    const result = validateConfig({ NAME: 'ok', COUNT: 2 }, EnvValidator);

    expect(result).toBeInstanceOf(EnvValidator);
    expect(result.NAME).toBe('ok');
    expect(result.COUNT).toBe(2);
  });

  it('should throw when validation fails', () => {
    expect(() =>
      validateConfig({ NAME: 'ok', COUNT: 0 }, EnvValidator),
    ).toThrow();
  });
});
