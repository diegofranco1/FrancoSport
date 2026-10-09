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

  const productUrl = `/product.html?id=${encodeURIComponent(product.id)}`;
  const imageLink = document.createElement('a');
  imageLink.href = productUrl;
  imageLink.setAttribute('aria-label', `Ver detalles de ${product.name}`);

  const image = document.createElement('img');
  image.src = product.url;
  image.alt = product.name;
  image.className = 'card-img-top';
  imageLink.appendChild(image);
  card.appendChild(imageLink);

  const body = document.createElement('div');
  body.className = 'card-body d-flex flex-column';

  const name = document.createElement('h3');
  name.className = 'card-title';
  const nameLink = document.createElement('a');
  nameLink.href = productUrl;
  nameLink.textContent = product.name;
  nameLink.className = 'product-card-link';
  name.appendChild(nameLink);
  body.appendChild(name);

  const stock = Number(product.stock) || 0;
  const stockText = document.createElement('p');
  stockText.className = 'card-text';
  stockText.textContent = stock > 0 ? `${stock} unidades disponibles` : 'Agotado';
  body.appendChild(stockText);

  const price = document.createElement('p');
  price.className = 'text-primary fw-bold';
  price.textContent = formatCLP(product.price);
  body.appendChild(price);

  const detailsLink = document.createElement('a');
  detailsLink.href = productUrl;
  detailsLink.className = 'btn btn-primary w-100 mt-auto';
  detailsLink.textContent = 'Ver producto y tallas';

  body.appendChild(detailsLink);
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
