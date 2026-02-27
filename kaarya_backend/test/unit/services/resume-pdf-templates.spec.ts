import { generateResumeHtml } from 'src/services/resume-pdf-templates';

describe('resume-pdf-templates', () => {
  const fullContent = {
    personalInfo: {
      firstName: 'Alex',
      lastName: 'Doe',
      jobTitle: 'Backend Engineer',
      email: 'alex@example.com',
      phone: '123456789',
      city: 'Kathmandu',
      country: 'Nepal',
      linkedin: 'linkedin.com/in/alexdoe',
      github: 'github.com/alexdoe',
      portfolio: 'alex.dev',
    },
    professionalSummary: 'Build APIs & <secure> systems',
    targetRole: 'Senior Backend Engineer',
    experience: [
      {
        position: 'Software Engineer',
        company: 'Acme',
        startDate: '2023-01-01',
        endDate: '2024-01-01',
        currentlyWorking: false,
        bulletPoints: ['Built REST APIs', 'Improved latency by 40%', ''],
      },
      {
        position: 'Lead Engineer',
        company: 'Beta',
        startDate: '2024-02-01',
        currentlyWorking: true,
        bulletPoints: ['Led platform roadmap'],
      },
    ],
    education: [
      {
        degree: 'BSc',
        major: 'Computer Science',
        school: 'Tech University',
        startDate: '2019-01-01',
        endDate: '2022-01-01',
        coursework: 'Algorithms, Networks',
      },
    ],
    skills: ['Node.js', 'TypeScript', 'System Design'],
    projects: [
      {
        name: 'Platform Revamp',
        description: 'Redesigned architecture',
        technologies: 'Node.js, Redis',
        url: 'platform.example.com',
      },
      {
        name: 'No URL Project',
        description: 'Internal tooling',
      },
    ],
    achievements: [{ text: 'Won hackathon' }, { text: '' }],
  } as never;

  it('should render professional template with escaped and normalized values', () => {
    const html = generateResumeHtml(fullContent, 'professional');

    expect(html).toContain('ALEX DOE'.toLowerCase().replace(' ', '')); // basic presence guard via content
    expect(html).toContain('Alex Doe');
    expect(html).toContain('mailto:alex@example.com');
    expect(html).toContain('linkedin.com/in/alexdoe');
    expect(html).toContain('github.com/alexdoe');
    expect(html).toContain('https://alex.dev');
    expect(html).toContain('Build APIs &amp; &lt;secure&gt; systems');
    expect(html).toContain('Present');
    expect(html).toContain('Jan 2023');
    expect(html).toContain('Jan 2024');
    expect(html).toContain('Relevant Coursework');
    expect(html).toContain('https://platform.example.com');
    expect(html).toContain('Won hackathon');
  });

  it('should render modern template with header/job title and section blocks', () => {
    const html = generateResumeHtml(fullContent, 'modern');

    expect(html).toContain('linear-gradient');
    expect(html).toContain('Backend Engineer');
    expect(html).toContain('Technical Skills');
    expect(html).toContain('Leadership &amp; Achievements');
    expect(html).toContain('&nbsp;|&nbsp;');
  });

  it('should render minimal template with clean separators', () => {
    const html = generateResumeHtml(fullContent, 'minimal');

    expect(html).toContain('Summary');
    expect(html).toContain('Experience');
    expect(html).toContain('Education');
    expect(html).toContain('&middot;');
  });

  it('should render executive template with side contact/skills blocks', () => {
    const html = generateResumeHtml(fullContent, 'executive');

    expect(html).toContain('class="side"');
    expect(html).toContain('<h2>Contact</h2>');
    expect(html).toContain('class="tag"');
    expect(html).toContain('Node.js');
    expect(html).toContain('Professional Summary');
  });

  it('should fallback to professional template and handle empty content defaults', () => {
    const html = generateResumeHtml(
      {
        personalInfo: null,
        professionalSummary: '',
        targetRole: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        achievements: [],
      } as never,
      'unknown-template' as never,
    );

    expect(html).toContain('Your Name');
    expect(html).toContain('<h1>Your Name</h1>');
    expect(html).not.toContain('<h2>Professional Summary</h2>');
    expect(html).not.toContain('<h2>Work Experience</h2>');
  });
});

