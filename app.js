/* -----------------------------
   Email copy (all pages)
-------------------------------- */
function bindEmailCopy() {
  const emailEl = document.getElementById("copyEmail");
  const tooltip = document.getElementById("copyTooltip");
  if (!emailEl || !tooltip) return;

  if (emailEl.dataset.bound === "1") return;
  emailEl.dataset.bound = "1";

  emailEl.addEventListener("click", () => {
    const email = emailEl.childNodes[0].textContent.trim();
    navigator.clipboard.writeText(email).then(() => {
      tooltip.style.opacity = "1";
      setTimeout(() => (tooltip.style.opacity = "0"), 1200);
    });
  });
}

/* -----------------------------
   Lightbox (delegated, SPA-safe)
-------------------------------- */
function bindLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("lightboxClose");
  if (!lightbox || !lightboxImg || !closeBtn) return;

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add("open");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
  }

  if (closeBtn.dataset.bound !== "1") {
    closeBtn.dataset.bound = "1";
    closeBtn.addEventListener("click", closeLightbox);
  }

  document.addEventListener("click", (e) => {
    const img = e.target.closest(".works-masonry img");
    if (img) {
      openLightbox(img.src);
      return;
    }
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}

/* -----------------------------
   Formspree submit (no redirect)
-------------------------------- */
function bindContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  // SPA'da tekrar tekrar bind olmasın
  if (form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    status.textContent = "sending…";

    try {
      const data = new FormData(form);
      const res = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" },
      });

      if (res.ok) {
        form.reset();
        form.style.display = "none";
        status.textContent = "submitted! 💗";
      } else {
        status.textContent = "oops — try again?";
      }
    } catch (err) {
      status.textContent = "connection error — try again?";
    }
  });
}

/* -----------------------------
   SPA navigation
-------------------------------- */
function bindSPA() {
  const contentEl = document.getElementById("pageContent");
  if (!contentEl) return;

  function currentFile() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function normalizeHref(href) {
    return href.replace(/^\.\//, "");
  }

  async function loadPage(href, push = true) {
    const file = normalizeHref(href);

    // same page? do nothing
    if (currentFile() === file) return;

    // fade out
    contentEl.classList.add("is-fading-out");
    await new Promise((r) => setTimeout(r, 250));

    let html = "";
    try {
      const res = await fetch(file, { cache: "no-cache" });
      if (!res.ok) throw new Error("Fetch failed");
      html = await res.text();
    } catch (err) {
      window.location.href = file; // fallback
      return;
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    const newContent = doc.getElementById("pageContent");

    if (!newContent) {
      window.location.href = file;
      return;
    }

    // swap content
    contentEl.innerHTML = newContent.innerHTML;
    document.title = doc.title || document.title;

    // re-bind page-specific handlers after swap
    bindContactForm();

    if (push) history.pushState({ href: file }, "", file);

    // fade in
    requestAnimationFrame(() => {
      contentEl.classList.remove("is-fading-out");
    });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a.nav-link");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;

    e.preventDefault();
    loadPage(href, true);
  });

  window.addEventListener("popstate", (e) => {
    const href =
      (e.state && e.state.href) ||
      (window.location.pathname.split("/").pop() || "index.html");

    loadPage(href, false);
  });
}

/* -----------------------------
   Init
-------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  bindEmailCopy();
  bindLightbox();
  bindSPA();
  bindContactForm(); // first load (about page)
});
