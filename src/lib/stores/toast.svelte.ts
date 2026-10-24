export type ToastKind = "info" | "success" | "warning" | "error";

export type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
};

let nextId = 1;

class ToastStore {
  items = $state<Toast[]>([]);

  push(
    kind: ToastKind,
    title: string,
    message?: string,
    timeout = 3500,
  ): number {
    const id = nextId++;
    this.items.push({ id, kind, title, message });
    if (timeout > 0) {
      setTimeout(() => this.dismiss(id), timeout);
    }
    return id;
  }

  info = (title: string, message?: string, timeout?: number) =>
    this.push("info", title, message, timeout);
  success = (title: string, message?: string, timeout?: number) =>
    this.push("success", title, message, timeout);
  warning = (title: string, message?: string, timeout?: number) =>
    this.push("warning", title, message, timeout);
  error = (title: string, message?: string, timeout?: number) =>
    this.push("error", title, message, timeout);

  dismiss(id: number): void {
    this.items = this.items.filter((t) => t.id !== id);
  }
}

export const toasts = new ToastStore();
