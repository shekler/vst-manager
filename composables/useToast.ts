interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

export const useToast = () => {
  const toasts = useState<Toast[]>("toasts", () => []);

  const addToast = (message: string, type: Toast["type"] = "info", duration: number = 3000) => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, duration };

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const success = (message: string, duration?: number) => addToast(message, "success", duration);
  const error = (message: string, duration?: number) => addToast(message, "error", duration);
  const info = (message: string, duration?: number) => addToast(message, "info", duration);

  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
    success,
    error,
    info,
  };
};
