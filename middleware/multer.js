const multer = require("multer")

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        return cb(new Error("File not supported"), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
})

const uploadImages = upload.array("productImages")
const uploadBanner = upload.single("bannerImage")

module.exports = {
    productImage: (req, res, next) => {
        try {
            return uploadImages(req, res, (err) => {
                if (err instanceof multer.MulterError) {
                    // A Multer error occurred when uploading.
                    req.flash("message", "Error uploading files, max 4 images")
                    res.redirect("/admin/products")
                } else if (err) {
                    // An unknown error occurred when uploading.
                    req.flash("message", "Only support image files")
                    res.redirect("/admin/products")
                } else {
                    next()
                }
            })
        } catch (err) {
            if (err instanceof multer.MulterError) {
                req.flash("message", "Error uploading files, max 4 images")
                res.redirect("/admin/products")
            } else {
                req.flash("message", "Only support image files")
                res.redirect("/admin/products")
            }
        }
    },

    bannerImage: (req, res, next) => {
        return uploadBanner(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                console.log(err)
                req.flash("message", "Error uploading file")
                res.redirect("/admin/banners")
            } else if (err) {
                console.log(err)
                req.flash("message", "Only support image files")
                res.redirect("/admin/banners")
            } else {
                next()
            }
        })
    }

}

