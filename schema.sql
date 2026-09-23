-- ============================================
-- POS System Database Schema (PostgreSQL/Neon)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(20),
    role_id INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stores table (before orders, which references it)
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    manager VARCHAR(100),
    is_default BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE,
    item_code VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT,
    supplier_id INT,
    cost_price DECIMAL(10,2) DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    min_stock INT DEFAULT 5,
    unit VARCHAR(20) DEFAULT 'pcs',
    is_active BOOLEAN DEFAULT TRUE,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Widen image column for base64 data URLs (no-op if already TEXT)
ALTER TABLE products ALTER COLUMN image TYPE TEXT;

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    movement_type VARCHAR(20) NOT NULL DEFAULT 'in'
        CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INT NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    customer_name VARCHAR(100) DEFAULT 'Walk-in Customer',
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    change_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash',
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    store_id INT DEFAULT NULL,
    invoice_number VARCHAR(50) UNIQUE DEFAULT NULL,
    fs_number VARCHAR(20) UNIQUE DEFAULT NULL,
    payment_reference VARCHAR(100) DEFAULT NULL,
    customer_id INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Store transfers table
CREATE TABLE IF NOT EXISTS store_transfers (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    from_store_id INT,
    to_store_id INT,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'cancelled')),
    total_items INT DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_store_id) REFERENCES stores(id) ON DELETE SET NULL,
    FOREIGN KEY (to_store_id) REFERENCES stores(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Store transfer items table
CREATE TABLE IF NOT EXISTS store_transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (transfer_id) REFERENCES store_transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Update triggers for the updated_at columns
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Default data
-- ============================================

-- Default admin user
INSERT INTO users (username, password, full_name, email, role) VALUES
('admin', 'admin123', 'System Administrator', 'admin@pos.com', 'admin'),
('cashier', 'cashier123', 'Default Cashier', 'cashier@pos.com', 'cashier')
ON CONFLICT (username) DO NOTHING;

-- Default categories
INSERT INTO categories (name, description) VALUES
('General', 'General products'),
('Food & Beverages', 'Food and drink items'),
('Electronics', 'Electronic devices and accessories'),
('Stationery', 'Office and school supplies'),
('Household', 'Household items')
ON CONFLICT DO NOTHING;

-- Default suppliers
INSERT INTO suppliers (name, contact_person, phone, email) VALUES
('Default Supplier', 'John Doe', '0123456789', 'supplier@example.com')
ON CONFLICT DO NOTHING;

-- Default store
INSERT INTO stores (id, name, address, phone, is_default, is_active) VALUES
(1, 'Main Store', '123 Main Street', '0123456789', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('store_name', 'My POS Store'),
('store_address', '123 Main Street'),
('store_phone', '0123456789'),
('store_email', 'store@example.com'),
('tax_rate', '10'),
('currency_symbol', 'Br'),
('receipt_footer', 'Thank you for shopping with us!'),
('low_stock_threshold', '10'),
('company_name', 'My Company PLC'),
('trade_name', 'My Company'),
('motif', ''),
('tin_number', ''),
('machine_number', ''),
('receipt_show_tin', 'true'),
('invoice_prefix', 'CA'),
('invoice_suffix', ''),
('invoice_number_next', '1'),
('fs_number_next', '1'),
('active_store_id', '1'),
('pos_customer_default', 'Walk-in Customer'),
('printer_connection', 'browser'),
('receipt_width', '80')
ON CONFLICT (setting_key) DO NOTHING;

-- Sample products
INSERT INTO products (barcode, name, category_id, supplier_id, cost_price, selling_price, stock_quantity, min_stock, unit) VALUES
('1001', 'Bottle Water 500ml', 2, 1, 0.50, 1.00, 100, 20, 'pcs'),
('1002', 'Notebook A5', 4, 1, 1.00, 2.50, 50, 10, 'pcs'),
('1003', 'Ballpoint Pen Blue', 4, 1, 0.30, 0.75, 200, 50, 'pcs'),
('1004', 'USB Cable Type-C', 3, 1, 2.00, 5.00, 30, 5, 'pcs'),
('1005', 'Rice 5kg', 1, 1, 4.00, 6.50, 40, 10, 'bag')
ON CONFLICT DO NOTHING;

-- ============================================
-- Extended schema (ported from PHP pos-system)
-- ============================================

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    address TEXT,
    company VARCHAR(150),
    tax_number VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock receivings (GRN) tables
CREATE TABLE IF NOT EXISTS stock_receivings (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    store_id INT,
    supplier_id INT,
    total_cost DECIMAL(12,2) DEFAULT 0,
    item_count INT DEFAULT 0,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_receiving_items (
    id SERIAL PRIMARY KEY,
    receiving_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (receiving_id) REFERENCES stock_receivings(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL,
    page_key VARCHAR(50) NOT NULL,
    can_access BOOLEAN DEFAULT TRUE,
    UNIQUE (role_id, page_key),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    license_key TEXT NOT NULL,
    company_name VARCHAR(200),
    tin_number VARCHAR(50) UNIQUE,
    modules TEXT,
    start_date DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Held orders table
CREATE TABLE IF NOT EXISTS held_orders (
    id SERIAL PRIMARY KEY,
    user_id INT,
    store_id INT,
    customer_id INT,
    customer_name VARCHAR(150),
    cart_data TEXT NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    held_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Cash drawer sessions table
CREATE TABLE IF NOT EXISTS cash_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT,
    store_id INT,
    opening_cash DECIMAL(12,2) DEFAULT 0,
    closing_cash DECIMAL(12,2),
    expected_cash DECIMAL(12,2),
    discrepancy DECIMAL(12,2),
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_refunds DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'closed')),
    notes TEXT,
    opened_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(100),
    entity VARCHAR(50),
    entity_id INT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Attach open cash sessions to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_session_id INT;

-- Enforce non-negative stock (used by checkout transaction guard)
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_stock_non_negative;
ALTER TABLE products ADD CONSTRAINT check_stock_non_negative CHECK (stock_quantity >= 0);

-- Default roles
INSERT INTO roles (id, name, display_name, description, is_system, is_active) VALUES
(1, 'admin', 'Administrator', 'Full system access', TRUE, TRUE),
(2, 'manager', 'Manager', 'Manage store operations', TRUE, TRUE),
(3, 'cashier', 'Cashier', 'Handle sales at the counter', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Default permissions (admin: everything; manager: all but users; cashier: sales/pos)
WITH perms(page_key) AS (
    VALUES ('dashboard'), ('pos'), ('products'), ('categories'), ('suppliers'),
           ('customers'), ('receiving'), ('transfers'), ('stock'), ('orders'),
           ('reports'), ('users'), ('settings')
)
INSERT INTO permissions (role_id, page_key, can_access)
SELECT r.id, p.page_key, TRUE
FROM (SELECT id FROM roles WHERE name IN ('admin', 'manager')) r
CROSS JOIN perms p
ON CONFLICT (role_id, page_key) DO NOTHING;

WITH perms(page_key) AS (
    VALUES ('dashboard'), ('pos'), ('products'), ('categories'), ('suppliers'),
           ('customers'), ('receiving'), ('transfers'), ('stock'), ('orders'),
           ('reports'), ('users'), ('settings')
)
INSERT INTO permissions (role_id, page_key, can_access)
SELECT r.id, p.page_key, TRUE
FROM (SELECT id FROM roles WHERE name = 'cashier') r
CROSS JOIN perms p
WHERE p.page_key IN ('dashboard', 'pos', 'products', 'orders', 'stock', 'customers')
ON CONFLICT (role_id, page_key) DO NOTHING;

-- Default customers
INSERT INTO customers (name, phone, email, company, tax_number) VALUES
('Walk-in Customer', '', '', '', '')
ON CONFLICT DO NOTHING;