const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vazivibe_super_secret_key_12345';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Paths
const DB_DIR = path.join(__dirname, 'database');
const TENANTS_FILE = path.join(DB_DIR, 'tenants.json');
const SUPERADMIN_FILE = path.join(DB_DIR, 'superadmin.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Helper to get tenant-specific file paths
function getTenantDbPaths(subdomain) {
  const tenantDir = path.join(DB_DIR, 'tenants', subdomain);
  return {
    dir: tenantDir,
    settingsFile: path.join(tenantDir, 'settings.json'),
    productsFile: path.join(tenantDir, 'products.json')
  };
}

// Ensure directories exist and run migration if needed
async function initDirs() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(path.join(DB_DIR, 'tenants'), { recursive: true });
    
    if (!existsSync(TENANTS_FILE)) {
      await fs.writeFile(TENANTS_FILE, JSON.stringify([], null, 2));
    }
    
    if (!existsSync(SUPERADMIN_FILE)) {
      const defaultSuperPasswordHash = await bcrypt.hash('nyisu2026', 10);
      await fs.writeFile(SUPERADMIN_FILE, JSON.stringify({
        passwordHash: defaultSuperPasswordHash,
        whatsappNumber: "255756670798"
      }, null, 2));
    }
    
    // Auto-migration from single-tenant to multi-tenant:
    const rootSettingsFile = path.join(DB_DIR, 'settings.json');
    const rootProductsFile = path.join(DB_DIR, 'products.json');
    
    if (existsSync(rootSettingsFile) && existsSync(rootProductsFile)) {
      console.log("Migrating existing single-tenant database to multi-tenant...");
      const tenantsData = await fs.readFile(TENANTS_FILE, 'utf8');
      const tenants = JSON.parse(tenantsData);
      
      const hasMitindo = tenants.some(t => t.subdomain === 'mitindo');
      if (!hasMitindo) {
        const rootSettings = JSON.parse(await fs.readFile(rootSettingsFile, 'utf8'));
        const rootProducts = JSON.parse(await fs.readFile(rootProductsFile, 'utf8'));
        
        // Ensure tenant dir exists
        const { dir, settingsFile, productsFile } = getTenantDbPaths('mitindo');
        await fs.mkdir(dir, { recursive: true });
        
        await fs.writeFile(settingsFile, JSON.stringify(rootSettings, null, 2));
        await fs.writeFile(productsFile, JSON.stringify(rootProducts, null, 2));
        
        // Expiration date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        const newTenant = {
          subdomain: 'mitindo',
          storeName: rootSettings.storeName || 'VaziVibe Boutique',
          ownerName: 'VaziVibe Owner',
          whatsappNumber: rootSettings.whatsappNumber || '255712345678',
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          status: 'active',
          adminPasswordHash: rootSettings.adminPasswordHash
        };
        
        tenants.push(newTenant);
        await fs.writeFile(TENANTS_FILE, JSON.stringify(tenants, null, 2));
        console.log("Migration to 'mitindo' tenant completed successfully!");
      }
    }
  } catch (error) {
    console.error("Initialization error:", error);
  }
}
initDirs();

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (.jpg, .jpeg, .png, .webp, .gif) are allowed!"));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper to extract subdomain
function getSubdomain(host) {
  if (!host) return null;
  const hostname = host.split(':')[0].toLowerCase();
  
  if (hostname.endsWith('.localhost')) {
    return hostname.replace('.localhost', '');
  }
  
  if (hostname.endsWith('.mitindo.nyisu.com')) {
    return hostname.replace('.mitindo.nyisu.com', '');
  }
  
  const parts = hostname.split('.');
  if (parts.length > 2 && hostname !== 'mitindo.nyisu.com' && hostname !== 'localhost') {
    return parts[0];
  }
  
  return null;
}

