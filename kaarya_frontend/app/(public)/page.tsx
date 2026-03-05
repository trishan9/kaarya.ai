import { getCurrentUser } from "@/lib/dal";
import { Header } from "./_components/Header";
import { Hero } from "./_components/Hero";
import { PrimaryFeatures } from "./_components/PrimaryFeatures";
import { Testimonials } from "./_components/Testimonials";
import { Pricing } from "./_components/Pricing";
import { Faqs } from "./_components/Faqs";
import { CallToAction } from "./_components/CallToAction";
import { Footer } from "./_components/Footer";

export default async function Home() {
  const currentUser = await getCurrentUser();
  const isLoggedIn = !!currentUser;

  return (
    <div className="flex h-full flex-col scroll-smooth bg-white antialiased">
      <Header isLoggedIn={isLoggedIn} />

      <main>
        <Hero />
        <PrimaryFeatures />
        <Testimonials />
        <Pricing />
        <Faqs />
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
