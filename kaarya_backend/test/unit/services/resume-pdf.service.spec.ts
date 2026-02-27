jest.mock('puppeteer', () => ({
  __esModule: true,
  default: {
    launch: jest.fn(),
  },
}));

jest.mock('src/services/resume-pdf-templates', () => ({
  generateResumeHtml: jest.fn(() => '<html>resume</html>'),
}));

import puppeteer from 'puppeteer';
import { generateResumeHtml } from 'src/services/resume-pdf-templates';
import { ResumePdfService } from 'src/services/resume-pdf.service';

describe('ResumePdfService', () => {
  let service: ResumePdfService;
  let launchMock: jest.Mock;

  const createBrowserMock = (connected = true) => {
    const page = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      close: jest.fn().mockResolvedValue(undefined),
    };

    return {
      connected,
      newPage: jest.fn().mockResolvedValue(page),
      close: jest.fn().mockResolvedValue(undefined),
      __page: page,
    };
  };

  beforeEach(() => {
    service = new ResumePdfService();
    launchMock = (puppeteer as unknown as { launch: jest.Mock }).launch;
    launchMock.mockReset();
    (generateResumeHtml as jest.Mock).mockClear();
  });

  it('should initialize and destroy browser lifecycle', async () => {
    const browser = createBrowserMock();
    launchMock.mockResolvedValue(browser as never);

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(launchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headless: true,
      }),
    );
    expect(browser.close).toHaveBeenCalled();
  });

  it('should swallow init launch failures', async () => {
    launchMock.mockRejectedValue(new Error('launch failed'));
    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });

  it('should generate pdf and close page', async () => {
    const browser = createBrowserMock();
    launchMock.mockResolvedValue(browser as never);

    const buffer = await service.generatePdf(
      {
        personalInfo: { firstName: 'Alex' },
      } as never,
      'professional' as never,
    );

    expect(generateResumeHtml).toHaveBeenCalledWith(
      { personalInfo: { firstName: 'Alex' } },
      'professional',
    );
    expect(browser.newPage).toHaveBeenCalled();
    expect(browser.__page.setContent).toHaveBeenCalledWith('<html>resume</html>', {
      waitUntil: 'domcontentloaded',
    });
    expect(browser.__page.pdf).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'A4', printBackground: true }),
    );
    expect(browser.__page.close).toHaveBeenCalled();
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('should re-launch browser when disconnected and still close page on errors', async () => {
    const disconnected = createBrowserMock(false);
    const connected = createBrowserMock(true);
    connected.__page.setContent.mockRejectedValueOnce(new Error('content fail'));
    launchMock
      .mockResolvedValueOnce(disconnected as never)
      .mockResolvedValueOnce(connected as never);

    await service.onModuleInit();

    await expect(
      service.generatePdf({} as never, 'professional' as never),
    ).rejects.toThrow('content fail');
    expect(launchMock).toHaveBeenCalledTimes(2);
    expect(connected.__page.close).toHaveBeenCalled();
  });
});