// Middleware to resolve tenant and check expiration
const resolveTenant = async (req, res, next) => {
  const subdomain = getSubdomain(req.headers.host);
  
  // Base domain (Superadmin area / landing)
  if (!subdomain) {
    req.isMainDomain = true;
    return next();
  }
  
  try {
    const tenantsData = await fs.readFile(TENANTS_FILE, 'utf8');
    const tenants = JSON.parse(tenantsData);
    const tenant = tenants.find(t => t.subdomain === subdomain);
    
    if (!tenant) {
      return res.status(404).json({ message: "Duka hili halikupatikana kwenye mfumo wetu." });
    }
    
    req.isMainDomain = false;
    req.subdomain = subdomain;
    req.tenant = tenant;
    
    // Subscription Check
    const isExpired = new Date() > new Date(tenant.expiresAt);
    const isSuspended = tenant.status !== 'active';
    
    if (isExpired || isSuspended) {
      req.tenantExpired = true;
      req.tenantMessage = isSuspended ? "Duka hili limesitishwa na admin." : "Mfumo umejifunga. Siku za malipo zimeisha.";
      
      // If requesting store-related API, return 403 Forbidden with lock data
      const publicRoutes = ['/api/settings', '/api/products'];
      const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
      const isAdminRoute = req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/verify') || req.method !== 'GET';
      
      if (isPublicRoute || isAdminRoute) {
        const superadminData = JSON.parse(await fs.readFile(SUPERADMIN_FILE, 'utf8'));
        return res.status(403).json({
          expired: true,
          message: req.tenantMessage,
          storeName: tenant.storeName,
          whatsappNumber: superadminData.whatsappNumber || "255756670798"
        });
      }
    } else {
      req.tenantExpired = false;
    }
    
    next();
  } catch (err) {
    console.error("resolveTenant error:", err);
    res.status(500).json({ message: "Server error resolving tenant." });
  }
};

app.use(resolveTenant);

// Authentication Middleware for Tenant Admins
const authenticateToken = (req, res, next) => {
  if (req.isMainDomain) {
    return res.status(401).json({ message: "Access denied. Main domain context." });
  }
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: "Access denied. Token missing." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token." });
    if (user.subdomain !== req.subdomain) {
      return res.status(403).json({ message: "Access denied. Unauthorized for this shop." });
    }
    req.user = user;
    next();
  });
};

// Authentication Middleware for Superadmin
const authenticateSuperadminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: "Access denied. Token missing." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || !user.superadmin) {
      return res.status(403).json({ message: "Invalid or expired superadmin token." });
    }
    req.user = user;
    next();
  });
};

// Static routes
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'frontend/dist')));


// --- SUPERADMIN API ENDPOINTS ---

// Superadmin Login
app.post('/api/superadmin/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const superData = JSON.parse(await fs.readFile(SUPERADMIN_FILE, 'utf8'));
    const isMatch = await bcrypt.compare(password, superData.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect superadmin password." });
    }

    const token = jwt.sign({ superadmin: true }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error during superadmin login." });
  }
});

// Verify Superadmin Token
app.get('/api/superadmin/verify', authenticateSuperadminToken, (req, res) => {
  res.json({ valid: true, message: "Authorized" });
});

// Get Superadmin Settings
app.get('/api/superadmin/settings', authenticateSuperadminToken, async (req, res) => {
  try {
    const superData = JSON.parse(await fs.readFile(SUPERADMIN_FILE, 'utf8'));
    const { passwordHash, ...publicData } = superData;
    res.json(publicData);
  } catch (error) {
    res.status(500).json({ message: "Server error getting settings." });
  }
});

