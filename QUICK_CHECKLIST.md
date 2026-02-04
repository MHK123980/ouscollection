# Quick Implementation Checklist

## ✅ Completed Backend Changes

### Database Models
- [x] Product: Updated stock, added delivery charges, removed reviews
- [x] User: Removed OAuth fields, updated address schema
- [x] Order: New status values, COD only, customer details added
- [x] Cart: Added delivery charges field

### Controllers
- [x] Product: Stock and delivery charges handling
- [x] Cart: Stock validation, delivery calculations
- [x] Order: COD checkout, new status workflow
- [x] User: Removed profile, password, OTP features
- [x] Admin: Removed user/banner/coupon management

### Routes
- [x] Removed OAuth routes (Google, Facebook)
- [x] Removed password reset routes
- [x] Removed OTP routes
- [x] Removed wishlist routes
- [x] Removed profile routes
- [x] Removed payment routes
- [x] Updated order status routes
- [x] Added delete order route

### Middleware & Configuration
- [x] Removed OTP middleware
- [x] Removed account verification checks
- [x] Removed OAuth initialization
- [x] Updated package.json (removed OAuth, Razorpay, etc.)

### Documentation
- [x] Created REFACTORING_CHANGES.md
- [x] Created FRONTEND_IMPLEMENTATION_GUIDE.md

---

## ⏳ TODO: Frontend Views

### Customer Website Views

#### Navigation & Layout
- [ ] Remove Google/Facebook buttons from login
- [ ] Remove password recovery links
- [ ] Remove profile link from header
- [ ] Remove wishlist link from header

#### Login/Register
- [ ] Update login.ejs - remove OAuth buttons
- [ ] Update register.ejs - remove OTP form fields
- [ ] Delete forgetPassword.ejs
- [ ] Delete resetPassword.ejs
- [ ] Delete otpValidationForm.ejs
- [ ] Delete profile.ejs

#### Shopping Flow
- [ ] Update shop.ejs - remove pagination, add stock status
- [ ] Update product-details.ejs - add stock display, delivery charges
- [ ] Update product cards - show delivery charges under price
- [ ] Update cart.ejs - show delivery charges per item
- [ ] Update checkout.ejs - new address form, COD only

#### Product Display
- [ ] Add "In Stock", "Low Stock", "Out of Stock" badges
- [ ] Display delivery charges prominently
- [ ] Add quantity selector with stock limit validation
- [ ] Remove review/rating sections
- [ ] Remove wishlist buttons

### Admin Panel Views

#### Navigation
- [ ] Remove User Management link
- [ ] Remove Banner Management link
- [ ] Remove Coupon Management link
- [ ] Remove Analytics/Graphs link

#### Dashboard
- [ ] Remove user count widget
- [ ] Remove graphs
- [ ] Remove analytics
- [ ] Keep basic stats

#### Product Management
- [ ] Update product form - add stock field (required)
- [ ] Update product form - add delivery charges field (required)
- [ ] Update product form - add checkbox for DC with quantity
- [ ] Update product form - multiple image upload
- [ ] Update product list - show stock and delivery charges
- [ ] Update product list - show stock status badge

#### Order Management
- [ ] Update status dropdown - new values only
- [ ] Remove "Out for delivery" option
- [ ] Add "Ready to Ship" option
- [ ] Update status display logic
- [ ] Create/update order details page
- [ ] Add delete button for orders
- [ ] Show customer name and mobile
- [ ] Show delivery address details
- [ ] Show product details in order

#### Category Management
- [ ] Mark Men's as permanent
- [ ] Mark Women's as permanent
- [ ] Prevent deletion of permanent categories
- [ ] Add subcategory management

#### File Deletions
- [ ] Delete userManagement.ejs
- [ ] Delete bannerManagement.ejs
- [ ] Delete couponManagement.ejs
- [ ] Delete _modal_user.ejs (if exists)
- [ ] Delete _modal_banner.ejs
- [ ] Delete _modal_coupon.ejs

### JavaScript/CSS Updates

#### JavaScript Files to Update
- [ ] public/js/loginForm.js - remove OAuth logic
- [ ] public/js/registerForm.js - remove OTP validation
- [ ] public/js/cart.js - update with stock validation
- [ ] public/js/admin-scripts.js - update order status handling
- [ ] public/js/payment.js - DELETE (no longer needed)
- [ ] public/js/wishlist.js - DELETE (no longer needed)
- [ ] Search for and remove any "razorpay" references
- [ ] Search for and remove any "wishlist" references
- [ ] Search for and remove any "otp" references

