import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-slate-950/28 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    ref={ref}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

function getSheetSideClasses(side: 'top' | 'right' | 'bottom' | 'left'): string {
  switch (side) {
    case 'left':
      return 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 sm:max-w-sm';
    case 'right':
      return 'inset-y-0 right-0 h-full w-[min(560px,100vw)] border-l data-[state=closed]:translate-x-full data-[state=open]:translate-x-0';
    case 'top':
      return 'inset-x-0 top-0 border-b data-[state=closed]:-translate-y-full data-[state=open]:translate-y-0';
    case 'bottom':
      return 'inset-x-0 bottom-0 border-t data-[state=closed]:translate-y-full data-[state=open]:translate-y-0';
  }
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideOverlay?: boolean;
    overlayClassName?: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
  }
>(
  (
    { children, className, hideOverlay = false, overlayClassName, side = 'right', ...props },
    ref,
  ) => (
    <SheetPortal>
      {hideOverlay ? null : <SheetOverlay className={overlayClassName} />}
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 gap-4 bg-[#fffdf9] p-0 shadow-[-24px_0_80px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out data-[state=closed]:opacity-100 data-[state=open]:opacity-100',
          getSheetSideClasses(side),
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  ),
);
SheetContent.displayName = DialogPrimitive.Content.displayName;

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end', className)} {...props} />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
