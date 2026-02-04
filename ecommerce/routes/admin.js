const express = require("express")
const router = express.Router()
const passport = require('passport')

// Admin login page (public)
router.get('/login', async (req, res) => {
	const messages = { error: req.flash('error') }
	res.render('admin/adminLogin', { messages, layout: false })
})

// Admin login POST
router.post('/login', (req, res, next) => {
	passport.authenticate('local', { failureFlash: true, failureRedirect: '/admin/login' })(req, res, function () {
		// Successful authentication
		if (req.user && req.user.isAdmin) {
			return res.redirect('/admin')
		}
		// Not an admin - log out and redirect to homepage
		req.logout(function (err) {
			return res.redirect('/')
		})
	})
})
const userControl = require("../controllers/userController")
const multer = require("../middleware/multer")
const authentication = require("../middleware/authentication")
const productControl = require("../controllers/productController")
const adminControl = require("../controllers/adminController")
const orderControl = require("../controllers/orderController")
const bannerControl = require("../controllers/bannerController")
const couponControl = require("../controllers/couponController")

router.use(authentication.checkLoggedIn, authentication.checkAdminPrivilege)

router.get("/", adminControl.home)
router.get("/getGraphDetails",adminControl.getGraphDetails)
router.get("/users", adminControl.users)
router.get("/categories", adminControl.categories)
router.get("/products", adminControl.products)
router.get("/orders", adminControl.orders)
router.get("/coupons", adminControl.coupons)
router.get("/banners", bannerControl.getBanner)
router.get("/orders/:id", adminControl.orderDetails)


router.post("/addCategory", adminControl.addCategory)
router.post("/addProduct", multer.productImage, productControl.addProduct)
router.post("/addCoupon", couponControl.addCoupon)
router.post("/addBanner", multer.bannerImage, bannerControl.addBanner)

router.put("/activateCoupon/:id", couponControl.activate)
router.put("/deactivateCoupon/:id", couponControl.deactivate)
router.put("/editProduct/:id", multer.productImage, productControl.editProduct)
router.put("/editCategory/:id", adminControl.editCategory)
router.put("/blockUser/:id", adminControl.blockUser)
router.put("/unblockUser/:id", adminControl.unblockUser)

router.put("/activateBanner/:id", bannerControl.activate)
router.put("/deactivateBanner/:id", bannerControl.deactivate)

router.put("/packOrder/:id", orderControl.packOrder)
router.put("/shipOrder/:id", orderControl.shipOrder)
router.put("/outForDelivery/:id", orderControl.outForDelivery)
router.put("/deliverPackage/:id", orderControl.deliverPackage)
router.put("/cancelOrder/:id", orderControl.cancelOrder)

router.delete("/orders/:id", adminControl.deleteOrder)
router.delete("/deleteProduct/:id", productControl.deleteProduct)
router.delete("/deleteCategory/:id", adminControl.deleteCategory)
router.delete("/logout", userControl.userLogout)

module.exports = router