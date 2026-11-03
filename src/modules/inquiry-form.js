import { INQUIRY_ENDPOINT, whatsappLink } from "../config.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validation rules shared in spirit with api/inquiry.js. */
const rules = {
  name: (v) => (v.trim().length >= 2 ? "" : "Masukkan nama kamu."),
  email: (v) =>
    !v.trim() ? "Masukkan email kamu agar kami bisa membalas." : EMAIL_RE.test(v.trim()) ? "" : "Periksa alamat email — sepertinya belum lengkap.",
  category: (v) => (v ? "" : "Pilih jenis proyek."),
  details: (v) =>
    v.trim().length >= 20 ? "" : "Tambahkan sedikit detail — minimal satu atau dua kalimat (20 karakter).",
};

function inquiryToMessage(data) {
  return [
    "Halo END. YOURCREATIVE! Saya ingin memulai proyek.",
    "",
    `Nama: ${data.name}`,
    `Email: ${data.email}`,
    `Proyek: ${data.category}`,
    data.budget ? `Budget: ${data.budget}` : null,
    "",
    data.details,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function initInquiryForm(form) {
  if (!form) return;

  const status = form.querySelector("[data-status]");
  const submit = form.querySelector("[data-submit]");
  const submitLabel = form.querySelector("[data-submit-label]");
  let attempted = false;

  const field = (name) => form.elements.namedItem(name);

  const showError = (name, message) => {
    const input = field(name);
    const err = form.querySelector(`#${input.id}-err`);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    input.closest(".field")?.classList.toggle("has-error", Boolean(message));
    if (err) err.textContent = message;
  };

  const validate = () => {
    let firstInvalid = null;
    for (const [name, check] of Object.entries(rules)) {
      const message = check(field(name).value);
      showError(name, message);
      if (message && !firstInvalid) firstInvalid = field(name);
    }
    return firstInvalid;
  };

  const setStatus = (kind, html) => {
    status.className = `inquiry__status${kind ? ` is-${kind}` : ""}`;
    status.innerHTML = html;
  };

  const setBusy = (busy) => {
    submit.disabled = busy;
    form.setAttribute("aria-busy", String(busy));
    submitLabel.textContent = busy ? "Mengirim…" : "Kirim permintaan";
  };

  // Live re-validation once the visitor has tried to submit.
  Object.keys(rules).forEach((name) => {
    const input = field(name);
    const evt = input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(evt, () => attempted && showError(name, rules[name](input.value)));
    input.addEventListener("blur", () => {
      if (input.value) showError(name, rules[name](input.value));
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    attempted = true;
    setStatus("", "");

    const firstInvalid = validate();
    if (firstInvalid) {
      firstInvalid.focus();
      setStatus("error", "Ada beberapa kolom yang perlu diperbaiki sebelum bisa dikirim.");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const waHref = whatsappLink(inquiryToMessage(data));
    const fallback = `<a href="${waHref}" target="_blank" rel="noopener">Kirim lewat WhatsApp saja</a> — detail kamu sudah terisi otomatis.`;

    setBusy(true);
    try {
      const res = await fetch(INQUIRY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        form.reset();
        attempted = false;
        Object.keys(rules).forEach((name) => showError(name, ""));
        setStatus(
          "success",
          `Terima kasih, ${escapeHtml(data.name.split(" ")[0])}. Permintaanmu sudah terkirim — kami akan segera membalas ke ${escapeHtml(data.email)}.`
        );
        return;
      }

      if (res.status === 400 && body.errors) {
        Object.entries(body.errors).forEach(([name, message]) => field(name) && showError(name, message));
        setStatus("error", "Ada beberapa kolom yang perlu diperbaiki sebelum bisa dikirim.");
        return;
      }

      setStatus("error", `Formulir belum bisa dikirim saat ini. ${fallback}`);
    } catch {
      setStatus("error", `Tidak dapat terhubung ke server — periksa koneksi kamu. ${fallback}`);
    } finally {
      setBusy(false);
    }
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
