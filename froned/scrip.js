// ============================================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ============================================================
const API_URL = 'https://sapiayte-bz3i.onrender.com';

let mesaActual = null;
let cart = [];
let productIds = {};
let menuDataGlobal = {};
let categoriaActiva_Global = null;

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Inicializando app...");
  cargarMesaDesdeStorage();
  cargarCarrito();
  cargarMenuDesdeBD();
  initReservasForm();
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
  const navLogo = document.querySelector('.nav-logo');
  if (!navLogo) return;
  const old = navLogo.querySelector('.mesa-indicador');
  if (old) old.remove();
  if (mesaActual && mesaActual.numero) {
    const span = document.createElement('span');
    span.className = 'mesa-indicador';
    span.style.cssText = 'font-size:0.9rem; color:var(--gold); margin-left:10px;';
    span.innerText = `🍽️ Mesa ${mesaActual.numero}`;
    navLogo.appendChild(span);
  }
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
    else { alert('Máximo 99'); return; }
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
    alert('Máximo 99');
    return;
  } else {
    item.qty = newQty;
  }
  renderCart();
  guardarCarrito();
}

function clearCart() {
  if (confirm('¿Vaciar carrito?')) {
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
    container.innerHTML = `<div class="cart-empty"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p>Tu carrito está vacío</p></div>`;
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
      <div class="cart-item-price">$${item.price.toLocaleString('es-AR')}</div>
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
  document.getElementById('cart-total').innerHTML = '<span>$</span>' + total.toLocaleString('es-AR');
  updateCartCount();
}

function openCart() {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('cart-overlay');
  if (panel && overlay) {
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

// ============================================================
// ENVÍO DE PEDIDO
// ============================================================
async function sendOrder() {
  const savedMesa = localStorage.getItem('mesa_actual');
  const mesa = savedMesa ? JSON.parse(savedMesa) : mesaActual;
  if (mesa) mesaActual = mesa;

  if (cart.length === 0) {
    alert('Carrito vacío');
    return;
  }
  if (!mesa || (!mesa.numero && !mesa.id)) {
    alert('No hay mesa seleccionada. Escanea QR.');
    if (confirm('Ir a escanear?')) location.href = 'qr-scaner.html';
    return;
  }
  const missing = cart.filter(item => !item.product_id);
  if (missing.length) {
    alert('Error: productos sin ID. Recarga.');
    return;
  }
  const pedidoData = {
    mesa_id: mesa.id || mesa.id_mesa,
    items: cart.map(item => ({
      producto_id: item.product_id,
      cantidad: item.qty,
      precio: item.price
    })),
    observaciones: ''
  };
  try {
    const response = await fetch(`${API_URL}/pedido/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(pedidoData)
    });
    const data = await response.json();
    if (data.success) {
      let text = `*Sapy'Aite — Pedido Confirmado*\nMesa N°: ${mesa.numero}\nPedido ID: #${data.pedido_id}\n`;
      let total = 0;
      cart.forEach(i => {
        text += `${i.qty}x ${i.name} — $${(i.price * i.qty).toLocaleString('es-AR')}\n`;
        total += i.price * i.qty;
      });
      text += `Total: $${total.toLocaleString('es-AR')}\n¡Gracias!`;
      window.open(`https://wa.me/5493756565902?text=${encodeURIComponent(text)}`, '_blank');
      cart = [];
      renderCart();
      guardarCarrito();
      closeCart();
      alert('¡Pedido enviado!');
    } else {
      alert('Error: ' + (data.error || 'No se pudo registrar'));
    }
  } catch (error) {
    alert('Error de red. ¿Backend activo?');
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

function initReservasForm() {
  const form = document.querySelector('#reservas form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Captura de campos
    const nombre   = form.querySelector('input[name="nombre"]')?.value?.trim();
    const telefono = form.querySelector('input[name="telefono"]')?.value?.trim();
    const fecha    = form.querySelector('input[name="fecha"]')?.value;
    const mensaje  = form.querySelector('textarea[name="mensaje"]')?.value?.trim() || '';
    const selectPersonas = form.querySelector('select[name="personas"]');
    const personasTexto = selectPersonas?.value || '1 — 2 personas';
    
    // Extraer el primer número (ej: "3 — 4 personas" → "3")
    const personasNum = parseInt(personasTexto.split('—')[0].trim(), 10);

    // Validación
    if (!nombre || !telefono || !fecha) {
      alert('Completá todos los campos obligatorios.');
      return;
    }

    // Armar mensaje de WhatsApp
    let text = `*🍽️ Reserva — Sapy'Aite*\n`;
    text += `───────────────────\n`;
    text += `👤 *Nombre:* ${nombre}\n`;
    text += `📞 *Teléfono:* ${telefono}\n`;
    text += `📅 *Fecha:* ${formatearFecha(fecha)}\n`;
    text += `👥 *Personas:* ${personasTexto}\n`;
    if (mensaje) text += `💬 *Mensaje:* ${mensaje}\n`;
    text += `───────────────────\n`;
    text += `_Reserva enviada desde la web_`;

    // Envío opcional a la API (no bloquea el envío por WhatsApp)
    try {
      const reservaData = {
        nombre, telefono, fecha, hora: '20:00:00',
        personas: isNaN(personasNum) ? 2 : personasNum,
        mensaje,
        mesa_id: mesaActual ? (mesaActual.id || mesaActual.id_mesa) : null
      };
      await fetch(`${API_URL}/reserva/crear`, {
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
  });
}
// ============================================================
// MENÚ
// ============================================================
async function cargarMenuDesdeBD() {
  try {
    const res = await fetch(`${API_URL}/menu`);
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
    container.innerHTML = '<p class="menu-subtitle" style="grid-column:1/-1;padding:2rem;">No se encontraron productos.</p>';
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
          <span class="price">$${parseInt(p.precio).toLocaleString('es-AR')}</span>
        </div>
        <p class="desc">${escapeHtml(p.descripcion || 'Sin descripción')}</p>
      </div>
    `;
    const btn = document.createElement('button');
    btn.className = 'btn-add';
    btn.textContent = 'Agregar';
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

// Cierre fuera del carrito
document.addEventListener('click', function(e) {
  const panel = document.getElementById('cart-panel');
  const toggle = document.getElementById('cart-toggle');
  const overlay = document.getElementById('cart-overlay');
  if (panel?.classList.contains('active') && overlay?.classList.contains('active')) {
    if (!panel.contains(e.target) && !toggle?.contains(e.target)) {
      closeCart();
    }
  }
});

// Exponer funciones globalmente
window.addToCart = addToCart;
window.changeQty = changeQty;
window.clearCart = clearCart;
window.toggleCart = toggleCart;
window.sendOrder = sendOrder;
window.filtrarMenu = filtrarMenu;
window.limpiarBusqueda = limpiarBusqueda;