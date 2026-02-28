const DeploymentCTA = () => {
  return (
    <section className="bg-[hsl(var(--navy))] py-16 sm:py-20 lg:py-24" aria-label="Request deployment">
      <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          Ready To Deploy Equipment To Your Project Site?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:mt-6 sm:text-lg">
          Request a deployment plan. Our team will align fleet availability and site support to your timeline.
        </p>
        <div className="mt-10">
          <a href="/contact" className="btn-cta-on-dark">
            Request Deployment Plan
          </a>
        </div>
      </div>
    </section>
  );
};

export default DeploymentCTA;
