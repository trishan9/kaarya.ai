import { Container } from "./Container";

const faqs = [
  [
    {
      question: "How does the AI resume builder work?",
      answer:
        "Our AI analyzes your experience, skills, and target job descriptions to generate ATS-optimized resumes. Just fill in your profile and let Kaarya craft the perfect resume for each application.",
    },
    {
      question: "Is Kaarya free to use?",
      answer:
        "Yes! Our Starter plan is completely free and includes core features like resume building, basic job matching, and limited interview prep. Upgrade to Pro for unlimited access.",
    },
    {
      question: "Can I use Kaarya for multiple job applications?",
      answer:
        "Absolutely. You can create tailored resumes for different roles and track all your applications from a single dashboard. Pro users get unlimited resume versions.",
    },
  ],
  [
    {
      question: "How does smart job matching work?",
      answer:
        "Our AI analyzes your skills, experience, preferences, and career trajectory to surface the most relevant job opportunities. The more you use Kaarya, the smarter the recommendations get.",
    },
    {
      question: "What kind of interview prep does Kaarya offer?",
      answer:
        "AI-powered mock interviews customized to your target role and company. You'll get real-time feedback on your answers, body language tips, and areas for improvement.",
    },
    {
      question: "Can recruiters use Kaarya too?",
      answer:
        "Yes! Recruiters get a dedicated workspace to post jobs, manage applicants, schedule interviews, and collaborate with their hiring team — all powered by AI matching.",
    },
  ],
  [
    {
      question: "Is my data secure on Kaarya?",
      answer:
        "We take data security seriously. All data is encrypted at rest and in transit. We never share your personal information with third parties without your explicit consent.",
    },
    {
      question: "Can colleges use Kaarya for placements?",
      answer:
        "Absolutely. Colleges get a dedicated portal to manage student placements, track career outcomes, and connect with top employers through our Enterprise plan.",
    },
    {
      question: "How is Kaarya different from LinkedIn?",
      answer:
        "While LinkedIn is a social network, Kaarya is a career acceleration platform. We provide AI-powered tools that actively help you build better resumes, prepare for interviews, and get matched to the right jobs.",
    },
  ],
];

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-32"
    >
      {/* Top gradient line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />

      <Container className="relative">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl"
          >
            Frequently asked questions
          </h2>

          <p className="mt-4 text-lg tracking-tight text-slate-700">
            If you can&apos;t find what you&apos;re looking for, email our support team
            and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="text-lg font-medium leading-7 text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-700">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
