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
  const { isSignedIn, isLoaded } = useAuth();

  const { clearAuth, checkAuth, isCheckingAuth } = useAuthStore(
    useShallow((state) => ({
      clearAuth: state.clearAuth,
      checkAuth: state.checkAuth,
      isCheckingAuth: state.isCheckingAuth,
    })),
  );

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) checkAuth();
    else clearAuth();
  }, [checkAuth, clearAuth, isLoaded, isSignedIn]);

  if (!isLoaded || (isSignedIn && isCheckingAuth)) return <PageLoader />;

  return (
    <ThemeProvider>
      <WallpaperProvider>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={isSignedIn ? <ChatPage /> : <Navigate to="/auth" replace />} />
              <Route
                path="/auth"
                element={!isSignedIn ? <AuthPage /> : <Navigate to="/" replace />}
              />
              <Route
                path="*"
                element={<Navigate to={isSignedIn ? "/" : "/auth"} replace />}
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
