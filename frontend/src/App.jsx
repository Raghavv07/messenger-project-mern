import { WallpaperProvider } from "./context/WallpaperContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Navigate, Route, Routes } from "react-router";
import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "@clerk/react";
import PageLoader from "./components/PageLoader";
import { useAuthStore } from "./store/useAuthStore";
import { useShallow } from "zustand/react/shallow";

const ChatPage = lazy(() => import("./pages/ChatPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));

import AppToaster from "./components/AppToaster";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();

  const { authUser, guestToken, clearAuth, checkAuth, isCheckingAuth } = useAuthStore(
    useShallow((state) => ({
      authUser: state.authUser,
      guestToken: state.guestToken,
      clearAuth: state.clearAuth,
      checkAuth: state.checkAuth,
      isCheckingAuth: state.isCheckingAuth,
    })),
  );

  useEffect(() => {
    if (!isClerkLoaded) return;

    if (isSignedIn) {
      checkAuth();
    } else if (guestToken || (typeof window !== "undefined" && localStorage.getItem("messenger_guest_token"))) {
      checkAuth();
    } else {
      clearAuth();
    }
  }, [checkAuth, clearAuth, isClerkLoaded, isSignedIn, guestToken]);

  const isAuthenticated = Boolean(isSignedIn || (authUser && (authUser.isGuest || authUser._id)));

  if (!isClerkLoaded || ((isSignedIn || guestToken) && isCheckingAuth)) return <PageLoader />;

  return (
    <ThemeProvider>
      <WallpaperProvider>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={isAuthenticated ? <ChatPage /> : <Navigate to="/auth" replace />} />
              <Route
                path="/auth"
                element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" replace />}
              />
              <Route
                path="*"
                element={<Navigate to={isAuthenticated ? "/" : "/auth"} replace />}
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <AppToaster />
      </WallpaperProvider>
    </ThemeProvider>
  );
}

export default App;
