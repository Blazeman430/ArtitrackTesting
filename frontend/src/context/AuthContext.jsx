import React from "react";
import { apiProbe, primeCsrf } from "../lib/apiClient";

const AuthCtx = React.createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = React.useState("checking"); // 'checking' | 'authed' | 'guest'
  const [user, setUser] = React.useState(null);

  const refreshAuth = React.useCallback(async () => {
    try {
        await primeCsrf();
        const res = await apiProbe("/api/auth/me");
        if (res.status === 200 && res.data && res.data.id) {
        setUser(res.data);
        try { localStorage.setItem("arti_user", JSON.stringify(res)); } catch {}
        setStatus("authed");
        return res.data;
        } 
    } catch (_) {}
    setUser(null);
    setStatus("guest");
    return null;
    }, []);

   React.useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);

  // cross-tab sync for login/logout
  React.useEffect(() => {
    function onStorage(e) {
      if (e.key === "arti_auth_broadcast") {
        try {
            const msg = JSON.parse(e.newValue || "{}");
            if (msg.action === "logout") window.location.assign("/loginpage");
            if (msg.action === "login") refreshAuth(); // no full reload needed
        } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshAuth]);

  const value = React.useMemo(
    () => ({ status, user, setUser, refreshAuth }),
    [status, user, refreshAuth]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return React.useContext(AuthCtx);
}
