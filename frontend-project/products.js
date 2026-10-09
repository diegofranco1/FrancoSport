const productList = document.getElementById('product-list');

function showProductMessage(message, className = 'text-secondary') {
  const notice = document.createElement('p');
  notice.className = className;
  notice.textContent = message;
  productList.replaceChildren(notice);
}

function renderProduct(product) {
  const column = document.createElement('div');
  column.className = 'col-lg-4 col-md-6';

  const card = document.createElement('article');
  card.className = 'card h-100';

  const image = document.createElement('img');
  image.src = product.url;
  image.alt = product.name;
  image.className = 'card-img-top';
  card.appendChild(image);

  const body = document.createElement('div');
  body.className = 'card-body d-flex flex-column';

  const name = document.createElement('h3');
  name.className = 'card-title';
  name.textContent = product.name;
  body.appendChild(name);

  const stock = Number(product.stock) || 0;
  const stockText = document.createElement('p');
  stockText.className = 'card-text';
  stockText.textContent = stock > 0 ? `${stock} disponibles` : 'Agotado';
  body.appendChild(stockText);

  const price = document.createElement('p');
  price.className = 'text-primary fw-bold';
  price.textContent = formatCLP(product.price);
  body.appendChild(price);

  const form = document.createElement('form');
  form.className = 'add-to-cart-form mt-auto';
  form.dataset.productId = product.id;

  const quantityGroup = document.createElement('div');
  quantityGroup.className = 'd-flex align-items-center gap-2 mb-3';

  const quantityLabel = document.createElement('label');
  quantityLabel.htmlFor = `quantity-${product.id}`;
  quantityLabel.className = 'form-label mb-0';
  quantityLabel.textContent = 'Unidades';

  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.id = `quantity-${product.id}`;
  quantityInput.name = 'quantity';
  quantityInput.value = '1';
  quantityInput.min = '1';
  quantityInput.max = String(stock);
  quantityInput.required = true;
  quantityInput.className = 'form-control';
  quantityInput.style.maxWidth = '90px';

  quantityGroup.append(quantityLabel, quantityInput);
  form.appendChild(quantityGroup);

  const addButton = document.createElement('button');
  addButton.type = 'submit';
  addButton.className = 'btn btn-primary w-100';
  addButton.textContent = stock > 0 ? 'Agregar al carro' : 'Agotado';
  addButton.disabled = stock <= 0;
  form.appendChild(addButton);

  form.addEventListener('submit', event => {
    event.preventDefault();
    addToCart(form.dataset.productId, quantityInput.value);
  });

  body.appendChild(form);
  card.appendChild(body);
  column.appendChild(card);
  productList.appendChild(column);
}

async function fetchProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error(`Error ${response.status} al obtener los productos`);
    }

    const data = await response.json();
    if (!Array.isArray(data.products)) {
      throw new Error('La respuesta del servidor no contiene una lista de productos');
    }

    productList.replaceChildren();
    if (data.products.length === 0) {
      showProductMessage('Todavía no hay productos disponibles.');
      return;
    }

    data.products.forEach(renderProduct);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    showProductMessage('No pudimos cargar los productos. Intenta nuevamente más tarde.', 'alert alert-warning');
  }
}

fetchProducts();

async function addToCart(productId, quantity) {
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: productId, quantity: parseInt(quantity) }),
      credentials: 'include'
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }
    if (!response.ok) throw new Error(`Error en la solicitud: ${response.status}`);

    const data = await response.json();
    showToast(data.message || 'Producto agregado al carro.');
  } catch (error) {
    console.error('Error al agregar al carro:', error);
    showToast('No pudimos agregar el producto. Intenta nuevamente.', 'error');
  }
}
