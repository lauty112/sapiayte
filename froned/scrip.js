// ============================================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ============================================================
const API_BASE = window.API_URL || 'https://sapiayte-bz3i.onrender.com/api';
const DEFAULT_API_URL = 'https://sapiayte-bz3i.onrender.com/api';
const API_URL = window.API_URL || (() => {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
    return isLocal ? 'http://localhost:5000/api' : DEFAULT_API_URL;
})();
console.log('API_BASE =', API_BASE);

let mesaActual = null;
let cart = [];
let productIds = {};
let menuDataGlobal = {};
let categoriaActiva_Global = null;
let mesaReservaSeleccionada = null;

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Inicializando app...");
  cargarMesaDesdeStorage();
  cargarCarrito();
  cargarMenuDesdeBD();
  initReservasForm();
  actualizarVisibilidadTracking();
  actualizarInterfazMesa();
});

// ============================================================
// MESA
// ============================================================
function cargarMesaDesdeStorage() {
  const saved = localStorage.getItem('mesa_actual');
  if (saved) {
    try {
      mesaActual = JSON.parse(saved);
      console.log("✅ Mesa cargada:", mesaActual);
      actualizarInterfazMesa();
    } catch(e) {
      console.error("Error parseando mesa:", e);
      localStorage.removeItem('mesa_actual');
    }
  } else {
    console.warn("⚠️ No hay mesa guardada");
  }
}

function actualizarInterfazMesa() {
  const pill = document.getElementById('scan-pill');
  if (!pill) return;
  const pillText = pill.querySelector('.scan-pill-text');
  if (mesaActual && mesaActual.numero) {
    pill.classList.add('scan-pill--mesa');
    if (pillText) pillText.textContent = tF('mesa.indicador', { n: mesaActual.numero });
    pill.title = T('nav.cambiarMesa');
  } else {
    pill.classList.remove('scan-pill--mesa');
    if (pillText) pillText.textContent = T('nav.scanPill');
    pill.title = T('nav.scan');
  }
}

// ============================================================
// MENÚ MÓVIL (hamburguesa)
// ============================================================
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const burger = document.getElementById('nav-burger');
  if (!menu || !burger) return;
  const abierto = !menu.classList.contains('open');
  menu.classList.toggle('open', abierto);
  burger.setAttribute('aria-expanded', String(abierto));
  menu.setAttribute('aria-hidden', String(!abierto));
  document.body.classList.toggle('menu-abierto', abierto);
}

function cerrarMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const burger = document.getElementById('nav-burger');
  if (!menu || !burger) return;
  menu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('menu-abierto');
}

// ============================================================
// CARRITO
// ============================================================
function guardarCarrito() {
  localStorage.setItem('carrito_actual', JSON.stringify(cart));
}

function cargarCarrito() {
  const saved = localStorage.getItem('carrito_actual');
  if (saved) {
    try {
      cart = JSON.parse(saved);
      renderCart();
    } catch(e) { console.error(e); }
  }
}

function addToCart(name, price, btn) {
  console.log("➕ Agregando:", name, price);
  if (btn) {
    btn.classList.remove('popped');
    void btn.offsetWidth;
    btn.classList.add('popped');
    setTimeout(() => btn.classList.remove('popped'), 400);
  }
  const existing = cart.find(i => i.name === name);
  if (existing) {
    if (existing.qty < 99) existing.qty++;
    else { alert(T('alerta.max99')); return; }
  } else {
    cart.push({ name, price, qty: 1, product_id: productIds[name] || null });
  }
  renderCart();
  guardarCarrito();
}

function changeQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    cart = cart.filter(i => i.name !== name);
  } else if (newQty > 99) {
    alert(T('alerta.max99'));
    return;
  } else {
    item.qty = newQty;
  }
  renderCart();
  guardarCarrito();
}

function clearCart() {
  if (confirm(T('confirm.vaciar'))) {
    cart = [];
    renderCart();
    guardarCarrito();
    updateCartCount();
  }
}

function updateCartCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const elem = document.getElementById('cart-count');
  if (elem) {
    elem.textContent = count;
    elem.classList.toggle('visible', count > 0);
  }
}

function renderCart() {
  const container = document.getElementById('cart-items');
  if (!container) return;

  // Limpiar contenedor
  container.innerHTML = '';

  // Caso carrito vacío
  if (cart.length === 0) {
    container.innerHTML = `<div class="cart-empty"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p>${T('cart.vacio')}</p></div>`;
    document.getElementById('cart-total').innerHTML = '<span>$</span>0';
    updateCartCount();
    return;
  }

  let total = 0;

  // Recorrer items del carrito
  cart.forEach(item => {
    total += item.price * item.qty;

    // Contenedor del item
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';

    // Info del producto
    const infoDiv = document.createElement('div');
    infoDiv.className = 'cart-item-info';
    infoDiv.innerHTML = `
      <div class="cart-item-name">${escapeHtml(item.name)}</div>
      <div class="cart-item-price">$${formatearPrecio(item.price)}</div>
    `;

    // Acciones (botones + y -)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'cart-item-actions';

    const qtySelector = document.createElement('div');
    qtySelector.className = 'quantity-selector';

    const btnMinus = document.createElement('button');
    btnMinus.textContent = '−';
    btnMinus.className = 'qty-btn-mini';
    btnMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      changeQty(item.name, -1);
    });

    const qtySpan = document.createElement('span');
    qtySpan.textContent = item.qty;

    const btnPlus = document.createElement('button');
    btnPlus.textContent = '+';
    btnPlus.className = 'qty-btn-mini';
    btnPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      changeQty(item.name, 1);
    });

    qtySelector.appendChild(btnMinus);
    qtySelector.appendChild(qtySpan);
    qtySelector.appendChild(btnPlus);
    actionsDiv.appendChild(qtySelector);

    itemDiv.appendChild(infoDiv);
    itemDiv.appendChild(actionsDiv);
    container.appendChild(itemDiv);
  });

  // Actualizar total y contador
  document.getElementById('cart-total').innerHTML = '<span>$</span>' + formatearPrecio(total);
  updateCartCount();
}

function openCart() {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('cart-overlay');
  if (panel && overlay) {
    closeTracking();
    panel.classList.add('active');
    overlay.classList.add('active');
  }
}

function closeCart() {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('cart-overlay');
  if (panel && overlay) {
    panel.classList.remove('active');
    overlay.classList.remove('active');
  }
}

function toggleCart() {
  const panel = document.getElementById('cart-panel');
  if (panel && panel.classList.contains('active')) {
    closeCart();
  } else {
    openCart();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).replace(/[\"\']/g, function(m) {
    if (m === '"') return '&quot;';
    if (m === "'") return '&#39;';
    return m;
  });
}

function formatearPrecio(n) {
  return Number(n || 0).toLocaleString(T('loc.num'));
}

// ============================================================
// ENVÍO DE PEDIDO
// ============================================================
async function sendOrder() {
  const savedMesa = localStorage.getItem('mesa_actual');
  const mesa = savedMesa ? JSON.parse(savedMesa) : mesaActual;
  if (mesa) mesaActual = mesa;

  if (cart.length === 0) {
    alert(T('alerta.carritoVacio'));
    return;
  }
  if (!mesa || (!mesa.numero && !mesa.id)) {
    alert(T('alerta.sinMesa'));
    if (confirm(T('confirm.irEscanear'))) location.href = 'qr-scaner.html';
    return;
  }
  const missing = cart.filter(item => !item.product_id);
  if (missing.length) {
    alert(T('alerta.sinID'));
    return;
  }
  const pedidoData = {
    mesa_id: mesa.id || mesa.id_mesa,
    mesa_token: localStorage.getItem('mesa_token') || '',
    items: cart.map(item => ({
      producto_id: item.product_id,
      cantidad: item.qty
    })),
    observaciones: ''
  };
  try {
    const response = await fetch(`${API_BASE}/pedido/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(pedidoData)
    });
    const data = await response.json();
    if (data.success) {
      // Guardar el pedido para poder seguir su estado
      localStorage.setItem('pedido_actual', JSON.stringify({ id: data.pedido_id, fecha: Date.now() }));
      actualizarVisibilidadTracking();
      let text = `${T('whatsapp.pedidoTitulo')}\n${tF('whatsapp.mesa', { n: mesa.numero })}\n${tF('whatsapp.pedidoId', { id: data.pedido_id })}\n`;
      let total = 0;
      cart.forEach(i => {
        text += `${i.qty}x ${i.name} — $${formatearPrecio(i.price * i.qty)}\n`;
        total += i.price * i.qty;
      });
      text += `${T('whatsapp.total')}${formatearPrecio(total)}\n${T('whatsapp.gracias')}`;
      window.open(`https://wa.me/5493756565902?text=${encodeURIComponent(text)}`, '_blank');
      cart = [];
      renderCart();
      guardarCarrito();
      closeCart();
      alert(T('alerta.pedidoEnviado'));
    } else {
      alert('Error: ' + (data.error || T('alerta.errorRegistro')));
    }
  } catch (error) {
    alert(T('alerta.errorRed'));
  }
}