// Update Superadmin Settings
app.put('/api/superadmin/settings', authenticateSuperadminToken, async (req, res) => {
  try {
    const { whatsappNumber, newPassword } = req.body;
    const superData = JSON.parse(await fs.readFile(SUPERADMIN_FILE, 'utf8'));
    
    if (whatsappNumber) superData.whatsappNumber = whatsappNumber;
    if (newPassword && newPassword.trim() !== "") {
      superData.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    
    await fs.writeFile(SUPERADMIN_FILE, JSON.stringify(superData, null, 2));
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error updating settings." });
  }
});

// Get all tenants
app.get('/api/superadmin/tenants', authenticateSuperadminToken, async (req, res) => {
  try {
    const tenantsData = await fs.readFile(TENANTS_FILE, 'utf8');
    const tenants = JSON.parse(tenantsData);
    
    const now = new Date();
    const tenantsWithDays = tenants.map(t => {
      const expires = new Date(t.expiresAt);
      const diffTime = expires - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...t,
        remainingDays: diffDays
      };
    });
    
    res.json(tenantsWithDays);
  } catch (error) {
    res.status(500).json({ message: "Server error getting tenants." });
  }
});

// Create tenant
app.post('/api/superadmin/tenants', authenticateSuperadminToken, async (req, res) => {
  try {
    const { subdomain, storeName, ownerName, whatsappNumber, expiresAt, adminPassword } = req.body;
    
    if (!subdomain || !storeName || !whatsappNumber || !expiresAt || !adminPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }
    
    const subdomainRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({ message: "Subdomain is invalid. Use lowercase letters, numbers, and dashes only." });
    }
    
    if (['www', 'admin', 'superadmin', 'api', 'uploads'].includes(subdomain)) {
      return res.status(400).json({ message: "Subdomain name is reserved." });
    }
    
    const tenantsData = await fs.readFile(TENANTS_FILE, 'utf8');
    const tenants = JSON.parse(tenantsData);
    
    if (tenants.some(t => t.subdomain === subdomain)) {
      return res.status(400).json({ message: "Subdomain already exists." });
    }
    
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const paths = getTenantDbPaths(subdomain);
    await fs.mkdir(paths.dir, { recursive: true });
    
    const defaultSettings = {
      storeName,
      whatsappNumber,
      currency: "Tsh",
      adminPasswordHash
    };
    
    await fs.writeFile(paths.settingsFile, JSON.stringify(defaultSettings, null, 2));
    await fs.writeFile(paths.productsFile, JSON.stringify([], null, 2));
    
    const newTenant = {
      subdomain,
      storeName,
      ownerName: ownerName || 'Bila Jina',
      whatsappNumber,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      status: 'active',
      adminPasswordHash
    };
    
    tenants.push(newTenant);
    await fs.writeFile(TENANTS_FILE, JSON.stringify(tenants, null, 2));
    
    res.status(201).json({ message: "Tenant created successfully", tenant: newTenant });
  } catch (error) {
    res.status(500).json({ message: "Server error creating tenant." });
  }
});

// Update tenant
app.put('/api/superadmin/tenants/:subdomain', authenticateSuperadminToken, async (req, res) => {
  try {
    const { storeName, ownerName, whatsappNumber, expiresAt, status, adminPassword } = req.body;
    const { subdomain } = req.params;
    
    const tenantsData = await fs.readFile(TENANTS_FILE, 'utf8');
    const tenants = JSON.parse(tenantsData);
    const index = tenants.findIndex(t => t.subdomain === subdomain);
    
    if (index === -1) {
      return res.status(404).json({ message: "Tenant not found." });
    }
    
    const tenant = tenants[index];
    if (storeName) tenant.storeName = storeName;
    if (ownerName) tenant.ownerName = ownerName;
    if (whatsappNumber) tenant.whatsappNumber = whatsappNumber;
    if (expiresAt) tenant.expiresAt = new Date(expiresAt).toISOString();
    if (status) tenant.status = status;
    
    let passwordHash = null;
    if (adminPassword && adminPassword.trim() !== "") {
      passwordHash = await bcrypt.hash(adminPassword, 10);
      tenant.adminPasswordHash = passwordHash;
    }
    
    const paths = getTenantDbPaths(subdomain);
    if (existsSync(paths.settingsFile)) {
      const settings = JSON.parse(await fs.readFile(paths.settingsFile, 'utf8'));
      if (storeName) settings.storeName = storeName;
      if (whatsappNumber) settings.whatsappNumber = whatsappNumber;
      if (passwordHash) settings.adminPasswordHash = passwordHash;
      await fs.writeFile(paths.settingsFile, JSON.stringify(settings, null, 2));
    }
    
    tenants[index] = tenant;
    await fs.writeFile(TENANTS_FILE, JSON.stringify(tenants, null, 2));
    
    res.json({ message: "Tenant updated successfully", tenant });
  } catch (error) {
    res.status(500).json({ message: "Server error updating tenant." });
  }
});

