# Frontend Implementation Guide

## Overview
This guide covers the EJS view files that need to be updated to reflect the backend changes.

---

## 1. Customer Website Views

### 1.1 Login Page (`master/login.ejs`)

**REMOVE:**
```html
<!-- Remove these sections -->
<a href="/auth/google" class="btn btn-google">Login with Google</a>
<a href="/auth/facebook" class="btn btn-facebook">Login with Facebook</a>
```

**KEEP:**
- Email/Password login form
- Register link
- Error messages

---

### 1.2 Register Page (`master/register.ejs`)

**REMOVE:**
```html
<!-- Remove OTP-related elements -->
- OTP input field
- OTP verification section
- Resend OTP button
- OTP timer
```

**KEEP:**
- Name, Email, Password fields
- Password confirmation field
- Submit button

---

### 1.3 Checkout Page (`master/checkout.ejs`)

**REPLACE** old address form with NEW fields:

```html
<form>
    <!-- Required Fields -->
    <input type="text" name="fullName" placeholder="Full Name" required>
    <input type="tel" name="mobileNo" placeholder="Mobile Number" required>
    
    <!-- Optional Fields -->
    <input type="tel" name="alternativeMobileNo" placeholder="Alternative Mobile (Optional)">
    <input type="email" name="email" placeholder="Email (Optional)">
    
    <!-- Address Required Fields -->
    <input type="text" name="houseNo" placeholder="House Number" required>
    <input type="text" name="streetName" placeholder="Street Name" required>
    <input type="text" name="areaName" placeholder="Area/Locality" required>
    <input type="text" name="city" placeholder="City" required>
    <input type="text" name="province" placeholder="Province/State" required>
    
    <!-- Order Summary -->
    <div class="order-summary">
        <p>Subtotal: <span id="subtotal">₹0</span></p>
        <p>Delivery Charges: <span id="delivery-charges">₹0</span></p>
        <p class="total">Total: <span id="total">₹0</span></p>
    </div>
    
    <!-- COD Only - No payment selection needed -->
    <button type="submit" class="btn btn-primary">
        Place Order - COD
    </button>
</form>
```

---

### 1.4 Cart Page (`master/cart.ejs`)

**ADD** Delivery Charges Display:

```html
<!-- For each product in cart -->
<div class="cart-item">
    <img src="<%= product.previewImage %>" alt="">
    <h4><%= product.name %></h4>
    <p>Price: ₹<%= product.offerPrice || product.price %></p>
    <p>Delivery Charges: ₹<%= product.deliveryCharges %></p>
    <p>Quantity: <%= cartItem.quantity %></p>
    <p>Item Total: ₹<%= (product.offerPrice || product.price) * cartItem.quantity %></p>
</div>

<!-- Cart Summary -->
<div class="cart-summary">
    <p>Subtotal: ₹<%= cart.subTotal %></p>
    <p>Delivery Charges: ₹<%= cart.totalDeliveryCharges %></p>
    <h3>Total: ₹<%= cart.total %></h3>
</div>
```

---

### 1.5 Product Details Page (`master/product-details.ejs`)

**ADD** Stock Status and Delivery Charges:

```html
<div class="product-details">
    <!-- Existing content -->
    
    <!-- NEW: Stock Status -->
    <div class="stock-status">
        <% if (product.stock === 0) { %>
            <span class="badge badge-danger">Out of Stock</span>
            <button disabled class="btn btn-disabled">Add to Cart</button>
        <% } else if (product.stock <= 3) { %>
            <span class="badge badge-warning">Low in Stock (<%= product.stock %> left)</span>
            <button class="btn btn-primary">Add to Cart</button>
        <% } else { %>
            <span class="badge badge-success">In Stock</span>
            <button class="btn btn-primary">Add to Cart</button>
        <% } %>
    </div>
    
    <!-- NEW: Delivery Charges -->
    <div class="delivery-info">
        <p><strong>Delivery Charges:</strong> ₹<%= product.deliveryCharges %></p>
        <% if (product.increaseDeliveryChargesWithQuantity) { %>
            <p><small>Charges increase with quantity</small></p>
        <% } else { %>
            <p><small>Fixed delivery charges</small></p>
        <% } %>
    </div>
    
    <!-- Quantity selector with validation -->
    <div class="quantity-selector">
        <label>Quantity:</label>
        <select id="quantity" name="quantity" required>
            <% for (let i = 1; i <= Math.min(product.stock, 10); i++) { %>
                <option value="<%= i %>"><%= i %></option>
            <% } %>
        </select>
        <span class="max-quantity-msg">Max: <%= product.stock %> available</span>
    </div>
</div>
```

