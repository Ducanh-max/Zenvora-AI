export type ThemeChoice = "light" | "dark";
type TransitionHandle = { ready?: Promise<unknown>; finished: Promise<unknown> };
type TransitionDocument = { startViewTransition?: (change: () => void) => TransitionHandle };

/** Reveal the new theme vertically while leaving content and focus in place. */
export async function transitionTheme(next: ThemeChoice, commit: () => void): Promise<void> {
  let committed = false;
  const apply = () => { if (!committed) { committed = true; commit(); } };
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { apply(); return; }

  const root = document.documentElement;
  const direction = next === "light" ? "down" : "up";
  root.dataset.themeSlide = direction;
  let curtain: HTMLDivElement | null = null;
  try {
    const start = (document as unknown as TransitionDocument).startViewTransition;
    if (typeof start === "function") {
      try {
        const transition = start.call(document, apply);
        // Hidden pages and interrupted transitions can skip their ready phase.
        void transition.ready?.catch(() => undefined);
        await transition.finished.catch(() => undefined);
        apply();
        return;
      } catch { /* Fall through to a vertical curtain on older implementations. */ }
    }

    curtain = document.createElement("div");
    curtain.setAttribute("data-aunora-theme-curtain", "");
    curtain.setAttribute("aria-hidden", "true");
    Object.assign(curtain.style, {
      position: "fixed", inset: "0", zIndex: "2147483646", pointerEvents: "auto",
      background: next === "light" ? "#f5f7ee" : "#061211",
      transform: direction === "down" ? "translateY(-100%)" : "translateY(100%)",
    });
    document.body.appendChild(curtain);
    if (typeof curtain.animate !== "function") { apply(); return; }
    await curtain.animate([
      { transform: direction === "down" ? "translateY(-100%)" : "translateY(100%)" },
      { transform: "translateY(0)" },
    ], { duration: 260, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" }).finished;
    apply();
    await curtain.animate([
      { transform: "translateY(0)" },
      { transform: direction === "down" ? "translateY(100%)" : "translateY(-100%)" },
    ], { duration: 290, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" }).finished;
  } catch {
    apply();
  } finally {
    curtain?.remove();
    delete root.dataset.themeSlide;
  }
}
