import * as React from "react";

export const isAbortError = (e) =>
  e?.name === "AbortError" ||
  e?.code === 20 ||
  e?.__isAbort === true ||
  /abort(ed)?/i.test(String(e?.message || ""));

export function useAsync() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError]   = React.useState(null);

  const run = React.useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      if (isAbortError(e)) {
        // swallow silently
        return;
      }
      setError(e);
      // keep a console for real errors, not for aborts
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run };
}

export function useAborter() {
  const ref = React.useRef(null);

  // Create a fresh signal for each call; cancel previous one
  const getSignal = React.useCallback(() => {
    if (ref.current) ref.current.abort();
    ref.current = new AbortController();
    return ref.current.signal;
  }, []);

  // Cancel on unmount
  React.useEffect(() => () => ref.current?.abort(), []);

  return getSignal;
}
