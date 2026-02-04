const Cart = require("../models/cart");
const Category = require("../models/category")
const User = require("../models/users")
const Product = require("../models/product")

module.exports = {
    addToCart: async (req, res) => {
        const productId = req.params.id
        const { name, price, quantity, offerPrice } = req.body;
        try {
            const findProduct = await Product.findById(productId)
            if (!findProduct || findProduct.quantity < quantity) {
                return res.status(200).json({ message: "item not available" })
            }
            // Stock will be decreased only when order is confirmed, not when adding to cart

            let itemTotal
            if (req.user) {
                const userId = req.user.id
                let cart = await Cart.findOne({ userId });
                if (cart) {
                    let itemIndex = cart.products.findIndex(product => product.productId == productId);
                    if (itemIndex != -1) {
                        let productItem = cart.products[itemIndex];
                        productItem.quantity += quantity
                        itemTotal = offerPrice ? offerPrice * productItem.quantity : price * productItem.quantity
                    } else {
                        cart.products.push({ productId, quantity, name, price, offerPrice });
                        itemTotal = offerPrice ? offerPrice * quantity : price * quantity
                    }
                    cart.subTotal = cart.products.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
                    cart.total = cart.products.reduce((acc, curr) => acc + curr.quantity * (curr.offerPrice || curr.price), 0)
                    // compute total delivery charges for cart
                    {
                        const prodIds = cart.products.map(p => p.productId)
                        const prods = await Product.find({ _id: { $in: prodIds } })
                        let totalDelivery = 0
                        cart.products.forEach(item => {
                            const prod = prods.find(p => p.id == item.productId)
                            if (prod) {
                                const charge = Number(prod.deliveryCharges || 0)
                                totalDelivery += prod.increaseDeliveryChargesWithQuantity ? charge * item.quantity : charge
                            }
                        })
                        cart.totalDeliveryCharges = totalDelivery
                    }
                    await cart.save();
                } else {
                    const subTotal = (quantity * price)
                    const total = offerPrice ? (quantity * offerPrice) : subTotal
                    cart = await Cart.create({
                        userId,
                        products: [{ productId, quantity, name, price, offerPrice }],
                        subTotal: subTotal,
                        total: total
                    });
                    // compute delivery for newly created cart
                    {
                        const prod = await Product.findById(productId)
                        const charge = Number(prod.deliveryCharges || 0)
                        cart.totalDeliveryCharges = prod.increaseDeliveryChargesWithQuantity ? charge * quantity : charge
                        await cart.save()
                    }
                    itemTotal = offerPrice ? offerPrice * quantity : price * quantity
                }
            } else {
                // session based cart for anonymous users
                req.session.cart = req.session.cart || { products: [], subTotal: 0, total: 0 }
                const cart = req.session.cart
                const idx = cart.products.findIndex(p => p.productId == productId)
                if (idx > -1) {
                    cart.products[idx].quantity += Number(quantity)
                    itemTotal = (cart.products[idx].offerPrice || cart.products[idx].price) * cart.products[idx].quantity
                } else {
                    cart.products.push({ productId, quantity: Number(quantity), name, price: Number(price), offerPrice: offerPrice ? Number(offerPrice) : null })
                    itemTotal = offerPrice ? Number(offerPrice) * Number(quantity) : Number(price) * Number(quantity)
                }
                cart.subTotal = cart.products.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
                cart.total = cart.products.reduce((acc, curr) => acc + curr.quantity * (curr.offerPrice || curr.price), 0)
                // compute session cart delivery charges
                {
                    const prodIds = cart.products.map(p => p.productId)
                    const prods = await Product.find({ _id: { $in: prodIds } })
                    let totalDelivery = 0
                    cart.products.forEach(item => {
                        const prod = prods.find(p => p.id == item.productId)
                        if (prod) {
                            const charge = Number(prod.deliveryCharges || 0)
                            totalDelivery += prod.increaseDeliveryChargesWithQuantity ? charge * item.quantity : charge
                        }
                    })
                    cart.totalDeliveryCharges = totalDelivery
                }
            }
            //removing coupon from session if exist
            req.session.coupon = null
            return res.status(201).json({ message: "cart updated", itemTotal: itemTotal.toFixed(2) })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ err })
        }
    },

    getCart: async (req, res) => {
        const allCategories = await Category.find();
        try {
            const errorMessage = req.flash("message")
            if (req.user) {
                const userId = req.user.id
                const findCart = await Cart.findOne({ userId: userId }).populate({ path: "products.productId", model: "Product" })
                // ensure delivery charges up-to-date for persisted cart
                if(findCart && findCart.products && findCart.products.length>0){
                    const prodIds = findCart.products.map(p => p.productId._id ? p.productId._id : p.productId)
                    const prods = await Product.find({ _id: { $in: prodIds } })
                    let totalDelivery = 0
                    findCart.products.forEach(item => {
                        const prod = prods.find(p => p.id == (item.productId._id ? item.productId._id.toString() : item.productId))
                        if (prod) {
                            const charge = Number(prod.deliveryCharges || 0)
                            totalDelivery += prod.increaseDeliveryChargesWithQuantity ? charge * item.quantity : charge
                        }
                    })
                    findCart.totalDeliveryCharges = totalDelivery
                    await findCart.save()
                }
                const couponCode = req.session.coupon?.code
                const couponDiscount = Number(req.session.coupon?.discount)
                res.render("master/cart", { allCategories: allCategories, findCart: findCart, errorMessage: errorMessage, couponCode: couponCode, couponDiscount: couponDiscount })
            } else {
                const sessionCart = req.session.cart || { products: [], subTotal: 0, total: 0 }
                // populate product details
                const productIds = sessionCart.products.map(p => p.productId)
                const products = await Product.find({ _id: { $in: productIds } })
                const populatedProducts = sessionCart.products.map(item => ({
                    productId: products.find(p => p.id == item.productId),
                    quantity: item.quantity,
                    name: item.name,
                    price: item.price,
                    offerPrice: item.offerPrice
                }))
                // Calculate total delivery charges
                let totalDelivery = 0
                populatedProducts.forEach(item => {
                    if (item.productId) {
                        const charge = Number(item.productId.deliveryCharges || 0)
                        totalDelivery += item.productId.increaseDeliveryChargesWithQuantity ? charge * item.quantity : charge
                    }
                })
                const findCart = { products: populatedProducts, subTotal: sessionCart.subTotal, total: sessionCart.total, totalDeliveryCharges: totalDelivery }
                const couponCode = req.session.coupon?.code
                const couponDiscount = Number(req.session.coupon?.discount)
                res.render("master/cart", { allCategories: allCategories, findCart: findCart, errorMessage: errorMessage, couponCode: couponCode, couponDiscount: couponDiscount })
            }
        } catch (err) {
            console.log(err)
        }
    },
    cartItemCount: async (req, res, next) => {
        try {
            let itemCount = 0
            if (req.user) {
                const userId = req.user.id
                const cart = await Cart.findOne({ userId })
                if (cart) {
                    cart.products.forEach(product => { itemCount += product.quantity })
                }
            } else {
                const sessionCart = req.session.cart || { products: [] }
                sessionCart.products.forEach(p => { itemCount += Number(p.quantity) })
            }
            res.locals.cartItemCount = itemCount
            return res.status(200).json({ itemCount: itemCount })

        } catch (err) {
            console.log(err)
            return res.status(500).json({ err })
        }
    },
    deleteItem: async (req, res, next) => {
        const productId = req.params.id
        const cartCount = Number(req.body.cartCount || 0)
        try {
            const findProduct = await Product.findById(productId)
            // DO NOT change stock when deleting from cart - only change on order confirmation
            if (req.user) {
                const userId = req.user.id
                const cart = await Cart.findOne({ userId })
                const itemIndex = cart.products.findIndex(product => product.productId == productId);
                cart.products.splice(itemIndex, 1)
                cart.subTotal = cart.products.reduce((acc, curr) => acc + curr.quantity * curr.price, 0)
                cart.total = cart.products.reduce((acc, curr) => acc + curr.quantity * (curr.offerPrice || curr.price), 0)
                // recompute delivery for persisted cart after deletion
                const prodIds = cart.products.map(p => p.productId)
                const prods = await Product.find({ _id: { $in: prodIds } })
                let totalDelivery = 0
                cart.products.forEach(item => {
                    const prod = prods.find(p => p.id == item.productId)
                    if (prod) {
                        const charge = Number(prod.deliveryCharges || 0)
                        totalDelivery += prod.increaseDeliveryChargesWithQuantity ? charge * item.quantity : charge
                    }
                })
                cart.totalDeliveryCharges = totalDelivery
                req.session.coupon = null
                await cart.save()
                return res.status(200).json({ message: "successfully deleted" })
            } else {
                req.session.cart = req.session.cart || { products: [], subTotal: 0, total: 0 }
                const idx = req.session.cart.products.findIndex(p => p.productId == productId)
                if (idx > -1) req.session.cart.products.splice(idx, 1)
                req.session.cart.subTotal = req.session.cart.products.reduce((acc, curr) => acc + curr.quantity * curr.price, 0)
                req.session.cart.total = req.session.cart.products.reduce((acc, curr) => acc + curr.quantity * (curr.offerPrice || curr.price), 0)
                // recompute session cart delivery
                const prodIds = req.session.cart.products.map(p => p.productId)
                const prods = await Product.find({ _id: { $in: prodIds } })
                let totalDelivery = 0
                req.session.cart.products.forEach(item => {
                    const prod = prods.find(p => p.id == item.productId)
                    if (prod) {
                        const charge = Number(prod.deliveryCharges || 0)
                        totalDelivery += prod.increaseDeliveryChargesWithQuantity ? charge * item.quantity : charge
                    }
                })
                req.session.cart.totalDeliveryCharges = totalDelivery
                req.session.coupon = null
                // nothing to save for products here; do not call findProduct.save()
                return res.status(200).json({ message: "successfully deleted" })
            }
        } catch (err) {
            return res.status(400).json({ err })
        }
    },
    getCheckout: async (req, res) => {
        try {
            const allCategories = await Category.find();
            const couponDiscount = req.session.coupon?.discount
            const couponCode = req.session.coupon?.code
            if (req.user) {
                const userId = req.user.id
                const user = await User.findById(userId, { email: 1, address: 1 })
                const findCart = await Cart.findOne({ userId: userId }).populate({ path: "products.productId", model: "Product" })
                if (findCart?.products.length > 0) {
                    // ensure delivery charges are up-to-date
                    const prodIds = findCart.products.map(p => p.productId._id ? p.productId._id : p.productId)
                    const prods = await Product.find({ _id: { $in: prodIds } })
                    let totalDelivery = 0
                    findCart.products.forEach(item => {
                        const prod = prods.find(p => p.id == (item.productId._id ? item.productId._id.toString() : item.productId))
                        if (prod) {
                            const charge = Number(prod.deliveryCharges || 0)
                            totalDelivery += prod.increaseDeliveryChargesWithQuantity ? charge * item.quantity : charge
                        }
                    })
                    findCart.totalDeliveryCharges = totalDelivery
                    await findCart.save()
                    res.render("master/checkout", { allCategories: allCategories, findCart: findCart, user: user, couponCode: couponCode, couponDiscount: couponDiscount })
                } else {
                    res.redirect("/user/cart")
                }
            } else {
                // anonymous checkout using session cart
                const sessionCart = req.session.cart || { products: [] }
                if (sessionCart.products.length > 0) {
                    const productIds = sessionCart.products.map(p => p.productId)
                    const products = await Product.find({ _id: { $in: productIds } })
                    const populatedProducts = sessionCart.products.map(item => ({ productId: products.find(p => p.id == item.productId), quantity: item.quantity, name: item.name, price: item.price, offerPrice: item.offerPrice }))
                    // compute session cart delivery charges
                    let totalDelivery = 0
                    populatedProducts.forEach(item => {
                        const prod = item.productId
                        if (prod) {
                            const charge = Number(prod.deliveryCharges || 0)
                            totalDelivery += prod.increaseDeliveryChargesWithQuantity ? charge * item.quantity : charge
                        }
                    })
                    const findCart = { products: populatedProducts, subTotal: sessionCart.subTotal || 0, total: sessionCart.total || 0, totalDeliveryCharges: totalDelivery }
                    const user = { address: [], email: '' }
                    res.render("master/checkout", { allCategories: allCategories, findCart: findCart, user: user, couponCode: couponCode, couponDiscount: couponDiscount })
                } else {
                    res.redirect("/user/cart")
                }
            }
        } catch (err) {
            console.log(err)
        }
    },
}