const productMessage = document.getElementById('product-message');
const productDetail = document.getElementById('product-detail');
const productSizes = document.getElementById('product-sizes');
const quantityInput = document.getElementById('product-quantity');
const addToCartButton = document.getElementById('add-to-cart-button');
const productId = new URLSearchParams(window.location.search).get('id');
let currentProduct;
let selectedSize;

function updateSelectedSize(size) {
  selectedSize = size;
  const selectedInventory = currentProduct.sizes.find(option => option.size === size);
  const availableStock = Number(selectedInventory?.stock) || 0;

  document.getElementById('product-stock').textContent = availableStock > 0
    ? `${availableStock} unidades disponibles en talla ${size}`
    : `Talla ${size} agotada`;
  quantityInput.max = String(availableStock);
  quantityInput.disabled = availableStock < 1;
  if (Number(quantityInput.value) > availableStock || Number(quantityInput.value) < 1) {
    quantityInput.value = availableStock > 0 ? '1' : '0';
  }
  addToCartButton.disabled = availableStock < 1;
  addToCartButton.textContent = availableStock > 0 ? 'Agregar al carro' : 'Talla agotada';
}

function renderProduct(product) {
  currentProduct = product;
  document.title = `${product.name} | Franco Sport`;
  document.getElementById('product-image').src = product.url;
  document.getElementById('product-image').alt = product.name;
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-price').textContent = formatCLP(product.price);
  productSizes.replaceChildren();

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  sizes.forEach((option, index) => {
    const stock = Number(option.stock) || 0;
    const inputId = `product-size-${option.size}`;
    const label = document.createElement('label');
    label.className = 'product-size-option';
    label.htmlFor = inputId;

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'size';
    input.id = inputId;
    input.value = option.size;
    input.disabled = stock < 1;
    input.checked = index === sizes.findIndex(candidate => Number(candidate.stock) > 0);
    input.addEventListener('change', () => updateSelectedSize(option.size));

    const sizeName = document.createElement('span');
    sizeName.className = 'product-size-name';
    sizeName.textContent = option.size;

    const sizeStock = document.createElement('span');
    sizeStock.className = 'product-size-stock';
    sizeStock.textContent = stock > 0 ? `${stock} disp.` : 'Agotada';

    label.append(input, sizeName, sizeStock);
    productSizes.appendChild(label);
  });

  const firstAvailableSize = sizes.find(option => Number(option.stock) > 0);
  if (firstAvailableSize) {
    updateSelectedSize(firstAvailableSize.size);
  } else {
    document.getElementById('product-stock').textContent = 'Producto agotado en todas las tallas.';
    quantityInput.disabled = true;
    addToCartButton.disabled = true;
    addToCartButton.textContent = 'Agotado';
  }

  productMessage.hidden = true;
  productDetail.hidden = false;
}

async function loadProduct() {
  if (!productId || !/^\d+$/.test(productId)) {
    productMessage.textContent = 'El enlace del producto no es válido.';
    return;
  }

  try {
    const response = await fetch(`/api/products/${encodeURIComponent(productId)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'No pudimos cargar este producto.');
    }
    renderProduct(data.product);
  } catch (error) {
    console.error('Error al cargar el detalle del producto:', error);
    productMessage.textContent = error.message;
    productMessage.className = 'alert alert-warning mt-4';
  }
}

document.getElementById('product-purchase-form').addEventListener('submit', async event => {
  event.preventDefault();
  const quantity = Number(quantityInput.value);
  if (!selectedSize || !Number.isInteger(quantity) || quantity < 1) {
    showToast('Selecciona una talla y una cantidad válida.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        product_id: currentProduct.id,
        quantity,
        size: selectedSize,
      }),
    });
    const data = await response.json();

    if (response.status === 401) {
      redirectToLogin();
      return;
    }
    if (!response.ok) {
      throw new Error(data.error || 'No pudimos agregar el producto al carro.');
    }
    showToast(data.message || 'Producto agregado al carro.');
  } catch (error) {
    console.error('Error al agregar el producto al carro:', error);
    showToast(error.message, 'error');
  }
});

quantityInput.addEventListener('change', () => {
  const maxQuantity = Number(quantityInput.max);
  const quantity = Number(quantityInput.value);
  if (quantity < 1) quantityInput.value = '1';
  if (quantity > maxQuantity) quantityInput.value = String(maxQuantity);
});

loadProduct();
