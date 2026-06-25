import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

// Geometry follows design.md §7.5: pill radius, 14px semibold, 4px gap, 20px icon.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-pill text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Default = dark action button (.btn-dark, §7.5). Brand `primary`
        // (Leaf) stays available via the explicit `primary` variant.
        default:
          "bg-button text-button-foreground hover:bg-button-hover",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        // End-call style (.btn-end) — Error/500.
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-grey-400 bg-white shadow-100 hover:bg-grey-200",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        "default": "px-3 py-1.5 has-[>svg]:px-3",
        "sm": "px-2.5 py-1 has-[>svg]:px-2.5",
        "lg": "px-6 py-2 has-[>svg]:px-4",
        "icon": "size-8",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
