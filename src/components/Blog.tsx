import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { getHapyjoImage } from "@/lib/hapyjo-images";
import { getBlogPostBySlug } from "@/lib/blog-posts";
import { BLOG_STATIC_PAGES } from "@/lib/static-routes";

const Blog = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      id="blog"
      ref={ref as React.RefObject<HTMLElement>}
      className={`bg-stone py-16 sm:py-20 lg:py-24 ${isVisible ? "opacity-100" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-equipment-yellow">
            Insights
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-4xl">
            Blog
          </h2>
          <div className="divider-industrial mt-4 mx-auto" />
          <p className="mt-4 max-w-2xl mx-auto text-sm text-steel sm:mt-6 sm:text-base">
            Fleet, site control, and construction logistics expertise from HapyJo.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {BLOG_STATIC_PAGES.map(({ slug, file }) => {
            const post = getBlogPostBySlug(slug);
            if (!post) return null;
            const previewSrc = getHapyjoImage(post.heroImageIndex);
            return (
              <a
                key={file}
                href={`/${file}`}
                className="block overflow-hidden rounded-xl border border-border bg-card transition-[background-color,border-color] hover:bg-stone hover:border-stone-dark"
              >
                {previewSrc && (
                  <div className="aspect-[16/10] overflow-hidden bg-stone">
                    <img
                      src={previewSrc}
                      alt={`${post.title} – HapyJo blog`}
                      className="h-full w-full object-cover image-industrial"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-8">
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {post.shortDescription}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
        <div className="mt-10 flex justify-center">
          <a href="/blog" className="btn-cta">
            Read All Insights
          </a>
        </div>
      </div>
    </section>
  );
};

export default Blog;
