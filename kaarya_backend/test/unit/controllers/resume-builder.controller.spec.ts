import { HttpStatus } from '@nestjs/common';
import { ApiError } from 'src/common/errors/api-error';
import { ResumeBuilderController } from 'src/controllers/resume-builder.controller';
import { ResumeBuilderService } from 'src/services/resume-builder.service';

describe('ResumeBuilderController', () => {
  let controller: ResumeBuilderController;
  let resumeBuilderService: jest.Mocked<ResumeBuilderService>;
  const user = { id: 'u1', role: 'student' } as never;

  beforeEach(() => {
    resumeBuilderService = {
      create: jest.fn(),
      list: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      generatePdf: jest.fn(),
      saveAsResume: jest.fn(),
      generateAiSummary: jest.fn(),
      generateExperienceBullets: jest.fn(),
      generateAiSuggestions: jest.fn(),
      atsScan: jest.fn(),
    } as unknown as jest.Mocked<ResumeBuilderService>;

    controller = new ResumeBuilderController(resumeBuilderService);
  });

  it('should create resume draft and reject invalid payload', async () => {
    resumeBuilderService.create.mockResolvedValue({ id: 'r1' } as never);

    const created = await controller.create(
      { user },
      { title: 'Resume 1', targetRole: 'Backend Engineer' } as never,
    );

    expect(created).toEqual({
      success: true,
      message: 'Resume draft created.',
      data: { id: 'r1' },
    });
    await expect(
      controller.create({ user }, { title: '' } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should list drafts and reject invalid query', async () => {
    resumeBuilderService.list.mockResolvedValue({
      items: [],
      meta: { page: 1, size: 10 },
    } as never);

    const listed = await controller.list({ user }, { page: '1', size: '10' } as never);
    expect(listed.message).toBe('Resumes fetched.');

    await expect(
      controller.list({ user }, { page: 0 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get by id and throw not found', async () => {
    resumeBuilderService.getById
      .mockResolvedValueOnce({ id: 'r1' } as never)
      .mockResolvedValueOnce(null as never);

    const found = await controller.getById({ user }, 'r1');
    expect(found.message).toBe('Resume fetched.');

    try {
      await controller.getById({ user }, 'missing');
      throw new Error('Expected not found');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).getStatus()).toBe(HttpStatus.NOT_FOUND);
    }
  });

  it('should update draft and handle invalid/not found', async () => {
    resumeBuilderService.update
      .mockResolvedValueOnce({ id: 'r1' } as never)
      .mockResolvedValueOnce(null as never);

    const updated = await controller.update(
      { user },
      'r1',
      { title: 'Updated resume' },
    );
    expect(updated.message).toBe('Resume updated.');

    await expect(
      controller.update({ user }, 'r1', { title: '' } as never),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.update({ user }, 'r1', { title: 'Another' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should delete draft and throw not found when missing', async () => {
    resumeBuilderService.delete
      .mockResolvedValueOnce(true as never)
      .mockResolvedValueOnce(false as never);

    const deleted = await controller.delete({ user }, 'r1');
    expect(deleted).toEqual({
      success: true,
      message: 'Resume deleted.',
      data: { deleted: true },
    });

    await expect(controller.delete({ user }, 'r1')).rejects.toBeInstanceOf(ApiError);
  });

  it('should generate pdf and save resume', async () => {
    resumeBuilderService.generatePdf.mockResolvedValue({
      fileName: 'resume.pdf',
      pdfBase64: 'abc',
    } as never);
    resumeBuilderService.saveAsResume.mockResolvedValue({
      resumeId: 'resume-1',
    } as never);

    const pdf = await controller.generatePdf({ user }, 'r1');
    const saved = await controller.save({ user }, 'r1');

    expect(pdf.message).toBe('PDF generated.');
    expect(saved.message).toBe('Resume saved.');
  });

  it('should generate ai summary and validate payload', async () => {
    resumeBuilderService.generateAiSummary.mockResolvedValue({
      summary: 'A concise summary',
    } as never);

    const result = await controller.generateAiSummary(
      { user },
      { targetRole: 'Backend Engineer' },
    );
    expect(result.message).toBe('Summary generated.');

    await expect(
      controller.generateAiSummary({ user }, { targetRole: 12 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should generate experience bullets and suggestions', async () => {
    resumeBuilderService.generateExperienceBullets.mockResolvedValue({
      bullets: ['Built APIs'],
    } as never);
    resumeBuilderService.generateAiSuggestions.mockResolvedValue({
      targetRole: 'Backend Engineer',
      summary: 'Use measurable impact',
      skills: ['Node.js'],
      headline: 'Backend Engineer',
      suggestions: ['Highlight APIs'],
    } as never);

    const bullets = await controller.generateExperienceBullets(
      { user },
      { description: 'Built API platform' },
    );
    const suggestions = await controller.generateSuggestions(
      { user },
      { focus: 'summary', targetRole: 'Backend Engineer' } as never,
    );

    expect(bullets.message).toBe('Bullets generated.');
    expect(suggestions.message).toBe('Suggestions generated.');

    await expect(
      controller.generateExperienceBullets(
        { user },
        { description: '' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.generateSuggestions({ user }, { focus: 'bad' } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should perform ats scan and handle missing file', async () => {
    resumeBuilderService.atsScan.mockResolvedValue({
      overallScore: 70,
      sections: [],
      summary: 'Good',
      topFixes: [],
      extractedTextPreview: '',
      isResumeDetected: true,
      confidence: 0.8,
      notResumeReason: null,
    } as never);

    const file = {
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('pdf'),
      size: 200,
    } as Express.Multer.File;

    const scanned = await controller.atsScan(
      { user },
      file,
      { targetRole: 'Backend Engineer' },
    );
    expect(scanned.message).toBe('ATS scan complete.');

    const scannedWithInvalidBody = await controller.atsScan(
      { user },
      file,
      { targetRole: 42 } as never,
    );
    expect(resumeBuilderService.atsScan).toHaveBeenLastCalledWith(user, file, {
      targetRole: undefined,
      experienceLevel: undefined,
      jobDescription: undefined,
    });
    expect(scannedWithInvalidBody.success).toBe(true);

    await expect(
      controller.atsScan({ user }, undefined, {}),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