**REMOVE:**
- Review/Rating section
- Wishlist button/functionality
- Share options (optional)

---

### 1.6 Shop Page (`master/shop.ejs`)

**REMOVE:**
```html
<!-- Remove pagination -->
<div class="pagination">
    <a href="/shop/<%= previousPage %>">Previous</a>
    <span>Page <%= currentPage %></span>
    <a href="/shop/<%= nextPage %>">Next</a>
</div>
```

**OPTIONAL:** Implement infinite scroll or load all products at once.

**UPDATE** Product Cards:

```html
<div class="product-card">
    <img src="<%= product.previewImage %>" alt="<%= product.name %>">
    <h5><%= product.name %></h5>
    <p>₹<%= product.offerPrice || product.price %></p>
    
    <!-- NEW: Delivery Charges under price -->
    <p class="delivery-charges">Delivery: ₹<%= product.deliveryCharges %></p>
    
    <!-- NEW: Stock Status -->
    <% if (product.stock === 0) { %>
        <span class="badge badge-danger">Out of Stock</span>
    <% } else if (product.stock <= 3) { %>
        <span class="badge badge-warning">Low Stock</span>
    <% } %>
</div>
```

---

### 1.7 Delete Profile Page

**DELETE** the entire file: `master/profile.ejs` (no longer needed)

---

### 1.8 Other Pages to Remove

**DELETE these EJS files:**
- `master/forgetPassword.ejs`
- `master/resetPassword.ejs`
- `master/otpValidationForm.ejs`

---

## 2. Admin Panel Views

### 2.1 Product Management (`admin/productManagement.ejs`)

**UPDATE** Product List Table:

```html
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Delivery Charges</th>
            <th>Stock</th>
            <th>Stock Status</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <% products.forEach(product => { %>
            <tr>
                <td><%= product.name %></td>
                <td>₹<%= product.price %></td>
                <td>₹<%= product.deliveryCharges %></td>
                <td><%= product.stock %></td>
                <td>
                    <% if (product.stock === 0) { %>
                        <span class="badge badge-danger">Out of Stock</span>
                    <% } else if (product.stock <= 3) { %>
                        <span class="badge badge-warning">Low Stock</span>
                    <% } else { %>
                        <span class="badge badge-success">In Stock</span>
                    <% } %>
                </td>
                <td>
                    <button onclick="editProduct('<%= product._id %>')">Edit</button>
                    <button onclick="deleteProduct('<%= product._id %>')">Delete</button>
                </td>
            </tr>
        <% }); %>
    </tbody>
</table>
```

---

### 2.2 Add/Edit Product Form (`admin/_modal_product.ejs` or similar)

**UPDATE** Form Fields:

