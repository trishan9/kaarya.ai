import { Container } from "./Container";

const faqs = [
  {
    question: "How does the AI resume builder work?",
    answer:
      "Kaarya analyzes your profile details and target job context to help generate stronger resume content for candidate workflows.",
  },
  {
    question: "What is included in the Free plan?",
    answer:
      "Free gives candidates access to the resume builder, job discovery, saved jobs, dashboard features, and up to 5 interview sessions per month.",
  },
  {
    question: "What changes after upgrading to Pro?",
    answer:
      "Pro unlocks unlimited interview sessions and is managed through Stripe checkout and Stripe billing portal.",
  },
  {
    question: "Do recruiters need to buy Pro?",
    answer:
      "No. Recruiter accounts currently use the platform with full workspace access and do not need a separate Pro plan.",
  },
  {
    question: "Do colleges need to buy Pro?",
    answer:
      "No. College accounts also get their current workspace access without a separate Pro billing step.",
  },
  {
    question: "How does Stripe billing work?",
    answer:
      "Candidates can upgrade to Pro through Stripe checkout and manage payment methods, bills, and invoice history inside Stripe portal.",
  },
  {
    question: "Is my data secure on Kaarya?",
    answer:
      "We treat user data carefully and keep platform security controls in place for authentication, stored information, and account access.",
  },
  {
    question: "Can I cancel or manage billing later?",
    answer:
      "Yes. Billing management is handled through Stripe portal, where eligible candidate accounts can manage payment details and invoices.",
  },
  {
    question: "How is Kaarya different from a job board?",
    answer:
      "Kaarya combines candidate tools, interview preparation, recruiter workspaces, and college workflows in one product instead of only listing jobs.",
  },
];

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-32"
    >
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
            The landing page now reflects the current product plan structure and
            billing flow.
          </p>
        </div>

        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-none xl:grid-cols-3"
        >
          {faqs.map((faq) => (
            <li
              key={faq.question}
              className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6"
            >
              <h3 className="text-lg font-medium leading-7 text-slate-900">
                {faq.question}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                {faq.answer}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
