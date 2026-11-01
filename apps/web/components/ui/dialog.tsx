/** GENERATED from the Arche identity (fixtures/identity.arche.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const dialogOverlayVariants = cva(
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50",
  {
    variants: {
      // style-surface knob: token ref + opacity choices per manifest
      overlayBackground: {
        "--foreground": "",
        "--primary": "",
        "--muted": "",
      },
      overlayOpacity: {
        0.3: "",
        0.4: "",
        0.5: "",
        0.6: "",
      },
      backdropBlur: {
        none: "backdrop-blur-none",
        sm: "backdrop-blur-sm",
        md: "backdrop-blur-md",
        lg: "backdrop-blur-lg",
      },
    },
    compoundVariants: [
      { overlayBackground: "--foreground", overlayOpacity: 0.3, className: "bg-(--foreground)/30" },
      { overlayBackground: "--foreground", overlayOpacity: 0.4, className: "bg-(--foreground)/40" },
      { overlayBackground: "--foreground", overlayOpacity: 0.5, className: "bg-(--foreground)/50" },
      { overlayBackground: "--foreground", overlayOpacity: 0.6, className: "bg-(--foreground)/60" },
      { overlayBackground: "--primary", overlayOpacity: 0.3, className: "bg-(--primary)/30" },
      { overlayBackground: "--primary", overlayOpacity: 0.4, className: "bg-(--primary)/40" },
      { overlayBackground: "--primary", overlayOpacity: 0.5, className: "bg-(--primary)/50" },
      { overlayBackground: "--primary", overlayOpacity: 0.6, className: "bg-(--primary)/60" },
      { overlayBackground: "--muted", overlayOpacity: 0.3, className: "bg-(--muted)/30" },
      { overlayBackground: "--muted", overlayOpacity: 0.4, className: "bg-(--muted)/40" },
      { overlayBackground: "--muted", overlayOpacity: 0.5, className: "bg-(--muted)/50" },
      { overlayBackground: "--muted", overlayOpacity: 0.6, className: "bg-(--muted)/60" },
    ],
    defaultVariants: {
      overlayBackground: "--foreground",
      overlayOpacity: 0.4,
      backdropBlur: "sm",
    },
  },
);

const dialogContentVariants = cva(
  "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-6",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        default: "max-w-lg",
        lg: "max-w-2xl",
        full: "rounded-none w-[min(100vw,100%)] h-[min(100dvh,100%)] max-w-none",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-(--shadow-sm)",
        md: "shadow-(--shadow-md)",
        lg: "shadow-(--shadow-lg)",
      },
      border: {
        none: "border-none",
        sm: "border",
      },
      // style-surface knob: token ref to --radius with a scale list per manifest
      radius: {
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
      // style-surface knob: motion token ref per manifest
      motion: {
        "--motion-fast":
          "duration-(--motion-fast-duration) ease-(--motion-fast-easing)",
        "--motion-normal":
          "duration-(--motion-normal-duration) ease-(--motion-normal-easing)",
      },
    },
    defaultVariants: {
      size: "default",
      shadow: "md",
      border: "sm",
      radius: "lg",
      motion: "--motion-normal",
    },
  },
);

function Dialog(
  props: React.ComponentProps<typeof DialogPrimitive.Root>,
) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>,
) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(
  props: React.ComponentProps<typeof DialogPrimitive.Portal>,
) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

interface DialogOverlayProps
  extends Omit<React.ComponentProps<typeof DialogPrimitive.Overlay>, "className">,
    VariantProps<typeof dialogOverlayVariants> {
  className?: string;
}

function DialogOverlay({
  className,
  overlayBackground,
  overlayOpacity,
  backdropBlur,
  ...props
}: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        dialogOverlayVariants({
          overlayBackground,
          overlayOpacity,
          backdropBlur,
        }),
        className,
      )}
      {...props}
    />
  );
}

interface DialogContentProps
  extends Omit<React.ComponentProps<typeof DialogPrimitive.Content>, "className">,
    VariantProps<typeof dialogOverlayVariants>,
    VariantProps<typeof dialogContentVariants> {
  className?: string;
}

function DialogContent({
  className,
  children,
  overlayBackground,
  overlayOpacity,
  backdropBlur,
  size,
  shadow,
  border,
  radius,
  motion,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay
        overlayBackground={overlayBackground}
        overlayOpacity={overlayOpacity}
        backdropBlur={backdropBlur}
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          dialogContentVariants({ size, shadow, border, radius, motion }),
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          data-slot="dialog-close"
          className="ring-offset-background focus:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-50 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          {/* Radix owns dialog behavior; this Close button only renders an X glyph */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader(props: React.ComponentProps<"div">) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...rest}
    />
  );
}

function DialogFooter(props: React.ComponentProps<"div">) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...rest}
    />
  );
}

function DialogTitle(
  props: React.ComponentProps<typeof DialogPrimitive.Title>,
) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold leading-none")}
      {...props}
    />
  );
}

function DialogDescription(
  props: React.ComponentProps<typeof DialogPrimitive.Description>,
) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm")}
      {...props}
    />
  );
}

function DialogClose(
  props: React.ComponentProps<typeof DialogPrimitive.Close>,
) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  dialogContentVariants,
  dialogOverlayVariants,
};
