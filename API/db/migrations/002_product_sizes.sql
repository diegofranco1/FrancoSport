BEGIN;

CREATE TABLE product_sizes (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(5) NOT NULL CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  PRIMARY KEY (product_id, size)
);

WITH size_options(size, size_order) AS (
  VALUES ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6)
),
product_size_inventory AS (
  SELECT
    p.id AS product_id,
    p.stock,
    sizes.size,
    sizes.size_order,
    ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY sizes.size_order) AS size_number
  FROM products AS p
  CROSS JOIN size_options AS sizes
)
INSERT INTO product_sizes (product_id, size, stock)
SELECT
  product_id,
  size,
  (stock / 6) + CASE WHEN size_number <= MOD(stock, 6) THEN 1 ELSE 0 END
FROM product_size_inventory;

ALTER TABLE cart_item
  ADD COLUMN size VARCHAR(5) NOT NULL DEFAULT 'M';

ALTER TABLE cart_item
  ADD CONSTRAINT cart_item_product_size_fk
  FOREIGN KEY (product_id, size)
  REFERENCES product_sizes (product_id, size)
  ON DELETE CASCADE;

CREATE INDEX cart_item_product_size_idx
  ON cart_item (product_id, size);

COMMIT;
