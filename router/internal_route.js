var express = require('express');
var router = express.Router();
const internalController = require("../controllers/internal_controller");



router.post('/home_page', internalController.homePage)

router.post('/product_list', internalController.productList)


router.post('/product_details', internalController.productDetails)
router.post('/razorpay/order_create', internalController.razorOrderCreate)
router.post('/payment/verification', internalController.verification)
router.post('/blog_list', internalController.blogList)
router.get('/banner_list', internalController.bannerList)

router.post('/forgot_password', internalController.forgotPassword)

router.post('/news_letter', internalController.newsLetter)

// router.post('/order', internalController.order)



module.exports = router;