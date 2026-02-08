import { useState, useEffect } from "react";

export function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () =>
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    setDark(check());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setDark(check());
    mq.addEventListener("change", handleChange);

    // Also observe class changes on <html> for manual toggle support
    const observer = new MutationObserver(() => setDark(check()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mq.removeEventListener("change", handleChange);
      observer.disconnect();
    };
  }, []);

  return dark;
}
