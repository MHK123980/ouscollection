const _ = require("lodash");
const User = require("../models/users");
const Category = require("../models/category");
const Product = require("../models/product");
const Order = require("../models/order");
const Coupon = require("../models/coupon");
const { sendOrderConfirmationEmail } = require("../services/emailService");

const calculateDeliveryCharge = (prod, quantity) => {
    if (prod.deliveryChargeTiers && prod.deliveryChargeTiers.length > 0) {
        let charge = Number(prod.deliveryCharges || 0);
        for (let tier of prod.deliveryChargeTiers) {
            if (quantity >= tier.quantity) charge = Number(tier.charge);
            else break;
        }
        return charge;
    }
    const charge = Number(prod.deliveryCharges || 0);
    return prod.increaseDeliveryChargesWithQuantity ? charge * quantity : charge;
};

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
          .select('name category quantity price discount offerPrice isFeatured isWholesaleSet piecesPerSet productImagePath deliveryCharges increaseDeliveryChargesWithQuantity createdAt')
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
