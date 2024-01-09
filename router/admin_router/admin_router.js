var express = require('express');
var router = express.Router();
const adminProductController = require("../../controllers/admin_controller/admin_product");
const adminUserController = require("../../controllers/admin_controller/admin_user");


const { uploadBulkImg } = require('../../helpers/multer-upload');
const auth = require('../../middleware/validation')

router.post('/add_admin', adminUserController.addAdmin)
router.post('/add_product', adminProductController.addproduct)
router.post('/admin_login', adminUserController.adminLogin)
router.post('/add_category', adminProductController.addEditCategory)
router.post('/list_category', adminProductController.listCategory)
router.post('/product_approval_list', adminProductController.productApprovalList)
router.post('/user_product_approval', adminProductController.userProductApproval)
router.post('/product_approval_admin', adminProductController.productApprovalAdmin)

router.post('/product_img', adminProductController.addProductImg)
router.post('/add_banner', adminProductController.addDeleteBanner)
router.post('/create_role', adminProductController.createRole)
router.post('/get_role', adminProductController.getRole)
router.post('/get_user_list', adminProductController.getUserList)
router.post('/get_user', adminProductController.getUser)
router.post('/search_owner_id', adminProductController.searchOwnerId)
router.post('/products_list', adminProductController.productsList)
router.post('/get_edit_product', adminProductController.getEditProduct)

router.post('/get_order_list', adminProductController.getOrderList)

router.post('/get_order_data', adminProductController.getOrderData)

router.post('/edit_blog', adminProductController.editBlog)



router.post('/customer_list', adminUserController.customerList)

router.post('/add_blog', adminUserController.addDeleteBlog)

router.post('/dashboard', adminUserController.Dashboard)

router.post('/place_Order', adminUserController.placeOrder)


router.post('/admin_reports', adminUserController.adminReports)

router.post('/test', auth.fieldValidation, adminUserController.test)

module.exports = router