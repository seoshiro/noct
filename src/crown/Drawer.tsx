import { useLayoutEffect, useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
export default function Drawer({
  open,
  title,
  onClose,
  reduce,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  reduce: boolean;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    panel = useRef<HTMLDivElement>(null),
    focus = useRef<HTMLElement | null>(null),
    current = useRef(open);
  current.current = open;
  useLayoutEffect(() => {
    const d = dialog.current!,
      p = panel.current!;
    gsap.killTweensOf(p);
    if (open) {
      if (!d.open) {
        focus.current = document.activeElement as HTMLElement;
        d.showModal();
        gsap.set(p, { x: reduce ? 0 : 25, opacity: 0 });
      }
      document.body.style.overflow = "hidden";
      gsap.to(p, {
        x: 0,
        opacity: 1,
        duration: reduce ? 0 : 0.26,
        ease: "power3.out",
        overwrite: true,
      });
      d.querySelector<HTMLButtonElement>(".drawer-close")?.focus();
    } else if (d.open) {
      gsap.to(p, {
        x: reduce ? 0 : 25,
        opacity: 0,
        duration: reduce ? 0 : 0.2,
        overwrite: true,
        onComplete: () => {
          if (current.current) return;
          d.close();
          document.body.style.overflow = "";
          focus.current?.focus({ preventScroll: true });
        },
      });
    }
    return () => {
      gsap.killTweensOf(p);
    };
  }, [open, reduce]);
  useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    [],
  );
  return (
    <dialog
      className="crown-dialog"
      ref={dialog}
      aria-labelledby="drawer-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="crown-drawer" ref={panel}>
        <div className="drawer-heading">
          <span>NOCT / PARFUMS DE NUIT</span>
          <button className="drawer-close" aria-label={title} onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
