import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/bodoni-moda/opsz-italic.css";
import "@fontsource-variable/jost/index.css";
import "./styles/main.css";

import { whatsappLink } from "./config.js";
import { initNav } from "./modules/nav.js";
import { initReveal } from "./modules/reveal.js";
import { initInquiryForm } from "./modules/inquiry-form.js";
import { initEnvelope } from "./modules/envelope.js";

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = whatsappLink();
});

document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

initNav();
initReveal();
initInquiryForm(document.querySelector("[data-inquiry-form]"));
initEnvelope(document.querySelector("[data-envelope]"));
