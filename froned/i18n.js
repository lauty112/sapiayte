// ============================================================
// i18n.js — Internacionalización ES/EN de Sapy'Aite
// Vanilla JS, sin dependencias. Debe cargarse ANTES que los
// demás scripts de cada página.
// ============================================================
(function () {
  const IDIOMAS = ['es', 'en'];

  const LANG = {
    es: {
      'loc.num': 'es-AR',

      // NAV / HERO
      'nav.menu': 'Menú',
      'nav.scan': '📷 Escanear Mesa',
      'nav.scanPill': 'Escanear mesa',
      'nav.cambiarMesa': 'Cambiar de mesa',
      'nav.galeria': 'Galería',
      'nav.contacto': 'Contacto',
      'nav.reservar': 'Reservar mesa',
      'hero.title': 'patio<br><em>de comidas</em>',
      'hero.verMenu': 'Ver menú',
      'hero.hacerReserva': 'Hacer reserva',
      'hero.abierto': 'Abierto hoy',
      'hero.horas': '12:00 — 00:00 hs',
      'hero.scroll': 'Scroll',

      // MENÚ
      'menu.label': 'Sabores auténticos',
      'menu.titulo': 'Nuestro Menú',
      'menu.sub': 'Platos preparados con ingredientes frescos y pasión',
      'menu.buscar': 'Buscar en el menú...',

      // RESERVAS
      'reservas.label': '¿Tenés un momento especial?',
      'reservas.titulo': 'Reservá tu mesa',
      'reservas.sub': 'Asegurá tu lugar con tiempo. Para grupos mayores de 8 personas, contactanos directamente.',
      'form.nombre': 'Nombre',
      'form.telefono': 'Teléfono',
      'form.fecha': 'Fecha',
      'form.hora': 'Hora',
      'form.personas': 'Personas',
      'form.mesa': 'Elegí tu mesa',
      'form.mensaje': 'Mensaje (opcional)',
      'form.ph.nombre': 'Tu nombre',
      'form.ph.telefono': '+54 11 ...',
      'form.ph.mensaje': 'Ocasión especial, alergias, preferencias...',
      'form.personas.1': '1 — 2 personas',
      'form.personas.2': '3 — 4 personas',
      'form.personas.3': '5 — 6 personas',
      'form.personas.4': '7 — 8 personas',
      'form.reservar': '📲 Reservar por WhatsApp',
      'reservas.hintInicial': 'Elegí fecha y hora para ver las mesas disponibles.',
      'reservas.cargando': 'Cargando mesas...',
      'reservas.error': 'No se pudo cargar la disponibilidad.',
      'reservas.disponibles': '{n} de {m} mesas disponibles.',

      // GALERÍA / CONTACTO
      'galeria.label': 'El ambiente',
      'galeria.titulo': 'Viví la experiencia',
      'contacto.ubicacion': 'Ubicación',
      'contacto.horarios': 'Horarios',
      'contacto.horario1': 'Lun — Vie',
      'contacto.horario2': 'Sáb — Dom',
      'contacto.abierto': '● Abierto hoy',
      'contacto.contacto': 'Contacto',

      // CARRITO / SEGUIMIENTO
      'cart.title': 'Ver pedido',
      'cart.label': 'Tu pedido',
      'cart.titulo': 'Carrito',
      'cart.vacio': 'Tu carrito está vacío',
      'cart.total': 'Total',
      'cart.enviar': 'Enviar pedido por WhatsApp',
      'cart.vaciar': 'Vaciar carrito',
      'tracking.title': 'Seguir pedido',
      'tracking.label': 'Seguimiento',
      'tracking.titulo': 'Pedido',
      'tracking.sinPedido': 'No hay un pedido para seguir. Enviá tu pedido primero.',
      'tracking.sinItems': 'Sin ítems.',
      'tracking.cancelado': '✕ Pedido cancelado',
      'tracking.estado': 'Estado:',
      'tracking.total': 'Total:',

      // ESTADOS DE PEDIDO
      'estado.pendiente': 'Pendiente',
      'estado.en_preparacion': 'En preparación',
      'estado.listo': 'Listo',
      'estado.entregado': 'Entregado',
      'estado.pagado': 'Pagado',
      'estado.cancelado': 'Cancelado',

      // AVISOS DEL CLIENTE
      'mesa.indicador': '🍽️ Mesa {n}',
      'mesa.disponible': 'Mesa {n} disponible',
      'mesa.ocupada': 'Mesa {n} ocupada',
      'alerta.max99': 'Máximo 99',
      'confirm.vaciar': '¿Vaciar carrito?',
      'alerta.carritoVacio': 'Carrito vacío',
      'alerta.sinMesa': 'No hay mesa seleccionada. Escanea QR.',
      'confirm.irEscanear': 'Ir a escanear?',
      'alerta.sinID': 'Error: productos sin ID. Recarga.',
      'alerta.pedidoEnviado': '¡Pedido enviado!',
      'alerta.errorRegistro': 'No se pudo registrar',
      'alerta.errorRed': 'Error de red. ¿Backend activo?',
      'alerta.obligatorios': 'Completá todos los campos obligatorios.',
      'producto.sinDesc': 'Sin descripción',
      'producto.sinResultados': 'No se encontraron productos.',
      'producto.agregar': 'Agregar',

      // MENSAJES DE WHATSAPP
      'whatsapp.pedidoTitulo': "*Sapy'Aite — Pedido Confirmado*",
      'whatsapp.mesa': 'Mesa N°: {n}',
      'whatsapp.pedidoId': 'Pedido ID: #{id}',
      'whatsapp.total': 'Total: $',
      'whatsapp.gracias': '¡Gracias!',
      'whatsapp.reservaTitulo': "*🍽️ Reserva — Sapy'Aite*",
      'whatsapp.nombre': '👤 *Nombre:* {v}',
      'whatsapp.telefono': '📞 *Teléfono:* {v}',
      'whatsapp.fecha': '📅 *Fecha:* {v}',
      'whatsapp.hora': '🕘 *Hora:* {v}',
      'whatsapp.mesaR': '🪑 *Mesa:* {v}',
      'whatsapp.personas': '👥 *Personas:* {v}',
      'whatsapp.mensaje': '💬 *Mensaje:* {v}',
      'whatsapp.desdeWeb': '_Reserva enviada desde la web_',

      // LOGIN
      'login.title': "Iniciar Sesión - Sapy'Aite",
      'login.titulo': 'Iniciar Sesión',
      'login.email': 'Email',
      'login.password': 'Contraseña',
      'login.ingresar': 'Ingresar',
      'login.volver': '← Volver al sitio',
      'login.errorCredenciales': 'Credenciales incorrectas',
      'login.errorConexion': 'Error de conexión con el servidor',

      // ADMIN
      'admin.title': "Panel de Administración - Sapy'Aite",
      'admin.panel': 'Panel de Control',
      'admin.cerrar': 'Cerrar Sesión',
      'admin.producto': 'Producto',
      'admin.nombre': 'Nombre *',
      'admin.categoria': 'Categoría *',
      'admin.descripcion': 'Descripción',
      'admin.precio': 'Precio *',
      'admin.urlImagen': 'URL Imagen',
      'admin.disponible': 'Disponible',
      'admin.guardar': 'Guardar producto',
      'admin.cancelar': 'Cancelar edición',
      'admin.lista': 'Lista de productos',
      'admin.th.id': 'ID',
      'admin.th.nombre': 'Nombre',
      'admin.th.categoria': 'Categoría',
      'admin.th.precio': 'Precio',
      'admin.th.disponible': 'Disponible',
      'admin.th.acciones': 'Acciones',
      'admin.seleccionaCategoria': '-- Selecciona una Categoría --',
      'admin.si': 'Sí',
      'admin.no': 'No',
      'admin.editar': 'Editar',
      'admin.eliminar': 'Eliminar',
      'admin.confirmEliminar': '¿Eliminar producto ID {id}?',
      'admin.editarTitulo': 'Editar Producto (ID: {id})',
      'admin.errorEliminar': 'No se pudo eliminar',
      'admin.errorGuardar': 'No se pudo guardar',
      'admin.errorConexion': 'Error de conexión',

      // QR SCANNER
      'qr.title': "Escanear QR - Sapy'Aite",
      'qr.h1': 'Escanear QR de la mesa',
      'qr.sub': 'Acercá el código QR de tu mesa a la cámara',
      'qr.iniciar': '📷 Iniciar cámara',
      'qr.detener': '⏹️ Detener',
      'qr.verificando': 'Verificando mesa...',
      'qr.volver': '← Volver al inicio',
      'qr.footer': "Sapy'Aite — Escaneá el QR de tu mesa para comenzar a pedir",
      'qr.yaVerificada': '✓ Mesa ya verificada',
      'qr.irMenu': 'Ir al menú →',
      'qr.mesa': 'Mesa {n}',
      'qr.sinCamara': 'No se encontró ninguna cámara en este dispositivo',
      'qr.accesoCamera': 'No se pudo acceder a la cámara. Verificá los permisos del navegador.',
      'qr.camaraActiva': 'Cámara activa. Apuntá al código QR de la mesa...',
      'qr.errorEscaneo': 'Error al iniciar el escaneo continuo',
      'qr.exito': '✓ Éxito',
      'qr.error': '✗ Error',
      'qr.info': 'ℹ️ Información',
      'qr.mesaAsignada': '¡Mesa {n} asignada correctamente!<br>Redirigiendo al menú...',
      'qr.qrInvalido': 'Código QR o mesa no válida.',
      'qr.errorComunicacion': 'Error de comunicación con el servidor. ¿Está el backend corriendo en {url}?',

      // FOOTER
      'footer.derechos': "© 2024 Sapy'Aite — Todos los derechos reservados",
      'footer.privacidad': 'Privacidad',
      'footer.terminos': 'Términos'
    },

    en: {
      'loc.num': 'en-US',

      // NAV / HERO
      'nav.menu': 'Menu',
      'nav.scan': '📷 Scan Table',
      'nav.scanPill': 'Scan table',
      'nav.cambiarMesa': 'Change table',
      'nav.galeria': 'Gallery',
      'nav.contacto': 'Contact',
      'nav.reservar': 'Book a table',
      'hero.title': 'food<br><em>court</em>',
      'hero.verMenu': 'View menu',
      'hero.hacerReserva': 'Make a reservation',
      'hero.abierto': 'Open today',
      'hero.horas': '12:00 — 00:00',
      'hero.scroll': 'Scroll',

      // MENU
      'menu.label': 'Authentic flavors',
      'menu.titulo': 'Our Menu',
      'menu.sub': 'Dishes made with fresh ingredients and passion',
      'menu.buscar': 'Search the menu...',

      // RESERVATIONS
      'reservas.label': 'Got a special occasion?',
      'reservas.titulo': 'Book your table',
      'reservas.sub': 'Secure your spot in advance. For groups of more than 8, contact us directly.',
      'form.nombre': 'Name',
      'form.telefono': 'Phone',
      'form.fecha': 'Date',
      'form.hora': 'Time',
      'form.personas': 'Guests',
      'form.mesa': 'Choose your table',
      'form.mensaje': 'Message (optional)',
      'form.ph.nombre': 'Your name',
      'form.ph.telefono': '+54 11 ...',
      'form.ph.mensaje': 'Special occasion, allergies, preferences...',
      'form.personas.1': '1 — 2 people',
      'form.personas.2': '3 — 4 people',
      'form.personas.3': '5 — 6 people',
      'form.personas.4': '7 — 8 people',
      'form.reservar': '📲 Book via WhatsApp',
      'reservas.hintInicial': 'Choose a date and time to see available tables.',
      'reservas.cargando': 'Loading tables...',
      'reservas.error': 'Could not load availability.',
      'reservas.disponibles': '{n} of {m} tables available.',

      // GALLERY / CONTACT
      'galeria.label': 'The atmosphere',
      'galeria.titulo': 'Experience it',
      'contacto.ubicacion': 'Location',
      'contacto.horarios': 'Hours',
      'contacto.horario1': 'Mon — Fri',
      'contacto.horario2': 'Sat — Sun',
      'contacto.abierto': '● Open today',
      'contacto.contacto': 'Contact',

      // CART / TRACKING
      'cart.title': 'View order',
      'cart.label': 'Your order',
      'cart.titulo': 'Cart',
      'cart.vacio': 'Your cart is empty',
      'cart.total': 'Total',
      'cart.enviar': 'Send order via WhatsApp',
      'cart.vaciar': 'Empty cart',
      'tracking.title': 'Track order',
      'tracking.label': 'Tracking',
      'tracking.titulo': 'Order',
      'tracking.sinPedido': 'No order to track yet. Send your order first.',
      'tracking.sinItems': 'No items.',
      'tracking.cancelado': '✕ Order cancelled',
      'tracking.estado': 'Status:',
      'tracking.total': 'Total:',

      // ORDER STATUS
      'estado.pendiente': 'Pending',
      'estado.en_preparacion': 'Preparing',
      'estado.listo': 'Ready',
      'estado.entregado': 'Delivered',
      'estado.pagado': 'Paid',
      'estado.cancelado': 'Cancelled',

      // CUSTOMER ALERTS
      'mesa.indicador': '🍽️ Table {n}',
      'mesa.disponible': 'Table {n} available',
      'mesa.ocupada': 'Table {n} occupied',
      'alerta.max99': 'Maximum 99',
      'confirm.vaciar': 'Empty cart?',
      'alerta.carritoVacio': 'Cart is empty',
      'alerta.sinMesa': 'No table selected. Scan the QR.',
      'confirm.irEscanear': 'Go scan?',
      'alerta.sinID': 'Error: products without ID. Reload.',
      'alerta.pedidoEnviado': 'Order sent!',
      'alerta.errorRegistro': 'Could not register',
      'alerta.errorRed': 'Network error. Is the backend running?',
      'alerta.obligatorios': 'Fill in all required fields.',
      'producto.sinDesc': 'No description',
      'producto.sinResultados': 'No products found.',
      'producto.agregar': 'Add',

      // WHATSAPP MESSAGES
      'whatsapp.pedidoTitulo': "*Sapy'Aite — Order Confirmed*",
      'whatsapp.mesa': 'Table N°: {n}',
      'whatsapp.pedidoId': 'Order ID: #{id}',
      'whatsapp.total': 'Total: $',
      'whatsapp.gracias': 'Thank you!',
      'whatsapp.reservaTitulo': "*🍽️ Reservation — Sapy'Aite*",
      'whatsapp.nombre': '👤 *Name:* {v}',
      'whatsapp.telefono': '📞 *Phone:* {v}',
      'whatsapp.fecha': '📅 *Date:* {v}',
      'whatsapp.hora': '🕘 *Time:* {v}',
      'whatsapp.mesaR': '🪑 *Table:* {v}',
      'whatsapp.personas': '👥 *Guests:* {v}',
      'whatsapp.mensaje': '💬 *Message:* {v}',
      'whatsapp.desdeWeb': '_Reservation sent from the website_',

      // LOGIN
      'login.title': "Sign In - Sapy'Aite",
      'login.titulo': 'Sign In',
      'login.email': 'Email',
      'login.password': 'Password',
      'login.ingresar': 'Sign in',
      'login.volver': '← Back to site',
      'login.errorCredenciales': 'Incorrect credentials',
      'login.errorConexion': 'Connection error with the server',

      // ADMIN
      'admin.title': "Admin Panel - Sapy'Aite",
      'admin.panel': 'Control Panel',
      'admin.cerrar': 'Sign Out',
      'admin.producto': 'Product',
      'admin.nombre': 'Name *',
      'admin.categoria': 'Category *',
      'admin.descripcion': 'Description',
      'admin.precio': 'Price *',
      'admin.urlImagen': 'Image URL',
      'admin.disponible': 'Available',
      'admin.guardar': 'Save product',
      'admin.cancelar': 'Cancel edit',
      'admin.lista': 'Product list',
      'admin.th.id': 'ID',
      'admin.th.nombre': 'Name',
      'admin.th.categoria': 'Category',
      'admin.th.precio': 'Price',
      'admin.th.disponible': 'Available',
      'admin.th.acciones': 'Actions',
      'admin.seleccionaCategoria': '-- Select a Category --',
      'admin.si': 'Yes',
      'admin.no': 'No',
      'admin.editar': 'Edit',
      'admin.eliminar': 'Delete',
      'admin.confirmEliminar': 'Delete product ID {id}?',
      'admin.editarTitulo': 'Edit Product (ID: {id})',
      'admin.errorEliminar': 'Could not delete',
      'admin.errorGuardar': 'Could not save',
      'admin.errorConexion': 'Connection error',

      // QR SCANNER
      'qr.title': "Scan QR - Sapy'Aite",
      'qr.h1': 'Scan the table QR',
      'qr.sub': 'Point your camera at the table QR code',
      'qr.iniciar': '📷 Start camera',
      'qr.detener': '⏹️ Stop',
      'qr.verificando': 'Verifying table...',
      'qr.volver': '← Back to home',
      'qr.footer': "Sapy'Aite — Scan your table QR to start ordering",
      'qr.yaVerificada': '✓ Table already verified',
      'qr.irMenu': 'Go to menu →',
      'qr.mesa': 'Table {n}',
      'qr.sinCamara': 'No camera found on this device',
      'qr.accesoCamera': 'Could not access the camera. Check your browser permissions.',
      'qr.camaraActiva': 'Camera active. Point it at the table QR code...',
      'qr.errorEscaneo': 'Error starting continuous scan',
      'qr.exito': '✓ Success',
      'qr.error': '✗ Error',
      'qr.info': 'ℹ️ Info',
      'qr.mesaAsignada': 'Table {n} assigned successfully!<br>Redirecting to the menu...',
      'qr.qrInvalido': 'Invalid QR code or table.',
      'qr.errorComunicacion': 'Communication error with the server. Is the backend running at {url}?',

      // FOOTER
      'footer.derechos': "© 2024 Sapy'Aite — All rights reserved",
      'footer.privacidad': 'Privacy',
      'footer.terminos': 'Terms'
    }
  };

  let idiomaActual = 'es';

  function detectarIdioma() {
    try {
      const guardado = localStorage.getItem('idioma');
      if (guardado && IDIOMAS.includes(guardado)) return guardado;
    } catch (e) { /* modo archivo */ }
    const nav = (navigator.language || 'es').toLowerCase();
    return nav.indexOf('en') === 0 ? 'en' : 'es';
  }

  window.T = function (key) {
    const table = LANG[idiomaActual] || LANG.es;
    if (key in table) return table[key];
    if (key in LANG.es) return LANG.es[key];
    return key;
  };

  // Traducción con parámetros: {nombre} → valor
  window.tF = function (key, params) {
    return window.T(key).replace(/\{(\w+)\}/g, function (m, k) {
      return params && params[k] != null ? params[k] : m;
    });
  };

  window.getIdioma = function () { return idiomaActual; };

  window.setIdioma = function (lang) {
    if (!IDIOMAS.includes(lang)) return;
    idiomaActual = lang;
    try { localStorage.setItem('idioma', lang); } catch (e) { /* noop */ }
    aplicarIdioma();
    // Avisar a los demás scripts para que re-rendericen contenido dinámico
    document.dispatchEvent(new CustomEvent('idioma-cambiado', { detail: idiomaActual }));
  };

  function aplicarIdioma() {
    document.documentElement.lang = idiomaActual;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = window.T(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = window.T(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', window.T(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.setAttribute('title', window.T(el.getAttribute('data-i18n-title')));
    });

    const toggle = document.getElementById('idioma-toggle');
    if (toggle) toggle.textContent = idiomaActual === 'es' ? '🌐 EN' : '🌐 ES';
  }

  function crearToggle() {
    if (document.getElementById('idioma-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'idioma-toggle';
    btn.className = 'idioma-toggle';
    btn.setAttribute('aria-label', 'Cambiar idioma');
    btn.addEventListener('click', function () {
      window.setIdioma(idiomaActual === 'es' ? 'en' : 'es');
    });
    document.body.appendChild(btn);
  }

  document.addEventListener('DOMContentLoaded', function () {
    idiomaActual = detectarIdioma();
    crearToggle();
    aplicarIdioma();
  });
})();