// Delete tenant
app.delete('/api/superadmin/tenants/:subdomain', authenticateSuperadminToken, async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const tenantsData = await fs.readFile(TENANTS_FILE, 'utf8');
    const tenants = JSON.parse(tenantsData);
    const index = tenants.findIndex(t => t.subdomain === subdomain);
    
    if (index === -1) {
      return res.status(404).json({ message: "Tenant not found." });
    }
    
    const paths = getTenantDbPaths(subdomain);
    try {
      await fs.rm(paths.dir, { recursive: true, force: true });
    } catch (err) {
      console.warn("Could not delete tenant directory:", paths.dir, err.message);
    }
    
    tenants.splice(index, 1);
    await fs.writeFile(TENANTS_FILE, JSON.stringify(tenants, null, 2));
    
    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting tenant." });
  }
});


// --- TENANT API ENDPOINTS ---

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  if (req.isMainDomain) {
    return res.status(400).json({ message: "Shops can only login on their subdomain." });
  }
  
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const isMatch = await bcrypt.compare(password, req.tenant.adminPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const token = jwt.sign({ admin: true, subdomain: req.subdomain }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error during login." });
  }
});

// Verify Token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, message: "Authorized" });
});

// Get Settings (Public)
app.get('/api/settings', async (req, res) => {
  if (req.isMainDomain) {
    return res.status(400).json({ message: "Main domain has no shop settings." });
  }
  
  try {
    const paths = getTenantDbPaths(req.subdomain);
    const settingsData = await fs.readFile(paths.settingsFile, 'utf8');
    const settings = JSON.parse(settingsData);
    
    const { adminPasswordHash, ...publicSettings } = settings;
    res.json(publicSettings);
  } catch (error) {
    res.status(500).json({ message: "Failed to read settings." });
  }
});

// Update Settings (Admin Only)
app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { storeName, whatsappNumber, currency, newPassword } = req.body;
    const paths = getTenantDbPaths(req.subdomain);
    const settingsData = await fs.readFile(paths.settingsFile, 'utf8');
    const settings = JSON.parse(settingsData);

    if (storeName) settings.storeName = storeName;
    if (whatsappNumber) settings.whatsappNumber = whatsappNumber;
    if (currency) settings.currency = currency;
    
    let passwordHash = null;
    if (newPassword && newPassword.trim() !== "") {
      passwordHash = await bcrypt.hash(newPassword, 10);
      settings.adminPasswordHash = passwordHash;
    }

    await fs.writeFile(paths.settingsFile, JSON.stringify(settings, null, 2));
    
    // Also update in tenants.json
    const tenantsData = await fs.readFile(TENANTS_FILE, 'utf8');
    const tenants = JSON.parse(tenantsData);
    const index = tenants.findIndex(t => t.subdomain === req.subdomain);
    if (index !== -1) {
      if (storeName) tenants[index].storeName = storeName;
      if (whatsappNumber) tenants[index].whatsappNumber = whatsappNumber;
      if (passwordHash) tenants[index].adminPasswordHash = passwordHash;
      await fs.writeFile(TENANTS_FILE, JSON.stringify(tenants, null, 2));
    }
    
    const { adminPasswordHash, ...publicSettings } = settings;
    res.json({ message: "Settings updated successfully", settings: publicSettings });
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings." });
  }
});

