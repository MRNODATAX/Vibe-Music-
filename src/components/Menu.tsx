import { Ellipsis, type LucideIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface MenuAction {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** draw a divider above this item */
  divider?: boolean;
}

interface MenuProps {
  items: MenuAction[];
  label?: string;
  trigger?: ReactNode;
  triggerClassName?: string;
  align?: "left" | "right";
}

/**
 * Lightweight glass dropdown. Rendered in a portal with fixed positioning so it
 * is never clipped by the scroll containers it lives in.
 */
const Menu = ({ items, label = "Opsi lainnya", trigger, triggerClassName, align = "right" }: MenuProps) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = 248;
    const height = Math.min(items.length * 42 + 24, 420);
    let left = align === "right" ? rect.right - width : rect.left;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    let top = rect.bottom + 8;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 8);
    setPos({ top, left });
  }, [open, items.length, align]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={triggerClassName ?? "icon-btn"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          setOpen((value) => !value);
        }}
      >
        {trigger ?? <Ellipsis size={18} />}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="menu glass"
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            onClick={(event) => event.stopPropagation()}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={`menu-item ${item.danger ? "is-danger" : ""} ${item.divider ? "has-divider" : ""}`}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                >
                  {Icon ? <Icon size={16} /> : <span className="menu-dot" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
};

export default Menu;
