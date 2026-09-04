export const THEME_STORAGE_KEY = "vizor-theme";

export type Theme = "light" | "dark";

/**
 * Runs before hydration via an inline `<script>` in the root layout, so the
 * ledger never flashes light-then-dark (or vice versa) on load. Reads the
 * stored preference; falls back to the OS setting by leaving `data-theme`
 * unset, since globals.css already handles that case via
 * `prefers-color-scheme`.
 */
export const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;
