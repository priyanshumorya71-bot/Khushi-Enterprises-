const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String },
    image: { type: String },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    orderDate: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// Image upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// API Routes

// Product APIs
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : '';
        
        const product = new Product({
            name,
            description,
            price: parseFloat(price),
            category,
            stock: parseInt(stock),
            image
        });
        
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        const updates = req.body;
        if (req.file) {
            updates.image = `/uploads/${req.file.filename}`;
        }
        
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        );
        
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Order APIs
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        orderData.orderId = 'ORD' + Date.now();
        
        const order = new Order(orderData);
        await order.save();
        
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('products.productId')
            .sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'Pending' });
        
        const totalRevenue = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        res.json({
            totalProducts,
            totalOrders,
            pendingOrders,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