// ============================================================
// SEGUIMIENTO DEL PEDIDO
// ============================================================
const ESTADOS_ORDEN = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'pagado'];
let trackingInterval = null;

function tEstado(estado) {
  return T('estado.' + estado) || estado;
}

function getPedidoGuardado() {
  const saved = localStorage.getItem('pedido_actual');
  if (!saved) return null;
  try {
    const pedidoRef = JSON.parse(saved);
    return pedidoRef && pedidoRef.id ? pedidoRef : null;
  } catch(e) {
    return null;
  }
}

function actualizarVisibilidadTracking() {
  const btn = document.getElementById('tracking-toggle');
  if (btn) btn.style.display = getPedidoGuardado() ? 'flex' : 'none';
}

async function cargarEstadoPedido() {
  const pedidoRef = getPedidoGuardado();
  if (!pedidoRef) return null;
  try {
    const res = await fetch(`${API_BASE}/pedido/${pedidoRef.id}/estado`);
    const data = await res.json();
    return data.success ? data.pedido : null;
  } catch (e) {
    console.error('Error cargando estado del pedido:', e);
    return null;
  }
}

function pasoDeEstado(estado) {
  const idx = ESTADOS_ORDEN.indexOf(estado);
  return idx === -1 ? null : idx;
}

async function renderSeguimiento() {
  const body = document.getElementById('tracking-content');
  const idElem = document.getElementById('tracking-id');
  if (!body) return;

  const pedido = await cargarEstadoPedido();

  if (!pedido) {
    body.innerHTML = `<p class="tracking-empty">${T('tracking.sinPedido')}</p>`;
    return;
  }

  if (idElem) idElem.textContent = `#${pedido.id_pedido}`;

  const cancelado = pedido.estado === 'cancelado';
  const paso = pasoDeEstado(pedido.estado);

  let pasosHtml = '';
  ESTADOS_ORDEN.forEach((est, i) => {
    const activo = !cancelado && paso !== null && i <= paso;
    const actual = !cancelado && paso !== null && i === paso;
    pasosHtml += `
      <div class="tracking-step ${activo ? 'active' : ''} ${actual ? 'current' : ''}">
        <div class="tracking-dot"></div>
        <span class="tracking-step-label">${tEstado(est)}</span>
      </div>`;
  });

  const itemsHtml = (pedido.items || []).map(it => `
    <div class="tracking-item">
      <span>${it.cantidad}x ${escapeHtml(it.nombre)}</span>
      <span>$${formatearPrecio(it.subtotal)}</span>
    </div>`).join('') || `<p class="tracking-empty">${T('tracking.sinItems')}</p>`;

  body.innerHTML = `
    ${cancelado
      ? `<p class="tracking-cancelado">${T('tracking.cancelado')}</p>`
      : `<div class="tracking-steps">${pasosHtml}</div>`}
    <div class="tracking-detalle">
      <p class="tracking-estado-line">${T('tracking.estado')} <strong>${tEstado(pedido.estado)}</strong></p>
      <div class="tracking-items">${itemsHtml}</div>
      <div class="tracking-total">${T('tracking.total')} <strong>$${formatearPrecio(pedido.total)}</strong></div>
    </div>`;
}

