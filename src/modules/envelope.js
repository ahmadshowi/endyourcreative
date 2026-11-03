/**
 * Scroll-driven envelope in the hero. While the stage is pinned, scroll progress
 * through the section is split into four overlapping steps and written as CSS
 * variables (0–1): --seal lifts the wax seal, --flap opens the flap, --rise
 * slides the letter out, --out drops the envelope away. Clicking the envelope
 * scrolls to the point where the letter is out.
 *
 * With reduced motion this does nothing and the CSS shows the opened letter.
 */
const STEPS = {
  seal: [0, 0.1],
  flap: [0.04, 0.3],
  rise: [0.28, 0.6],
  out: [0.62, 0.92],
};

const clamp = (v) => Math.min(1, Math.max(0, v));

export function initEnvelope(section) {
  if (!section) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  section.classList.add("is-animated");
  const body = section.querySelector("[data-envelope-body]");
  let ticking = false;

  const progress = () => {
    const track = section.offsetHeight - window.innerHeight;
    return track > 0 ? clamp(-section.getBoundingClientRect().top / track) : 1;
  };

  const update = () => {
    ticking = false;
    const p = progress();
    for (const [name, [from, to]] of Object.entries(STEPS)) {
      section.style.setProperty(`--${name}`, clamp((p - from) / (to - from)).toFixed(4));
    }
    section.classList.toggle("is-flap-open", p > (STEPS.flap[0] + STEPS.flap[1]) / 2);
    section.classList.toggle("is-risen", p > STEPS.rise[0] + 0.06);
  };

  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  update();

  body?.addEventListener("click", () => {
    const track = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: section.offsetTop + track * STEPS.rise[1], behavior: "smooth" });
  });
}
