const Product = require("../models/product")
const Cart = require("../models/cart")
const Wishlist = require("../models/wishlist")
const { uploadToImgBB } = require("../services/imageService")

// Helper function to upload images in batches
async function uploadImagesInBatches(files, batchSize = 5) {
    let uploadedUrls = [];
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchPromises = batch.map(file => uploadToImgBB(file.buffer));
        try {
            const urls = await Promise.all(batchPromises);
            uploadedUrls.push(...urls);
        } catch (uploadErr) {
            console.error("ImgBB upload error:", uploadErr);
            throw new Error("Image upload failed. Try uploading fewer or smaller images. " + uploadErr.message);
        }
    }
    return uploadedUrls;
}

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
                // Upload in batches concurrently to speed up the process
                productImages = await uploadImagesInBatches(req.files);
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
            const pusher = req.app.get('pusher');
            if (pusher) {
                const populatedProduct = await Product.findById(product._id).populate('category').exec();
                pusher.trigger('ecommerce-channel', 'new_product', populatedProduct);
                pusher.trigger('ecommerce-channel', 'site_updated', {});
            }

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
                // Upload in batches concurrently
                const newUrls = await uploadImagesInBatches(req.files);
                productImages.push(...newUrls);
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

            const pusher = req.app.get('pusher');
      if (pusher) { pusher.trigger('ecommerce-channel', 'site_updated', {}); }
            res.redirect("/admin/products")
        } catch (err) {
            console.log(err)
            req.flash("message", "Error updating product: " + err.message)
            res.redirect("/admin/products")
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const productId = req.params.id;
            
            // Delete product completely from the database
            await Product.findByIdAndDelete(productId);
            
            // Also remove this product from all user carts
            await Cart.updateMany(
                { "products.productId": productId },
                { $pull: { products: { productId: productId } } }
            );

            // Also remove this product from all user wishlists
            await Wishlist.updateMany(
                { "myList.productId": productId },
                { $pull: { myList: { productId: productId } } }
            );

            const pusher = req.app.get('pusher');
            if (pusher) { pusher.trigger('ecommerce-channel', 'site_updated', {}); }
            res.redirect("/admin/products")
        } catch (err) {
            console.log(err)
            req.flash("message", "Error deleting product")
            res.redirect("/admin/products")
        }
    },

}