function openTracking() {
  const panel = document.getElementById('tracking-panel');
  const overlay = document.getElementById('tracking-overlay');
  if (!panel || !overlay) return;
  closeCart();
  panel.classList.add('active');
  overlay.classList.add('active');
  renderSeguimiento();
  if (trackingInterval) clearInterval(trackingInterval);
  trackingInterval = setInterval(renderSeguimiento, 15000);
}

function closeTracking() {
  const panel = document.getElementById('tracking-panel');
  const overlay = document.getElementById('tracking-overlay');
  if (panel) panel.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
}

function toggleTracking() {
  const panel = document.getElementById('tracking-panel');
  if (panel && panel.classList.contains('active')) {
    closeTracking();
  } else {
    openTracking();
  }
}

// ============================================================
// RESERVAS
// ============================================================
const WHATSAPP_RESERVAS = '5493756565902'; // ← Cambiá este número si es necesario

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—';
  const [y, m, d] = fechaISO.split('-');
  return `${d}/${m}/${y}`;
}

async function cargarDisponibilidadMesas() {
  const form = document.querySelector('#reservas form');
  const grid = document.getElementById('mesas-grid');
  const hint = document.getElementById('mesas-hint');
  if (!form || !grid || !hint) return;

  const fecha = form.querySelector('input[name="fecha"]')?.value;
  const hora  = form.querySelector('input[name="hora"]')?.value || '20:00';

  if (!fecha) {
    grid.innerHTML = '';
    hint.textContent = T('reservas.hintInicial');
    mesaReservaSeleccionada = null;
    return;
  }

  hint.textContent = T('reservas.cargando');
  try {
    const res = await fetch(`${API_BASE}/mesas/disponibles?fecha=${encodeURIComponent(fecha)}&hora=${encodeURIComponent(hora)}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.mesas)) {
      hint.textContent = T('reservas.error');
      return;
    }

    const disponibles = data.mesas.filter(m => m.disponible);
    hint.textContent = tF('reservas.disponibles', { n: disponibles.length, m: data.mesas.length });

    // Si la mesa elegida dejó de estar disponible, se deselecciona
    if (mesaReservaSeleccionada && !disponibles.some(m => m.id_mesa === mesaReservaSeleccionada.id_mesa)) {
      mesaReservaSeleccionada = null;
    }

    grid.innerHTML = '';
    data.mesas.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mesa-btn' + (m.disponible ? '' : ' ocupada');
      btn.title = m.disponible ? tF('mesa.disponible', { n: m.numero }) : tF('mesa.ocupada', { n: m.numero });
      btn.innerHTML = `<span class="mesa-icon">🍽️</span><span class="mesa-num">${m.numero}</span>`;

      if (m.disponible) {
        if (mesaReservaSeleccionada && mesaReservaSeleccionada.id_mesa === m.id_mesa) {
          btn.classList.add('selected');
        }
        btn.addEventListener('click', () => {
          const mismo = mesaReservaSeleccionada && mesaReservaSeleccionada.id_mesa === m.id_mesa;
          mesaReservaSeleccionada = mismo ? null : { id_mesa: m.id_mesa, numero: m.numero };
          grid.querySelectorAll('.mesa-btn.selected').forEach(b => b.classList.remove('selected'));
          if (!mismo) btn.classList.add('selected');
        });
      } else {
        btn.disabled = true;
      }

      grid.appendChild(btn);
    });
  } catch (e) {
    console.error('Error cargando disponibilidad de mesas:', e);
    hint.textContent = T('reservas.error');
  }
}

function initReservasForm() {
  const form = document.querySelector('#reservas form');
  if (!form) return;

  // Al cambiar fecha u hora se actualiza la disponibilidad de mesas
  const fechaInput = form.querySelector('input[name="fecha"]');
  const horaInput  = form.querySelector('input[name="hora"]');
  [fechaInput, horaInput].forEach(el => {
    if (el) el.addEventListener('change', cargarDisponibilidadMesas);
  });
  // Si la fecha ya viene cargada (ej. al recargar), cargar de una
  if (fechaInput?.value) cargarDisponibilidadMesas();

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Captura de campos
    const nombre   = form.querySelector('input[name="nombre"]')?.value?.trim();
    const telefono = form.querySelector('input[name="telefono"]')?.value?.trim();
    const fecha    = form.querySelector('input[name="fecha"]')?.value;
    const hora     = form.querySelector('input[name="hora"]')?.value || '20:00';
    const mensaje  = form.querySelector('textarea[name="mensaje"]')?.value?.trim() || '';
    const selectPersonas = form.querySelector('select[name="personas"]');
    const personasTexto = selectPersonas?.value || '1 — 2 personas';
    
    // Extraer el primer número (ej: "3 — 4 personas" → "3")
    const personasNum = parseInt(personasTexto.split('—')[0].trim(), 10);

    // Validación
    if (!nombre || !telefono || !fecha) {
      alert(T('alerta.obligatorios'));
      return;
    }

    // Armar mensaje de WhatsApp
    let text = `${T('whatsapp.reservaTitulo')}\n`;
    text += `───────────────────\n`;
    text += `${tF('whatsapp.nombre', { v: nombre })}\n`;
    text += `${tF('whatsapp.telefono', { v: telefono })}\n`;
    text += `${tF('whatsapp.fecha', { v: formatearFecha(fecha) })}\n`;
    text += `${tF('whatsapp.hora', { v: hora })}\n`;
    if (mesaReservaSeleccionada) text += `${tF('whatsapp.mesaR', { v: mesaReservaSeleccionada.numero })}\n`;
    text += `${tF('whatsapp.personas', { v: personasTexto })}\n`;
    if (mensaje) text += `${tF('whatsapp.mensaje', { v: mensaje })}\n`;
    text += `───────────────────\n`;
    text += `${T('whatsapp.desdeWeb')}`;

    // Envío opcional a la API (no bloquea el envío por WhatsApp)
    try {
      const reservaData = {
        nombre, telefono, fecha, hora,
        personas: isNaN(personasNum) ? 2 : personasNum,
        mensaje,
        mesa_id: mesaReservaSeleccionada
          ? mesaReservaSeleccionada.id_mesa
          : (mesaActual ? (mesaActual.id || mesaActual.id_mesa) : null)
      };
      await fetch(`${API_BASE}/reserva/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reservaData)
      });
    } catch (_) {
      // La API es opcional; si falla igual se abre WhatsApp
    }

    // Abrir WhatsApp con el mensaje prearmado
    window.open(
      `https://wa.me/${WHATSAPP_RESERVAS}?text=${encodeURIComponent(text)}`,
      '_blank'
    );

    form.reset();
    mesaReservaSeleccionada = null;
    cargarDisponibilidadMesas();
  });
}
// ============================================================
// MENÚ
// ============================================================
async function cargarMenuDesdeBD() {
  try {
    const res = await fetch(`${API_BASE}/menu`);
    const data = await res.json();
    if (data.success) {
      menuDataGlobal = data.menu;
      Object.values(menuDataGlobal).forEach(productos => {
        productos.forEach(p => { productIds[p.nombre] = p.id; });
      });
      renderizarCategorias();
    }
  } catch(e) { console.error(e); }
}

