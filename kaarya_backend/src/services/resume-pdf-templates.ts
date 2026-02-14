/**
 * Four distinct templates, each ATS-friendly (semantic HTML, no tables for layout):
 *  - professional: LaTeX-style dense layout (like the reference resume)
 *  - modern: Accent-color header band, centered header, colored sections
 *  - minimal: Ultra-clean, generous whitespace, muted typography
 *  - executive: Dark left sidebar with contact/skills, main content right
 */
import type {
  ResumeBuilderContent,
  ResumeBuilderTemplateId,
} from 'src/types/resume-builder.types';

function esc(t?: string | null): string {
  if (!t) return '';
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function strip(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function fmtDate(raw?: string | null): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function dateRange(
  s?: string | null,
  e?: string | null,
  current?: boolean,
): string {
  const start = fmtDate(s);
  const end = current ? 'Present' : fmtDate(e);
  return [start, end].filter(Boolean).join(' \u2013 ');
}

type Link = { text: string; href?: string };

function contactItems(
  p?: ResumeBuilderContent['personalInfo'] | null,
): Link[] {
  if (!p) return [];
  const out: Link[] = [];
  const loc = [p.city, p.country].filter(Boolean).join(', ');
  if (loc) out.push({ text: loc });
  if (p.phone) out.push({ text: p.phone });
  if (p.email) out.push({ text: p.email, href: `mailto:${p.email}` });
  if (p.linkedin) {
    const d = strip(p.linkedin);
    const m = d.match(/linkedin\.com\/in\/([^/?]+)/i);
    out.push({
      text: m ? `linkedin.com/in/${m[1]}` : d,
      href: p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`,
    });
  }
  if (p.github) {
    const d = strip(p.github);
    const m = d.match(/github\.com\/([^/?]+)/i);
    out.push({
      text: m ? `github.com/${m[1]}` : d,
      href: p.github.startsWith('http') ? p.github : `https://${p.github}`,
    });
  }
  if (p.portfolio) {
    out.push({
      text: strip(p.portfolio),
      href: p.portfolio.startsWith('http')
        ? p.portfolio
        : `https://${p.portfolio}`,
    });
  }
  return out;
}

function contactLine(items: Link[], sep: string): string {
  return items
    .map((i) =>
      i.href
        ? `<a href="${esc(i.href)}">${esc(i.text)}</a>`
        : esc(i.text),
    )
    .join(sep);
}

function contactStack(items: Link[]): string {
  return items
    .map(
      (i) =>
        `<div class="ci">${i.href ? `<a href="${esc(i.href)}">${esc(i.text)}</a>` : esc(i.text)}</div>`,
    )
    .join('');
}

function fullName(
  p?: ResumeBuilderContent['personalInfo'] | null,
): string {
  return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || 'Your Name';
}

function summaryBlock(c: ResumeBuilderContent): string {
  const s = c.professionalSummary?.trim();
  return s ? `<p class="body">${esc(s)}</p>` : '';
}

function expBlock(c: ResumeBuilderContent): string {
  if (!c.experience?.length) return '';
  return c.experience
    .map((e) => {
      const t = esc(e.position || '');
      const d = dateRange(e.startDate, e.endDate, e.currentlyWorking);
      const sub = esc(e.company || '');
      const bul = (e.bulletPoints || [])
        .filter((b) => b?.trim())
        .map((b) => `<li>${esc(b)}</li>`)
        .join('');
      return `<div class="entry">
        <div class="row"><span class="title">${t}</span>${d ? `<span class="date">${esc(d)}</span>` : ''}</div>
        ${sub ? `<div class="sub">${sub}</div>` : ''}
        ${bul ? `<ul>${bul}</ul>` : ''}
      </div>`;
    })
    .join('');
}

function eduBlock(c: ResumeBuilderContent): string {
  if (!c.education?.length) return '';
  return c.education
    .map((e) => {
      const deg = [e.degree, e.major].filter(Boolean).join(' in ');
      const d = dateRange(e.startDate, e.endDate);
      const school = esc(e.school || '');
      const cw = e.coursework?.trim();
      return `<div class="entry">
        <div class="row"><span class="title">${esc(deg || 'Degree')}</span>${d ? `<span class="date">${esc(d)}</span>` : ''}</div>
        ${school ? `<div class="sub">${school}</div>` : ''}
        ${cw ? `<div class="note"><em>Relevant Coursework:</em> ${esc(cw)}</div>` : ''}
      </div>`;
    })
    .join('');
}

function skillsInline(c: ResumeBuilderContent): string {
  const s = c.skills?.map((sk) => sk?.trim()).filter(Boolean);
  return s?.length ? esc(s.join(', ')) : '';
}

function projBlock(c: ResumeBuilderContent): string {
  if (!c.projects?.length) return '';
  return c.projects
    .map((p) => {
      const n = esc(p.name?.trim() || 'Project');
      const desc = p.description?.trim();
      const tech = p.technologies?.trim();
      const url = p.url?.trim();
      const urlDisp = url ? strip(url) : '';
      const urlHref = url
        ? url.startsWith('http')
          ? url
          : `https://${url}`
        : '';
      return `<div class="entry">
        <div class="row"><span class="title">${n}</span>${urlHref ? `<a href="${esc(urlHref)}" class="link">${esc(urlDisp)}</a>` : ''}</div>
        ${desc ? `<div class="body">${esc(desc)}</div>` : ''}
        ${tech ? `<div class="note">${esc(tech)}</div>` : ''}
      </div>`;
    })
    .join('');
}

function achBlock(c: ResumeBuilderContent): string {
  const items = c.achievements?.filter((a) => a.text?.trim());
  if (!items?.length) return '';
  return `<ul>${items.map((a) => `<li>${esc(a.text!)}</li>`).join('')}</ul>`;
}

function sec(title: string, content: string): string {
  if (!content) return '';
  return `<div class="section"><h2>${title}</h2>${content}</div>`;
}

function professionalTpl(c: ResumeBuilderContent): string {
  const n = fullName(c.personalInfo);
  const ci = contactItems(c.personalInfo);

  const css = `
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font:9.5pt/1.4 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#222;padding:30px 42px 24px;width:210mm}
a{color:inherit;text-decoration:none}
h1{font-size:19pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:2px}
.contact{font-size:8.5pt;color:#444;line-height:1.6}
.contact a:hover{text-decoration:underline}
.section{margin-top:11px}
h2{font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #000;padding-bottom:1.5px;margin-bottom:5px}
.entry{margin-bottom:5px;break-inside:avoid}
.row{display:flex;justify-content:space-between;align-items:baseline}
.title{font-weight:700;font-size:9.5pt}
.date{font-size:8.5pt;color:#555;flex-shrink:0;margin-left:8px;white-space:nowrap}
.sub{font-style:italic;font-size:9pt;color:#444}
.note{font-size:8.5pt;color:#333;margin-top:1px}
.body{font-size:9.5pt;line-height:1.45}
ul{padding-left:14px;margin:2px 0 0}
li{margin:.5px 0;font-size:9.5pt;line-height:1.4}
.link{font-size:8pt;color:#555;margin-left:6px;flex-shrink:0}
`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body>
<h1>${esc(n)}</h1>
<div class="contact">${contactLine(ci, ' &#x22C4; ')}</div>
${sec('Professional Summary', summaryBlock(c))}
${sec('Work Experience', expBlock(c))}
${sec('Education', eduBlock(c))}
${sec('Technical Skills', skillsInline(c) ? `<p class="body">${skillsInline(c)}</p>` : '')}
${sec('Projects', projBlock(c))}
${sec('Leadership &amp; Achievements', achBlock(c))}
</body></html>`;
}

function modernTpl(c: ResumeBuilderContent): string {
  const n = fullName(c.personalInfo);
  const jt = c.personalInfo?.jobTitle || c.targetRole || '';
  const ci = contactItems(c.personalInfo);

  const css = `
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font:9.5pt/1.4 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#2d3748;width:210mm}
a{color:inherit;text-decoration:none}
.hdr{background:linear-gradient(135deg,#1a5276,#1e6b9a);color:#fff;padding:26px 42px 22px;text-align:center}
.hdr h1{font-size:20pt;font-weight:700;letter-spacing:2px;text-transform:uppercase}
.hdr .jt{font-size:10pt;opacity:.88;margin-top:3px;font-weight:400}
.hdr .contact{font-size:8pt;opacity:.78;margin-top:6px}
.hdr a{color:#fff}
.cnt{padding:18px 42px 20px}
.section{margin-top:11px}
h2{font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1a5276;border-bottom:2px solid #1a5276;padding-bottom:2px;margin-bottom:6px}
.entry{margin-bottom:5px;break-inside:avoid}
.row{display:flex;justify-content:space-between;align-items:baseline}
.title{font-weight:700;font-size:9.5pt}
.date{font-size:8.5pt;color:#718096;flex-shrink:0;margin-left:8px;white-space:nowrap}
.sub{font-size:9pt;color:#718096}
.note{font-size:8.5pt;color:#4a5568;margin-top:1px}
.body{font-size:9.5pt;line-height:1.45}
ul{padding-left:14px;margin:2px 0 0}
li{margin:.5px 0;font-size:9.5pt;line-height:1.4}
.link{font-size:8pt;color:#718096;margin-left:6px;flex-shrink:0}
`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="hdr">
  <h1>${esc(n)}</h1>
  ${jt ? `<div class="jt">${esc(jt)}</div>` : ''}
  <div class="contact">${contactLine(ci, ' &nbsp;|&nbsp; ')}</div>
</div>
<div class="cnt">
${sec('Professional Summary', summaryBlock(c))}
${sec('Work Experience', expBlock(c))}
${sec('Education', eduBlock(c))}
${sec('Technical Skills', skillsInline(c) ? `<p class="body">${skillsInline(c)}</p>` : '')}
${sec('Projects', projBlock(c))}
${sec('Leadership &amp; Achievements', achBlock(c))}
</div>
</body></html>`;
}

function minimalTpl(c: ResumeBuilderContent): string {
  const n = fullName(c.personalInfo);
  const ci = contactItems(c.personalInfo);

  const css = `
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font:9pt/1.55 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#444;padding:40px 50px 28px;width:210mm}
a{color:inherit;text-decoration:none}
h1{font-size:26pt;font-weight:300;letter-spacing:3px;text-transform:uppercase;color:#222;margin-bottom:5px}
.contact{font-size:8pt;color:#999;letter-spacing:.5px}
.contact a:hover{text-decoration:underline}
.section{margin-top:16px}
h2{font-size:8pt;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#999;border-bottom:.5px solid #ddd;padding-bottom:4px;margin-bottom:7px}
.entry{margin-bottom:7px;break-inside:avoid}
.row{display:flex;justify-content:space-between;align-items:baseline}
.title{font-weight:600;font-size:9pt;color:#222}
.date{font-size:8pt;color:#aaa;flex-shrink:0;margin-left:8px;white-space:nowrap}
.sub{font-size:8.5pt;color:#888}
.note{font-size:8pt;color:#888;margin-top:1px}
.body{font-size:9pt;line-height:1.55;color:#555}
ul{padding-left:14px;margin:2px 0 0;color:#555}
li{margin:1px 0;font-size:9pt;line-height:1.5}
.link{font-size:7.5pt;color:#aaa;margin-left:6px;flex-shrink:0}
`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body>
<h1>${esc(n)}</h1>
<div class="contact">${contactLine(ci, ' &middot; ')}</div>
${sec('Summary', summaryBlock(c))}
${sec('Experience', expBlock(c))}
${sec('Education', eduBlock(c))}
${sec('Skills', skillsInline(c) ? `<p class="body">${skillsInline(c)}</p>` : '')}
${sec('Projects', projBlock(c))}
${sec('Achievements', achBlock(c))}
</body></html>`;
}

function executiveTpl(c: ResumeBuilderContent): string {
  const n = fullName(c.personalInfo);
  const jt = c.personalInfo?.jobTitle || c.targetRole || '';
  const ci = contactItems(c.personalInfo);
  const skills = c.skills?.map((s) => s?.trim()).filter(Boolean) || [];

  const css = `
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:210mm;min-height:297mm}
body{font:9pt/1.4 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#222;display:flex}
a{color:inherit;text-decoration:none}
.side{width:68mm;background:#1a2332;color:#cbd5e1;padding:30px 16px;min-height:297mm;flex-shrink:0}
.side h1{font-size:15pt;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;line-height:1.2;margin-bottom:3px}
.side .jt{font-size:8.5pt;color:#94a3b8;margin-bottom:14px}
.side h2{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;border-bottom:.5px solid #334155;padding-bottom:3px;margin-bottom:6px;margin-top:16px}
.ci{font-size:7.5pt;margin:3px 0;word-break:break-all;line-height:1.5}
.ci a:hover{text-decoration:underline}
.tag{display:inline-block;font-size:7.5pt;background:#334155;color:#e2e8f0;padding:2px 7px;margin:2px 2px;border-radius:3px}
.main{flex:1;padding:30px 34px 24px}
.section{margin-top:11px}
.main h2{font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#1a2332;border-bottom:1.5px solid #1a2332;padding-bottom:1.5px;margin-bottom:5px}
.entry{margin-bottom:5px;break-inside:avoid}
.row{display:flex;justify-content:space-between;align-items:baseline}
.title{font-weight:700;font-size:9pt}
.date{font-size:8pt;color:#718096;flex-shrink:0;margin-left:8px;white-space:nowrap}
.sub{font-size:8.5pt;color:#718096}
.note{font-size:8pt;color:#4a5568;margin-top:1px}
.body{font-size:9pt;line-height:1.45}
ul{padding-left:12px;margin:2px 0 0}
li{margin:.5px 0;font-size:9pt;line-height:1.4}
.link{font-size:7.5pt;color:#718096;margin-left:6px;flex-shrink:0}
`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="side">
  <h1>${esc(n)}</h1>
  ${jt ? `<div class="jt">${esc(jt)}</div>` : ''}
  <h2>Contact</h2>
  ${contactStack(ci)}
  ${skills.length ? `<h2>Skills</h2><div>${skills.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}
</div>
<div class="main">
${sec('Professional Summary', summaryBlock(c))}
${sec('Work Experience', expBlock(c))}
${sec('Education', eduBlock(c))}
${sec('Projects', projBlock(c))}
${sec('Leadership &amp; Achievements', achBlock(c))}
</div>
</body></html>`;
}

export function generateResumeHtml(
  content: ResumeBuilderContent,
  templateId: ResumeBuilderTemplateId,
): string {
  switch (templateId) {
    case 'modern':
      return modernTpl(content);
    case 'minimal':
      return minimalTpl(content);
    case 'executive':
      return executiveTpl(content);
    case 'professional':
    default:
      return professionalTpl(content);
  }
}
