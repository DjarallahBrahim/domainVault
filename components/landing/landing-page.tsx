import { NavBar } from "./navbar";
import { HeroSection } from "./hero-section";
import { MarketplacesSection } from "./marketplaces-section";
import { FeaturesSection } from "./features-section";
import { ComparisonSection } from "./comparison-section";
import { AnalyticsSection } from "./analytics-section";
import { ExpirySection } from "./expiry-section";
import { WorkflowSection } from "./workflow-section";
import { CtaSection } from "./cta-section";
import { Footer } from "./footer";

interface LandingPageProps {
  isAuthenticated: boolean;
}

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  const ctaHref = isAuthenticated ? "/dashboard" : "/register";

  return (
    <div className="landing min-h-screen bg-background text-foreground">
      <NavBar ctaHref={ctaHref} />
      <HeroSection ctaHref={ctaHref} />
      <MarketplacesSection />
      <AnalyticsSection />
      <FeaturesSection />
      <ComparisonSection />
      <ExpirySection ctaHref={ctaHref} />
      <WorkflowSection />
      <CtaSection ctaHref={ctaHref} />
      <Footer />
    </div>
  );
}
