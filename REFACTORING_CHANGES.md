# E-commerce Website Refactoring - Complete Changes

## Summary
This document outlines all the changes made to refactor the e-commerce website according to the new requirements.

---

## 1. REMOVED FEATURES

### Customer Website
- ❌ **Login/Signup with Google and Facebook** - OAuth authentication removed
- ❌ **OTP Verification for Registration** - Direct registration without OTP
- ❌ **Wishlist** - All wishlist functionality removed
- ❌ **Forget Password / Change Password** - Password management removed
- ❌ **Customer Profile Management** - Profile system removed
- ❌ **Razorpay Payment Integration** - Online payment removed
- ❌ **Pagination** - Product listing without pagination (load all or infinite scroll)
- ❌ **Order Tracking System** - Simplified to basic order status
- ❌ **Review and Rating System** - Product reviews removed

### Admin Panel
- ❌ **User Management** - Removed user list and management
- ❌ **Banner Management** - Banner system removed
- ❌ **Coupon Management** - Coupon system removed
- ❌ **Sales Report & Graphs** - Analytics and reporting removed

---

## 2. DATABASE MODEL CHANGES

### Product Model
```javascript
// OLD FIELDS REMOVED
- quantity → stock (renamed for clarity)
- reviews array (removed)
- avgRating (removed)
- totalReviews (removed)

// NEW FIELDS ADDED
- stock: Number (compulsory, required: true, min: 0)
- deliveryCharges: Number (compulsory, required: true, default: 0)
- increaseDeliveryChargesWithQuantity: Boolean (default: false)
- previewImage: String (first image preview)
- sku: String (optional)
```

### User Model
```javascript
// REMOVED FIELDS
- facebook object
- google object
- havePassword field
- isVerified field
- otp field
- passwordResetId field
- redeemedCoupons array

// UPDATED ADDRESS SCHEMA
OLD:
- firstName, lastName, house, address, city, state, pincode, phone

NEW (from checkout form):
- fullName (required)
- mobileNo (required)
- alternativeMobileNo (optional)
- email (optional)
- houseNo (required)
- streetName (required)
- areaName (required)
- city (required)
- province (required)
```

### Order Model
```javascript
// NEW FIELDS ADDED
- customerName: String (required)
- customerMobileNo: String (required)
- totalDeliveryCharges: Number (calculated from products)

// UPDATED FIELDS
- paymentType: default "COD" (only COD allowed)
- status enum: ["Pending", "Packed", "Ready to Ship", "Shipping", "Delivered", "Cancelled"]

// REMOVED FIELDS
- coupon object
- razorpayOrderId
- razorpayPaymentId

// PRODUCT STRUCTURE UPDATED
products: [{
  deliveryCharges: Number (added)
}]
```

### Cart Model
```javascript
// NEW FIELDS ADDED
- totalDeliveryCharges: Number (calculated)
- Products now include: deliveryCharges field
```

---

## 3. CONTROLLER CHANGES

### Product Controller
- ✅ Stock management updated (stock field instead of quantity)
- ✅ Multiple image support with preview image
- ✅ Delivery charges field handling
- ✅ Increase delivery charges with quantity checkbox

### Cart Controller
- ✅ Stock validation before adding to cart
- ✅ Delivery charges calculation in cart
- ✅ Support for variable delivery charges based on quantity
- ✅ Error handling for insufficient stock

### Order Controller
- ✅ New checkout address fields implementation
- ✅ COD-only payment system
- ✅ Stock restoration on order cancellation
- ✅ New order status methods:
  - `readyToShip()` - Ready to Ship status
  - `deleteOrder()` - Order deletion with stock restoration
- ✅ Order status values: Pending → Packed → Ready to Ship → Shipping → Delivered/Cancelled

### User Controller
- ✅ Removed: changePassword, setPassword, resetPassword, addRating
- ✅ Removed: createAddress, removeAddress, getProfile
- ✅ Kept: userRegister, userLogin, userLogout
- ✅ No OTP sending on registration

### Admin Controller
- ✅ Removed user management functionality
- ✅ Removed graph/analytics functionality
- ✅ Kept: category management, product management, order management

---

## 4. ROUTE CHANGES

