CREATE TABLE IF NOT EXISTS customers_history (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  deleted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices_history (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  amount INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  deleted_at TIMESTAMP DEFAULT NOW()
);