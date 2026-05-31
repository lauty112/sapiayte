// Usamos 'var' o validamos la existencia para evitar el error "Identifier already been declared"
if (typeof API_URL === 'undefined') {
    window.API_URL = 'http://127.0.0.1:5000/api';
}

// Declaramos las categorías globalmente de forma segura
if (typeof categorias === 'undefined') {
    window.categorias = [];
}

// Esperamos a que el HTML esté completamente cargado antes de validar nada
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🔒 Iniciando controles de seguridad del panel...");
  
  // Forzamos la validación de la sesión
  const sesionValida = await verificarSesion();
  
  if (sesionValida) {
    console.log("🔓 Acceso concedido. Cargando datos de la base de datos...");
    await cargarCategorias();
    await cargarProductos();
  }
});

// ✅ CORREGIDO: Ruta exacta de Flask y validación estricta del rol 'admin'
async function verificarSesion() {
  try {
    const res = await fetch(`${window.API_URL}/empleado/actual`, { credentials: 'include' });
    
    if (res.status === 404) {
      console.error("❌ Error 404: La ruta /api/empleado/actual no existe en el backend.");
      window.location.href = 'login.html';
      return false;
    }

    const data = await res.json();
    console.log("Datos recibidos del servidor en sesión:", data);
    
    // Tu backend devuelve 'data.empleado.rol_nombre' según tu sentencia SQL
    if (!data.success || !data.empleado || data.empleado.rol !== 'admin') {
      console.warn("⚠️ Intento de acceso no autorizado o rol incorrecto.");
      window.location.href = 'login.html';
      return false;
    }
    
    return true;
  } catch(e) {
    console.error("❌ Fallo crítico en verificarSesion, expulsando por seguridad:", e);
    window.location.href = 'login.html';
    return false;
  }
}

// ✅ CORREGIDO: Inyección en el id="categoriaId" exacto de admin.html
async function cargarCategorias() {
  try {
    const res = await fetch(`${window.API_URL}/categorias`, { credentials: 'include' });
    const data = await res.json();
    
    if (data.success && Array.isArray(data.categorias)) {
      window.categorias = data.categorias;
      const select = document.getElementById('categoriaId'); 
      
      if (!select) {
        console.error("❌ Error: No existe un <select id='categoriaId'> en tu admin.html");
        return;
      }

      select.innerHTML = '';
      
      // Opción inicial vacía
      const defOption = document.createElement('option');
      defOption.value = '';
      defOption.textContent = '-- Selecciona una Categoría --';
      select.appendChild(defOption);

      window.categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id; // Mapea al ID de la categoría devuelto por conexion.py
        option.textContent = cat.nombre;
        select.appendChild(option);
      });
      console.log("✅ Selector de categorías sincronizado e inyectado con éxito.");
    }
  } catch(e) {
    console.error('❌ Error cargando categorías desde el backend:', e);
  }
}

async function cargarProductos() {
  try {
    const res = await fetch(`${window.API_URL}/admin/productos`, { credentials: 'include' });
    const data = await res.json();
    
    if (data.success && Array.isArray(data.productos)) {
      const tbody = document.getElementById('productsTbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      
      data.productos.forEach(prod => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = prod.id;
        row.insertCell(1).textContent = prod.nombre;
        row.insertCell(2).textContent = prod.categoria_nombre;
        row.insertCell(3).textContent = `$${prod.precio}`;
        row.insertCell(4).textContent = prod.disponible ? 'Sí' : 'No';
        
        const acciones = row.insertCell(5);
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.className = 'edit';
        editBtn.onclick = () => editarProducto(prod);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.className = 'delete';
        deleteBtn.onclick = () => eliminarProducto(prod.id);
        
        acciones.appendChild(editBtn);
        acciones.appendChild(deleteBtn);
      });
    }
  } catch(e) {
    console.error('Error cargando productos:', e);
  }
}

async function eliminarProducto(id) {
  if (!confirm(`¿Eliminar producto ID ${id}?`)) return;
  try {
    const res = await fetch(`${window.API_URL}/admin/productos/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      cargarProductos();
    } else {
      alert('Error: ' + (data.error || 'No se pudo eliminar'));
    }
  } catch(e) {
    alert('Error de conexión');
  }
}

function editarProducto(prod) {
  document.getElementById('productId').value = prod.id;
  document.getElementById('nombre').value = prod.nombre;
  document.getElementById('descripcion').value = prod.descripcion || '';
  document.getElementById('precio').value = prod.precio;
  document.getElementById('categoriaId').value = prod.categoria_id;
  document.getElementById('imagenUrl').value = prod.imagen_url || '';
  document.getElementById('disponible').checked = prod.disponible;
  
  document.querySelector('.product-form-section h2').textContent = 'Editar Producto (ID: ' + prod.id + ')';
}

function resetFormulario() {
  document.getElementById('productId').value = '';
  document.getElementById('productForm').reset();
  document.querySelector('.product-form-section h2').textContent = 'Producto';
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  
  const producto = {
    nombre: document.getElementById('nombre').value,
    descripcion: document.getElementById('descripcion').value,
    precio: parseFloat(document.getElementById('precio').value),
    categoria_id: parseInt(document.getElementById('categoriaId').value),
    imagen_url: document.getElementById('imagenUrl').value,
    disponible: document.getElementById('disponible').checked
  };

  let url = `${window.API_URL}/admin/productos`;
  let method = 'POST';
  if (id) {
    url = `${window.API_URL}/admin/productos/${id}`;
    method = 'PUT';
  }
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(producto)
    });
    const data = await res.json();
    if (data.success) {
      resetFormulario();
      cargarProductos();
    } else {
      alert('Error: ' + (data.error || 'No se pudo guardar'));
    }
  } catch(e) { 
    alert('Error de conexión'); 
  }
});

document.getElementById('cancelEditBtn').addEventListener('click', resetFormulario);

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch(`${window.API_URL}/logout`, { method: 'POST', credentials: 'include' });
  window.location.href = 'login.html';
});