```html
<form method="POST" enctype="multipart/form-data">
    <!-- Existing fields -->
    <input type="text" name="name" placeholder="Product Name" required>
    <input type="number" name="price" placeholder="Price" required>
    <input type="number" name="discount" placeholder="Discount %">
    <textarea name="description" placeholder="Description" required></textarea>
    <input type="text" name="brand" placeholder="Brand">
    <input type="text" name="sku" placeholder="SKU (Optional)">
    
    <!-- Category Selection -->
    <select name="category" required>
        <option value="">Select Category</option>
        <% categories.forEach(cat => { %>
            <option value="<%= cat._id %>"><%= cat.name %></option>
        <% }); %>
    </select>
    
    <!-- NEW: Stock Field (REQUIRED) -->
    <input type="number" name="stock" placeholder="Stock Quantity" required min="0">
    
    <!-- NEW: Delivery Charges (REQUIRED) -->
    <input type="number" name="deliveryCharges" placeholder="Delivery Charges" required step="0.01">
    
    <!-- NEW: Increase DC with Quantity checkbox -->
    <label>
        <input type="checkbox" name="increaseDeliveryChargesWithQuantity">
        Increase Delivery Charges with Quantity
    </label>
    
    <!-- NEW: Multiple Image Upload -->
    <label>Product Images (Multiple):</label>
    <input type="file" name="productImages" multiple accept="image/*" required>
    <small>First image will be used as preview</small>
    
    <!-- Image Preview -->
    <div id="image-preview" class="preview-container">
        <!-- Preview images here -->
    </div>
    
    <!-- Featured Product -->
    <label>
        <input type="checkbox" name="isFeatured">
        Featured Product
    </label>
    
    <button type="submit" class="btn btn-primary">
        <%= isEdit ? 'Update Product' : 'Add Product' %>
    </button>
</form>

<script>
    // Preview multiple images
    document.querySelector('input[name="productImages"]').addEventListener('change', function(e) {
        const preview = document.getElementById('image-preview');
        preview.innerHTML = '';
        
        for (let file of e.target.files) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
</script>
```

---

### 2.3 Order Management (`admin/orderManagement.ejs`)

**UPDATE** Order Status Column:

```html
<table>
    <thead>
        <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <% orders.forEach(order => { %>
            <tr>
                <td>#<%= order._id %></td>
                <td><%= order.customerName %></td>
                <td>₹<%= order.total %></td>
                <td>
                    <select class="status-select" data-order-id="<%= order._id %>">
                        <option value="Pending" <%= order.status === 'Pending' ? 'selected' : '' %>>Pending</option>
                        <option value="Packed" <%= order.status === 'Packed' ? 'selected' : '' %>>Packed</option>
                        <option value="Ready to Ship" <%= order.status === 'Ready to Ship' ? 'selected' : '' %>>Ready to Ship</option>
                        <option value="Shipping" <%= order.status === 'Shipping' ? 'selected' : '' %>>Shipping</option>
                        <option value="Delivered" <%= order.status === 'Delivered' ? 'selected' : '' %>>Delivered</option>
                        <option value="Cancelled" <%= order.status === 'Cancelled' ? 'selected' : '' %>>Cancelled</option>
                    </select>
                </td>
                <td>
                    <button onclick="viewOrderDetails('<%= order._id %>')">View</button>
                    <button onclick="deleteOrder('<%= order._id %>')">Delete</button>
                </td>
            </tr>
        <% }); %>
    </tbody>
</table>

<script>
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            const orderId = this.dataset.orderId;
            const status = this.value;
            // Call API to update order status
            updateOrderStatus(orderId, status);
        });
    });
</script>
```

---

### 2.4 Order Details (`admin/orderDetails.ejs`)

**NEW** Enhanced Order Details View:

