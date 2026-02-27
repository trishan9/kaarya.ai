import {
  CreateResourceCourseDTO,
  ResourceCourseListQueryDTO,
  UpdateResourceCourseDTO,
} from 'src/dtos/resources/resource-course.dto';
import { ResourceCourseDifficulty } from 'src/types/resource-course-difficulty.enum';
import { ResourceCourseGenerationMode } from 'src/types/resource-course-generation-mode.enum';
import { ResourceCourseSource } from 'src/types/resource-course-source.enum';
import { ResourceCourseVisibility } from 'src/types/resource-course-visibility.enum';

describe('ResourceCourse DTOs', () => {
  it('should parse create payload with defaults and preprocessors', () => {
    const result = CreateResourceCourseDTO.parse({
      title: '  Backend Interview Sprint  ',
      description: '  Focused prep  ',
      category: '  Learn  ',
      difficulty: ResourceCourseDifficulty.INTERMEDIATE,
      targetRoles: ['Backend Engineer'],
      chapterTitles: ['Networking'],
      includeVideoRecommendations: 'false',
      customVideoUrls: 'https://youtu.be/a,https://youtu.be/b',
      promptContext: '  explain deeply  ',
      jobDescriptionContext: '  job context  ',
    });

    expect(result.title).toBe('Backend Interview Sprint');
    expect(result.category).toBe('Learn');
    expect(result.generationMode).toBe(ResourceCourseGenerationMode.LEARN);
    expect(result.visibility).toBe(ResourceCourseVisibility.PRIVATE);
    expect(result.chapterCount).toBe(6);
    expect(result.includeVideoRecommendations).toBe(false);
    expect(result.customVideoUrls).toEqual([
      'https://youtu.be/a',
      'https://youtu.be/b',
    ]);
  });

  it('should parse empty optional arrays as defaults', () => {
    const result = CreateResourceCourseDTO.parse({
      title: 'Course',
      category: 'Cat',
      difficulty: ResourceCourseDifficulty.BEGINNER,
      targetRoles: ['QA'],
      customVideoUrls: '',
    });

    expect(result.chapterTitles).toEqual([]);
    expect(result.customVideoUrls).toEqual([]);
  });

  it('should reject invalid custom URLs', () => {
    const parsed = CreateResourceCourseDTO.safeParse({
      title: 'Course',
      category: 'Cat',
      difficulty: ResourceCourseDifficulty.BEGINNER,
      targetRoles: ['QA'],
      customVideoUrls: 'not-a-url',
    });

    expect(parsed.success).toBe(false);
  });

  it('should support optional preprocessors for arrays and booleans', () => {
    const parsed = CreateResourceCourseDTO.parse({
      title: 'Course Name',
      description: '   ',
      category: 'Category',
      difficulty: ResourceCourseDifficulty.BEGINNER,
      targetRoles: ['QA'],
      includeVideoRecommendations: '',
      customVideoUrls: ['https://youtu.be/a'],
      promptContext: '',
      jobDescriptionContext: '  ',
    });

    expect(parsed.description).toBeUndefined();
    expect(parsed.chapterTitles).toEqual([]);
    expect(parsed.includeVideoRecommendations).toBe(true);
    expect(parsed.promptContext).toBeUndefined();
    expect(parsed.jobDescriptionContext).toBeUndefined();
  });

  it('should keep explicit boolean values and reject invalid url-array types', () => {
    const parsed = CreateResourceCourseDTO.parse({
      title: 'Course Name',
      category: 'Category',
      difficulty: ResourceCourseDifficulty.BEGINNER,
      targetRoles: ['QA'],
      includeVideoRecommendations: false,
      customVideoUrls: [],
    });
    const invalid = CreateResourceCourseDTO.safeParse({
      title: 'Course Name',
      category: 'Category',
      difficulty: ResourceCourseDifficulty.BEGINNER,
      targetRoles: ['QA'],
      customVideoUrls: 123,
    });

    expect(parsed.includeVideoRecommendations).toBe(false);
    expect(invalid.success).toBe(false);
  });

  it('should validate update payload and defaults', () => {
    const valid = UpdateResourceCourseDTO.safeParse({
      title: ' Updated title ',
      regenerateContent: 'true',
      includeVideoRecommendations: 'false',
    });
    const defaults = UpdateResourceCourseDTO.safeParse({});
    const invalid = UpdateResourceCourseDTO.safeParse({
      title: 'a',
    });

    expect(valid.success).toBe(true);
    expect(valid.data?.regenerateContent).toBe(true);
    expect(valid.data?.includeVideoRecommendations).toBe(false);
    expect(defaults.success).toBe(true);
    expect(defaults.data?.regenerateContent).toBe(false);
    expect(invalid.success).toBe(false);
  });

  it('should parse update custom urls and boolean preprocessors', () => {
    const parsed = UpdateResourceCourseDTO.parse({
      customVideoUrls: '',
      includeVideoRecommendations: null,
      regenerateContent: '',
    });

    expect(parsed.customVideoUrls).toEqual([]);
    expect(parsed.includeVideoRecommendations).toBeUndefined();
    expect(parsed.regenerateContent).toBe(false);
  });

  it('should parse list query defaults and explicit filters', () => {
    const defaults = ResourceCourseListQueryDTO.parse({});
    const filtered = ResourceCourseListQueryDTO.parse({
      page: '2',
      size: '25',
      search: '  backend ',
      category: '  system design ',
      difficulty: ResourceCourseDifficulty.ADVANCED,
      visibility: ResourceCourseVisibility.PUBLIC,
      source: ResourceCourseSource.COMPANY,
      ownership: 'mine',
      sortBy: 'title',
    });

    expect(defaults).toEqual({
      page: 1,
      size: 12,
      search: undefined,
      category: undefined,
      difficulty: undefined,
      visibility: undefined,
      source: undefined,
      ownership: 'all',
      sortBy: 'newest',
    });
    expect(filtered.search).toBe('backend');
    expect(filtered.category).toBe('system design');
    expect(filtered.ownership).toBe('mine');
    expect(filtered.sortBy).toBe('title');
  });
});
