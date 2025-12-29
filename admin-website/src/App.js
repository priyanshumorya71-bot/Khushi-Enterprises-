import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image: null
    });

    // Fetch data
    useEffect(() => {
        fetchProducts();
        fetchOrders();
        fetchStats();
    }, []);

    const fetchProducts = async () => {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        setProducts(data);
    };

    const fetchOrders = async () => {
        const response = await fetch('http://localhost:5000/api/orders');
        const data = await response.json();
        setOrders(data);
    };

    const fetchStats = async () => {
        const response = await fetch('http://localhost:5000/api/dashboard/stats');
        const data = await response.json();
        setStats(data);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            image: e.target.files[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) {
                formDataToSend.append(key, formData[key]);
            }
        });

        try {
            let response;
            if (editingProduct) {
                response = await fetch(`http://localhost:5000/api/products/${editingProduct._id}`, {
                    method: 'PUT',
                    body: formDataToSend
                });
            } else {
                response = await fetch('http://localhost:5000/api/products', {
                    method: 'POST',
                    body: formDataToSend
                });
            }

            if (response.ok) {
                setShowProductForm(false);
                setEditingProduct(null);
                setFormData({
                    name: '',
                    description: '',
                    price: '',
                    category: '',
                    stock: '',
                    image: null
                });
                fetchProducts();
            }
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            image: null
        });
        setShowProductForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE'
            });
            fetchProducts();
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        fetchOrders();
    };

    return (
        <div className="admin-container">
            {/* Header */}
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="stats">
                    <div className="stat-card">
                        <h3>Total Products</h3>
                        <p>{stats.totalProducts || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Orders</h3>
                        <p>{stats.totalOrders || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Pending Orders</h3>
                        <p>{stats.pendingOrders || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Revenue</h3>
                        <p>₹{stats.totalRevenue || 0}</p>
                    </div>
                </div>
            </header>

            <main className="admin-main">
                {/* Product Management Section */}
                <section className="section">
                    <div className="section-header">
                        <h2>Product Management</h2>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowProductForm(true)}
                        >
                            Add New Product
                        </button>
                    </div>

                    {showProductForm && (
                        <div className="product-form-modal">
                            <div className="modal-content">
                                <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                                <form onSubmit={handleSubmit}>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Product Name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <textarea
                                        name="description"
                                        placeholder="Description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                    />
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="Price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="category"
                                        placeholder="Category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                    />
                                    <input
                                        type="number"
                                        name="stock"
                                        placeholder="Stock Quantity"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                    />
                                    <input
                                        type="file"
                                        name="image"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary">
                                            {editingProduct ? 'Update' : 'Add'} Product
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowProductForm(false);
                                                setEditingProduct(null);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="products-grid">
                        {products.map(product => (
                            <div key={product._id} className="product-card">
                                <img 
                                    src={`http://localhost:5000${product.image}`} 
                                    alt={product.name}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/150';
                                    }}
                                />
                                <div className="product-info">
                                    <h3>{product.name}</h3>
                                    <p className="price">₹{product.price}</p>
                                    <p className="category">{product.category}</p>
                                    <p className="stock">Stock: {product.stock}</p>
                                    <div className="product-actions">
                                        <button 
                                            className="btn btn-edit"
                                            onClick={() => handleEdit(product)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="btn btn-delete"
                                            onClick={() => handleDelete(product._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Order Management Section */}
                <section className="section">
                    <h2>Recent Orders</h2>
                    <div className="orders-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Products</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id}>
                                        <td>{order.orderId}</td>
                                        <td>
                                            <div>
                                                <strong>{order.customerName}</strong><br/>
                                                {order.customerEmail}<br/>
                                                {order.customerPhone}
                                            </div>
                                        </td>
                                        <td>
                                            {order.products.map((p, idx) => (
                                                <div key={idx}>
                                                    {p.name} x {p.quantity}
                                                </div>
                                            ))}
                                        </td>
                                        <td>₹{order.totalAmount}</td>
                                        <td>
                                            <span className={`status-${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                        <td>
                                            <select 
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Confirmed">Confirmed</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;
