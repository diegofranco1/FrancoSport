document.addEventListener("DOMContentLoaded", async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        console.error("Respuesta no OK:", response.status, response.statusText);

        if (response.status === 401) {
          redirectToLogin();
          return;
        } else if (response.status === 403) {
          window.location.href = '/';
          return;
        } else {
          const errorData = await response.json();
          console.error("Detalles del error:", errorData);
          throw new Error("Hubo un problema al cargar los datos.");
        }
      } else {
        const data = await response.json();
        console.log("Datos recibidos:", data);
        mostrarDatosAdmin(data);
      }
    } catch (error) {
      console.error("Error al obtener datos de administración:", error);
      showToast('No pudimos cargar el panel de administración.', 'error');
    }
  });

  function mostrarDatosAdmin(data) {
    const ventasTotalesElement = document.getElementById('ventas-totales');
    const productosContainer = document.getElementById('productos-container');
    const totalSales = Number(data.totalSales) || 0;
    ventasTotalesElement.textContent = formatCLP(totalSales);
    productosContainer.innerHTML = "";
data.products.forEach((product) => {
  const productRow = document.createElement('tr');
  productRow.innerHTML = `
    <td>${product.id}</td>
    <td>
      <input type="text" class="form-control" name="name" id="name-${product.id}" value="${product.name}" required>
    </td>
    <td>
      <input type="number" class="form-control" name="price" id="price-${product.id}" value="${product.price}" required>
    </td>
    <td>
      <input type="url" class="form-control" name="url" id="url-${product.id}" value="${product.url}" required>
    </td>
    <td>
      <input type="number" class="form-control" name="stock" id="stock-${product.id}" value="${product.stock}" required>
    </td>
    <td>
      <button type="button" class="btn btn-success" onclick="actualizarProducto(${product.id})">Actualizar</button>
    </td>
    <td>
      <button class="btn btn-danger" onclick="eliminarProducto(${product.id})">Eliminar</button>
    </td>
  `;
  productosContainer.appendChild(productRow);
});
  }
  async function eliminarProducto(productId) {
    const confirmacion = await confirmAction(
      '¿Estás seguro de que quieres eliminar este producto?',
      'Eliminar producto',
    );
    if (!confirmacion) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (response.status === 403) {
        window.location.href = '/';
        return;
      }
      if (response.ok) {
        showToast('Producto eliminado correctamente.');
        setTimeout(() => location.reload(), 900);
      } else {
        const errorData = await response.json();
        console.error("Error al eliminar el producto:", errorData);
        showToast(errorData.message || 'No pudimos eliminar el producto.', 'error');
      }
    } catch (error) {
      console.error("Error en la solicitud de eliminación:", error);
      showToast('No pudimos conectar con el servidor.', 'error');
    }
  }
  document.getElementById('crearProductoForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombre = document.getElementById('nombreProducto').value;
    const precio = parseFloat(document.getElementById('precioProducto').value);
    const url = document.getElementById('urlImagen').value;
    const stock = parseInt(document.getElementById('stockProducto').value);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: nombre, price: precio, url: url, stock: stock }),
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (response.status === 403) {
        window.location.href = '/';
        return;
      }
      if (response.ok) {
        showToast('Producto creado correctamente.');
        setTimeout(() => window.location.href = '/', 900);
      } else {
        const errorData = await response.json();
        console.error('Error al crear el producto:', errorData);
        showToast(errorData.error || 'No pudimos crear el producto.', 'error');
      }
    } catch (error) {
      console.error('Error en la solicitud de creación:', error);
      showToast('No pudimos conectar con el servidor.', 'error');
    }
  });
  async function actualizarProducto(productId) {
    const name = document.getElementById(`name-${productId}`).value;
    const price = document.getElementById(`price-${productId}`).value;
    const url = document.getElementById(`url-${productId}`).value;
    const stock = document.getElementById(`stock-${productId}`).value;

    const datosProducto = {
      name,
      price,
      url,
      stock,
    };

    try {
      const response = await fetch(`/api/admin/edit/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosProducto),
        credentials: 'include',
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (response.status === 403) {
        window.location.href = '/';
        return;
      }
      if (response.ok) {
        const data = await response.json();
        showToast(data.message || 'Producto actualizado correctamente.');
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'No pudimos actualizar el producto.', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      showToast('No pudimos conectar con el servidor.', 'error');
    }
  }
