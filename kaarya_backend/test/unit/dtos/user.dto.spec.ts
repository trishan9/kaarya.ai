import { CreateUserDTO, LoginDTO, UpdateMeDTO } from 'src/dtos/users/user.dto';

const baseUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123',
  confirmPassword: 'Password123',
};

describe('User DTOs', () => {
  it('should validate create user payloads', () => {
    const result = CreateUserDTO.safeParse(baseUser);

    expect(result.success).toBe(true);
  });

  it('should reject mismatched passwords', () => {
    const result = CreateUserDTO.safeParse({
      ...baseUser,
      confirmPassword: 'Mismatch',
    });

    expect(result.success).toBe(false);
  });

  it('should validate login payloads', () => {
    const result = LoginDTO.safeParse({
      email: 'test@example.com',
      password: 'Password123',
    });

    expect(result.success).toBe(true);
  });

  it('should allow partial update payloads', () => {
    const result = UpdateMeDTO.safeParse({ name: 'New' });

    expect(result.success).toBe(true);
  });

  it('should parse candidate profile payload from JSON string', () => {
    const result = UpdateMeDTO.safeParse({
      candidateProfile: JSON.stringify({
        headline: 'Frontend Developer',
        skills: ['React', 'TypeScript'],
        experience: [
          {
            id: 'exp-1',
            jobTitle: 'Frontend Engineer',
            companyName: 'Acme Inc',
            currentlyWorking: true,
          },
        ],
      }),
    });

    expect(result.success).toBe(true);
    expect(result.data?.candidateProfile?.headline).toBe('Frontend Developer');
    expect(result.data?.candidateProfile?.skills).toEqual([
      expect.objectContaining({
        id: 'migrated-react',
        name: 'React',
        category: 'Technical',
        proficiency: 'intermediate',
      }),
      expect.objectContaining({
        id: 'migrated-typescript',
        name: 'TypeScript',
        category: 'Technical',
        proficiency: 'intermediate',
      }),
    ]);
  });

  it('should treat empty candidate profile string as undefined', () => {
    const result = UpdateMeDTO.safeParse({
      candidateProfile: '   ',
      name: 'Updated Name',
    });

    expect(result.success).toBe(true);
    expect(result.data?.candidateProfile).toBeUndefined();
  });

  it('should fail when candidate profile is invalid JSON text', () => {
    const result = UpdateMeDTO.safeParse({
      candidateProfile: '{"headline":"Missing quote}',
    });

    expect(result.success).toBe(false);
  });

  it('should accept candidate profile when object payload is already parsed', () => {
    const result = UpdateMeDTO.safeParse({
      candidateProfile: {
        headline: 'Backend Engineer',
        skills: [],
        experience: [],
      },
    });

    expect(result.success).toBe(true);
  });
});
