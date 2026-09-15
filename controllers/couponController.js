const Coupon = require("../models/coupon");
const User = require("../models/users");
const Cart = require("../models/cart");
const Product = require("../models/product");

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

      // Calculate cart subtotal using FRESH product prices from DB (not stale cart cache)
      let subTotal = 0;
      if (req.user) {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (user && user.redeemedCoupons && user.redeemedCoupons.includes(findCoupon.id)) {
          req.session.coupon = null;
          return res.status(403).json({ message: "Coupon already redeemed" });
        }
        const findCart = await Cart.findOne({ userId });
        if (findCart && findCart.products && findCart.products.length > 0) {
          // Fetch fresh product data to avoid stale cached prices
          const productIds = findCart.products.map(p => p.productId);
          const freshProducts = await Product.find({ _id: { $in: productIds } });
          subTotal = findCart.products.reduce((acc, cartItem) => {
            const prod = freshProducts.find(p => p._id.toString() === cartItem.productId.toString());
            if (prod) {
              const multiplier = prod.isWholesaleSet ? (prod.piecesPerSet || 1) : 1;
              const effectivePrice = (prod.offerPrice && prod.offerPrice > 0)
                ? prod.offerPrice * multiplier
                : prod.price * multiplier;
              return acc + cartItem.quantity * effectivePrice;
            }
            // fallback to stored cart price if product not found
            return acc + cartItem.quantity * (cartItem.offerPrice || cartItem.price);
          }, 0);
        }
      } else {
        const sessionCart = req.session.cart || { products: [] };
        if (sessionCart.products && sessionCart.products.length > 0) {
          const productIds = sessionCart.products.map(p => p.productId);
          const freshProducts = await Product.find({ _id: { $in: productIds } });
          subTotal = sessionCart.products.reduce((acc, cartItem) => {
            const prod = freshProducts.find(p => p._id.toString() === cartItem.productId.toString());
            if (prod) {
              const multiplier = prod.isWholesaleSet ? (prod.piecesPerSet || 1) : 1;
              const effectivePrice = (prod.offerPrice && prod.offerPrice > 0)
                ? prod.offerPrice * multiplier
                : prod.price * multiplier;
              return acc + cartItem.quantity * effectivePrice;
            }
            return acc + cartItem.quantity * (cartItem.offerPrice || cartItem.price);
          }, 0);
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

  deleteCoupon: async (req, res) => {
    const couponId = req.params.id;
    try {
      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      if (coupon.isActive) {
        return res.status(400).json({ message: "Cannot delete an active coupon. Deactivate it first." });
      }
      await Coupon.findByIdAndDelete(couponId);
      return res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Error deleting coupon" });
    }
  },
};
