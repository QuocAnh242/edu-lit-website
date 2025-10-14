import Navbar from '../../components/shared/navbar';
import { Footer } from './components/footer';
import { LiteratureHero } from './components/literature-hero';
import { Features } from './components/features';
import { HowItWorks } from './components/how-it-works';
import { Testimonials } from './components/testimonials';
import { CallToAction } from './components/call-to-action';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <LiteratureHero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
