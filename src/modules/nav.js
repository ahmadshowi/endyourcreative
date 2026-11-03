/**
 * Header behaviour: mobile menu (with focus handling + Escape), header
 * background once scrolled, and current-section highlighting.
 */
export function initNav() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!header || !toggle || !nav) return;

  const mq = window.matchMedia("(max-width: 900px)");

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".menu-toggle__label").textContent = open ? "Tutup" : "Menu";
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("no-scroll", open);
    if (open) nav.querySelector("a")?.focus();
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a") && mq.matches) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  mq.addEventListener("change", (e) => {
    if (!e.matches) setOpen(false);
  });

  // Solid header after leaving the top of the page.
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;height:40px;width:1px;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    header.classList.toggle("is-scrolled", !entry.isIntersecting);
  }).observe(sentinel);

  // Mark the nav link for the section in view.
  const links = [...nav.querySelectorAll("[data-nav-link]")];
  const byId = new Map(links.map((l) => [l.getAttribute("href").slice(1), l]));
  const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  // The hero has no nav link; watching it clears the highlight when the visitor scrolls back up.
  const top = document.getElementById("top");
  if (top) sections.push(top);

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.removeAttribute("aria-current"));
        byId.get(entry.target.id)?.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));
}