```html
<div class="order-details-container">
    <!-- Customer Information -->
    <section class="customer-info">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> <%= order.customerName %></p>
        <p><strong>Mobile:</strong> <%= order.customerMobileNo %></p>
        
        <h4>Delivery Address</h4>
        <p><%= order.deliveryAddress.houseNo %>, <%= order.deliveryAddress.streetName %></p>
        <p><%= order.deliveryAddress.areaName %>, <%= order.deliveryAddress.city %></p>
        <p><%= order.deliveryAddress.province %></p>
        <% if (order.deliveryAddress.email) { %>
            <p>Email: <%= order.deliveryAddress.email %></p>
        <% } %>
    </section>
    
    <!-- Order Status -->
    <section class="order-status">
        <h3>Order Status</h3>
        <select class="form-control" id="status-update">
            <option value="Pending" <%= order.status === 'Pending' ? 'selected' : '' %>>Pending</option>
            <option value="Packed" <%= order.status === 'Packed' ? 'selected' : '' %>>Packed</option>
            <option value="Ready to Ship" <%= order.status === 'Ready to Ship' ? 'selected' : '' %>>Ready to Ship</option>
            <option value="Shipping" <%= order.status === 'Shipping' ? 'selected' : '' %>>Shipping</option>
            <option value="Delivered" <%= order.status === 'Delivered' ? 'selected' : '' %>>Delivered</option>
            <option value="Cancelled" <%= order.status === 'Cancelled' ? 'selected' : '' %>>Cancelled</option>
        </select>
        <button onclick="updateOrderStatus()">Update Status</button>
    </section>
    
    <!-- Order Items -->
    <section class="order-items">
        <h3>Order Items</h3>
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Delivery Charge</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                <% order.products.forEach(product => { %>
                    <tr>
                        <td><%= product.name %></td>
                        <td><%= product.quantity %></td>
                        <td>₹<%= product.offerPrice || product.price %></td>
                        <td>₹<%= product.deliveryCharges %></td>
                        <td>₹<%= ((product.offerPrice || product.price) * product.quantity) + product.deliveryCharges %></td>
                    </tr>
                <% }); %>
            </tbody>
        </table>
    </section>
    
    <!-- Order Summary -->
    <section class="order-summary">
        <p>Subtotal: ₹<%= order.subTotal %></p>
        <p>Delivery Charges: ₹<%= order.totalDeliveryCharges %></p>
        <h3>Total: ₹<%= order.total %></h3>
        <p>Payment Method: COD (Cash On Delivery)</p>
    </section>
    
    <!-- Delete Order -->
    <section class="order-actions">
        <button onclick="deleteOrder('<%= order._id %>')" class="btn btn-danger">Delete Order</button>
    </section>
</div>
```

---

### 2.5 Delete These Admin Views

**DELETE:**
- `admin/userManagement.ejs` (User management removed)
- `admin/bannerManagement.ejs` (Banner management removed)
- `admin/couponManagement.ejs` (Coupon management removed)
- `admin/_modal_banner.ejs`
- `admin/_modal_coupon.ejs`
- `admin/_modal_user.ejs` (if exists)

---

### 2.6 Update Admin Layout

**UPDATE** `admin/index.ejs` (Dashboard):

**REMOVE:**
- User count widgets
- Graph/Chart sections
- Sales analytics

**KEEP:**
- Basic dashboard statistics
- Quick links to products, categories, orders

```html
<!-- Example simplified dashboard -->
<div class="dashboard-cards">
    <div class="card">
        <h3>Total Products</h3>
        <p><%= totalProducts %></p>
    </div>
    <div class="card">
        <h3>Total Orders</h3>
        <p><%= totalOrders %></p>
    </div>
    <div class="card">
        <h3>Pending Orders</h3>
        <p><%= pendingOrders %></p>
    </div>
    <div class="card">
        <h3>Categories</h3>
        <p><%= totalCategories %></p>
    </div>
</div>

<div class="quick-links">
    <a href="/admin/products">Manage Products</a>
    <a href="/admin/categories">Manage Categories</a>
    <a href="/admin/orders">View Orders</a>
</div>
```

---

### 2.7 Update Category Management

**ENSURE** Men's and Women's are permanent categories:

