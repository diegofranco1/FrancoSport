async function fetchCart() {
    try {
      const response = await fetch('/api/cart', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          redirectToLogin();
          return;
        }
        showToast('No pudimos cargar tu carro. Intenta nuevamente.', 'error');
        return;
      }

      const data = await response.json();
      const products = Array.isArray(data.products) ? data.products : [];
      const totalProducts = parseInt(data.totalProducts, 10) || 0;
      const totalPrice = parseFloat(data.totalPrice) || 0;

      console.log('Productos en el carro:', products);
      updateCart(products, totalProducts, totalPrice);
    } catch (error) {
      console.error('Error al obtener el carro:', error);
      showToast('No pudimos conectar con el servidor. Intenta nuevamente.', 'error');
    }
  }

  function updateCart(products, totalProducts, totalPrice) {
    const cartContainer = document.getElementById('cart-items-container');
    const emptyCartAlert = document.getElementById('empty-cart-alert');

    emptyCartAlert.style.display = products.length === 0 ? 'block' : 'none';
    cartContainer.innerHTML = '';

    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'card mb-3';
      productCard.innerHTML = `
        <div class="d-flex align-items-center p-3">
          <img src="${product.url}" class="img-fluid" style="width: 100px; height: 100px; object-fit: cover;" alt="${product.name}">
          <div class="ms-3">
            <h5 class="card-title">${product.name}</h5>
            <p><strong>Talla:</strong> ${product.size}</p>
            <p><strong>Unidades:</strong> ${product.quantity}</p>
            <p><strong>Subtotal:</strong> ${formatCLP(product.total_price)}</p>
            <button class="btn btn-danger btn-sm delete-product-btn" data-product-id="${product.id}" data-product-size="${product.size}">Eliminar</button>
          </div>
        </div>
      `;
      cartContainer.appendChild(productCard);
    });

    const totalProductsElement = document.getElementById('total-products');
    const totalPriceElement = document.getElementById('total-price');

    if (totalProductsElement) {
      totalProductsElement.textContent = totalProducts;
    } else {
      console.error("Elemento con id 'total-products' no encontrado.");
    }

    if (totalPriceElement) {
      totalPriceElement.textContent = formatCLP(totalPrice);
    } else {
      console.error("Elemento con id 'total-price' no encontrado.");
    }

    document.querySelectorAll('.delete-product-btn').forEach(button => {
      button.addEventListener('click', function () {
        const productId = this.getAttribute('data-product-id');
        const productSize = this.getAttribute('data-product-size');
        console.log('ID del producto seleccionado:', productId);
        deleteProductFromCart(productId, productSize);
      });
    });
  }

  async function deleteProductFromCart(productId, productSize) {
    if (!productId || !productSize) {
      console.error('No se proporcionaron el ID y la talla del producto.');
      showToast('No pudimos identificar el producto que quieres eliminar.', 'error');
      return;
    }

    const numericProductId = Number(productId);
    if (isNaN(numericProductId)) {
      console.error("ID de producto inválido:", productId);
      showToast('El producto seleccionado no es válido.', 'error');
      return;
    }

    const confirmDelete = await confirmAction(
      '¿Quieres quitar este producto de tu carro?',
      'Quitar producto',
    );
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/cart/${numericProductId}/${encodeURIComponent(productSize)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al eliminar el producto:", errorData);
        showToast(errorData.error || 'No pudimos quitar el producto del carro.', 'error');
        return;
      }

      const data = await response.json();
      showToast(data.message || 'Producto eliminado del carro.');
      fetchCart();
    } catch (error) {
      console.error("Error al realizar la solicitud de eliminación:", error);
      showToast('No pudimos quitar el producto. Intenta nuevamente.', 'error');
    }
  }

  async function buyProducts() {
    try {
      const response = await fetch('/api/buy', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        throw new Error('Error al procesar la compra');
      }
      const data = await response.json();
      if (data.errorMessage) {
        showToast(data.errorMessage, 'error');
        return;
      }
      const receipt = data.receipt;
      showToast(`¡Compra realizada! Recibo n.º ${receipt.id}. Total: ${formatCLP(receipt.amount)}.`);
      fetchCart();
    } catch (error) {
      console.error('Error al realizar la compra:', error);
      showToast('No pudimos procesar la compra. Intenta nuevamente.', 'error');
    }
  }

  document.getElementById('checkout-button').addEventListener('click', async () => {
    const shouldBuy = await confirmAction('¿Confirmas que quieres realizar la compra?', 'Pagar');
    if (shouldBuy) await buyProducts();
  });

  document.addEventListener('DOMContentLoaded', fetchCart);
