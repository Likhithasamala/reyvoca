import { Check } from "lucide-react";
import { featureStories } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { StoryVisual } from "./story-visuals";

export function FeatureStories() {
  return (
    <section aria-label="Product features" className="py-24 lg:py-32">
      <Container className="space-y-24 lg:space-y-32">
        {featureStories.map((story, index) => {
          const flipped = index % 2 === 1;
          return (
            <article
              key={story.title}
              className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24"
              aria-labelledby={`story-${story.visual}`}
            >
              <div className={cn(flipped && "lg:order-2")}>
                <p className="text-xs font-semibold tracking-[0.08em] text-brand uppercase">{story.eyebrow}</p>
                <h2 id={`story-${story.visual}`} className="mt-3 text-h3 font-semibold text-ink text-balance">
                  {story.title}
                </h2>
                <p className="mt-4 max-w-lg text-lead text-ink-muted text-pretty">{story.description}</p>
                <ul className="mt-7 space-y-3">
                  {story.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-[0.9375rem] text-ink">
                      <Check className="mt-0.5 size-[18px] shrink-0 text-brand" strokeWidth={2.25} aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cn("reveal relative isolate", flipped && "lg:order-1")}>
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 -z-10 rounded-[32px] bg-linear-to-br from-brand-softer via-white to-surface-muted sm:-inset-8"
                />
                <div aria-hidden="true">
                  <StoryVisual visual={story.visual} />
                </div>
              </div>
            </article>
          );
        })}
      </Container>
    </section>
  );
}
