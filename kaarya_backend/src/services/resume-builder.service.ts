import { HttpStatus, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PDFParse } from 'pdf-parse';
import { ApiError } from 'src/common/errors/api-error';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import {
  ACResumeBuilderRepository,
} from 'src/repositories/resume-builder.repository';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { GamificationService } from 'src/services/gamification.service';
import { GeminiService } from 'src/services/gemini.service';
import { ResumePdfService } from 'src/services/resume-pdf.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import type {
  ResumeBuilderContent,
  ResumeBuilderTemplateId,
  AtsScanResult,
} from 'src/types/resume-builder.types';
import {
  listResumeBuilderQueryDTO,
  aiSuggestionsDTO,
  atsScanBodyDTO,
  type TCreateResumeBuilderDTO,
  type TUpdateResumeBuilderDTO,
  type TListResumeBuilderQueryDTO,
  type TAiSummaryDTO,
  type TAiExperienceBulletsDTO,
  type TAiSuggestionsDTO,
  type TAtsScanBodyDTO,
} from 'src/dtos/resume-builder/resume-builder.dto';

@Injectable()
export class ResumeBuilderService {
  constructor(
    private readonly resumeBuilderRepo: ACResumeBuilderRepository,
    private readonly resumeRepo: ACResumeRepository,
    private readonly geminiService: GeminiService,
    private readonly resumePdfService: ResumePdfService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly gamificationService: GamificationService,
  ) {}

  async create(
    user: TAuthenticatedUser,
    payload: TCreateResumeBuilderDTO,
  ): Promise<{ id: string; title: string; targetRole: string | null; templateId: string; content: ResumeBuilderContent }> {
    const doc = await this.resumeBuilderRepo.create({
      studentId: new Types.ObjectId(user.id),
      title: payload.title,
      targetRole: payload.targetRole ?? null,
      templateId: payload.templateId ?? 'professional',
      content: (payload.content as ResumeBuilderContent) ?? {},
    });
    const response = this.toResponse(doc);
    await this.gamificationService.awardResumeBuilderCreated({
      userId: user.id,
      resumeBuilderId: response.id,
    });
    return response;
  }

