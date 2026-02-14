import { HttpStatus, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PDFParse } from 'pdf-parse';
import { ApiError } from 'src/common/errors/api-error';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import {
  ACResumeBuilderRepository,
} from 'src/repositories/resume-builder.repository';
import { CloudinaryService } from 'src/services/cloudinary.service';
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
    return this.toResponse(doc);
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

    const atsReport = await this.geminiService.atsScanResume({
      resumeText,
      targetRole: targetRole ?? null,
      experienceLevel: experienceLevel ?? null,
      jobDescription: jobDescription ?? null,
    });

    const uploaded = await this.cloudinaryService.uploadDocument(file);
    const normalizedFileName = this.ensurePdfFileName(
      uploaded.originalFilename || file.originalname,
    );

    await this.resumeRepo.create({
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
}
