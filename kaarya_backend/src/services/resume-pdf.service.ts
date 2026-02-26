import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import puppeteer, { type Browser } from 'puppeteer';
import type {
  ResumeBuilderContent,
  ResumeBuilderTemplateId,
} from 'src/types/resume-builder.types';
import { generateResumeHtml } from './resume-pdf-templates';

@Injectable()
export class ResumePdfService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ResumePdfService.name);
  private browser: Browser | null = null;

  async onModuleInit(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      this.logger.log('Puppeteer browser launched for PDF generation.');
    } catch (error) {
      this.logger.error(
        'Failed to launch Puppeteer browser. PDF generation will attempt on-demand.',
        error,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Puppeteer browser closed.');
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async generatePdf(
    content: ResumeBuilderContent,
    templateId: ResumeBuilderTemplateId,
  ): Promise<Buffer> {
    const browser = await this.ensureBrowser();
    const html = generateResumeHtml(content, templateId);
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfUint8 = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
      return Buffer.from(pdfUint8);
    } finally {
      await page.close();
    }
  }
}