#### CSS Updates
- [ ] Add styles for stock status badges
- [ ] Add styles for delivery charges display
- [ ] Update form styling for new checkout fields
- [ ] Remove any styles for deleted features

---

## 🗄️ Database Cleanup

### Collections to Drop (if not needed)
```
- banners
- coupons
- wishlists (if migrated to nothing)
```

### Migration Scripts Needed
- Update all products: rename quantity → stock
- Update all products: add deliveryCharges field
- Update all users: remove OAuth fields
- Update all orders: set paymentType to COD
- Update all orders: standardize status values

---

## 🧪 Testing Checklist

### Customer Website Tests
- [ ] Can register without OTP
- [ ] Can login with email/password only
- [ ] Cannot add quantity more than stock
- [ ] Stock decreases when added to cart
- [ ] Stock status displays correctly (In Stock/Low/Out)
- [ ] Delivery charges show on product page
- [ ] Delivery charges show in cart
- [ ] Delivery charges included in checkout total
- [ ] Can checkout with new address form
- [ ] All address fields validate correctly
- [ ] Payment method shows as COD only
- [ ] Order created successfully
- [ ] Stock restored if order cancelled

### Admin Tests
- [ ] Can create product with all new fields
- [ ] Can upload multiple images
- [ ] Can set delivery charges
- [ ] Can tick "increase DC with quantity"
- [ ] Can edit products
- [ ] Can view orders with new details
- [ ] Can update order status through dropdown
- [ ] Can delete orders
- [ ] Stock updates in real-time
- [ ] Categories: Men's and Women's are permanent
- [ ] Cannot delete permanent categories
- [ ] Can add subcategories

### No Errors
- [ ] No console errors
- [ ] No broken links
- [ ] All redirects work
- [ ] All forms submit correctly
- [ ] All validations work
- [ ] Real-time updates work without refresh

---

## 📝 Configuration Files to Update

- [ ] .env - remove OAuth credentials
- [ ] Remove any API keys for removed services
- [ ] Update environment variables if needed

---

## 🚀 Deployment Checklist

- [ ] Test in development
- [ ] Backup production database
- [ ] Run migration scripts
- [ ] Update production code
- [ ] Test all features in production
- [ ] Monitor for errors
- [ ] Update documentation
- [ ] Notify users of changes

---

## 📚 Documentation Status

| Document | Status | Details |
|----------|--------|---------|
| REFACTORING_CHANGES.md | ✅ Complete | All changes documented |
| FRONTEND_IMPLEMENTATION_GUIDE.md | ✅ Complete | View updates detailed |
| Database migration guide | ⏳ Todo | Create scripts for data migration |
| API documentation | ⏳ Todo | Update if external API users exist |

---

## 💡 Important Reminders

1. **Stock Management**: Stock decrements on add-to-cart, restores on cart removal or order cancellation
2. **Delivery Charges**: Can be fixed or variable based on quantity
3. **Payment**: Only COD (Cash On Delivery) is supported
4. **Categories**: Men's and Women's are permanent parent categories
5. **Order Status**: Follow workflow: Pending → Packed → Ready to Ship → Shipping → Delivered/Cancelled
6. **Real-time Updates**: Use AJAX for stock and cart updates without page refresh

---

## 🔗 Files Modified

### Backend Files (Done ✅)
- [x] models/product.js
- [x] models/users.js
- [x] models/order.js
- [x] models/cart.js
- [x] controllers/productController.js
- [x] controllers/cartController.js
- [x] controllers/orderController.js
- [x] controllers/userController.js
- [x] routes/index.js
- [x] routes/user.js
- [x] routes/admin.js
- [x] middleware/authentication.js
- [x] server.js
- [x] package.json

### Frontend Files (Todo ⏳)
- [ ] views/master/* (multiple files)
- [ ] views/admin/* (multiple files)
- [ ] public/js/* (multiple files)
- [ ] public/css/* (if needed)
- [ ] layouts/* (masterLayout, adminLayout)

### Documentation (Done ✅)
- [x] REFACTORING_CHANGES.md
- [x] FRONTEND_IMPLEMENTATION_GUIDE.md
- [x] This file: QUICK_CHECKLIST.md

---

**Last Updated:** February 3, 2026
**Backend Status:** ✅ 100% Complete
**Frontend Status:** ⏳ Pending (View updates needed)
**Overall Progress:** ~50% Complete

Next steps: Update EJS views and test thoroughly before deployment.
