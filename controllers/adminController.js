const _ = require("lodash");
const User = require("../models/users");
const Category = require("../models/category");
const Product = require("../models/product");
const Order = require("../models/order");
const Coupon = require("../models/coupon");

module.exports = {
  home: async (req, res) => {
    try {
      const errorMessage = req.flash("message");
      const userCountPromise = User.find({
        isAdmin: false,
      }).countDocuments();
      const orderStatusPendingPromise = Order.find({
        status: "Pending",
      }).countDocuments();
      const orderStatusDeliveredPromise = Order.find({
        status: "Delivered",
      }).countDocuments();
      const orderStatusCancelledPromise = Order.find({
        status: "Cancelled",
      }).countDocuments();
      const totalSalePromise = Order.aggregate([
        {
          $match: {
            status: { $ne: "Cancelled" },
          },
        },
        {
          $group: {
            _id: "",
            totalSale: { $sum: "$total" },
          },
        },
        {
          $project: {
            _id: 0,
            totalAmount: "$totalSale",
          },
        },
      ]);
      const [userCount, orderStatusPending, orderStatusDelivered, totalSale, orderStatusCancelled] =
        await Promise.all([
          userCountPromise,
          orderStatusPendingPromise,
          orderStatusDeliveredPromise,
          totalSalePromise,
          orderStatusCancelledPromise,
        ]);
      const orderStatusCount = [
        orderStatusPending,
        orderStatusDelivered,
        totalSale[0]?.totalAmount?.toFixed(2) || '0.00',
        orderStatusCancelled,
      ];
      res.render("admin/index", {
        errorMessage: errorMessage,
        layout: "layouts/adminLayout",
        orderStatusCount: orderStatusCount,
        userCount: userCount,
      });
    } catch (err) {
      console.log(err.message);
      res.redirect("/admin");
    }
  },

  getGraphDetails: async (req, res) => {
    try {
      const totalRegisterPromise = User.aggregate([
        {
          $match: {
            createdAt: { $ne: null },
          },
        },
        {
          $project: {
            month: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
        },
        {
          $group: {
            _id: { createdAt: "$month" },
            count: { $sum: 1 },
          },
        },

        {
          $addFields: {
            createdAt: "$_id.createdAt",
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $project: {
            _id: false,
          },
        },
      ]).limit(7);

      const totalSalePromise = Order.aggregate([
        // First Stage
        {
          $match: { createdAt: { $ne: null } },
        },
        {
          $match: { status: { $ne: "Cancelled" } },
        },
        // Second Stage
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: "$total" },
          },
        },
        // Third Stage
        {
          $sort: { _id: -1 },
        },
      ]);

      const [totalRegister, totalSale] = await Promise.all([
        totalRegisterPromise,
        totalSalePromise,
      ]);

      res
        .status(201)
        .json({ totalRegister: totalRegister, totalSale: totalSale });
    } catch (err) {
      res.status(500).json({ err });
    }
  },

  users: async (req, res) => {
    try {
      const errorMessage = req.flash("message");
      const users = await User.find({}).sort({ createdAt: -1 }).exec();
      res.render("admin/userManagement", {
        users: users,
        errorMessage: errorMessage,
        layout: "layouts/adminLayout",
      });
    } catch (err) {
      console.log(err.message);
      res.redirect("/admin");
    }
  },

  categories: async (req, res) => {
    try {
      const errorMessage = req.flash("message");
      const allCategories = await Category.find()
        .sort({ categoryName: 1 })
        .exec();
      res.render("admin/categoryManagement", {
        allCategories: allCategories,
        errorMessage: errorMessage,
        layout: "layouts/adminLayout",
      });
    } catch (err) {
      console.log(err.message);
      res.redirect("/admin");
    }
  },

  products: async (req, res) => {
    try {
      const errorMessage = req.flash('message');
      const [allCategories, rawProducts] = await Promise.all([
        Category.find().sort({ categoryName: 1 }).lean().exec(),
        Product.find()
          .populate('category', 'categoryName')
          .select('name category quantity price discount offerPrice isFeatured isWholesaleSet piecesPerSet productImagePath deliveryCharges increaseDeliveryChargesWithQuantity description createdAt')
          .sort({ createdAt: -1 })
          .lean()
          .exec()
      ]);
      const allProducts = rawProducts.map(p => { p.id = p._id.toString(); return p; });
      res.render('admin/productManagement', {
        allCategories: allCategories,
        allProducts: allProducts,
        errorMessage: errorMessage,
        layout: 'layouts/adminLayout',
      });
    } catch (err) {
      console.log(err.message);
      res.redirect('/admin');
    }
  },
  getEditProductModal: async (req, res) => {
    try {
      const [allCategories, rawProduct] = await Promise.all([
        Category.find().sort({ categoryName: 1 }).lean().exec(),
        Product.findById(req.params.id).populate('category', 'categoryName').lean().exec()
      ]);
      if (!rawProduct) {
        return res.status(404).send("Product not found");
      }
      rawProduct.id = rawProduct._id.toString();
      res.render('admin/_modal_edit_product_partial', {
        allCategories: allCategories,
        product: rawProduct,
        layout: false
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error loading product");
    }
  },
  orders: async (req, res) => {
    try {
      const errorMessage = req.flash("message");
      const allOrders = await Order.find({ isDeleted: { $ne: true } })
        .populate([
          {
            path: "userId",
            model: "User",
          },
          {
            path: "products.productId",
            model: "Product",
          },
        ])
        .sort({ createdAt: -1 })
        .exec();
      res.render("admin/orderManagement", {
        allOrders: allOrders,
        errorMessage: errorMessage,
        layout: "layouts/adminLayout",
      });
    } catch (err) {
      console.log(err);
      req.flash("message", "Error getting order details");
      res.redirect("/admin");
    }
  },

  coupons: async (req, res) => {
    const allCoupons = await Coupon.find().sort({ createdAt: -1 }).exec();
    const errorMessage = req.flash("message");
    res.render("admin/couponManagement", {
      allCoupons: allCoupons,
      errorMessage: errorMessage,
      layout: "layouts/adminLayout",
    });
  },

  orderDetails: async (req, res) => {
    try {
      const orderId = req.params.id;
      const myOrder = await Order.findById(orderId)
        .populate([
          {
            path: "userId",
            model: "User",
          },
          {
            path: "products.productId",
            model: "Product",
          },
          {
            path: "coupon",
            model: "Coupon",
          },
        ])
        .exec();
      console.log(myOrder);
      const isAjax = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));
      if (myOrder) {
        if (isAjax) {
          res.json({ myOrder });
        } else {
          res.render("admin/orderDetails", {
            myOrder: myOrder,
            layout: "layouts/adminLayout",
          });
        }
      } else {
        if (isAjax) {
          res.status(404).json({ error: "Order not found" });
        } else {
          req.flash("message", "Invalid orderId");
          res.redirect("/admin/orders");
        }
      }
    } catch (err) {
      console.log(err);
      const isAjax = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));
      if (isAjax) {
        res.status(500).json({ error: "Server error" });
      } else {
        req.flash("message", "Invalid orderId");
        res.redirect("/admin/orders");
      }
    }
  },

  addCategory: async (req, res) => {
    try {
      const normalizedName = _.startCase(_.toLower((req.body.categoryName || '').trim()));
      const division = (req.body.division || '').trim();

      // Check if a category with same name and division already exists
      const exists = await Category.findOne({ categoryName: normalizedName, division: division }).exec();
      if (exists) {
        req.flash("message", "Category already exists in the selected division");
        return res.redirect("/admin/categories");
      }

      // Create and save
      const category = new Category({
        categoryName: normalizedName,
        division: division,
      });
      await category.save();
      const pusher = req.app.get('pusher');
      if (pusher) { pusher.trigger('ecommerce-channel', 'site_updated', {}); }
      res.redirect("/admin/categories");
    } catch (err) {
      console.log(err.message);
      // Friendly handling for duplicate key index errors
      if (err.code === 11000) {
        req.flash("message", "A category with that name already exists (index constraint). Please check existing categories.");
      } else {
        req.flash("message", "Error adding category");
      }
      res.redirect("/admin/categories");
    }
  },

  editCategory: async (req, res) => {
    try {
      const normalizedName = _.startCase(_.toLower((req.body.categoryName || '').trim()));
      const division = (req.body.division || '').trim();

      // Check if another category with same name and division exists
      const conflict = await Category.findOne({ categoryName: normalizedName, division: division, _id: { $ne: req.params.id } }).exec();
      if (conflict) {
        req.flash("message", "Another category with the same name exists in the selected division");
        return res.redirect("/admin/categories");
      }

      await Category.findByIdAndUpdate(req.params.id, {
        categoryName: normalizedName,
        division: division
      });
      const pusher = req.app.get('pusher');
      if (pusher) { pusher.trigger('ecommerce-channel', 'site_updated', {}); }
      res.redirect("/admin/categories");
    } catch (err) {
      console.log(err.message);
      if (err.code === 11000) {
        req.flash("message", "A category with that name already exists (index constraint). Please check existing categories.");
      } else {
        req.flash("message", "Error editing in category");
      }
      res.redirect("/admin/categories");
    }
  },

  deleteCategory: async (req, res) => {
    let category;
    try {
      category = await Category.findById(req.params.id);
      await category.remove();
      const pusher = req.app.get('pusher');
      if (pusher) { pusher.trigger('ecommerce-channel', 'site_updated', {}); }
      res.redirect("/admin/categories");
    } catch (err) {
      console.log(err.message);
      if (category == null) {
        res.redirect("/admin");
      } else {
        req.flash("message", err.message);
        res.redirect("/admin/categories");
      }
    }
  },

  blockUser: async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, { isActive: false });
      const pusher = req.app.get('pusher');
      if (pusher) { pusher.trigger('ecommerce-channel', 'site_updated', {}); }
      res.redirect("/admin/users");
    } catch (err) {
      console.log(err.message);
      req.flash("message", "Error blocking User");
      res.redirect("/admin/users");
    }
  },

  unblockUser: async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, { isActive: true });
      const pusher = req.app.get('pusher');
      if (pusher) { pusher.trigger('ecommerce-channel', 'site_updated', {}); }
      res.redirect("/admin/users");
    } catch (error) {
      console.log(err.message);
      req.flash("message", "Error un blocking User");
      res.redirect("/admin/users");
    }
  },

  deleteOrder: async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Soft-delete: mark as deleted instead of removing
      order.isDeleted = true;
      await order.save();

      const pusher = req.app.get('pusher');
      if (pusher) { pusher.trigger('ecommerce-channel', 'site_updated', {}); }
      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
      console.log(err.message);
      return res.status(500).json({ error: "Error deleting order" });
    }
  },

  getAddOrder: async (req, res) => {
    try {
      const errorMessage = req.flash("message");
      const products = await Product.find({ quantity: { $gt: 0 } }).sort({ name: 1 });
      res.render("admin/addOrder", {
        products: products,
        errorMessage: errorMessage,
        layout: "layouts/adminLayout"
      });
    } catch (err) {
      console.log(err);
      req.flash("message", "Error loading add order page");
      res.redirect("/admin/orders");
    }
  },

  postAddOrder: async (req, res) => {
    try {
      const Counter = require("../models/counter");
      const { email, firstName, lastName, address, city, province, phone, orderProducts } = req.body;
      
      const items = JSON.parse(orderProducts);
      if (!items || items.length === 0) {
        req.flash("message", "No products selected");
        return res.redirect("/admin/addOrder");
      }

      let totalAmount = 0;
      let totalQuantity = 0;
      let totalDeliveryCharges = 0;
      const orderItems = [];

      for (let item of items) {
        const product = await Product.findById(item.productId);
        if (product && product.quantity >= item.quantity) {
          const price = product.offerPrice || product.price;
          const itemTotal = price * item.quantity;
          totalAmount += itemTotal;
          totalQuantity += item.quantity;
          
          // Calculate delivery charges
          let itemDelivery = product.deliveryCharges || 0;
          if (product.increaseDeliveryChargesWithQuantity) {
            itemDelivery = itemDelivery * item.quantity;
          }
          totalDeliveryCharges += itemDelivery;
          
          orderItems.push({
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            price: product.price,
            offerPrice: product.offerPrice
          });

          // update stock
          product.quantity -= item.quantity;
          await product.save();
        } else {
          req.flash("message", `Insufficient stock for ${item.name}`);
          return res.redirect("/admin/addOrder");
        }
      }

      // Generate sequential order ID
      const counter = await Counter.findOneAndUpdate(
        { name: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const orderIdStr = 'ORD-' + String(counter.seq).padStart(4, '0');

      const finalTotal = totalAmount + totalDeliveryCharges;

      const newOrder = new Order({
        orderIdStr: orderIdStr,
        deliveryAddress: {
          email: email || '', firstName, lastName, address, city, province, phone
        },
        products: orderItems,
        quantity: totalQuantity,
        total: finalTotal,
        subTotal: totalAmount,
        totalDeliveryCharges: totalDeliveryCharges,
        paymentType: 'online_paid',
        status: "Pending"
      });

      await newOrder.save();
      req.flash("message", "Order " + orderIdStr + " created successfully");
      const pusher = req.app.get('pusher');
      if (pusher) { pusher.trigger('ecommerce-channel', 'site_updated', {}); }
      res.redirect("/admin/orders");
      
    } catch (err) {
      console.log(err);
      req.flash("message", "Error creating order: " + err.message);
      res.redirect("/admin/addOrder");
    }
  },

  getReport: async (req, res) => {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const thisMonthOrders = await Order.find({
        createdAt: { $gte: thisMonthStart },
        isDeleted: { $ne: true }
      }).populate('products.productId').exec();
      const lastMonthOrders = await Order.find({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        isDeleted: { $ne: true }
      }).populate('products.productId').exec();

      const reportMonth = req.query.month || 'both';

      res.render("admin/report", {
        layout: false,
        thisMonthOrders,
        lastMonthOrders,
        now,
        reportMonth
      });
    } catch (err) {
      console.log(err);
      res.redirect("/admin");
    }
  }
};
