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
      const [userCount, orderStatusPending, orderStatusDelivered, totalSale] =
        await Promise.all([
          userCountPromise,
          orderStatusPendingPromise,
          orderStatusDeliveredPromise,
          totalSalePromise,
        ]);
      const orderStatusCount = [
        orderStatusPending,
        orderStatusDelivered,
        totalSale[0]?.totalAmount.toFixed(2),
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
      const errorMessage = req.flash("message");
      const allCategories = await Category.find()
        .sort({ categoryName: 1 })
        .exec();
      const allProducts = await Product.find()
        .populate("category")
        .sort({ createdAt: -1 })
        .exec();
      res.render("admin/productManagement", {
        allCategories: allCategories,
        allProducts: allProducts,
        errorMessage: errorMessage,
        layout: "layouts/adminLayout",
      });
    } catch (err) {
      console.log(err.message);
      res.redirect("/admin");
    }
  },

  orders: async (req, res) => {
    try {
      const errorMessage = req.flash("message");
      const allOrders = await Order.find()
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
        req.flash("message", "Order not found");
        return res.redirect("/admin/orders");
      }

      // Delete the order
      await Order.findByIdAndDelete(orderId);

      req.flash("message", "Order deleted successfully");
      res.redirect("/admin/orders");
    } catch (err) {
      console.log(err.message);
      req.flash("message", "Error deleting order");
      res.redirect("/admin/orders");
    }
  },
};
