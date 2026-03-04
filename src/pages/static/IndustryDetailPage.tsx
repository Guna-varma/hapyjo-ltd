import { Layout } from "@/components/Layout";
import { getHapyjoImage } from "@/lib/hapyjo-images";
import { getIndustryById } from "@/lib/industries-data";
import type { StaticPageId } from "@/lib/static-routes";
import { ContactCTA } from "@/components/ContactCTA";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function IndustryDetailPage({ pageId }: { pageId: StaticPageId }) {
  const industry = getIndustryById(pageId);

  if (!industry) {
    return (
      <Layout>
        <section className="section-industrial bg-background">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground">Industry not found</h1>
            <a
              href="/industries"
              className="mt-6 inline-flex items-center gap-2 btn-cta"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Industries
            </a>
          </div>
        </section>
      </Layout>
    );
  }

  const heroSrc = getHapyjoImage(industry.imageIndex);

  return (
    <Layout>
      <article className="bg-background">
        {/* Hero / back + title */}
        <div className="border-b border-stone-dark bg-stone/50 py-8 sm:py-10">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <a
              href="/industries"
              className="inline-flex items-center gap-2 text-sm font-semibold text-steel transition-colors hover:text-navy"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to Industries
            </a>
            <h1 className="font-heading mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {industry.title}
            </h1>
            <p className="mt-2 text-base font-medium text-equipment-yellow sm:text-lg">
              {industry.tagline}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          {/* Hero image */}
          {heroSrc && (
            <div className="overflow-hidden rounded-2xl border border-border shadow-soft-lg">
              <div className="responsive-image-container">
                <img
                  src={heroSrc}
                  alt=""
                  className="image-industrial"
                  loading="eager"
                />
              </div>
            </div>
          )}

          {/* Intro */}
          <p className="mt-8 text-lg leading-relaxed text-foreground sm:mt-10">
            {industry.intro}
          </p>

          {/* Paragraphs */}
          <div className="mt-8 space-y-6">
            {industry.paragraphs.map((para, i) => (
              <p key={i} className="text-base leading-relaxed text-muted-foreground">
                {para}
              </p>
            ))}
          </div>

          {/* Offerings */}
          <div className="mt-10 rounded-2xl border border-border bg-card/60 p-6 shadow-soft sm:mt-12 sm:p-8">
            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              {industry.offeringsTitle}
            </h2>
            <ul className="mt-4 space-y-3 sm:mt-6">
              {industry.offerings.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-equipment-yellow mt-0.5" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Capabilities */}
          <div className="mt-8 rounded-2xl border border-border bg-stone/50 p-6 sm:mt-10 sm:p-8">
            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              {industry.capabilitiesTitle}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2 sm:mt-6">
              {industry.capabilities.map((item, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-background px-4 py-2 text-sm font-medium text-foreground shadow-soft"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <p className="mt-8 text-center text-base font-medium text-foreground sm:mt-10">
            {industry.ctaLine}
          </p>

          <ContactCTA />
        </div>
      </article>
    </Layout>
  );
}