  async getById(
    user: TAuthenticatedUser,
    id: string,
  ): Promise<{
    id: string;
    title: string;
    targetRole: string | null;
    templateId: string;
    content: ResumeBuilderContent;
    generatedResumeId: string | null;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const doc = await this.resumeBuilderRepo.findByIdAndStudentId(id, user.id);
    if (!doc) return null;
    const d = doc.toJSON ? doc.toJSON() : (doc as unknown as Record<string, unknown>);
    return {
      id: String(d._id),
      title: (d.title as string) ?? 'Untitled Resume',
      targetRole: (d.targetRole as string) ?? null,
      templateId: (d.templateId as string) ?? 'professional',
      content: (d.content as ResumeBuilderContent) ?? {},
      generatedResumeId: d.generatedResumeId ? String(d.generatedResumeId) : null,
      createdAt: (d.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (d.updatedAt as Date)?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async list(
    user: TAuthenticatedUser,
    query: TListResumeBuilderQueryDTO,
  ): Promise<{
    items: Array<{
      id: string;
      title: string;
      targetRole: string | null;
      templateId: string;
      generatedResumeId: string | null;
      updatedAt: string;
    }>;
    total: number;
    page: number;
    size: number;
  }> {
    const parsed = listResumeBuilderQueryDTO.parse(query ?? {});
    const { items, total } = await this.resumeBuilderRepo.findAllByStudentId({
      studentId: user.id,
      page: parsed.page,
      size: parsed.size,
    });
    return {
      items: items.map((doc) => {
        const d = doc.toJSON ? doc.toJSON() : (doc as unknown as Record<string, unknown>);
        return {
          id: String(d._id),
          title: (d.title as string) ?? 'Untitled Resume',
          targetRole: (d.targetRole as string) ?? null,
          templateId: (d.templateId as string) ?? 'professional',
          generatedResumeId: d.generatedResumeId ? String(d.generatedResumeId) : null,
          updatedAt: (d.updatedAt as Date)?.toISOString?.() ?? new Date().toISOString(),
        };
      }),
      total,
      page: parsed.page,
      size: parsed.size,
    };
  }

  async update(
    user: TAuthenticatedUser,
    id: string,
    payload: TUpdateResumeBuilderDTO,
  ): Promise<{
    id: string;
    title: string;
    targetRole: string | null;
    templateId: string;
    content: ResumeBuilderContent;
  } | null> {
    const updatePayload: Record<string, unknown> = {};
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.targetRole !== undefined) updatePayload.targetRole = payload.targetRole;
    if (payload.templateId !== undefined) updatePayload.templateId = payload.templateId;
    if (payload.content !== undefined) updatePayload.content = payload.content;
    const doc = await this.resumeBuilderRepo.update(user.id, id, updatePayload as never);
    if (!doc) return null;
    return this.toResponse(doc);
  }

  async generatePdf(
    user: TAuthenticatedUser,
    id: string,
  ): Promise<{ pdfUrl: string }> {
    const doc = await this.resumeBuilderRepo.findByIdAndStudentId(id, user.id);
    if (!doc) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resume not found.',
      });
    }
    const d = doc.toJSON ? doc.toJSON() : (doc as unknown as Record<string, unknown>);
    const content = (d.content as ResumeBuilderContent) ?? {};
    const templateId = (d.templateId as ResumeBuilderTemplateId) ?? 'professional';
    const buffer = await this.resumePdfService.generatePdf(content, templateId);
    const fakeFile = {
      buffer,
      originalname: `resume-${id}.pdf`,
      mimetype: 'application/pdf',
      size: buffer.length,
    } as Express.Multer.File;
    const uploaded = await this.cloudinaryService.uploadDocument(fakeFile);
    return { pdfUrl: uploaded.url };
  }

  async saveAsResume(
    user: TAuthenticatedUser,
    id: string,
  ): Promise<{
    resumeId: string;
    pdfUrl: string;
    fileName: string;
  }> {
    const doc = await this.resumeBuilderRepo.findByIdAndStudentId(id, user.id);
    if (!doc) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resume not found.',
      });
    }
    const d = doc.toJSON ? doc.toJSON() : (doc as unknown as Record<string, unknown>);
    const content = (d.content as ResumeBuilderContent) ?? {};
    const templateId = (d.templateId as ResumeBuilderTemplateId) ?? 'professional';
    const title = (d.title as string) ?? 'Resume';
    const buffer = await this.resumePdfService.generatePdf(content, templateId);
    const fakeFile = {
      buffer,
      originalname: `${title.replace(/\s+/g, '-')}.pdf`,
      mimetype: 'application/pdf',
      size: buffer.length,
    } as Express.Multer.File;
    const uploaded = await this.cloudinaryService.uploadDocument(fakeFile);
    const resumeDoc = await this.resumeRepo.create({
      studentId: new Types.ObjectId(user.id),
      type: 'builder',
      fileName: uploaded.originalFilename,
      fileUrl: uploaded.url,
      filePublicId: uploaded.publicId,
      mimeType: 'application/pdf',
      fileSize: uploaded.bytes,
    });
    await this.resumeBuilderRepo.update(user.id, id, {
      generatedResumeId: resumeDoc._id as Types.ObjectId,
    });
    await this.gamificationService.awardResumeBuilderSaved({
      userId: user.id,
      resumeBuilderId: id,
      resumeId: String(resumeDoc._id),
    });
    return {
      resumeId: String(resumeDoc._id),
      pdfUrl: uploaded.url,
      fileName: uploaded.originalFilename,
    };
  }

  async generateAiSummary(
    user: TAuthenticatedUser,
    payload: TAiSummaryDTO,
  ): Promise<{ summary: string }> {
    const summary = await this.geminiService.generateProfessionalSummary({
      targetRole: payload.targetRole ?? null,
      professionalSummary: payload.professionalSummary ?? null,
      experience: payload.experience,
      education: payload.education,
      skills: payload.skills,
    });
    return { summary };
  }

  async generateExperienceBullets(
    user: TAuthenticatedUser,
    payload: TAiExperienceBulletsDTO,
  ): Promise<{ bullets: string[] }> {
    const bullets = await this.geminiService.generateExperienceBullets({
      targetRole: payload.targetRole ?? null,
      position: payload.position ?? null,
      company: payload.company ?? null,
      description: payload.description,
    });
    return { bullets };
  }

  async generateAiSuggestions(
    user: TAuthenticatedUser,
    payload: TAiSuggestionsDTO,
  ): Promise<{
    targetRole?: string;
    jobTitle?: string;
    professionalSummary?: string;
    skills?: string[];
  }> {
    const parsed = aiSuggestionsDTO.parse(payload ?? {});
    return this.geminiService.generateResumeSuggestions({
      focus: parsed.focus,
      targetRole: parsed.targetRole ?? null,
      personalInfo: parsed.personalInfo ?? null,
      professionalSummary: parsed.professionalSummary ?? null,
      experience: parsed.experience,
      education: parsed.education,
      skills: parsed.skills,
    });
  }

  async atsScan(
    user: TAuthenticatedUser,
    file: Express.Multer.File,
    body: TAtsScanBodyDTO,
  ): Promise<AtsScanResult> {
    if (!file?.buffer) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Resume PDF file is required.',
      });
    }
    const parsed = atsScanBodyDTO.safeParse(body ?? {});
    const { targetRole, experienceLevel, jobDescription } = parsed.success
      ? parsed.data
      : { targetRole: undefined, experienceLevel: undefined, jobDescription: undefined };

    let resumeText: string;
    try {
      const parser = new PDFParse({
        data: new Uint8Array(file.buffer),
      });
      const textResult = await parser.getText();
      await parser.destroy();
      resumeText = textResult?.text?.trim() ?? '';
    } catch {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Could not extract text from the uploaded PDF.',
      });
    }
    if (!resumeText || resumeText.length < 50) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'PDF appears to be empty or image-only. Upload a text-based resume PDF.',
      });
    }

    const classification = this.classifyDocumentForAts(resumeText);
    const atsReport = classification.isResume
      ? await this.geminiService.atsScanResume({
          resumeText,
          targetRole: targetRole ?? null,
          experienceLevel: experienceLevel ?? null,
          jobDescription: jobDescription ?? null,
        })
      : this.buildNotResumeAtsResult(classification.reason);

    const uploaded = await this.cloudinaryService.uploadDocument(file);
    const normalizedFileName = this.ensurePdfFileName(
      uploaded.originalFilename || file.originalname,
    );

    const savedResume = await this.resumeRepo.create({
      studentId: new Types.ObjectId(user.id),
      type: 'ats_scan',
      fileName: normalizedFileName,
      fileUrl: uploaded.url,
      filePublicId: uploaded.publicId,
      mimeType: 'application/pdf',
      fileSize: uploaded.bytes || file.size || null,
      atsScore: atsReport.overallScore,
      aiEvaluation: {
        atsScan: atsReport,
        context: {
          targetRole: targetRole ?? null,
          experienceLevel: experienceLevel ?? null,
          jobDescription:
            typeof jobDescription === 'string' && jobDescription.trim().length > 0
              ? jobDescription.trim().slice(0, 3000)
              : null,
          scannedAt: new Date().toISOString(),
        },
      },
    });

    await this.gamificationService.awardAtsScan({
      userId: user.id,
      resumeId: String(savedResume._id),
      score: atsReport.overallScore,
    });

    return atsReport;
  }

  async delete(
    user: TAuthenticatedUser,
    id: string,
  ): Promise<boolean> {
    return this.resumeBuilderRepo.delete(user.id, id);
  }

  private toResponse(doc: unknown): {
    id: string;
    title: string;
    targetRole: string | null;
    templateId: string;
    content: ResumeBuilderContent;
  } {
    const raw = doc as { toJSON?: () => Record<string, unknown> };
    const d = (raw.toJSON ? raw.toJSON() : doc) as Record<string, unknown>;
    return {
      id: String(d._id),
      title: (d.title as string) ?? 'Untitled Resume',
      targetRole: (d.targetRole as string) ?? null,
      templateId: (d.templateId as string) ?? 'professional',
      content: (d.content as ResumeBuilderContent) ?? {},
    };
  }

  private ensurePdfFileName(fileName?: string | null): string {
    const fallback = 'ats-scanned-resume.pdf';
    if (!fileName || !fileName.trim()) return fallback;
    const trimmed = fileName.trim();
    return /\.pdf$/i.test(trimmed) ? trimmed : `${trimmed}.pdf`;
  }

  private classifyDocumentForAts(text: string): {
    isResume: boolean;
    reason: string;
  } {
    const normalized = text.toLowerCase();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const wordCount = normalized.split(/\s+/).filter(Boolean).length;

    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
    const hasPhone =
      /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}/.test(text);
    const hasProfessionalLink =
      /(linkedin\.com|github\.com|behance\.net|dribbble\.com|portfolio)/i.test(
        normalized,
      );
    const hasDateRange =
      /\b(19|20)\d{2}\s*(?:-|–|—|to)\s*(present|current|(19|20)\d{2})\b/i.test(
        normalized,
      );
    const bulletCount = lines.filter((line) => /^[-*•]\s+/.test(line)).length;

    const resumeSectionKeywords = [
      'experience',
      'work experience',
      'employment',
      'education',
      'skills',
      'projects',
      'professional summary',
      'summary',
      'objective',
      'certifications',
      'achievements',
      'internship',
    ];

    const matchedResumeSections = resumeSectionKeywords.filter((keyword) =>
      normalized.includes(keyword),
    ).length;

    const nonResumeKeywords = [
      'chapter',
      'lecture',
      'syllabus',
      'semester',
      'assignment',
      'class notes',
      'unit ',
      'experiment',
      'theorem',
      'formula',
      'bibliography',
      'table of contents',
      'question bank',
      'midterm',
      'final exam',
      'credits',
      'lab manual',
    ];

    const matchedNonResumeKeywords = nonResumeKeywords.filter((keyword) =>
      normalized.includes(keyword),
    ).length;
    const numberedQuestionMatches =
      normalized.match(/\b(question|q)\s*\d+\b/g)?.length ?? 0;

    let positiveScore = 0;
    if (hasEmail) positiveScore += 2;
    if (hasPhone) positiveScore += 2;
    if (hasProfessionalLink) positiveScore += 1;
    if (matchedResumeSections >= 3) positiveScore += 3;
    else if (matchedResumeSections >= 1) positiveScore += 1;
    if (hasDateRange) positiveScore += 2;
    if (bulletCount >= 3) positiveScore += 1;
    if (wordCount >= 120) positiveScore += 1;

    let negativeScore = 0;
    if (matchedNonResumeKeywords >= 4) negativeScore += 4;
    else if (matchedNonResumeKeywords >= 2) negativeScore += 2;
    if (numberedQuestionMatches >= 2) negativeScore += 2;
    if (wordCount < 80) negativeScore += 2;

    const signalScore = positiveScore - negativeScore;
    const hasCoreResumeSignals = hasEmail || hasPhone || matchedResumeSections >= 2;
    const isResume =
      (hasCoreResumeSignals && positiveScore >= 4 && signalScore >= 1) ||
      positiveScore >= 6;

    if (isResume) {
      return {
        isResume: true,
        reason: 'Document matches resume structure and can be ATS-evaluated.',
      };
    }

    if (matchedNonResumeKeywords >= 3 || numberedQuestionMatches >= 2) {
      return {
        isResume: false,
        reason:
          'The uploaded file appears to be notes or academic/course material, not a professional resume.',
      };
    }

    return {
      isResume: false,
      reason:
        'The uploaded file is missing key resume signals like contact details, role history, and structured resume sections.',
    };
  }

  private buildNotResumeAtsResult(reason: string): AtsScanResult {
    const classificationReason =
      reason.trim() ||
      'This uploaded file is not a resume. Upload a professional resume PDF for ATS analysis.';

    const tip = {
      type: 'improve' as const,
      tip: 'This uploaded file is not a resume.',
      explanation: classificationReason,
    };

    return {
      documentType: 'not_resume',
      classificationReason,
      overallScore: 0,
      ATS: {
        score: 0,
        tips: [tip],
      },
      toneAndStyle: {
        score: 0,
        tips: [tip],
      },
      content: {
        score: 0,
        tips: [tip],
      },
      structure: {
        score: 0,
        tips: [tip],
      },
      skills: {
        score: 0,
        tips: [tip],
      },
    };
  }
}
