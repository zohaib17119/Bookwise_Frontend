import { Button } from "@/components/ui/button";

export function PricingHero() {
  return (
    <section className="mx-auto max-w-4xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
        Pricing
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
        Accounting infrastructure for serious operations
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
        Transparent SaaS pricing for multi-company accounting workflows. USD is the billing
        source of truth. Local currency display is approximate and shown for convenience only.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button">Start free</Button>
        <Button type="button" variant="secondary">Contact sales</Button>
      </div>
    </section>
  );
}
