import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { ACResumeBuilderRepository } from 'src/repositories/resume-builder.repository';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { GamificationService } from 'src/services/gamification.service';
import { GeminiService } from 'src/services/gemini.service';
import { ResumeBuilderService } from 'src/services/resume-builder.service';
import { ResumePdfService } from 'src/services/resume-pdf.service';
import { UserRole } from 'src/types/user-role.enum';

const parseGetText = jest.fn();
const parseDestroy = jest.fn();

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: parseGetText,
    destroy: parseDestroy,
  })),
}));

describe('ResumeBuilderService', () => {
  let service: ResumeBuilderService;
  let resumeBuilderRepo: jest.Mocked<ACResumeBuilderRepository>;
  let resumeRepo: jest.Mocked<ACResumeRepository>;
  let geminiService: jest.Mocked<GeminiService>;
  let resumePdfService: jest.Mocked<ResumePdfService>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;
  let gamificationService: jest.Mocked<GamificationService>;

  const userId = new Types.ObjectId().toString();
  const builderId = new Types.ObjectId().toString();
  const resumeId = new Types.ObjectId().toString();
  const user = { id: userId, role: UserRole.STUDENT };

  const makeDoc = (data: Record<string, unknown>) => ({
    ...data,
    toJSON: () => data,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    resumeBuilderRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndStudentId: jest.fn(),
      findAllByStudentId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ACResumeBuilderRepository>;

    resumeRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndStudentId: jest.fn(),
      findAllByStudentId: jest.fn(),
      deleteByIdAndStudentId: jest.fn(),
    } as unknown as jest.Mocked<ACResumeRepository>;

    geminiService = {
      generateProfessionalSummary: jest.fn(),
      generateExperienceBullets: jest.fn(),
      generateResumeSuggestions: jest.fn(),
      atsScanResume: jest.fn(),
      generateInterviewPrepCourse: jest.fn(),
    } as unknown as jest.Mocked<GeminiService>;

    resumePdfService = {
      generatePdf: jest.fn(),
    } as unknown as jest.Mocked<ResumePdfService>;

    cloudinaryService = {
      uploadDocument: jest.fn(),
      uploadImage: jest.fn(),
      deleteAsset: jest.fn(),
    } as unknown as jest.Mocked<CloudinaryService>;

    gamificationService = {
      awardResumeBuilderCreated: jest.fn(),
      awardResumeBuilderSaved: jest.fn(),
      awardAtsScan: jest.fn(),
    } as unknown as jest.Mocked<GamificationService>;

    service = new ResumeBuilderService(
      resumeBuilderRepo,
      resumeRepo,
      geminiService,
      resumePdfService,
      cloudinaryService,
      gamificationService,
    );
  });

  it('should create, get, list, update and delete resume builder records', async () => {
    resumeBuilderRepo.create.mockResolvedValue(
      makeDoc({
        _id: builderId,
        title: 'My Resume',
        targetRole: 'Backend Engineer',
        templateId: 'professional',
        content: { personalInfo: { name: 'User' } },
      }) as never,
    );
    const created = await service.create(user as never, {
      title: 'My Resume',
      targetRole: 'Backend Engineer',
      templateId: 'professional',
      content: { personalInfo: { name: 'User' } },
    } as never);
    expect(created).toEqual(
      expect.objectContaining({
        id: builderId,
        title: 'My Resume',
      }),
    );
    expect(gamificationService.awardResumeBuilderCreated).toHaveBeenCalled();

    resumeBuilderRepo.findByIdAndStudentId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        makeDoc({
          _id: builderId,
          title: 'My Resume',
          targetRole: null,
          templateId: 'professional',
          content: {},
          generatedResumeId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        }) as never,
      );
    await expect(service.getById(user as never, builderId)).resolves.toBeNull();
    await expect(service.getById(user as never, builderId)).resolves.toEqual(
      expect.objectContaining({
        id: builderId,
        generatedResumeId: null,
      }),
    );

    resumeBuilderRepo.findAllByStudentId.mockResolvedValue({
      items: [
        makeDoc({
          _id: builderId,
          title: 'My Resume',
          targetRole: 'Backend Engineer',
          templateId: 'professional',
          generatedResumeId: new Types.ObjectId(resumeId),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        }),
      ],
      total: 1,
    } as never);
    const listed = await service.list(user as never, {
      page: 1,
      size: 10,
    } as never);
    expect(listed.total).toBe(1);
    expect(listed.items[0].generatedResumeId).toBe(resumeId);

    resumeBuilderRepo.update
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        makeDoc({
          _id: builderId,
          title: 'Updated',
          targetRole: 'Backend Engineer',
          templateId: 'professional',
          content: {},
        }) as never,
      );
    await expect(
      service.update(user as never, builderId, { title: 'Updated' } as never),
    ).resolves.toBeNull();
    await expect(
      service.update(user as never, builderId, { title: 'Updated' } as never),
    ).resolves.toEqual(expect.objectContaining({ title: 'Updated' }));

    resumeBuilderRepo.delete.mockResolvedValue(true);
    await expect(service.delete(user as never, builderId)).resolves.toBe(true);
  });

  it('should generate pdf and save as resume', async () => {
    resumeBuilderRepo.findByIdAndStudentId.mockResolvedValue(
      makeDoc({
        _id: builderId,
        title: 'Builder',
        templateId: 'professional',
        content: { personalInfo: { name: 'User' } },
      }) as never,
    );
    resumePdfService.generatePdf.mockResolvedValue(Buffer.from('pdf'));
    cloudinaryService.uploadDocument.mockResolvedValue({
      url: 'https://cdn.test/resume.pdf',
      originalFilename: 'resume.pdf',
      publicId: 'pub-1',
      bytes: 111,
    } as never);

    await expect(service.generatePdf(user as never, builderId)).resolves.toEqual({
      pdfUrl: 'https://cdn.test/resume.pdf',
    });

    resumeRepo.create.mockResolvedValue({
      _id: new Types.ObjectId(resumeId),
    } as never);
    await expect(service.saveAsResume(user as never, builderId)).resolves.toEqual(
      expect.objectContaining({
        resumeId,
        pdfUrl: 'https://cdn.test/resume.pdf',
      }),
    );
    expect(gamificationService.awardResumeBuilderSaved).toHaveBeenCalled();
  });

  it('should throw for missing resume builder doc in pdf/save flows', async () => {
    resumeBuilderRepo.findByIdAndStudentId.mockResolvedValue(null);

    await expect(service.generatePdf(user as never, builderId)).rejects.toBeInstanceOf(
      ApiError,
    );
    await expect(service.saveAsResume(user as never, builderId)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('should proxy ai helper methods', async () => {
    geminiService.generateProfessionalSummary.mockResolvedValue('summary');
    geminiService.generateExperienceBullets.mockResolvedValue(['a', 'b']);
    geminiService.generateResumeSuggestions.mockResolvedValue({
      targetRole: 'Backend Engineer',
      skills: ['Node.js'],
    });

    await expect(
      service.generateAiSummary(user as never, { targetRole: 'BE' } as never),
    ).resolves.toEqual({ summary: 'summary' });
    await expect(
      service.generateExperienceBullets(
        user as never,
        { description: 'Did work' } as never,
      ),
    ).resolves.toEqual({ bullets: ['a', 'b'] });
    await expect(
      service.generateAiSuggestions(
        user as never,
        {
          focus: 'skills',
          targetRole: 'BE',
          skills: ['Node.js'],
        } as never,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        targetRole: 'Backend Engineer',
      }),
    );
  });

  it('should handle ats scan validation, parse, classification and persistence', async () => {
    const file = {
      buffer: Buffer.from('dummy-pdf'),
      originalname: 'resume',
      mimetype: 'application/pdf',
      size: 200,
    } as Express.Multer.File;

    await expect(service.atsScan(user as never, undefined as never, {} as never)).rejects.toBeInstanceOf(ApiError);

    parseGetText.mockRejectedValueOnce(new Error('parse fail'));
    await expect(service.atsScan(user as never, file, {} as never)).rejects.toBeInstanceOf(
      ApiError,
    );

    parseGetText.mockResolvedValueOnce({ text: 'too short' });
    await expect(service.atsScan(user as never, file, {} as never)).rejects.toBeInstanceOf(
      ApiError,
    );

    const nonResumeText = `
      Chapter 1: syllabus and assignment for semester.
      Question 1, Question 2, table of contents, unit 3.
      Final exam and class notes.
      Bibliography and theorem.
      Additional lesson material and formula sheet.
    `;
    parseGetText.mockResolvedValueOnce({ text: nonResumeText });
    cloudinaryService.uploadDocument.mockResolvedValueOnce({
      url: 'https://cdn.test/non-resume.pdf',
      originalFilename: 'notes',
      publicId: 'public-1',
      bytes: 123,
    } as never);
    resumeRepo.create.mockResolvedValueOnce({
      _id: new Types.ObjectId(resumeId),
    } as never);

    const notResumeResult = await service.atsScan(
      user as never,
      file,
      {} as never,
    );
    expect(notResumeResult.documentType).toBe('not_resume');
    expect(notResumeResult.overallScore).toBe(0);

    const resumeLikeText = `
      Jane Doe
      jane@example.com
      +1 555 111 2222
      linkedin.com/in/jane
      Experience
      Software Engineer 2022 - Present
      Built APIs and delivered features with measurable impact.
      Education
      Skills
      Projects
      - Implemented scalable backend services and CI automation.
      - Improved latency by 35% through query optimization.
    `;
    parseGetText.mockResolvedValueOnce({ text: resumeLikeText });
    geminiService.atsScanResume.mockResolvedValueOnce({
      documentType: 'resume',
      overallScore: 77,
      ATS: { score: 80, tips: [] },
      toneAndStyle: { score: 70, tips: [] },
      content: { score: 75, tips: [] },
      structure: { score: 78, tips: [] },
      skills: { score: 82, tips: [] },
    } as never);
    cloudinaryService.uploadDocument.mockResolvedValueOnce({
      url: 'https://cdn.test/resume.pdf',
      originalFilename: 'resume',
      publicId: 'public-2',
      bytes: 456,
    } as never);
    resumeRepo.create.mockResolvedValueOnce({
      _id: new Types.ObjectId(resumeId),
    } as never);

    const resumeResult = await service.atsScan(
      user as never,
      file,
      { targetRole: 'Backend Engineer' } as never,
    );
    expect(resumeResult.documentType).toBe('resume');
    expect(resumeResult.overallScore).toBe(77);
    expect(gamificationService.awardAtsScan).toHaveBeenCalled();
  });

  it('should cover private helpers', () => {
    const internal = service as any;

    expect(internal.ensurePdfFileName(undefined)).toBe('ats-scanned-resume.pdf');
    expect(internal.ensurePdfFileName('resume')).toBe('resume.pdf');
    expect(internal.ensurePdfFileName('resume.pdf')).toBe('resume.pdf');

    const classifiedResume = internal.classifyDocumentForAts(`
      John Doe
      john@example.com
      +1 222 333 4444
      Experience
      Work Experience
      2022 - Present
      Skills
      Projects
      - Built APIs with Node.js
      - Improved throughput by 20%
    `);
    expect(classifiedResume.isResume).toBe(true);

    const classifiedNonResume = internal.classifyDocumentForAts(`
      semester syllabus
      assignment
      theorem
      formula
      question 1
      question 2
      table of contents
    `);
    expect(classifiedNonResume.isResume).toBe(false);

    const notResume = internal.buildNotResumeAtsResult('not a resume');
    expect(notResume).toEqual(
      expect.objectContaining({
        documentType: 'not_resume',
        overallScore: 0,
      }),
    );
  });

  it('should return fallback fields from toResponse', () => {
    const response = (service as any).toResponse({
      _id: builderId,
      content: {},
    });
    expect(response).toEqual({
      id: builderId,
      title: 'Untitled Resume',
      targetRole: null,
      templateId: 'professional',
      content: {},
    });
  });
});
