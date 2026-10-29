import { useEffect, useState } from "react";

interface ToastItem {
  id: number;
  message: string;
}

const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];
let counter = 0;

const emit = () => listeners.forEach((listener) => listener(items));

export const toast = (message: string) => {
  counter += 1;
  const id = counter;
  items = [...items, { id, message }].slice(-3);
  emit();
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    emit();
  }, 2600);
};

/** Renders transient confirmations ("Ditambahkan ke antrean", …). */
const ToastHost = () => {
  const [current, setCurrent] = useState<ToastItem[]>(items);

  useEffect(() => {
    listeners.add(setCurrent);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="false">
      {current.map((item) => (
        <div key={item.id} className="toast glass">
          {item.message}
        </div>
      ))}
    </div>
  );
};

export default ToastHost;
