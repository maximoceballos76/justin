/* Zenit Ing - comportamiento del sitio.
   Cada función se ocupa de una parte y no hace nada si esa parte
   no existe en la página actual. */

// Número real en formato internacional, sin "+" ni espacios (hoy es ficticio).
const WHATSAPP_NUMBER = "5492615550142";

function whatsappUrl(message) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/* Todos los enlaces con data-whatsapp usan el número de arriba. */
function initWhatsappLinks() {
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    link.href = whatsappUrl("Hola, quiero hacer una consulta sobre energía solar.");
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
  if (field.name === "whatsapp" && value && value.replace(/\D/g, "").length < 8) {
    return "Ingresá un número con código de área.";
  }
  return "";
}

function buildContactMessage(form) {
  const data = new FormData(form);
  const lines = [
    "Hola, quiero pedir un presupuesto.",
    `Nombre: ${data.get("nombre").trim()}`,
    `WhatsApp: ${data.get("whatsapp").trim()}`,
    `Localidad: ${data.get("localidad").trim()}`,
    `Instalación: ${data.get("tipo")}`,
  ];

  if (data.get("gasto").trim()) lines.push(`Gasto mensual de luz: $ ${data.get("gasto").trim()}`);
  if (data.get("mensaje").trim()) lines.push(`Mensaje: ${data.get("mensaje").trim()}`);
  return lines.join("\n");
}

/* El sitio no tiene servidor: la consulta se envía armando un mensaje de WhatsApp. */
function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const fields = form.querySelectorAll("input, select, textarea");
  const status = form.querySelector(".form-status");

  // Si viene desde un plan de mantenimiento (contacto.html?plan=Plus), lo deja escrito.
  const plan = new URLSearchParams(window.location.search).get("plan");
  if (plan) form.elements.mensaje.value = `Quiero consultar por el plan ${plan} de mantenimiento.`;

  fields.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") setFieldError(field, validateField(field));
    });
  });

  form.addEventListener("submit", (event) => {
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

    window.open(whatsappUrl(buildContactMessage(form)), "_blank", "noopener");
    status.textContent = "Abrimos WhatsApp con tu consulta. Solo falta tocar enviar.";
    status.hidden = false;
  });
}

initWhatsappLinks();
initMobileMenu();
initProjectFilters();
initContactForm();
