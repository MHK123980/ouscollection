# Quick Setup Guide - Category Hierarchy

## 🚀 One-Command Setup

```bash
npm run setup-categories
```

This will create **Men's** and **Women's** as permanent parent categories.

---

## 📝 What This Does

✅ Creates "Mens" parent category (if not exists)  
✅ Creates "Womens" parent category (if not exists)  
✅ Marks both as parent categories  
✅ Safe to run multiple times  

---

## 👥 Next Steps

After setup, you can:

### 1️⃣ Add Subcategories via Admin Panel
- Go to **Admin → Categories**
- Click **New Category**
- Enter name (e.g., "T-Shirts", "Formal Wear")
- **Leave** "Is this a parent category?" unchecked
- Select **"Mens"** or **"Womens"** as parent
- Click **Add**

### 2️⃣ Use Categories When Adding Products
- Go to **Admin → Products**
- Click **New Product**
- In Category dropdown, select any subcategory:
  ```
  Mens
    - T-Shirts
    - Jeans
    - Shoes
  Womens
    - Dresses
    - Tops
    - Shoes
  ```
- Fill other details and save

### 3️⃣ View Hierarchy in Management
- Go to **Admin → Categories**
- Table shows:
  - Category name
  - Type (Parent/Sub)
  - Parent category
  - Edit/Delete options

---

## 🎯 Features Included

✨ **Search Dropdowns** - Type to find categories  
✨ **Hierarchical Display** - Visual parent/child organization  
✨ **Real-time Updates** - Changes apply immediately  
✨ **Stock Indicators** - Visual badges for inventory status  
✨ **No Page Reloads** - Smooth AJAX operations  

---

## ❓ Troubleshooting

**Categories not showing?**
- Run `npm run setup-categories` again
- Check MongoDB connection
- Restart server: `npm start`

**Edit modal not opening?**
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh page (Ctrl+F5)
- Check console for errors (F12)

**Search not working?**
- Ensure Select2 library loaded (check DevTools → Network)
- Wait for modal to fully load before clicking dropdown

---

## 📞 Commands Reference

```bash
# Setup Men's and Women's categories
npm run setup-categories

# Start development server
npm start

# Start with auto-reload
npm run devStart
```

---

**Ready to go! 🎉**
