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

  // New method for persistent toasts that survive page reloads
  const persistentSuccess = (message: string, duration: number = 3000) => {
    if (process.client) {
      localStorage.setItem(
        "persistentToast",
        JSON.stringify({
          message,
          type: "success",
          duration,
        }),
      );
    }
  };

  // Method to check and show persistent toasts on page load
  const checkPersistentToast = () => {
    if (process.client) {
      const stored = localStorage.getItem("persistentToast");
      if (stored) {
        try {
          const toastData = JSON.parse(stored);
          addToast(toastData.message, toastData.type, toastData.duration);
          localStorage.removeItem("persistentToast");
        } catch (error) {
          console.error("Failed to parse persistent toast:", error);
          localStorage.removeItem("persistentToast");
        }
      }
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
    persistentSuccess,
    checkPersistentToast,
  };
};
