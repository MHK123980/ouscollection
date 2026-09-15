const Coupon = require("../models/coupon");
const User = require("../models/users");
const Cart = require("../models/cart");

module.exports = {
  addCoupon: async (req, res) => {
    const { name, couponCode, discount, maxLimit, minPurchase, expDate } =
      req.body;
    try {
      await Coupon.create({
        name: name.toUpperCase(),
        couponCode: couponCode.toUpperCase(),
        discount,
        maxLimit,
        minPurchase,
        expDate,
      });
      res.redirect("/admin/coupons");
    } catch (err) {
      console.log(err);
      req.flash("message", "This Coupon already exist");
      res.redirect("/admin/coupons");
    }
  },

  redeem: async (req, res) => {
    try {
      const rawCode = req.params.id || "";
      const couponCode = rawCode.trim().toUpperCase();
      if (!couponCode) {
        req.session.coupon = null;
        return res.status(404).json({ message: "Invalid coupon code" });
      }

      const findCoupon = await Coupon.findOne({ couponCode: couponCode });
      if (!findCoupon) {
        req.session.coupon = null;
        return res.status(404).json({ message: "Invalid coupon code or expired" });
      }

      // Check active and expiration
      const expDate = findCoupon.expDate;
      const isNotExpired = expDate ? new Date() <= new Date(expDate) : true;

      if (!findCoupon.isActive || !isNotExpired) {
        req.session.coupon = null;
        return res.status(404).json({ message: "Coupon is inactive or expired" });
      }

      // Calculate cart subtotal (effective price)
      let subTotal = 0;
      if (req.user) {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (user && user.redeemedCoupons && user.redeemedCoupons.includes(findCoupon.id)) {
          req.session.coupon = null;
          return res.status(403).json({ message: "Coupon already redeemed" });
        }
        const findCart = await Cart.findOne({ userId });
        if (findCart && findCart.products) {
          subTotal = findCart.products.reduce((acc, curr) => acc + curr.quantity * (curr.offerPrice || curr.price), 0);
        }
      } else {
        const sessionCart = req.session.cart || { products: [] };
        if (sessionCart.products) {
          subTotal = sessionCart.products.reduce((acc, curr) => acc + curr.quantity * (curr.offerPrice || curr.price), 0);
        }
      }

      const minPurchase = Number(findCoupon.minPurchase || 0);
      if (minPurchase > 0 && subTotal < minPurchase) {
        req.session.coupon = null;
        return res.status(400).json({
          message: `minimum purchase is Rs ${minPurchase}`,
          minPurchase: minPurchase,
        });
      }

      // Calculate discount amount
      let discountAmount = (subTotal * Number(findCoupon.discount || 0)) / 100;
      const maxLimit = Number(findCoupon.maxLimit || 0);
      if (maxLimit > 0 && discountAmount > maxLimit) {
        discountAmount = maxLimit;
      }
      const couponDiscount = Number(discountAmount.toFixed(2));

      // Save to session
      req.session.coupon = {
        id: findCoupon._id,
        code: findCoupon.couponCode,
        discount: couponDiscount,
      };

      return res.status(200).json({
        couponDiscount: couponDiscount,
        totalPrice: subTotal,
        message: "coupon is valid",
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Error redeeming coupon" });
    }
  },

  removeCoupon: (req, res) => {
    req.session.coupon = null;
    return res.status(201).json({});
  },

  activate: async (req, res) => {
    const orderId = req.params.id;
    try {
      await Coupon.findByIdAndUpdate(orderId, { isActive: true });
      res.status(201).json({ message: "coupon activated" });
    } catch (err) {
      res.status(500).json({ err });
    }
  },

  deactivate: async (req, res) => {
    const orderId = req.params.id;
    try {
      await Coupon.findByIdAndUpdate(orderId, { isActive: false });
      res.status(201).json({ message: "coupon deactivated" });
    } catch (err) {
      res.status(500).json({ err });
    }
  },
};
