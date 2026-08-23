type Props = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  alt: string;
};

export function PageHero({ title, subtitle, description, image, alt }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div className="absolute inset-0">
        <img src={image} alt={alt} className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] to-transparent" />
      </div>
      <div className="absolute right-0 top-0 hidden h-full w-[55%] lg:block">
        <img src={image} alt="" className="h-full w-full object-cover object-left opacity-90" style={{ maskImage: "linear-gradient(to left, black 60%, transparent)" }} />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#050507]" />
      </div>
      <div className="relative mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <h1 className="text-6xl font-black tracking-tight sm:text-7xl lg:text-[84px] lg:leading-none" style={{ fontFamily: "Impact, sans-serif", letterSpacing: "-0.02em" }}>
            {title}
          </h1>
          <p className="mt-2 text-lg font-bold tracking-[0.2em] text-[#E8B86A] sm:text-xl">{subtitle}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">{description}</p>
        </div>
      </div>
    </section>
  );
}
