var express = require('express');
var router = express.Router();

const userController = require("../controllers/user_controller");

router.post('/sign_up', userController.signUp)
router.post('/login', userController.login)
router.post('/add_remove_wishlist', userController.addRemoveWishlist)
router.post('/wishlist_list', userController.wishlistList)
router.post('/add_cart', userController.addRemoveCart)
router.post('/cart_list', userController.cartList)
router.post('/create_order', userController.createOrder)
router.post('/product_review', userController.productReview)
router.post('/edit_profile', userController.editProfile)
router.post('/add_new_address', userController.addNewAddress)
router.post('/address_list', userController.addressList)
router.post('/delete_address', userController.delete_address)
router.post('/order_list', userController.orderList)

router.post('/profile_upload', userController.profileUpload)

router.post('/check_pincode_pickk', userController.checkPincodePickk)

router.post('/count', userController.count)

router.post('/track_order', userController.trackOrder)

// router.post('/check_delivery_charges', userController.checkDeliveryCharges)


module.exports = router;