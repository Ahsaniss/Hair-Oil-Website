import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, insertProfileSchema, insertProductSchema, insertCategorySchema, insertOrderSchema, insertOrderItemSchema, insertCartItemSchema, insertReviewSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "5c9115d07b65d055cb9e2ddeedc69e5d370f35ea4b686e56d68058e1fa7fedd5ebdbfda87e1413984d9a997319d69860d2016763334ffbc6bcf8724184fa796e";

// Auth middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        role: 'user'
      });

      // Create profile
      await storage.createProfile({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Change own password (authenticated user)
  app.post('/api/auth/change-password', authenticateToken, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'currentPassword and newPassword required' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Current password incorrect' });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashed });
      res.json({ success: true });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Admin reset user password
  app.post('/api/admin/users/:id/reset-password', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword) return res.status(400).json({ error: 'newPassword required' });
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(targetUser.id, { password: hashed });
      res.json({ success: true });
    } catch (error) {
      console.error('Admin reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.get('/api/auth/profile', authenticateToken, async (req: any, res) => {
    try {
      const profile = await storage.getProfile(req.user.id);
      res.json({ user: req.user, profile });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error('Products fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/featured', async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error('Featured products fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch featured products' });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Product fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  app.post('/api/products', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error('Product creation error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Product update error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Product deletion error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Categories fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  app.post('/api/categories', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error('Category creation error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  // Cart routes
  app.get('/api/cart', authenticateToken, async (req: any, res) => {
    try {
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      console.error('Cart fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  });

  app.post('/api/cart', authenticateToken, async (req: any, res) => {
    try {
      const cartData = insertCartItemSchema.parse({
        ...req.body,
        user_id: req.user.id
      });
      const cartItem = await storage.addToCart(cartData);
      res.json(cartItem);
    } catch (error) {
      console.error('Cart add error:', error);
      res.status(500).json({ error: 'Failed to add to cart' });
    }
  });

  app.put('/api/cart/:id', authenticateToken, async (req: any, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      res.json(cartItem);
    } catch (error) {
      console.error('Cart update error:', error);
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  });

  app.delete('/api/cart/:id', authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.removeFromCart(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Cart removal error:', error);
      res.status(500).json({ error: 'Failed to remove from cart' });
    }
  });

  app.delete('/api/cart', authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.clearCart(req.user.id);
      res.json({ success });
    } catch (error) {
      console.error('Cart clear error:', error);
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  });

  // Order routes
  app.get('/api/orders', authenticateToken, async (req: any, res) => {
    try {
      const orders = await storage.getUserOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      console.error('Orders fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.post('/api/orders', authenticateToken, async (req: any, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        user_id: req.user.id,
        order_number: `ORD-${Date.now()}`
      });
      
      const order = await storage.createOrder(orderData);
      
      // Create order items
      const { items } = req.body;
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createOrderItem({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image,
            quantity: item.quantity,
            price: item.price
          });
        }
      }
      
      // Clear cart after order
      await storage.clearCart(req.user.id);
      
      res.json(order);
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Admin routes
  app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error('Admin orders fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      console.error('Order status update error:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Customer routes  
  app.get('/api/customers', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error('Customers fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.patch('/api/customers/:id/status', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { isActive } = req.body;
      const customer = await storage.updateCustomerStatus(req.params.id, isActive);
      res.json(customer);
    } catch (error) {
      console.error('Customer status update error:', error);
      res.status(500).json({ error: 'Failed to update customer status' });
    }
  });

  // Review routes
  app.get('/api/products/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getProductReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error('Reviews fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  app.post('/api/products/:id/reviews', authenticateToken, async (req: any, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        product_id: req.params.id,
        user_id: req.user.id
      });
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error('Review creation error:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
