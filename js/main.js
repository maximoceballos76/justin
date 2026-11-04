/* Zenit Ing - comportamiento del sitio.
   Cada función se ocupa de una parte y no hace nada si esa parte
   no existe en la página actual. */

// Número en formato internacional, sin "+" ni espacios.
const WHATSAPP_NUMBER = "5492617180242";

// Casilla que recibe las consultas.
const CONTACT_EMAIL = "equipotecnico@zeniting.com.ar";

// URL del servicio que envía el formulario por correo. Mientras esté vacía,
// el formulario abre el programa de correo con la consulta ya escrita.
const FORM_ENDPOINT = "";

function whatsappUrl(message, number) {
  const base = `https://wa.me/${number || WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/* Los enlaces con data-whatsapp usan el número de arriba, salvo que indiquen otro. */
function initWhatsappLinks() {
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    link.href = whatsappUrl("Hola, quisiera hacer una consulta sobre energía solar.", link.dataset.whatsapp);
    link.target = "_blank";
    link.rel = "noopener";
  });
}

/* Menú desplegable en tablet y celular. */
function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

/* Filtros por categoría en la página de Obras. */
function initProjectFilters() {
  const filters = document.querySelectorAll(".filter");
  const projects = document.querySelectorAll(".projects .project");

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const category = filter.dataset.filter;

      filters.forEach((item) => item.setAttribute("aria-pressed", String(item === filter)));
      projects.forEach((project) => {
        project.hidden = category !== "todas" && project.dataset.category !== category;
      });
    });
  });
}

/* Muestra u oculta el error de un campo. */
function setFieldError(field, message) {
  const error = field.closest(".field").querySelector(".field-error");
  error.textContent = message;
  error.hidden = !message;
  field.setAttribute("aria-invalid", String(Boolean(message)));
}

/* Devuelve el mensaje de error del campo, o "" si está bien. */
function validateField(field) {
  const value = field.value.trim();

  if (field.required && !value) return "Completá este campo.";
  if (field.name === "telefono" && value && value.replace(/\D/g, "").length < 8) {
    return "Ingresá un número con código de área.";
  }
  return "";
}

function buildContactMessage(form) {
  const data = new FormData(form);
  const lines = [
    "Consulta desde el sitio.",
    `Nombre: ${data.get("nombre").trim()}`,
    `Teléfono: ${data.get("telefono").trim()}`,
    `Localidad: ${data.get("localidad").trim()}`,
    `Tipo de trabajo: ${data.get("tipo")}`,
  ];

  if (data.get("nic").trim()) lines.push(`NIC de EDEMSA: ${data.get("nic").trim()}`);
  if (data.get("mensaje").trim()) lines.push(`Detalle: ${data.get("mensaje").trim()}`);
  return lines.join("\n");
}

/* Envía la consulta. Devuelve el texto que se le muestra a la persona. */
async function sendContactMessage(form) {
  const message = buildContactMessage(form);

  if (!FORM_ENDPOINT) {
    const subject = encodeURIComponent("Consulta desde el sitio");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(message)}`;
    return "Se abrió el correo con la consulta. Solo falta enviarla.";
  }

  const response = await fetch(FORM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ subject: "Consulta desde el sitio", message }),
  });
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return "Consulta enviada. La respuesta llega en el día.";
}

function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const fields = form.querySelectorAll("input, select, textarea");
  const status = form.querySelector(".form-status");

  fields.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") setFieldError(field, validateField(field));
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.hidden = true;

    let firstInvalid = null;
    fields.forEach((field) => {
      const message = validateField(field);
      setFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    try {
      status.textContent = await sendContactMessage(form);
    } catch {
      status.textContent = "No se pudo enviar. Probar por WhatsApp al 261 718-0242.";
    }
    status.hidden = false;
  });
}

initWhatsappLinks();
initMobileMenu();
initProjectFilters();
initContactForm();
