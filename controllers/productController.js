const Product = require("../models/product")
const { uploadToImgBB } = require("../services/imageService")

module.exports = {
    addProduct: async (req, res) => {
        try {
            const price = parseFloat(req.body.price)
            const discount = req.body.discount ? parseFloat(req.body.discount) : null
            const offerPrice = req.body.discount ? price - ((price / 100) * discount) : null;
            const isFeatured = req.body.isFeatured == 'on' ? true : false

            let productImages = [];
            if (req.files && req.files.length > 0) {
                // Upload each file to ImgBB
                const uploadPromises = req.files.map(file => uploadToImgBB(file.buffer));
                productImages = await Promise.all(uploadPromises);
            }

            const product = new Product({
                name: req.body.name,
                brand: req.body.brand,
                category: req.body.category || null,
                quantity: req.body.quantity,
                price: price,
                discount: discount,
                offerPrice: offerPrice,
                deliveryCharges: req.body.deliveryCharges ? Number(req.body.deliveryCharges) : 0,
                increaseDeliveryChargesWithQuantity: req.body.increaseDeliveryChargesWithQuantity == 'on' ? true : false,
                isFeatured: isFeatured,
                description: req.body.description,
                productImagePath: productImages.length > 0 ? productImages : null
            })
            await product.save()
            res.redirect("/admin/products")

        } catch (err) {
            console.log(err)
            req.flash("message", "Error Adding product: " + err.message)
            res.redirect("/admin/products")
        }

    },

    editProduct: async (req, res) => {
        let product
        try {
            product = await Product.findById(req.params.id)
            const price = parseFloat(req.body.price)
            const discount = req.body.discount ? parseFloat(req.body.discount) : null
            const offerPrice = req.body.discount ? price - ((price / 100) * discount) : null;
            const isFeatured = req.body.isFeatured == "on" ? true : false
            const oldProductImages = product.productImagePath

            let productImages = oldProductImages;
            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(file => uploadToImgBB(file.buffer));
                productImages = await Promise.all(uploadPromises);
            }

            await Product.findByIdAndUpdate(req.params.id, {
                name: req.body.name,
                brand: req.body.brand,
                category: req.body.category || null,
                quantity: req.body.quantity,
                price: price,
                discount: discount,
                offerPrice: offerPrice,
                deliveryCharges: req.body.deliveryCharges ? Number(req.body.deliveryCharges) : 0,
                increaseDeliveryChargesWithQuantity: req.body.increaseDeliveryChargesWithQuantity == 'on' ? true : false,
                isFeatured: isFeatured,
                description: req.body.description,
                productImagePath: productImages
            })

            // Note: On Vercel we don't delete files from disk because no files are stored on disk.
            // Old ImgBB links will just remain active.

            res.redirect("/admin/products")
        } catch (err) {
            console.log(err)
            req.flash("message", "Error updating product: " + err.message)
            res.redirect("/admin/products")
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id)
            await product.remove()
            res.redirect("/admin/products")
        } catch (err) {
            console.log(err)
            req.flash("message", "Error deleting product")
            res.redirect("/admin/products")
        }
    },

}
