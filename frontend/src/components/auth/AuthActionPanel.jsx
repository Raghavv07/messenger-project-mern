import { useState } from "react";
import { useClerk } from "@clerk/react";
import { dark } from "@clerk/themes";
import { Button, Modal, useOverlayState } from "@heroui/react";
import {
  ArrowRightIcon,
  Loader2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppLogo } from "../AppLogo";
import { AuthCardShell } from "./AuthCardShell";
import { useTheme } from "../../context/theme";
import { useAuthStore } from "../../store/useAuthStore";

const AFTER_AUTH = "/";

const logoTileClassName = [
  "relative rounded-2xl bg-linear-to-b from-white to-[#f2f2f7] p-2",
  "shadow-lg shadow-black/8 ring-1 ring-black/8",
  "dark:from-[#2c2c2e] dark:to-[#1a1a1c] dark:shadow-black/50 dark:ring-white/12",
].join(" ");

const continueButtonClassName = [
  "group relative h-13 overflow-hidden rounded-2xl text-[15px] font-semibold",
  "shadow-xl shadow-accent/45 dark:shadow-accent/35",
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl",
  "after:shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
  "dark:after:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
].join(" ");

export function AuthActionPanel() {
  const clerk = useClerk();
  const { theme } = useTheme();
  const guestModal = useOverlayState();
  const [guestName, setGuestName] = useState("");

  const loginAsGuest = useAuthStore((state) => state.loginAsGuest);
  const isLoggingInGuest = useAuthStore((state) => state.isLoggingInGuest);

  const handleSignIn = () => {
    clerk.openSignIn({
      fallbackRedirectUrl: AFTER_AUTH,
      forceRedirectUrl: AFTER_AUTH,
      appearance: {
        baseTheme: theme === "dark" ? dark : undefined,
      },
    });
  };

  const handleSignUp = () => {
    clerk.openSignUp({
      fallbackRedirectUrl: AFTER_AUTH,
      forceRedirectUrl: AFTER_AUTH,
      appearance: {
        baseTheme: theme === "dark" ? dark : undefined,
      },
    });
  };

  const handleGuestSubmit = async (e) => {
    if (e) e.preventDefault();

    const trimmed = guestName.trim();
    if (!trimmed || trimmed.length < 2) {
      toast.error("Please enter a name with at least 2 characters.");
      return;
    }

    const res = await loginAsGuest(trimmed);
    if (res.success) {
      toast.success(`Welcome to Messenger, ${trimmed}! 👋`);
      guestModal.close();
      setGuestName("");
    } else {
      toast.error(res.message || "Failed to join as guest.");
    }
  };

  const avatarPreviewUrl = guestName.trim()
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(guestName.trim())}`
    : "https://api.dicebear.com/7.x/bottts/svg?seed=Guest";

  return (
    <section className="relative flex flex-1 flex-col items-stretch justify-center overflow-hidden px-5 py-12 sm:px-10 md:px-14 md:py-10 lg:px-16">
      <AuthCardShell>
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div
              aria-hidden
              className="absolute -inset-3.5 rounded-[20px] bg-linear-to-br from-accent/22 via-accent/8 to-transparent opacity-90 blur-xl dark:from-accent/28 dark:via-accent/10"
            />
            <div className={logoTileClassName}>
              <AppLogo size={52} className="rounded-xl" alt="" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-accent">
            <SparklesIcon className="size-3.5" strokeWidth={2} aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
              Secure entry
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            fullWidth
            size="lg"
            variant="primary"
            className={continueButtonClassName}
            onPress={handleSignIn}
          >
            <span className="relative z-1 flex items-center justify-center gap-2">
              Sign In
              <ArrowRightIcon
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Button>

          <Button
            fullWidth
            size="md"
            variant="secondary"
            className="h-11 rounded-2xl text-[14px] font-medium"
            onPress={handleSignUp}
          >
            <span className="flex items-center justify-center gap-2">
              <UserPlusIcon className="size-4" aria-hidden />
              Create new account
            </span>
          </Button>

          <div className="relative my-1 flex items-center justify-center">
            <div className="w-full border-t border-black/8 dark:border-white/10" />
            <span className="shrink-0 bg-surface px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              or
            </span>
            <div className="w-full border-t border-black/8 dark:border-white/10" />
          </div>

          <Modal.Root state={guestModal}>
            <Modal.Trigger>
              <Button
                fullWidth
                size="md"
                variant="outline"
                className="h-11 rounded-2xl border border-dashed border-accent/40 bg-accent/5 text-[14px] font-semibold text-accent hover:bg-accent/10 hover:border-accent transition-all cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  <UserCheckIcon className="size-4" aria-hidden />
                  Continue as Guest
                </span>
              </Button>
            </Modal.Trigger>

            <Modal.Backdrop variant="opaque">
              <Modal.Container size="sm" scroll="inside" placement="center">
                <Modal.Dialog className="max-h-[90dvh] w-full max-w-sm rounded-3xl border border-border bg-surface p-6 text-surface-foreground shadow-2xl">
                  <Modal.Header className="flex flex-row items-center justify-between gap-3 border-b border-border pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                        <UserCheckIcon className="size-5" />
                      </div>
                      <div>
                        <Modal.Heading className="text-base font-semibold tracking-tight text-foreground">
                          Join as Guest
                        </Modal.Heading>
                        <p className="text-xs text-muted">Instant access · No sign-up</p>
                      </div>
                    </div>
                    <Modal.CloseTrigger />
                  </Modal.Header>

                  <Modal.Body className="isolate pt-5">
                    <form onSubmit={handleGuestSubmit} className="flex flex-col items-center gap-4">
                      {/* Live avatar preview */}
                      <div className="relative flex flex-col items-center">
                        <div className="relative size-18 rounded-full border-2 border-accent/30 bg-accent/5 p-1 shadow-md">
                          <img
                            src={avatarPreviewUrl}
                            alt="Guest avatar preview"
                            className="size-full rounded-full object-cover"
                          />
                        </div>
                        <span className="mt-1.5 text-[11px] font-medium text-muted">
                          Generated avatar preview
                        </span>
                      </div>

                      {/* Display name input */}
                      <div className="w-full">
                        <label
                          htmlFor="guest-name-input"
                          className="block text-xs font-semibold text-foreground/80 mb-1.5"
                        >
                          Your Name / Handle
                        </label>
                        <input
                          id="guest-name-input"
                          type="text"
                          placeholder="e.g. Alex Sharma"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          maxLength={40}
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden focus:ring-2 focus:ring-accent/20 transition-all"
                          autoFocus
                        />
                      </div>

                      <div className="flex w-full gap-2.5 pt-2">
                        <Button
                          fullWidth
                          size="md"
                          variant="secondary"
                          className="h-10 rounded-xl text-xs font-medium"
                          onPress={() => guestModal.close()}
                          isDisabled={isLoggingInGuest}
                        >
                          Cancel
                        </Button>
                        <Button
                          fullWidth
                          size="md"
                          variant="primary"
                          type="submit"
                          className="h-10 rounded-xl text-xs font-semibold shadow-md shadow-accent/25"
                          isDisabled={isLoggingInGuest || guestName.trim().length < 2}
                        >
                          {isLoggingInGuest ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2Icon className="size-3.5 animate-spin" />
                              Joining...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1.5">
                              Start Chatting
                              <ArrowRightIcon className="size-3.5" />
                            </span>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Modal.Body>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal.Root>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 border-t border-black/6 pt-6 text-[11px] text-[#8E8E93] dark:border-white/8 dark:text-[#636366]">
          <ShieldCheckIcon
            className="size-3.5 shrink-0 text-[#34C759] dark:text-[#30D158]"
            strokeWidth={2}
            aria-hidden
          />
          <span>Protected session · TLS encryption</span>
        </div>
      </AuthCardShell>
    </section>
  );
}
