const Wishlist = require("../models/wishlist")
const Category = require("../models/category")
const Product = require("../models/product")

module.exports = {
    wishlist: async (req, res) => {
        const allCategories = await Category.find();
        if (req.user) {
            const userId = req.user.id
            const findWishlist = await Wishlist.findOne({ userId: userId }).populate({
                path: "myList.productId",
                model: "Product"
            })
            res.render("master/wishlist", {
                allCategories: allCategories,
                findWishlist: findWishlist
            })
        } else {
            // session based wishlist for anonymous users
            const sessionWishlist = req.session.wishlist || []
            // fetch product details
            const productIds = sessionWishlist.map(i => i.productId)
            const products = await Product.find({ _id: { $in: productIds } })
            const myList = sessionWishlist.map(item => {
                const prod = products.find(p => p.id == item.productId)
                return { productId: prod, name: item.name }
            })
            const findWishlist = { myList }
            res.render("master/wishlist", { allCategories: allCategories, findWishlist })
        }
    },
    addToWishlist: async (req, res, next) => {
        try {
            const name = req.body.name
            const productId = req.params.id
            if (req.user) {
                const userId = req.user.id
                const myWishlist = await Wishlist.findOne({ userId: userId })

                if (myWishlist) {
                    const ItemIndex = myWishlist.myList.findIndex(product => product.productId == productId)
                    if (ItemIndex > -1) {
                        myWishlist.myList.splice(ItemIndex, 1)
                        await myWishlist.save()
                        return res.status(204).json({ message: "removed from wishlist" })
                    } else {
                        myWishlist.myList.push({ productId, name })
                        await myWishlist.save()
                        return res.status(201).json({ message: "added to wishlist" })
                    }
                } else {
                    await Wishlist.create({
                        userId: userId,
                        myList: [{ productId, name }]
                    })
                    return res.status(201).json({ message: "added to wishlist" })
                }
            } else {
                // session based wishlist
                req.session.wishlist = req.session.wishlist || []
                const idx = req.session.wishlist.findIndex(i => i.productId == productId)
                if (idx > -1) {
                    // remove
                    req.session.wishlist.splice(idx, 1)
                    return res.status(204).json({ message: "removed from wishlist" })
                } else {
                    req.session.wishlist.push({ productId, name })
                    return res.status(201).json({ message: "added to wishlist" })
                }
            }


        } catch (err) {
            console.log(err)
            return res.status(500).json({ err })
        }
    },
    wishlistItemCount: async (req, res, next) => {
        try {
            if (req.user) {
                const userId = req.user.id
                const wishlist = await Wishlist.findOne({ userId })
                let itemCount = (wishlist?.myList) ? (wishlist.myList.length) : 0
                res.locals.wishlistItemCount = itemCount
                return res.status(200).json({ itemCount: itemCount })
            } else {
                const sessionWishlist = req.session.wishlist || []
                const itemCount = sessionWishlist.length
                res.locals.wishlistItemCount = itemCount
                return res.status(200).json({ itemCount })
            }

        } catch (err) {
            console.log(err)
            return res.status(500).json({ err })
        }
    }
}