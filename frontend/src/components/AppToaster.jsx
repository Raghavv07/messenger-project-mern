import { useEffect } from "react";
import toast, { Toaster, ToastBar, useToasterStore } from "react-hot-toast";
import { X } from "lucide-react";
import { useTheme } from "../context/theme";

const TOAST_LIMIT = 3;

export function AppToaster() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toasts } = useToasterStore();

  // Enforce a maximum number of visible toasts to prevent flooding
  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? "#18181b" : "#ffffff",
          color: isDark ? "#f4f4f5" : "#18181b",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isDark
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
          borderRadius: "14px",
          padding: "10px 14px",
          fontSize: "13px",
          fontWeight: 500,
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#10b981",
            secondary: isDark ? "#18181b" : "#ffffff",
          },
        },
        error: {
          duration: 4500,
          iconTheme: {
            primary: "#ef4444",
            secondary: isDark ? "#18181b" : "#ffffff",
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t} style={{ ...t.style }}>
          {({ icon, message }) => (
            <div className="flex items-center gap-2">
              {icon}
              <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">{message}</div>
              {t.type !== "loading" && (
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="ml-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
                  aria-label="Dismiss toast"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}

export default AppToaster;