```html
<!-- Category List -->
<table>
    <thead>
        <tr>
            <th>Category Name</th>
            <th>Type</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <!-- Show permanent categories -->
        <tr>
            <td>Men's</td>
            <td><span class="badge">Permanent</span></td>
            <td>
                <button disabled>Cannot Delete</button>
                <a href="/admin/categories/mens-subcategories">Manage Subcategories</a>
            </td>
        </tr>
        <tr>
            <td>Women's</td>
            <td><span class="badge">Permanent</span></td>
            <td>
                <button disabled>Cannot Delete</button>
                <a href="/admin/categories/womens-subcategories">Manage Subcategories</a>
            </td>
        </tr>
        <!-- Other categories -->
        <% categories.forEach(cat => { %>
            <% if (cat.name !== "Men's" && cat.name !== "Women's") { %>
                <tr>
                    <td><%= cat.name %></td>
                    <td>Custom</td>
                    <td>
                        <button onclick="editCategory('<%= cat._id %>')">Edit</button>
                        <button onclick="deleteCategory('<%= cat._id %>')">Delete</button>
                    </td>
                </tr>
            <% } %>
        <% }); %>
    </tbody>
</table>
```

---

## 3. JavaScript Updates

### 3.1 Add to Cart Validation (`public/js/cart.js`)

```javascript
async function addToCart(productId) {
    const product = await fetchProductData(productId);
    
    // Check stock before adding
    if (product.stock === 0) {
        alert('Product is out of stock');
        return;
    }
    
    const maxQuantity = product.stock;
    let quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    if (quantity > maxQuantity) {
        alert(`Cannot add more than ${maxQuantity} items`);
        return;
    }
    
    // Add to cart
    const response = await fetch(`/user/addToCart/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            quantity: quantity,
            name: product.name,
            price: product.price,
            offerPrice: product.offerPrice,
            deliveryCharges: product.deliveryCharges
        })
    });
    
    if (response.ok) {
        alert('Added to cart!');
        updateCartItemCount();
    }
}
```

---

### 3.2 Order Status Update (`public/js/admin-scripts.js`)

```javascript
async function updateOrderStatus(orderId, status) {
    const statusMap = {
        'Pending': '/admin/packOrder/',
        'Packed': '/admin/readyToShip/',
        'Ready to Ship': '/admin/shipOrder/',
        'Shipping': '/admin/deliverPackage/',
        'Delivered': null,
        'Cancelled': '/admin/cancelOrder/'
    };
    
    const endpoint = statusMap[status];
    if (!endpoint) return;
    
    const response = await fetch(endpoint + orderId, {
        method: 'PUT'
    });
    
    if (response.ok) {
        alert('Order status updated');
        location.reload();
    } else {
        alert('Error updating order status');
    }
}

async function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        const response = await fetch(`/admin/deleteOrder/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Order deleted');
            location.reload();
        }
    }
}
```

---

## 4. Navigation/Layout Updates

### 4.1 Main Navigation (`layouts/masterLayout.ejs`)

**REMOVE:**
- Wishlist link
- Profile link (if separate)
- Forget Password link

**SIMPLIFY:**
- Keep Cart
- Keep My Orders
- Keep Login/Logout

### 4.2 Admin Navigation (`layouts/adminLayout.ejs`)

**REMOVE:**
- User Management link
- Banner Management link
- Coupon Management link
- Analytics/Graphs link

**KEEP:**
- Products
- Categories
- Orders
- Dashboard

---

## 5. Testing Checklist for Frontend

- [ ] Login page - no social auth buttons
- [ ] Register page - no OTP fields
- [ ] Product pages - show delivery charges under price
- [ ] Product pages - show stock status (In Stock/Low Stock/Out of Stock)
- [ ] Cart page - displays delivery charges for each item
- [ ] Cart - can't add quantity more than stock
- [ ] Checkout - new address form with all required fields
- [ ] Checkout - shows total with delivery charges
- [ ] Admin: Product form includes delivery charges and stock fields
- [ ] Admin: Multiple image upload works
- [ ] Admin: Order list shows new status options
- [ ] Admin: Order detail page shows customer info
- [ ] Admin: Can delete orders
- [ ] Real-time stock updates

---

## Notes

1. All backend endpoints have been updated, views just need to match the new data structure
2. Some JavaScript files may have references to removed features (OTP, Razorpay, Wishlist) - search and remove those
3. CSS for stock badges and delivery charges may need to be added
4. Consider adding animations for stock status changes
5. Test all forms with both valid and invalid data

