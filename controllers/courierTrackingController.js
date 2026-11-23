const Order = require("../models/order");

function getCourierPortalUrl(courier, cn) {
  if (!cn) return "";
  const c = (courier || "").toLowerCase().trim();
  if (c.includes("postex")) {
    return `https://postex.pk/tracking?cn=${encodeURIComponent(cn)}`;
  } else if (c.includes("tcs")) {
    return `https://www.tcsexpress.com/track/${encodeURIComponent(cn)}`;
  } else if (c.includes("leopard")) {
    return `https://leopardscourier.com/tracking?track=${encodeURIComponent(cn)}`;
  } else if (c.includes("trax")) {
    return `https://trax.pk/tracking?tracking_number=${encodeURIComponent(cn)}`;
  } else if (c.includes("m&p") || c.includes("mulphilog") || c.includes("mnp")) {
    return `https://mulphilog.com/tracking?cn=${encodeURIComponent(cn)}`;
  } else if (c.includes("call courier") || c.includes("callcourier")) {
    return `https://callcourier.com.pk/tracking/?tc=${encodeURIComponent(cn)}`;
  } else {
    return `https://www.google.com/search?q=${encodeURIComponent(courier + " tracking " + cn)}`;
  }
}

module.exports = {
  // Admin Page: Courier Tracking
  getCourierTracking: async (req, res) => {
    try {
      // Saved trackings: orders that have a tracking number assigned
      const savedOrders = await Order.find({
        trackingNumber: { $exists: true, $ne: "" },
        isDeleted: { $ne: true }
      }).sort({ trackingAssignedAt: -1, updatedAt: -1 });

      // Recent orders for autocomplete dropdown (latest 60)
      const recentOrders = await Order.find({
        isDeleted: { $ne: true }
      })
        .sort({ createdAt: -1 })
        .limit(60)
        .select("orderIdStr deliveryAddress createdAt total courierName trackingNumber status");

      res.render("admin/courierTracking", {
        savedOrders,
        recentOrders,
        layout: "layouts/adminLayout"
      });
    } catch (err) {
      console.error("getCourierTracking error:", err);
      res.redirect("/admin");
    }
  },

  // Admin: Save or update tracking
  saveTracking: async (req, res) => {
    try {
      const { orderId, courierCompany, otherCourierName, trackingNumber } = req.body;

      if (!orderId || !orderId.trim()) {
        return res.status(400).json({ success: false, message: "Please provide an Order ID" });
      }

      if (!trackingNumber || !trackingNumber.trim()) {
        return res.status(400).json({ success: false, message: "Please provide a Tracking / CN Number" });
      }

      let finalCourier = (courierCompany || "").trim();
      if (!finalCourier || finalCourier.toLowerCase() === "other") {
        if (!otherCourierName || !otherCourierName.trim()) {
          return res.status(400).json({ success: false, message: "Please enter the courier company name" });
        }
        finalCourier = otherCourierName.trim();
      }

      const trimmedId = orderId.trim();
      let order = await Order.findOne({
        orderIdStr: { $regex: new RegExp("^" + trimmedId + "$", "i") },
        isDeleted: { $ne: true }
      });

      if (!order && trimmedId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(trimmedId);
      }

      if (!order) {
        return res.status(404).json({ success: false, message: `Order #${trimmedId} not found` });
      }

      order.courierName = finalCourier;
      order.trackingNumber = trackingNumber.trim();
      order.trackingAssignedAt = new Date();
      await order.save();

      return res.status(200).json({
        success: true,
        message: `Tracking saved for Order #${order.orderIdStr || order._id}`,
        order: {
          id: order._id,
          orderIdStr: order.orderIdStr || order._id.toString(),
          courierName: order.courierName,
          trackingNumber: order.trackingNumber,
          portalUrl: getCourierPortalUrl(order.courierName, order.trackingNumber)
        }
      });
    } catch (err) {
      console.error("saveTracking error:", err);
      return res.status(500).json({ success: false, message: "Server error while saving tracking" });
    }
  },

  // Admin: Delete tracking from an order
  deleteTracking: async (req, res) => {
    try {
      const { id } = req.params;
      let order = await Order.findOne({
        orderIdStr: { $regex: new RegExp("^" + id.trim() + "$", "i") }
      });

      if (!order && id.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(id);
      }

      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      order.courierName = "";
      order.trackingNumber = "";
      order.trackingAssignedAt = null;
      await order.save();

      return res.status(200).json({
        success: true,
        message: `Tracking removed for Order #${order.orderIdStr || order._id}`
      });
    } catch (err) {
      console.error("deleteTracking error:", err);
      return res.status(500).json({ success: false, message: "Server error while removing tracking" });
    }
  },

  // Admin: Search orders for autocomplete
  searchOrders: async (req, res) => {
    try {
      const q = (req.query.q || "").trim();
      let filter = { isDeleted: { $ne: true } };

      if (q) {
        filter.$or = [
          { orderIdStr: { $regex: q, $options: "i" } },
          { "deliveryAddress.firstName": { $regex: q, $options: "i" } },
          { "deliveryAddress.phone": { $regex: q, $options: "i" } }
        ];
      }

      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(25)
        .select("orderIdStr deliveryAddress createdAt total courierName trackingNumber status");

      const formatted = orders.map(o => ({
        id: o._id,
        orderIdStr: o.orderIdStr || o._id.toString(),
        customer: (o.deliveryAddress?.firstName || "Customer") + (o.deliveryAddress?.phone ? ` (${o.deliveryAddress.phone})` : ""),
        date: new Date(o.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }),
        total: o.total || 0,
        hasTracking: !!(o.trackingNumber && o.trackingNumber.trim() !== ""),
        courierName: o.courierName || "",
        trackingNumber: o.trackingNumber || ""
      }));

      return res.json({ success: true, orders: formatted });
    } catch (err) {
      console.error("searchOrders error:", err);
      return res.status(500).json({ success: false, orders: [] });
    }
  },

  // Customer: Render Order Tracking Page
  getTrackOrderPage: async (req, res) => {
    try {
      const Category = require("../models/category");
      const allCategories = await Category.find();
      const initialId = (req.query.id || "").trim();

      res.render("master/trackOrder", {
        allCategories,
        initialId,
        layout: "layouts/masterLayout"
      });
    } catch (err) {
      console.error("getTrackOrderPage error:", err);
      res.redirect("/");
    }
  },

  // Customer: Live Order Status API (No refresh needed)
  trackOrderApi: async (req, res) => {
    try {
      const orderId = (req.params.orderId || req.query.id || "").trim();
      if (!orderId) {
        return res.status(400).json({ success: false, message: "Please enter an Order ID" });
      }

      let order = await Order.findOne({
        orderIdStr: { $regex: new RegExp("^" + orderId + "$", "i") },
        isDeleted: { $ne: true }
      });

      if (!order && orderId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(orderId);
      }

      if (!order) {
        return res.status(404).json({
          success: false,
          message: `Order #${orderId.toUpperCase()} not found. Please verify your Order ID and try again.`
        });
      }

      const isCancelled =
        order.status &&
        (order.status.toLowerCase() === "cancel" ||
          order.status.toLowerCase() === "cancelled" ||
          order.status.toLowerCase() === "canceled");

      // Requirement: Admin status whatever selected shows 'Confirmed', except when cancelled shows 'Order Cancelled'
      const displayStatus = isCancelled ? "Cancelled" : "Confirmed";

      const customerName = order.deliveryAddress?.firstName
        ? `${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName || ""}`.trim()
        : "Valued Customer";

      const orderDate = new Date(order.createdAt).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      const hasTracking = !!(order.trackingNumber && order.trackingNumber.trim() !== "");
      const courierName = order.courierName || "";
      const trackingNumber = order.trackingNumber || "";
      const courierUrl = hasTracking ? getCourierPortalUrl(courierName, trackingNumber) : "";

      return res.json({
        success: true,
        order: {
          orderIdStr: order.orderIdStr || order._id.toString(),
          customerName,
          date: orderDate,
          isCancelled,
          displayStatus,
          hasTracking,
          courierName,
          trackingNumber,
          courierUrl
        }
      });
    } catch (err) {
      console.error("trackOrderApi error:", err);
      return res.status(500).json({ success: false, message: "Error fetching order details" });
    }
  }
};
