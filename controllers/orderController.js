const Order = require("../models/order")
const Product = require("../models/product")
const Cart = require("../models/cart")
const User = require("../models/users")
const Category = require("../models/category")
const { sendOrderConfirmationEmail } = require("../services/emailService")
const Counter = require('../models/counter')

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

    getOrderPending: async (req, res) => {
        try {
            const orderId = req.params.id;
            const order = await Order.findById(orderId);
            if (!order) {
                return res.redirect("/");
            }
            res.render("master/orderPending", {
                order: order,
                layout: "layouts/masterLayout"
            });
        } catch (err) {
            console.log(err);
            res.redirect("/");
        }
    },

    checkout: async (req, res) => {
        console.log('[DEBUG] Checkout Controller Hit');
        // console.log('[DEBUG] Request Body:', req.body);
        try {
            let userId = null;
            let deliveryAddress = null;
            let products = [];
            let quantity = 0;
            let subTotal = 0;
            let total = 0;
            let totalDeliveryCharges = 0;
            let user = null;

            // 1. Handle User vs Guest
            if (req.user && req.user.id) {
                userId = req.user.id
                user = await User.findById(userId)
            }

            // 2. Handle Address
            const addressIndex = req.body.addressIndex

            if (userId && user && addressIndex && addressIndex !== '') {
                // Existing user address
                deliveryAddress = user.address[parseInt(addressIndex)]
            } else {
                // Guest or New Address
                deliveryAddress = {
                    firstName: req.body.fullName.split(' ')[0],
                    lastName: req.body.fullName.split(' ').slice(1).join(' '),
                    phone: req.body.phone,
                    phone2: req.body.phone2,
                    house: req.body.house,
                    address: req.body.address,
                    areaName: req.body.areaName,
                    landmark: req.body.landmark,
                    city: req.body.city,
                    state: req.body.state,
                    pincode: req.body.pincode,
                    email: req.body.email || (user ? user.email : null)
                };

                // Save address for logged-in user if it's new
                if (userId && user && (!addressIndex || addressIndex === '')) {
                    user.address.unshift(deliveryAddress);
                    await user.save();
                }
            }

            if (!deliveryAddress) {
                return res.status(400).json({ message: "Delivery address is required" })
            }

            // 3. Handle Cart Data
            let cartProducts = [];
            if (userId) {
                const cart = await Cart.findOne({ userId: userId })
                if (!cart || !cart.products || cart.products.length === 0) {
                    return res.status(400).json({ message: "Cart is empty" })
                }
                cartProducts = cart.products;
                products = cart.products;
                quantity = cart.quantity;
                subTotal = cart.subTotal;
                total = cart.total;
            } else {
                const cart = req.session.cart;
                if (!cart || !cart.products || cart.products.length === 0) {
                    return res.status(400).json({ message: "Cart is empty" })
                }
                cartProducts = cart.products;
                products = cart.products;
                quantity = cart.products.reduce((acc, curr) => acc + Number(curr.quantity), 0);
                subTotal = cart.subTotal;
                total = cart.total;
            }

            // Always recalculate delivery charges fresh from DB to ensure correctness
            const productIds = cartProducts.map(p => p.productId._id ? p.productId._id : p.productId);
            const dbProducts = await Product.find({ _id: { $in: productIds } });
            totalDeliveryCharges = 0;
            cartProducts.forEach(item => {
                const pId = item.productId._id ? item.productId._id.toString() : item.productId.toString();
                const prod = dbProducts.find(p => p._id.toString() === pId);
                if (prod) {
                    totalDeliveryCharges += calculateDeliveryCharge(prod, item.quantity);
                }
            });

            // 4. Calculate Final Total (with Coupons)
            const couponDiscount = req.session.coupon?.discount || 0
            const couponCode = req.session.coupon?.code
            const couponId = req.session.coupon?.id

            let finalTotal = (total + totalDeliveryCharges) - couponDiscount;
            if (req.body.paymentType == "cod") {
                finalTotal = finalTotal * 1.04;
            }

            const Counter = require('../models/counter');
            const counter = await Counter.findOneAndUpdate(
                { name: 'orderId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            
            // 5. Create Order
            const newOrder = new Order({
                orderIdStr: counter.seq.toString(),
                userId: userId, // Can be null for guests
                deliveryAddress: deliveryAddress,
                products: products,
                quantity: quantity,
                subTotal: subTotal,
                total: finalTotal,
                totalDeliveryCharges: totalDeliveryCharges,
                paymentType: req.body.paymentType
            })

            if (req.body.paymentType == "online") {
                newOrder.status = "Payment Pending";
            } else if (req.body.paymentType == "razorpay") {
                newOrder.razorpayOrderId = req.body.orderId
                newOrder.razorpayPaymentId = req.body.paymentId
            }

            // Adding coupon details if applied
            if (req.session.coupon) {
                newOrder.coupon = {
                    code: couponCode,
                    discount: couponDiscount
                }
                // Only save redeemed coupon for logged-in users
                if (user) {
                    user.redeemedCoupons.push(couponId)
                    await user.save()
                }
            }

            // 6. Decrease Stock
            for (let product of newOrder.products) {
                // Handle different product ID structures (session vs db)
                const pId = product.productId._id ? product.productId._id : product.productId;
                const prod = await Product.findById(pId)
                if (prod) {
                    prod.quantity -= product.quantity
                    await prod.save()
                }
            }

            await newOrder.save()

            // Send Email Confirmation
            if (deliveryAddress.email && deliveryAddress.email.trim() !== '') {
                sendOrderConfirmationEmail(newOrder, deliveryAddress.email.trim());
            }

            // Emit new_order event via Pusher
            const pusher = req.app.get('pusher');
            if (pusher) {
                const populatedOrder = await Order.findById(newOrder._id).populate('userId').exec();
                pusher.trigger('ecommerce-channel', 'new_order', JSON.parse(JSON.stringify(populatedOrder)));
            }

            // 7. Clear Cart
            if (userId) {
                await Cart.findOneAndDelete({ userId: userId });
            } else {
                req.session.cart = { products: [], subTotal: 0, total: 0 };
            }
            req.session.coupon = null

            // res.sendStatus(201)
            res.status(201).json({
                message: "Order placed successfully",
                isGuest: !userId,
                orderId: newOrder._id,
                paymentType: req.body.paymentType
            })

        } catch (err) {
            console.log('Checkout error:', err)
            res.status(500).json({ message: err.message || 'Something went wrong' })
        }
    },
    packOrder: async (req, res) => {
        try {
            const orderId = req.params.id
            const myOrder = await Order.findById(orderId)
            if (myOrder.status != "Cancelled") {
                myOrder.status = "Packed"
                await myOrder.save()
                const pusher = req.app.get('pusher');
                if (pusher) pusher.trigger('ecommerce-channel', 'orderStatusUpdated', { orderId, status: 'Packed' });
                return res.status(201).json({ message: "order Packed" })
            } else {
                return res.status(400).json({ message: "cant update status, Item is cancelled" })
            }

        } catch (err) {
            return res.status(500).json(err)
        }
    },


    shipOrder: async (req, res) => {
        try {
            const orderId = req.params.id
            const myOrder = await Order.findById(orderId)
            if (myOrder.status != "Cancelled") {
                myOrder.status = "Shipped"
                await myOrder.save()
                const pusher = req.app.get('pusher');
                if (pusher) pusher.trigger('ecommerce-channel', 'orderStatusUpdated', { orderId, status: 'Shipped' });
                return res.status(201).json({ message: "order shipped" })
            } else {
                return res.status(400).json({ message: "cant update status, Item is cancelled" })
            }

        } catch (err) {
            return res.status(500).json(err)
        }

    },

    outForDelivery: async (req, res) => {
        try {
            const orderId = req.params.id
            const myOrder = await Order.findById(orderId)
            if (myOrder.status != "Cancelled") {
                myOrder.status = "Out for delivery"
                await myOrder.save()
                const pusher = req.app.get('pusher');
                if (pusher) pusher.trigger('ecommerce-channel', 'orderStatusUpdated', { orderId, status: 'Out for delivery' });
                return res.status(201).json({ message: "out for delivery" })
            } else {
                return res.status(400).json({ message: "cant update status, Item is cancelled" })
            }

        } catch (err) {
            return res.status(500).json(err)
        }

    },

    deliverPackage: async (req, res) => {
        try {
            const orderId = req.params.id
            const myOrder = await Order.findById(orderId)
            if (myOrder.status != "Cancelled") {
                myOrder.status = "Delivered"
                await myOrder.save()
                const pusher = req.app.get('pusher');
                if (pusher) pusher.trigger('ecommerce-channel', 'orderStatusUpdated', { orderId, status: 'Delivered' });
                return res.status(201).json({ message: "order delivered" })
            } else {
                return res.status(400).json({ message: "cant update status, Item is cancelled" })
            }
        } catch (err) {
            return res.status(500).json(err)
        }

    },

    cancelOrder: async (req, res) => {
        try {
            const orderId = req.params.id
            const myOrder = await Order.findById(orderId)

            if (myOrder.status != "Cancelled" && myOrder.status != "Delivered") {
                //updating stock for each items in order before cancelling 
                myOrder.products.forEach(async product => {
                    let myProduct = await Product.findById(product.productId)
                    myProduct.quantity += product.quantity
                    await myProduct.save()
                })
                myOrder.status = "Cancelled"
                await myOrder.save()
                const pusher = req.app.get('pusher');
                if (pusher) pusher.trigger('ecommerce-channel', 'orderStatusUpdated', { orderId, status: 'Cancelled' });
                return res.status(201).json({ message: "order cancelled and stock updated" })
            } else {
                return res.status(400).json({ message: "cant update status, Item already cancelled" })
            }

        } catch (err) {
            console.log(err)
            return res.status(500).json(err)
        }
    },

    // Generic status change — also sends email when moving OUT of "Payment Pending"
    changeOrderStatus: async (req, res) => {
        try {
            const orderId = req.params.id;
            const { newStatus } = req.body;

            const validStatuses = ["Payment Pending", "Pending", "Packed", "Shipped", "Out for delivery", "Delivered", "Cancelled"];
            if (!validStatuses.includes(newStatus)) {
                return res.status(400).json({ message: "Invalid status" });
            }

            const myOrder = await Order.findById(orderId).populate('userId');
            if (!myOrder) return res.status(404).json({ message: "Order not found" });

            const wasPaymentPending = myOrder.status === "Payment Pending";
            const oldStatus = myOrder.status;

            myOrder.status = newStatus;
            await myOrder.save();

            // Emit pusher event
            const pusher = req.app.get('pusher');
            if (pusher) pusher.trigger('ecommerce-channel', 'orderStatusUpdated', { orderId, status: newStatus });

            // If this order was "Payment Pending" (online payment) and now admin
            // changed it to any other status → send order confirmation email
            if (wasPaymentPending && newStatus !== "Payment Pending") {
                const email = myOrder.deliveryAddress?.email ||
                              (myOrder.userId && myOrder.userId.email) || null;
                if (email && email.trim() !== '') {
                    console.log(`[Email] Sending order confirmation to ${email} (status changed from Payment Pending → ${newStatus})`);
                    sendOrderConfirmationEmail(myOrder, email.trim());
                } else {
                    console.log('[Email] No email on order — skipping confirmation email for Payment Pending → ' + newStatus);
                }
            }

            return res.status(200).json({ message: `Order status updated to ${newStatus}`, oldStatus });
        } catch (err) {
            console.log(err);
            return res.status(500).json(err);
        }
    },
}