// Get All Products (Public)
app.get('/api/products', async (req, res) => {
  if (req.isMainDomain) {
    return res.status(400).json({ message: "Main domain has no products." });
  }
  
  try {
    const paths = getTenantDbPaths(req.subdomain);
    const productsData = await fs.readFile(paths.productsFile, 'utf8');
    let products = JSON.parse(productsData);

    // Apply filters if query params exist
    const { search, category } = req.query;
    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to read products." });
  }
});

// Get Single Product (Public)
app.get('/api/products/:id', async (req, res) => {
  try {
    const paths = getTenantDbPaths(req.subdomain);
    const productsData = await fs.readFile(paths.productsFile, 'utf8');
    const products = JSON.parse(productsData);
    const product = products.find(p => p.id === req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to read product." });
  }
});

// Add Product (Admin Only)
app.post('/api/products', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category, sizes } = req.body;
    
    if (!title || !price || !category) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(400).json({ message: "Title, Price, and Category are required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Product image is required." });
    }

    const paths = getTenantDbPaths(req.subdomain);
    const productsData = await fs.readFile(paths.productsFile, 'utf8');
    const products = JSON.parse(productsData);

    let parsedSizes = [];
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
      } catch (e) {
        parsedSizes = sizes.split(',').map(s => s.trim());
      }
    }

    const newProduct = {
      id: Date.now().toString(),
      title,
      description: description || '',
      price: parseFloat(price),
      category,
      sizes: parsedSizes,
      imageUrl: `/uploads/${req.file.filename}`,
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    await fs.writeFile(paths.productsFile, JSON.stringify(products, null, 2));

    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch (e) {}
    }
    res.status(500).json({ message: "Server error while adding product." });
  }
});

// Update Product (Admin Only)
app.put('/api/products/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category, sizes } = req.body;
    const { id } = req.params;

    const paths = getTenantDbPaths(req.subdomain);
    const productsData = await fs.readFile(paths.productsFile, 'utf8');
    const products = JSON.parse(productsData);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(404).json({ message: "Product not found" });
    }

    const oldProduct = products[index];

    let parsedSizes = oldProduct.sizes;
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
      } catch (e) {
        parsedSizes = sizes.split(',').map(s => s.trim());
      }
    }

    let imageUrl = oldProduct.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      const oldFilename = path.basename(oldProduct.imageUrl);
      const oldFilePath = path.join(UPLOADS_DIR, oldFilename);
      try {
        await fs.unlink(oldFilePath);
      } catch (err) {
        console.warn("Could not delete old image:", oldFilePath, err.message);
      }
    }

    const updatedProduct = {
      ...oldProduct,
      title: title || oldProduct.title,
      description: description !== undefined ? description : oldProduct.description,
      price: price ? parseFloat(price) : oldProduct.price,
      category: category || oldProduct.category,
      sizes: parsedSizes,
      imageUrl,
      updatedAt: new Date().toISOString()
    };

    products[index] = updatedProduct;
    await fs.writeFile(paths.productsFile, JSON.stringify(products, null, 2));

    res.json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch (e) {}
    }
    res.status(500).json({ message: "Server error while updating product." });
  }
});

// Delete Product (Admin Only)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const paths = getTenantDbPaths(req.subdomain);
    const productsData = await fs.readFile(paths.productsFile, 'utf8');
    const products = JSON.parse(productsData);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) return res.status(404).json({ message: "Product not found" });

    const product = products[index];
    const filename = path.basename(product.imageUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn("Could not delete product image file:", filePath, err.message);
    }

    products.splice(index, 1);
    await fs.writeFile(paths.productsFile, JSON.stringify(products, null, 2));

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error while deleting product." });
  }
});

// Wildcard route to serve React frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Mitindo Multi-Tenant Server is running on port ${PORT}`);
});
