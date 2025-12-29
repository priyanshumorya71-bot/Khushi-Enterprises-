import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [orderForm, setOrderForm] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: ''
    });

    useEffect(() => {
        fetchProducts();
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    const fetchProducts = async () => {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        setProducts(data);
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item._id === product._id);
        let newCart;
        
        if (existingItem) {
            newCart = cart.map(item =>
                item._id === product._id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            newCart = [...cart, { ...product, quantity: 1 }];
        }
        
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const removeFromCart = (productId) => {
        const newCart = cart.filter(item => item._id !== productId);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        
        const newCart = cart.map(item =>
            item._id === productId ? { ...item, quantity } : item
        );
        
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handleOrderFormChange = (e) => {
        setOrderForm({
            ...orderForm,
            [e.target.name]: e.target.value
        });
    };

    const placeOrder = async () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const orderData = {
            ...orderForm,
            products: cart.map(item => ({
                productId: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            totalAmount: getCartTotal()
        };

        try {
            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                alert('Order placed successfully!');
                setCart([]);
                localStorage.removeItem('cart');
                setShowCheckout(false);
                setShowCart(false);
                setOrderForm({
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    customerAddress: ''
                });
            }
        } catch (error) {
            alert('Error placing order. Please try again.');
        }
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="container">
                    <div className="logo">
                        <h1>ShopEase</h1>
                    </div>
                    <nav className="nav">
                        <button 
                            className="cart-btn"
                            onClick={() => setShowCart(!showCart)}
                        >
                            🛒 Cart ({cart.length})
                        </button>
                    </nav>
                </div>
            </header>

            {/* Cart Sidebar */}
            {showCart && (
                <div className="cart-sidebar">
                    <div className="cart-header">
                        <h2>Shopping Cart</h2>
                        <button 
                            className="close-btn"
                            onClick={() => setShowCart(false)}
                        >
                            ×
                        </button>
                    </div>
                    
                    {cart.length === 0 ? (
                        <p className="empty-cart">Your cart is empty</p>
                    ) : (
                        <>
                            <div className="cart-items">
                                {cart.map(item => (
                                    <div key={item._id} className="cart-item">
                                        <img 
                                            src={`http://localhost:5000${item.image}`} 
                                            alt={item.name}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/50';
                                            }}
                                        />
                                        <div className="cart-item-details">
                                            <h4>{item.name}</h4>
                                            <p>₹{item.price}</p>
                                            <div className="quantity-controls">
                                                <button 
                                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <button 
                                            className="remove-btn"
                                            onClick={() => removeFromCart(item._id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="cart-total">
                                <h3>Total: ₹{getCartTotal()}</h3>
                                <button 
                                    className="checkout-btn"
                                    onClick={() => {
                                        setShowCart(false);
                                        setShowCheckout(true);
                                    }}
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
                <div className="checkout-modal">
                    <div className="modal-content">
                        <h2>Checkout</h2>
                        <form className="checkout-form">
                            <input
                                type="text"
                                name="customerName"
                                placeholder="Full Name"
                                value={orderForm.customerName}
                                onChange={handleOrderFormChange}
                                required
                            />
                            <input
                                type="email"
                                name="customerEmail"
                                placeholder="Email"
                                value={orderForm.customerEmail}
                                onChange={handleOrderFormChange}
                                required
                            />
                            <input
                                type="tel"
                                name="customerPhone"
                                placeholder="Phone Number"
                                value={orderForm.customerPhone}
                                onChange={handleOrderFormChange}
                                required
                            />
                            <textarea
                                name="customerAddress"
                                placeholder="Shipping Address"
                                value={orderForm.customerAddress}
                                onChange={handleOrderFormChange}
                                rows="3"
                                required
                            />
                            <div className="order-summary">
                                <h3>Order Summary</h3>
                                {cart.map(item => (
                                    <div key={item._id} className="summary-item">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                                <div className="summary-total">
                                    <strong>Total:</strong>
                                    <strong>₹{getCartTotal()}</strong>
                                </div>
                            </div>
                            <div className="checkout-actions">
                                <button 
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowCheckout(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={placeOrder}
                                >
                                    Place Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="main">
                <div className="container">
                    <div className="hero">
                        <h2>Welcome to ShopEase</h2>
                        <p>Your one-stop shop for all your needs</p>
                    </div>

                    <div className="products-grid">
                        {products.map(product => (
                            <div key={product._id} className="product-card">
                                <div className="product-image">
                                    <img 
                                        src={`http://localhost:5000${product.image}`} 
                                        alt={product.name}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300';
                                        }}
                                    />
                                </div>
                                <div className="product-details">
                                    <h3>{product.name}</h3>
                                    <p className="product-description">{product.description}</p>
                                    <div className="product-footer">
                                        <span className="product-price">₹{product.price}</span>
                                        <button 
                                            className="add-to-cart-btn"
                                            onClick={() => addToCart(product)}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <p>&copy; 2024 ShopEase. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default App;
