import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Dialog({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-heading"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id="dialog-heading">{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label={closeLabel}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
