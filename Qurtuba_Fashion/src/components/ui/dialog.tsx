"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "./utils";

// Hook to manage body scroll lock
function useBodyScrollLock(isLocked: boolean) {
  React.useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocked]);
}

function Dialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  useBodyScrollLock(open);

  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        if (!isControlled) {
          setUncontrolledOpen(nextOpen);
        }
        onOpenChange?.(nextOpen);
      }}
      {...props}
    />
  );
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="dialog-overlay"
    className={cn(
      "fixed inset-0 z-[999] bg-slate-950/70 backdrop-blur data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { fullScreen?: boolean }
>(({ className, children, fullScreen = false, ...props }, ref) => (
  <DialogPortal data-slot="dialog-portal">
    <DialogOverlay />
    <div className="fixed inset-0 z-[1000] overflow-y-auto">
      <div
        className={cn(
          "flex min-h-full",
          fullScreen ? "items-stretch justify-start p-0" : "items-center justify-center p-4 sm:p-6",
        )}
      >
        <DialogPrimitive.Content
          ref={ref}
          data-slot="dialog-content"
          className={cn(
            fullScreen
              ? "fixed inset-0 flex h-[100dvh] w-[100vw] max-h-none max-w-none flex-col overflow-hidden rounded-none bg-background text-foreground outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
              : "relative flex max-h-[calc(100dvh-3rem)] w-full max-w-[min(100vw-2rem,90rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background text-foreground shadow-[0_20px_70px_rgba(15,23,42,0.35)] outline-none ring-1 ring-border/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-h-[calc(100dvh-4rem)]",
            className,
          )}
          onEscapeKeyDown={(event: Event) => {
            event.preventDefault();
          }}
          onInteractOutside={(event: Event) => {
            event.preventDefault();
          }}
          {...props}
        >
          <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {children}
          </div>
        </DialogPrimitive.Content>
      </div>
    </div>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "sticky top-0 z-10 flex flex-col gap-2 border-b border-border/60 bg-gradient-to-b from-background/92 via-background/95 to-background/98 p-6 pb-4 text-center shadow-[0_10px_30px_-20px_rgba(15,23,42,0.75)] sm:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "sticky bottom-0 mt-auto z-10 flex flex-col-reverse gap-2 border-t border-border/60 bg-gradient-to-t from-background/92 via-background/95 to-background/98 p-6 pt-4 shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.65)] sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
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
};