function renderizarCategorias() {
  const tabs = document.getElementById('categories-tabs');
  if (!tabs) return;
  tabs.innerHTML = '';
  const categorias = Object.keys(menuDataGlobal);
  if (!categorias.length) return;
  const iconos = { merienda:'☕', 'para picar':'🍟', sandwiches:'🍔', 'al plato':'🍽️', pizzas:'🍕' };
  categorias.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${idx === 0 ? 'active' : ''}`;
    btn.innerHTML = `<span class="tab-icon">${iconos[cat.toLowerCase()] || '🍽️'}</span>${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      categoriaActiva_Global = cat;
      renderizarProductos(cat);
    });
    tabs.appendChild(btn);
  });
  categoriaActiva_Global = categorias[0];
  renderizarProductos(categorias[0]);
}

function renderizarProductos(categoria, filtro = '') {
  const container = document.getElementById('menu-items-container');
  if (!container) return;
  container.innerHTML = '';
  let productos = menuDataGlobal[categoria] || [];
  if (filtro) {
    const q = filtro.toLowerCase();
    productos = productos.filter(p => p.nombre.toLowerCase().includes(q) || (p.descripcion && p.descripcion.toLowerCase().includes(q)));
  }
  productos = productos.filter(p => p.disponible !== false);
  if (!productos.length) {
    container.innerHTML = `<p class="menu-subtitle" style="grid-column:1/-1;padding:2rem;">${T('producto.sinResultados')}</p>`;
    return;
  }
  productos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
      <div class="item-img"><div class="item-placeholder">🍽️</div></div>
      <div class="item-info">
        <div class="item-title-row">
          <h3>${escapeHtml(p.nombre)}</h3>
          <span class="price">$${formatearPrecio(parseInt(p.precio))}</span>
        </div>
        <p class="desc">${escapeHtml(p.descripcion || T('producto.sinDesc'))}</p>
      </div>
    `;
    const btn = document.createElement('button');
    btn.className = 'btn-add';
    btn.textContent = T('producto.agregar');
    btn.onclick = (function(nom, pre, bot) {
      return function() { addToCart(nom, pre, bot); };
    })(p.nombre, p.precio, btn);
    div.querySelector('.item-info').appendChild(btn);
    container.appendChild(div);
  });
}

function filtrarMenu() {
  const query = document.getElementById('searchInput')?.value || '';
  if (categoriaActiva_Global) renderizarProductos(categoriaActiva_Global, query);
}

function limpiarBusqueda() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  if (categoriaActiva_Global) renderizarProductos(categoriaActiva_Global);
}

// Cierre fuera del carrito / seguimiento
document.addEventListener('click', function(e) {
  const langBtn = document.getElementById('idioma-toggle');
  if (langBtn?.contains(e.target)) return;

  // Cerrar menú móvil al tocar un link o el fondo
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu?.classList.contains('open')) {
    if (e.target.closest('a') || e.target === mobileMenu) {
      cerrarMobileMenu();
    }
    return;
  }

  const panel = document.getElementById('cart-panel');
  const toggle = document.getElementById('cart-toggle');
  const overlay = document.getElementById('cart-overlay');
  if (panel?.classList.contains('active') && overlay?.classList.contains('active')) {
    if (!panel.contains(e.target) && !toggle?.contains(e.target)) {
      closeCart();
    }
  }

  const tPanel = document.getElementById('tracking-panel');
  const tToggle = document.getElementById('tracking-toggle');
  const tOverlay = document.getElementById('tracking-overlay');
  if (tPanel?.classList.contains('active') && tOverlay?.classList.contains('active')) {
    if (!tPanel.contains(e.target) && !tToggle?.contains(e.target)) {
      closeTracking();
    }
  }
});

// Hamburguesa y teclado para el menú móvil
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('nav-burger');
  if (burger) burger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarMobileMenu();
  });
});

// Re-renderizar contenido dinámico al cambiar el idioma
document.addEventListener('idioma-cambiado', () => {
  actualizarInterfazMesa();
  renderCart();
  if (document.getElementById('mesas-hint')) cargarDisponibilidadMesas();
  if (document.getElementById('tracking-content')) renderSeguimiento();
});

// Exponer funciones globalmente
window.addToCart = addToCart;
window.changeQty = changeQty;
window.clearCart = clearCart;
window.toggleCart = toggleCart;
window.sendOrder = sendOrder;
window.filtrarMenu = filtrarMenu;
window.limpiarBusqueda = limpiarBusqueda;
window.toggleTracking = toggleTracking;
window.toggleMobileMenu = toggleMobileMenu;
window.cerrarMobileMenu = cerrarMobileMenu;