### Index Routes (index.js)
**REMOVED ROUTES:**
- `/auth/google` and callback
- `/auth/facebook` and callback
- `/forgetPassword`
- `/reset/:email/password/:id`
- `POST /validateOtp`
- `POST /forgetPassword`
- `POST /resetPassword`
- `POST /resendOtp`

**KEPT ROUTES:**
- `GET /` (home)
- `GET /shop/:page` (product listing)
- `GET /shop/category/:category/:page` (category products)
- `GET /product/:id` (product details)
- `GET /search/:page` (search)
- `GET /contact`
- `GET /login`
- `GET /register`
- `POST /login`, `POST /register`, `DELETE /logout`

### User Routes (user.js)
**REMOVED:**
- `/profile`
- `/wishlist` and `/wishlistItemCount`
- `POST /addRating/:id`
- `POST /createAddress`
- `POST /payment/*` (all payment routes)
- `POST /redeem/:id`
- `PUT /setPassword`, `PUT /changePassword`
- `PUT /wishlist/:id`
- `DELETE /removeCoupon`, `DELETE /deleteAddress/:index`

**KEPT:**
- `GET /cart`, `GET /checkout`, `GET /myOrders`
- `POST /checkout`, `PUT /addToCart/:id`
- `DELETE /cart/:id`

### Admin Routes (admin.js)
**REMOVED:**
- `/users`, `/coupons`, `/banners`
- `GET /getGraphDetails`
- All coupon endpoints
- All banner endpoints
- User block/unblock endpoints

**UPDATED:**
- `PUT /shipOrder/:id` → status: "Shipping" (was "Shipped")
- Added `PUT /readyToShip/:id`
- Removed `/outForDelivery` endpoint
- Added `DELETE /deleteOrder/:id`

**KEPT:**
- `/categories`, `/products`, `/orders`
- Category and product management
- Order status management

---

## 5. AUTHENTICATION & MIDDLEWARE

### Authentication Middleware
- ✅ Removed `checkAccountVerified()` middleware
- ✅ Removed `checkAccountVerifiedInIndex()` middleware
- ✅ Kept `checkLoggedIn()`, `checkLoggedOut()`, `checkAdminPrivilege()`
- ✅ OTP middleware no longer used

### Server.js Changes
- ✅ Removed `oAuth` import and initialization
- ✅ Removed passport Facebook/Google strategies
- ✅ Kept passport Local strategy

---

## 6. DEPENDENCIES CHANGES

### Removed Packages
```json
- passport-facebook: ^3.0.0
- passport-google-oauth20: ^2.0.0
- razorpay: ^2.8.3
- nodemailer: ^7.0.13 (if OTP used email)
```

### Kept Packages
```json
- passport: ^0.6.0 (local auth only)
- passport-local: ^1.0.0
- passport-local-mongoose: ^7.1.2
- express, mongoose, multer, cors, etc.
```

---

## 7. NEW FEATURES IMPLEMENTED

### Stock Management
- ✅ Compulsory stock field in products
- ✅ Stock decreases when added to cart
- ✅ Stock increases when item removed from cart
- ✅ Stock increases when order is cancelled
- ✅ Real-time validation preventing orders beyond stock
- ✅ Low stock indicator (≤3 units)
- ✅ Out of stock indicator (0 units) - button disabled

### Delivery Charges
- ✅ Compulsory delivery charges field in admin product form
- ✅ Option to increase delivery charges with quantity
  - If enabled: DC = Base DC × Quantity
  - If disabled: DC = Fixed (same for any quantity)
- ✅ Delivery charges shown under price on product pages
- ✅ Total delivery charges calculated in cart
- ✅ Delivery charges included in checkout total

### Product Images
- ✅ Multiple image upload support
- ✅ Preview image selection (first image default)
- ✅ Image management in admin product form

### Checkout Form (New Fields)
```
REQUIRED:
- Full Name
- Mobile Number
- House Number
- Street Name
- Area Name
- City
- Province

OPTIONAL:
- Alternative Mobile Number
- Email Address
```

### Order Management (Admin)
- ✅ Order status workflow:
  1. Pending (default)
  2. Packed
  3. Ready to Ship
  4. Shipping
  5. Delivered
  6. Cancelled
- ✅ Order details view with customer information:
  - Customer Name
  - Mobile Number
  - Delivery Address
  - Products Ordered
  - Order Total (with delivery charges)
