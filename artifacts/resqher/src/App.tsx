import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import "@/lib/i18n";
import LoginPage from "@/pages/login";
import ActivationPage from "@/pages/activation";
import DashboardPage from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import EvidencePage from "@/pages/evidence";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AuthGate() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [activated, setActivated] = useState<boolean>(() =>
    localStorage.getItem("resqher-activated") === "true"
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setActivated(false);
      } else {
        setActivated(localStorage.getItem("resqher-activated") === "true");
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const onStorage = () => {
      setActivated(localStorage.getItem("resqher-activated") === "true");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#0d0a1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#9b1d3a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to={activated ? "/dashboard" : "/activation"} /> : <LoginPage />}
      </Route>
      <Route path="/activation">
        {!user ? <Redirect to="/" /> : activated ? <Redirect to="/dashboard" /> : <ActivationPage />}
      </Route>
      <Route path="/dashboard">
        {!user ? <Redirect to="/" /> : !activated ? <Redirect to="/activation" /> : <DashboardPage />}
      </Route>
      <Route path="/settings">
        {!user ? <Redirect to="/" /> : !activated ? <Redirect to="/activation" /> : <SettingsPage />}
      </Route>
      <Route path="/evidence">
        {!user ? <Redirect to="/" /> : !activated ? <Redirect to="/activation" /> : <EvidencePage />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGate />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
