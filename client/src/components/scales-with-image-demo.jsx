import { cn } from "@/lib/utils";
import { Scales } from "@/components/ui/scales";

const VARIANT = {
  lg: {
    shell: "max-w-[288px] min-h-[320px]",
    armThickV: "w-8",
    armThickH: "h-8",
    armLeft: "-left-10",
    armRight: "-right-10",
    armTop: "-top-10",
    armBottom: "-bottom-10",
  },
  md: {
    shell: "max-w-[248px] min-h-[276px]",
    armThickV: "w-7",
    armThickH: "h-7",
    armLeft: "-left-9",
    armRight: "-right-9",
    armTop: "-top-9",
    armBottom: "-bottom-9",
  },
  sm: {
    shell: "max-w-[200px] min-h-[220px]",
    armThickV: "w-6",
    armThickH: "h-6",
    armLeft: "-left-8",
    armRight: "-right-8",
    armTop: "-top-8",
    armBottom: "-bottom-8",
  },
  /** Wide column — capability-style blocks */
  column: {
    shell: "w-full min-h-[360px]",
    armThickV: "w-8",
    armThickH: "h-8",
    armLeft: "-left-10",
    armRight: "-right-10",
    armTop: "-top-10",
    armBottom: "-bottom-10",
  },
};

const INNER_MIN = {
  lg: "min-h-[320px]",
  md: "min-h-[276px]",
  sm: "min-h-[220px]",
  column: "min-h-[360px]",
};

const ARM_COLOR = "rgba(228, 228, 231, 0.11)";

/** Aceternity-style scales frame (shadcn `@aceternity/scales-with-image-demo`): hatched arms + inner panel. */
export function ScalesFramedBox({ children, className, innerClassName, scalesSize = 8, variant = "md" }) {
  const v = VARIANT[variant] ?? VARIANT.md;
  const innerMin = INNER_MIN[variant] ?? INNER_MIN.md;

  return (
    <div className={cn("relative flex w-full justify-center overflow-visible py-2", className)}>
      <div className={cn("relative mx-auto flex w-full flex-col", v.shell)}>
        <div
          className={cn(
            "pointer-events-none absolute -inset-y-[30%] z-0 h-[160%] landing-scales-arm-v",
            v.armLeft,
            v.armThickV,
          )}
        >
          <Scales size={scalesSize} color={ARM_COLOR} className="rounded-md" />
        </div>
        <div
          className={cn(
            "pointer-events-none absolute -inset-y-[30%] z-0 h-[160%] landing-scales-arm-v",
            v.armRight,
            v.armThickV,
          )}
        >
          <Scales size={scalesSize} color={ARM_COLOR} className="rounded-md" />
        </div>
        <div
          className={cn(
            "pointer-events-none absolute -inset-x-[30%] z-0 w-[160%] landing-scales-arm-h",
            v.armTop,
            v.armThickH,
          )}
        >
          <Scales size={scalesSize} color={ARM_COLOR} className="rounded-md" />
        </div>
        <div
          className={cn(
            "pointer-events-none absolute -inset-x-[30%] z-0 w-[160%] landing-scales-arm-h",
            v.armBottom,
            v.armThickH,
          )}
        >
          <Scales size={scalesSize} color={ARM_COLOR} className="rounded-md" />
        </div>

        <div
          className={cn(
            "relative z-10 flex w-full flex-1 flex-col overflow-hidden bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.07)]",
            innerMin,
            innerClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Stock Aceternity demo — useful for Storybook / reference; landing uses `ScalesFramedBox` with Covenant content. */
export function ScalesWithImageDemo() {
  return (
    <div className="relative mx-auto flex w-full items-center justify-center overflow-hidden py-10 md:py-20">
      <ScalesFramedBox variant="lg" innerClassName="bg-neutral-900/80 p-0">
        <img
          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop"
          alt=""
          className="h-full min-h-[320px] w-full flex-1 object-cover"
          loading="lazy"
        />
      </ScalesFramedBox>
    </div>
  );
}

export default ScalesWithImageDemo;
