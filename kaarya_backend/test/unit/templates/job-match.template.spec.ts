import { buildJobMatchEmail } from 'src/templates/email/job-match.template';

describe('buildJobMatchEmail', () => {
  it('should render excellent match with all details', () => {
    const result = buildJobMatchEmail({
      brandName: 'Kaarya',
      userName: '  Alex Doe  ',
      jobTitle: 'Senior Backend Engineer',
      companyName: 'Acme Corp',
      companyLogo: 'https://img.example.com/company.png',
      location: 'Remote, Nepal',
      workMode: 'remote',
      salaryRange: '$100k-$120k',
      employmentType: 'Full Time',
      matchScore: 88,
      jobUrl: 'https://app.example.com/jobs/1',
      supportUrl: 'https://support.example.com',
      logoUrl: 'https://img.example.com/logo.png',
      primaryColor: '#112233',
    });

    expect(result.subject).toBe('Excellent Match: Senior Backend Engineer at Acme Corp');
    expect(result.html).toContain('Excellent Match');
    expect(result.html).toContain('We found a job for you, Alex');
    expect(result.html).toContain('https://img.example.com/company.png');
    expect(result.html).toContain('Location');
    expect(result.html).toContain('Remote');
    expect(result.html).toContain('Salary');
    expect(result.html).toContain('$100k-$120k');
    expect(result.html).toContain('Contact support');
    expect(result.html).toContain('#112233');
    expect(result.text).toContain('View the job: https://app.example.com/jobs/1');
    expect(result.text).toContain('Support: https://support.example.com');
  });

  it('should render strong match and omit salary when not specified', () => {
    const result = buildJobMatchEmail({
      brandName: 'Kaarya',
      userName: 'Sam',
      jobTitle: 'Frontend Engineer',
      companyName: 'Beta Inc',
      location: 'Kathmandu',
      workMode: 'hybrid',
      salaryRange: 'Compensation not specified',
      employmentType: 'Contract',
      matchScore: 60,
      jobUrl: 'https://app.example.com/jobs/2',
    });

    expect(result.subject).toBe('Strong Match: Frontend Engineer at Beta Inc');
    expect(result.html).toContain('Strong Match');
    expect(result.html).not.toContain('Salary</td>');
    expect(result.text).toContain('Work Mode: hybrid');
    expect(result.text).not.toContain('Salary:');
  });

  it('should render fallback brand, first name, and company badge when optional fields are missing', () => {
    const result = buildJobMatchEmail({
      brandName: '',
      userName: '',
      jobTitle: 'Data Engineer',
      companyName: 'Gamma',
      matchScore: 20,
      jobUrl: 'https://app.example.com/jobs/3',
    });

    expect(result.subject).toBe('New Match: Data Engineer at Gamma');
    expect(result.html).toContain('Kaarya');
    expect(result.html).toContain('there');
    expect(result.html).toContain('>G<');
    expect(result.html).toContain('tl0x4mtzklebkdsbl50b.png');
    expect(result.text).not.toContain('Support:');
  });
});

