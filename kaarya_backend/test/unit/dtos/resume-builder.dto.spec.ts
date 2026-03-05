import {
  aiExperienceBulletsDTO,
  aiSuggestionsDTO,
  aiSummaryDTO,
  atsScanBodyDTO,
  createResumeBuilderDTO,
  listResumeBuilderQueryDTO,
  updateResumeBuilderDTO,
} from 'src/dtos/resume-builder/resume-builder.dto';

describe('resume-builder.dto', () => {
  it('should apply create defaults and nullable transforms', () => {
    const parsed = createResumeBuilderDTO.parse({
      targetRole: null,
      content: {
        professionalSummary: null,
        personalInfo: {
          firstName: null,
          lastName: '  Doe  ',
        },
      },
    });

    expect(parsed.title).toBe('Untitled Resume');
    expect(parsed.templateId).toBe('professional');
    expect(parsed.targetRole).toBeNull();
    expect(parsed.content.professionalSummary).toBeNull();
    expect(parsed.content.personalInfo?.firstName).toBe('');
    expect(parsed.content.personalInfo?.lastName).toBe('Doe');
  });

  it('should parse update payload with optional nested sections', () => {
    const parsed = updateResumeBuilderDTO.parse({
      title: ' Senior Resume ',
      content: {
        experience: [
          {
            id: 'exp-1',
            company: ' ACME ',
            position: ' Backend Engineer ',
            currentlyWorking: true,
            bulletPoints: ['Built APIs'],
          },
        ],
        education: [
          {
            id: 'edu-1',
            school: 'Example University',
            degree: 'BSc',
          },
        ],
        skills: ['Node.js', 'NestJS'],
        projects: [
          {
            id: 'proj-1',
            name: 'API Platform',
            technologies: 'Node.js, MongoDB',
          },
        ],
        achievements: [{ id: 'ach-1', text: 'Top performer' }],
      },
    });

    expect(parsed.title).toBe('Senior Resume');
    expect(parsed.content?.experience?.[0].company).toBe('ACME');
    expect(parsed.content?.experience?.[0].position).toBe('Backend Engineer');
  });

  it('should parse list query defaults', () => {
    expect(listResumeBuilderQueryDTO.parse({})).toEqual({ page: 1, size: 10 });
    expect(listResumeBuilderQueryDTO.parse({ page: '2', size: '5' })).toEqual({
      page: 2,
      size: 5,
    });
  });

  it('should parse AI helper DTOs and defaults', () => {
    const summary = aiSummaryDTO.parse({
      targetRole: null,
      skills: ['Node.js'],
      experience: [
        {
          company: ' ACME ',
          description: 'ignored' as never,
        },
      ],
    } as never);
    expect(summary.targetRole).toBe('');

    const suggestions = aiSuggestionsDTO.parse({
      targetRole: ' Backend ',
      personalInfo: null,
    });
    expect(suggestions.focus).toBe('summary');
    expect(suggestions.targetRole).toBe('Backend');

    const bullets = aiExperienceBulletsDTO.parse({
      targetRole: null,
      position: ' Backend Engineer ',
      company: ' ACME ',
      description: 'Built scalable APIs for production traffic.',
    });
    expect(bullets.targetRole).toBe('');
    expect(bullets.position).toBe('Backend Engineer');
    expect(bullets.company).toBe('ACME');

    expect(() =>
      aiExperienceBulletsDTO.parse({
        description: '   ',
      }),
    ).toThrow();

    const ats = atsScanBodyDTO.parse({
      targetRole: '  SDE  ',
      experienceLevel: '  junior  ',
      jobDescription: '  Build APIs  ',
    });
    expect(ats).toEqual({
      targetRole: 'SDE',
      experienceLevel: 'junior',
      jobDescription: 'Build APIs',
    });
  });
});
