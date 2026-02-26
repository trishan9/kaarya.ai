import { Container } from "./Container";

const testimonials = [
  [
    {
      content:
        "Kaarya's AI resume builder completely transformed my job search. I went from zero callbacks to landing three interviews in the first week.",
      author: {
        name: "Priya Sharma",
        role: "Software Engineer at Google",
      },
    },
    {
      content:
        "The smart job matching is eerily accurate. It recommended a role I wouldn't have found on my own — and I got it.",
      author: {
        name: "Rahul Verma",
        role: "Product Manager at Flipkart",
      },
    },
  ],
  [
    {
      content:
        "I used the AI interview prep before my final round. The mock questions were almost identical to what they actually asked. Absolutely worth it.",
      author: {
        name: "Ananya Patel",
        role: "Data Scientist at Microsoft",
      },
    },
    {
      content:
        "As a college placement officer, Kaarya has cut our coordination time in half. Students get matched to the right companies automatically.",
      author: {
        name: "Dr. Suresh Nair",
        role: "Placement Director at IIT Delhi",
      },
    },
  ],
  [
    {
      content:
        "The portfolio builder gave me a professional online presence in minutes. Recruiters actually reach out to me now instead of the other way around.",
      author: {
        name: "Meera Joshi",
        role: "UX Designer at Razorpay",
      },
    },
    {
      content:
        "We switched our entire hiring pipeline to Kaarya. The quality of applicants we see has gone up significantly with their AI matching.",
      author: {
        name: "Vikram Singh",
        role: "Head of HR at TCS",
      },
    },
  ],
];

function QuoteIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg aria-hidden="true" width={105} height={78} {...props}>
      <path d="M25.086 77.292c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622C1.054 58.534 0 53.411 0 47.686c0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C28.325 3.917 33.599 1.507 39.324 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Zm54.24 0c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622-2.11-4.52-3.164-9.643-3.164-15.368 0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C82.565 3.917 87.839 1.507 93.564 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Z" />
    </svg>
  );
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-label="What our users are saying"
      className="relative bg-slate-50 py-20 sm:py-32"
    >
      {/* Top gradient line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />

      <Container>
        <div className="mx-auto max-w-2xl md:text-center">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
            Loved by professionals worldwide.
          </h2>

          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Thousands of job seekers, recruiters, and institutions trust Kaarya.ai
            to streamline their career journey.
          </p>
        </div>

        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:mt-20 lg:max-w-none lg:grid-cols-3"
        >
          {testimonials.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-6 sm:gap-y-8">
                {column.map((testimonial, testimonialIndex) => (
                  <li key={testimonialIndex}>
                    <figure className="relative rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/15">
                      <QuoteIcon className="absolute left-6 top-6 fill-slate-100" />

                      <blockquote className="relative">
                        <p className="text-lg tracking-tight text-slate-900">
                          {testimonial.content}
                        </p>
                      </blockquote>

                      <figcaption className="relative mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
                        <div>
                          <div className="text-base font-medium text-slate-900">
                            {testimonial.author.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {testimonial.author.role}
                          </div>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                          <span className="text-lg font-semibold text-primary">
                            {testimonial.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                      </figcaption>
                    </figure>
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
