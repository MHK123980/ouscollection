const Product = require("../models/product")
const { uploadToImgBB } = require("../services/imageService")

module.exports = {
    addProduct: async (req, res) => {
        try {
            const price = parseFloat(req.body.price)
            const discount = req.body.discount ? parseFloat(req.body.discount) : null
            const offerPrice = req.body.discount ? price - ((price / 100) * discount) : null;
            const isFeatured = req.body.isFeatured == 'on' ? true : false
            const isWholesaleSet = req.body.isWholesaleSet == 'on' ? true : false
            const piecesPerSet = req.body.piecesPerSet ? Number(req.body.piecesPerSet) : 1

            let productImages = [];
            if (req.files && req.files.length > 0) {
                // Upload sequentially to prevent memory/timeout crashes with ImgBB
                for (const file of req.files) {
                    try {
                        const url = await uploadToImgBB(file.buffer);
                        productImages.push(url);
                    } catch(uploadErr) {
                        console.error("ImgBB upload error:", uploadErr);
                        throw new Error("Image upload failed. Try uploading fewer or smaller images. " + uploadErr.message);
                    }
                }
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
                isWholesaleSet: isWholesaleSet,
                piecesPerSet: piecesPerSet,
                description: req.body.description,
                productImagePath: productImages.length > 0 ? productImages : null
            })
            await product.save()
            
            // Emit new_product event
            const io = req.app.get('io');
            if (io) {
                const populatedProduct = await Product.findById(product._id).populate('category').exec();
                io.emit('new_product', populatedProduct);
            }

            const io = req.app.get('io'); if (io) { io.emit('site_updated'); } res.redirect("/admin/products")

        } catch (err) {
            console.log(err)
            req.flash("message", "Error Adding product: " + err.message)
            const io = req.app.get('io'); if (io) { io.emit('site_updated'); } res.redirect("/admin/products")
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
            const isWholesaleSet = req.body.isWholesaleSet == 'on' ? true : false
            const piecesPerSet = req.body.piecesPerSet ? Number(req.body.piecesPerSet) : 1
            const oldProductImages = product.productImagePath

            let productImages = oldProductImages || [];
            
            // Handle deleted images
            if (req.body.deletedImages) {
                let deleted = Array.isArray(req.body.deletedImages) ? req.body.deletedImages : [req.body.deletedImages];
                productImages = productImages.filter(img => !deleted.includes(img));
            }

            if (req.files && req.files.length > 0) {
                // Upload sequentially
                for (const file of req.files) {
                    try {
                        const url = await uploadToImgBB(file.buffer);
                        productImages.push(url); // Append new images to existing ones
                    } catch(uploadErr) {
                        console.error("ImgBB upload error:", uploadErr);
                        throw new Error("Image upload failed. Try uploading fewer or smaller images. " + uploadErr.message);
                    }
                }
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
                isWholesaleSet: isWholesaleSet,
                piecesPerSet: piecesPerSet,
                description: req.body.description,
                productImagePath: productImages
            })

            // Note: On Vercel we don't delete files from disk because no files are stored on disk.
            // Old ImgBB links will just remain active.

            const io = req.app.get('io'); if (io) { io.emit('site_updated'); } res.redirect("/admin/products")
        } catch (err) {
            console.log(err)
            req.flash("message", "Error updating product: " + err.message)
            const io = req.app.get('io'); if (io) { io.emit('site_updated'); } res.redirect("/admin/products")
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id)
            await product.remove()
            const io = req.app.get('io'); if (io) { io.emit('site_updated'); } res.redirect("/admin/products")
        } catch (err) {
            console.log(err)
            req.flash("message", "Error deleting product")
            const io = req.app.get('io'); if (io) { io.emit('site_updated'); } res.redirect("/admin/products")
        }
    },

}