- ✅ Delete order functionality
- ✅ Real-time stock updates (no page refresh)

### Categories
- ✅ Men's category (permanent)
- ✅ Women's category (permanent)
- ✅ Option to add subcategories

### Payment
- ✅ Cash On Delivery (COD) only
- ✅ No online payment option

---

## 8. QUANTITY RESTRICTIONS

### Customer Side
- ✅ Cannot increase quantity beyond available stock
- ✅ Validation in both add to cart and cart update
- ✅ Error message if insufficient stock

### Admin Side
- ✅ Stock validation when processing orders
- ✅ Real-time stock updates without page refresh

---

## 9. MIGRATION INSTRUCTIONS

### Database Migration
1. Backup existing MongoDB database
2. Update all existing products:
   - Rename `quantity` field to `stock`
   - Add `deliveryCharges: 0` (default)
   - Add `increaseDeliveryChargesWithQuantity: false` (default)
   - Add `previewImage` (set to first image or null)
   - Remove `reviews`, `avgRating`, `totalReviews`

3. Update all users:
   - Remove `facebook`, `google` objects
   - Remove `havePassword`, `isVerified`, `otp`, `passwordResetId`, `redeemedCoupons`
   - Update address schema

4. Update all orders:
   - Set `paymentType: "COD"`
   - Map status values: "Shipped" → "Shipping", "Out for delivery" → remove
   - Add `customerName` and `customerMobileNo`
   - Remove `coupon` and razorpay fields

### NPM Dependencies
```bash
npm install --save passport-local passport-local-mongoose
npm uninstall passport-facebook passport-google-oauth20 razorpay nodemailer
npm install
```

---

## 10. TESTING CHECKLIST

- [ ] User registration (no OTP)
- [ ] User login
- [ ] Product browsing with stock display
- [ ] Add to cart with stock validation
- [ ] Cart with delivery charges calculation
- [ ] Checkout with new address form
- [ ] Order creation (COD only)
- [ ] Admin: Add/Edit product with delivery charges
- [ ] Admin: Set delivery charges to increase with quantity
- [ ] Admin: Multiple image upload
- [ ] Admin: View order details
- [ ] Admin: Update order status
- [ ] Admin: Delete order
- [ ] Stock updates in real-time
- [ ] Low stock (≤3) and Out of stock indicators
- [ ] Cannot exceed available stock quantity

---

## 11. VIEWS TO UPDATE

The following EJS view files need to be updated (these still need manual updating):

**Customer Views:**
- `master/login.ejs` - Remove Google/Facebook buttons
- `master/register.ejs` - Remove OTP fields
- `master/profile.ejs` - Delete (no profile needed)
- `master/checkout.ejs` - New form fields
- `master/cart.ejs` - Show delivery charges
- `master/product-details.ejs` - Show delivery charges, stock status
- `master/shop.ejs` - Remove pagination, show stock status

**Admin Views:**
- `admin/productManagement.ejs` - Add delivery charges field
- `admin/productForm.ejs` - Multiple images, delivery charges, stock
- `admin/orderManagement.ejs` - New status options
- `admin/orderDetails.ejs` - Show customer details
- Delete: `admin/userManagement.ejs`, `admin/bannerManagement.ejs`, `admin/couponManagement.ejs`

---

## 12. IMPORTANT NOTES

1. **Stock Management**: Stock is decremented immediately when item is added to cart. When order is cancelled, stock is restored.

2. **Delivery Charges**: Can be fixed or increase with quantity. Configure during product creation/editing.

3. **Categories**: Men's and Women's should be created as permanent parent categories with subcategory options.

4. **Payment**: Only COD (Cash On Delivery) is supported. Remove all Razorpay integration.

5. **Product Display**: Products should display on a single page (or with infinite scroll). No pagination needed.

6. **Order Status**: Follow the new status workflow: Pending → Packed → Ready to Ship → Shipping → Delivered/Cancelled

7. **Real-time Updates**: Ensure stock and cart updates don't require page refresh using AJAX.

---

## Database Cleanup

You may want to drop the following collections if they're no longer needed:
- `banners`
- `coupons`
- `wishlists`

---

**Last Updated:** February 3, 2026
**Status:** Database Models and Controllers Updated
**Next Steps:** Frontend views need to be updated to reflect new features and removed features
