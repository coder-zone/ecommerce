const mongoose = require("mongoose");
const Joi = require("joi");
const md5 = require('md5')

require("../../models/user_model");
require("../../models/blog");
require("../../models/order");
require("../../models/product");
require("../../models/delivery");

const awsUpload = require("../../helpers/aws-upload");
const { orderList } = require("../user_controller");
var awsUploadHelper = new awsUpload();

var USER = mongoose.model("user");
var BLOG = mongoose.model("blog");
var ORDER = mongoose.model("order");
var PRODUCT = mongoose.model("product");
var DELIVERY = mongoose.model("delivery");

const request = require("request");

const EMAIL = require('../../helpers/email');
const delivery = require("../../models/delivery");
var EMAILER = new EMAIL();




exports.addAdmin = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            emailId: Joi.string().email().required(),
            password: Joi.string().required(),
            // gender: Joi.string().required(),
            active: Joi.boolean().required(),
            role: Joi.string().required(),
            phoneNo: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
            userId: Joi.string()
        });
        let result = validation.validate(req.body, { abortEarly: false });
        if (result.error) {
            let data = result.error.details[0].message.replace(
                /[."*+\-?^${}()|[\]\\]/g,
                ""
            );
            res.send({ code: 400, err: data });
            return;
        }
        if (result.value.userId) {
            const findUser = await USER.findById(result.value.userId)
            if (!findUser) {
                res.send({ code: 400, err: "No User Found" })

            } else {
                delete findUser.firstName
                delete findUser.lastName
                delete findUser.emailId
                // delete findUser.gender
                delete findUser.role
                delete findUser.phoneNo
                delete findUser.active

                findUser.set({
                    firstName: result.value.firstName,
                    lastName: result.value.lastName,
                    emailId: result.value.emailId,
                    // gender: result.value.gender,
                    role: mongoose.Types.ObjectId(result.value.role),
                    phoneNo: result.value.phoneNo,
                    active: result.value.active,
                })
                await findUser.save()
                res.send({ code: 200, message: "Edited Successfully" })

            }
        } else {
            const findUser = await USER.findOne({ $or: [{ emailId: result.value.emailId }, { phoneNo: result.value.phoneNo }] })
            if (findUser) {
                res.send({ code: 400, err: "Email/Phone No Already Registered" })
            } else {
                let uniqueNumber = await USER.findOne({}).sort({ userUniqueId: -1 });
                let userCount = "";
                if (uniqueNumber) {
                    let uniqueNo = uniqueNumber.userUniqueId.replace("WC", "");
                    userCount = "WC" + (parseInt(uniqueNo) + 1);
                } else {
                    userCount = "WC" + 10000;
                }
                result.value.userUniqueId = userCount
                let user = new USER({
                    firstName: result.value.firstName,
                    lastName: result.value.lastName,
                    emailId: result.value.emailId,
                    password: md5(result.value.password),
                    // gender: result.value.gender,
                    role: mongoose.Types.ObjectId(result.value.role),
                    phoneNo: result.value.phoneNo,
                    userUniqueId: result.value.userUniqueId,
                    active: result.value.active,
                })
                const userDetails = await user.save();
                await EMAILER.welcomeVender(result.value.firstName, result.value.emailId, result.value.password)
                res.send({ code: 200, data: { emailId: userDetails.emailId, userUniqueId: userDetails.userUniqueId }, message: "Create Successfully" })
            }

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}


exports.adminLogin = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            emailId: Joi.string().email().required(),
            password: Joi.string().required(),
        });
        let result = validation.validate(req.body, { abortEarly: false });
        if (result.error) {
            let data = result.error.details[0].message.replace(
                /[."*+\-?^${}()|[\]\\]/g,
                ""
            );
            res.send({ code: 400, err: data });
            return;
        }
        const findAdmin = await USER.find({ emailId: result.value.emailId }, { _id: 1, role: 1, password: 1, userUniqueId: 1, firstName: 1, active: 1 }).populate("role", { roleName: 1, module: 1 })
        if (!findAdmin[0]) {
            res.send({ code: 400, err: "Invalid EmailId" })
        } else {
            if (findAdmin[0].role.roleName == "CUSTOMER") {
                res.send({ code: 400, err: "Not Authroized" })
            } else {
                if (findAdmin[0].active) {
                    if (findAdmin[0].password == md5(result.value.password)) {
                        res.send({ code: 200, message: "Login Successfully", data: { userId: findAdmin[0]._id, role: findAdmin[0].role.roleName, roleId: findAdmin[0].role._id, module: findAdmin[0].role.module, uniqueId: findAdmin[0].userUniqueId, name: findAdmin[0].firstName } })
                    } else {
                        res.send({ code: 400, err: "Wrong Password" })

                    }
                } else {
                    res.send({ code: 400, err: "Not Authroized" })

                }
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }

}


exports.customerList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
        });
        let result = validation.validate(req.body, { abortEarly: false });
        if (result.error) {
            let data = result.error.details[0].message.replace(
                /[."*+\-?^${}()|[\]\\]/g,
                ""
            );
            res.send({ code: 400, err: data });
            return;
        }
        const findUser = await USER.findById(result.value.userId).populate("role", { roleName: 1 })
        if (!findUser) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            if (findUser.role.roleName != 'VENDOR' && findUser.role.roleName != 'CUSTOMER') {
                let pipeline = []
                pipeline.push({
                    $match: { role: mongoose.Types.ObjectId("6192626b8423aa2b0a7d23a2") }
                })

                pipeline.push({
                    $lookup: {
                        from: 'orders',
                        let: { id: '$_id' },
                        pipeline: [
                            {
                                $match:
                                {
                                    $expr:
                                    {
                                        $and:
                                            [
                                                { $eq: ["$customerId", "$$id"] },
                                                { $eq: ["$paymentSatus", "success"] }
                                            ]
                                    }

                                },


                            },
                            {
                                $sort: { 'updatedAt': -1 }
                            }

                        ],
                        as: "customerId"
                    }
                })
                pipeline.push({
                    $project: {
                        firstName: 1,
                        lastName: 1,
                        phoneNo: 1,
                        emailId: 1,
                        active: 1,
                        "customerId.updatedAt": 1,
                        totalOrder: {
                            $cond: {
                                if: {
                                    $isArray: "$customerId",
                                },
                                then: { $size: "$customerId" }, else: "NA"
                            }
                        },

                    }
                })
                pipeline.push({

                    $sort: { 'customerId.updatedAt': -1 }

                })

                const customerList = await USER.aggregate(pipeline)
                if (!customerList) {
                    res.send({ code: 400, data: { customerList: [] } })

                } else {
                    res.send({ code: 200, data: { customerList: customerList } })

                }
            } else {
                res.send({ code: 400, err: "Not Authorized" })

            }
        }

    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.addDeleteBlog = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
            blogName: Joi.string(),
            blogDesc: Joi.string(),
            base64: Joi.string(),
            blogId: Joi.string(),
        });
        let result = validation.validate(req.body, { abortEarly: false });
        if (result.error) {
            let data = result.error.details[0].message.replace(
                /[."*+\-?^${}()|[\]\\]/g,
                ""
            );
            res.send({ code: 400, err: data });
            return;
        }
        const findUser = await USER.findById(result.value.userId)
        if (!findUser) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            if (result.value.blogId) {
                await BLOG.deleteOne({ _id: mongoose.Types.ObjectId(result.value.blogId) })
                res.send({ code: 200, message: "Blog Delete Successfully" })
            } else {
                let url = await awsUploadHelper.uploadblog(result.value.base64)
                if (url.success) {
                    let saveBlog = new BLOG({
                        blogName: result.value.blogName,
                        blogDesc: result.value.blogDesc,
                        blogImg: url.url
                    })
                    await saveBlog.save()
                    res.send({ code: 200, message: "Blog Add Successfully" })
                } else {
                    res.send({ code: 400, err: "Something Wrong" })
                }
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}


exports.Dashboard = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
        });
        let result = validation.validate(req.body, { abortEarly: false });
        if (result.error) {
            let data = result.error.details[0].message.replace(
                /[."*+\-?^${}()|[\]\\]/g,
                ""
            );
            res.send({ code: 400, err: data });
            return;
        }
        const findUser = await USER.findById(result.value.userId).populate("role", { roleName: 1, ownerUniqueId: 1 })
        if (!findUser) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            if (findUser.role.roleName != 'VENDOR' && findUser.role.roleName != 'CUSTOMER') {
                const totalOrders = await ORDER.find({ paymentSatus: "success" }).count()
                const totalCustomer = await USER.find({ role: mongoose.Types.ObjectId('6192626b8423aa2b0a7d23a2') }).count()
                const totalProducts = await PRODUCT.find({}).count()
                let pipeline = []
                pipeline.push({
                    $unwind: "$products"
                })
                pipeline.push({
                    $group: {
                        _id: "$products.productId", count: { $sum: 1 }
                    },
                })
                pipeline.push({
                    $sort: { 'count': -1 }
                })
                pipeline.push({
                    $limit: 5
                })

                const recentOrder = await ORDER.find({ paymentSatus: "success" }, { _id: 0, orderIdGenerated: 0, products: 0, createdAt: 0, orderGenerate: 0, paymentDetails: 0, orderStatus: 0, paymentSatus: 0 }).sort({ updatedAt: -1 }).limit(10)
                    .populate('customerId', { firstName: 1, lastName: 1 })

                res.send({ code: 200, data: { totalOrders, totalCustomer, totalProducts, recentOrder } })

            } else {
                const totalProducts = await PRODUCT.find({ ownerUniqueId: findUser.userUniqueId }).count()
                let pipeline = []
                pipeline.push({
                    $match: { paymentSatus: "success" }
                })
                pipeline.push({
                    $lookup: {
                        from: 'products',
                        let: { productId: '$products.productId' },
                        pipeline: [
                            {
                                $match:
                                {
                                    $expr:
                                    {
                                        $and:
                                            [
                                                { $in: ["$_id", "$$productId"] },
                                                { $eq: ["$ownerUniqueId", findUser.userUniqueId] }
                                            ]
                                    }

                                },


                            },
                            {
                                $sort: { 'updatedAt': -1 }
                            }

                        ],
                        as: "productList"
                    }
                })
                pipeline.push({
                    $project: {
                        // "productList.updatedAt": 1,
                        totalOrder: {
                            $cond: {
                                if: {
                                    $isArray: "$productList",
                                },
                                then: { $size: "$productList" }, else: "NA"
                            }
                        },

                    }
                })
                pipeline.push({
                    $group: { _id: null, sum: { $sum: "$totalOrder" } }
                })
                pipeline.push({
                    $project: {
                        _id: 0,
                        sum: 1
                    }

                })

                const totalOrder = await ORDER.aggregate(pipeline)
                let pipeline1 = []
                pipeline1.push({
                    $match: { paymentSatus: "success" }

                })
                pipeline1.push({
                    "$unwind": "$products"

                })
                pipeline1.push({
                    $project: {
                        _id: 0,
                        orderIdGenerated: 0,
                        totalAmount: 0,
                        orderStatus: 0,
                        paymentSatus: 0,
                        createdAt: 0,
                        orderGenerate: 0,
                        paymentDetails: 0
                    }
                })
                pipeline1.push({
                    $limit: 20
                })
                pipeline1.push({
                    $sort: { updatedAt: -1 }
                })
                const productList = await ORDER.aggregate(pipeline1)
                let recentOrders = await ORDER.populate(productList, { path: 'products.productId customerId', match: { ownerUniqueId: findUser.userUniqueId }, select: { firstName: 1, lastName: 1, categoryName: 1, quantity: 1, productName: 1, SKU: 1, HSN: 1, price: 1, MRP: 1 } });
                recentOrders = recentOrders.filter((s) => s.products.productId)
                res.send({ code: 200, data: { totalProducts, totalOrder, recentOrders } })

            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.placeOrder = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
            itemName: Joi.string().required(),
            itemList: Joi.array().items().required(),
            custName: Joi.string().required(),
            custEmail: Joi.string().required(),
            custPhone: Joi.string().required(),
            custPincode: Joi.string().required(),
            custAddress: Joi.string().required(),
            totalQuantity: Joi.number().required(),
            totalAmount: Joi.number().required(),
            breadth: Joi.number().required(),
            height: Joi.number().required(),
            length: Joi.number().required(),
            weight: Joi.number().required(),
            orderId: Joi.string().required()
        });
        let result = validation.validate(req.body, { abortEarly: false });
        if (result.error) {
            let data = result.error.details[0].message.replace(
                /[."*+\-?^${}()|[\]\\]/g,
                ""
            );
            res.send({ code: 400, err: data });
            return;
        }
        var url = "https://pickrr.com/api/place-order/"
        console.log(url)
        var options = {
            method: "POST",
            url: url,
            body: JSON.stringify({
                auth_token: "c91dd1ad7a776d6698b17619788be8a1209735",
                item_name: result.value.itemName,
                item_list: result.value.itemList,
                from_name: "WeChimini,GTT Foundation",
                from_email: "contactus@wechimni.org",
                from_phone_number: "8956729677",
                from_address: "311, GTT Foundation, 3rd Floor, City Space Complex, above Unnati Mahindra Showroom, Vadgaon Sheri, Pune (MH) 411014",
                from_pincode: "411014",
                to_name: result.value.custName,
                to_email: result.value.custEmail,
                to_phone_number: result.value.custPhone,
                to_pincode: result.value.custPincode,
                to_address: result.value.custAddress,
                quantity: result.value.totalQuantity,
                invoice_value: result.value.totalAmount,
                item_breadth: result.value.breadth,
                item_length: result.value.length,
                item_height: result.value.height,
                item_weight: result.value.weight,
                client_order_id: result.value.orderId

            })
        };
        request(options, async (error, response, body) => {
            if (error) {
                console.log(error);
            } else {
                let jsonData = JSON.parse(body)
                if (jsonData.success) {
                    const findOrder = await ORDER.findOneAndUpdate({ orderIdGenerated: result.value.orderId }, { $set: { orderStatus: "dispatch", tracking_id: jsonData.tracking_id } })
                    let delivery = new DELIVERY({
                        order_Id: findOrder._id,
                        dispatchDetails: jsonData

                    })
                    await delivery.save()
                    var url =
                        "http://bhashsms.com/api/sendmsg.php?user=GTTFoundation&" +
                        "pass=" +
                        "GTTFoundation@123" +
                        "&sender=" +
                        "Vchimn" +
                        "&phone=" +
                        result.value.custPhone +
                        "&text=" +
                        `Your order has been accepted by the NGO` +
                        "SMS&priority=ndnd&stype=normal"
                    console.log(url)
                    var options = {
                        method: "GET",
                        url: url,
                    };
                    request(options, async (error, response, body) => {
                        if (error) {
                            console.log(error);
                        } else {
                            // let jsonData = JSON.parse(body)
                            console.log(jsonData);
                            res.send({ code: 200, message: "Dispatch Successfully" })
                        }
                    });
                } else {
                    console.log(body)
                    res.send({ code: 400, err: "Something Error" })

                }
            }
        });
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.adminReports = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
            type: Joi.string().required(),
            fromDate: Joi.string().required(),
            toDate: Joi.string().required(),
        });
        let result = validation.validate(req.body, { abortEarly: false });
        if (result.error) {
            let data = result.error.details[0].message.replace(
                /[."*+\-?^${}()|[\]\\]/g,
                ""
            );
            res.send({ code: 400, err: data });
            return;
        }
        let pipeline = []
        pipeline.push({
            $addFields: {
                onlyDate: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$createdAt'
                    }
                }
            }
        })
        if (result.value.type == 'Customer Report') {
            pipeline.push({
                $match: { onlyDate: { $gte: result.value.fromDate, $lte: result.value.toDate }, paymentSatus: "success" }
            })

            pipeline.push({
                "$unwind": "$products"

            })

            pipeline.push({
                $match: { orderStatus: { $ne: null } }
            })

            pipeline.push({
                $project: {
                    products: 1,
                    customerId: 1,
                    orderIdGenerated: 1,
                    orderStatus: 1,
                    paymentSatus: 1,
                    createdAt: 1,
                    // updatedAt: 1,
                    deliveryDate: 1,
                    shippingAddress: 1
                }
            })
            pipeline.push({
                $sort: { updatedAt: -1 }
            })
            const report = await ORDER.aggregate(pipeline)
            let customerReport = await ORDER.populate(report, { path: 'products.productId customerId', select: { categoryName: 1, productName: 1, MRP: 1, firstName: 1, lastName: 1, phoneNo: 1, emailId: 1 } });
            if (!customerReport[0]) {
                res.send({ code: 200, data: [] })

            } else {
                res.send({ code: 200, data: { customerReport } })
            }
        } else if (result.value.type == 'Vendor Report') {

            pipeline.push({
                $match: { onlyDate: { $gte: result.value.fromDate, $lte: result.value.toDate } }
            })
            pipeline.push({
                $group: {
                    _id: { ownerUniqueId: "$ownerUniqueId", ownerName: "$ownerName", categoryName: "$categoryName" },
                    totalProduct: { $sum: 1 }, totalApproval: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$approved", "yes"] },
                                then: 1, else: 0
                            }
                        },
                    },
                    "quantity": {
                        "$sum": {
                            "$toInt": "$quantity"
                        }
                    },
                }

            })
            pipeline.push({
                $project: {
                    _id: 0,
                    ownerUniqueId: "$_id.ownerUniqueId",
                    ownerName: "$_id.ownerName",
                    totalProduct: "$totalProduct",
                    totalApproval: "$totalApproval",
                    quantity: '$quantity',
                    category: "$_id.categoryName"

                }
            })

            pipeline.push({
                $sort: {
                    "updatedAt": -1
                },
            })
            const vendorReport = await PRODUCT.aggregate(pipeline)
            if (vendorReport) {
                res.send({ code: 200, data: { vendorReport: vendorReport, } })
            } else {
                res.send({ code: 200, data: [] })
            }
        } else if (result.value.type == 'Sale Report') {
            // if (result.value.type == 'Sale Report') {
            pipeline.push({
                $match: { onlyDate: { $gte: result.value.fromDate, $lte: result.value.toDate }, paymentSatus: "success" }
            })

            pipeline.push({
                "$unwind": "$products"

            })

            pipeline.push({
                $match: { orderStatus: { $ne: null } }
            })
            pipeline.push({
                $group: {
                    _id: { productId: "$products.productId" },
                    "quantity": {
                        "$sum": {
                            "$toInt": "$products.quantity"
                        }
                    },
                }
            })
            pipeline.push({
                $project: {
                    _id: 0,
                    products: 1,
                    productId: "$_id.productId",
                    quantity: 1
                    // orderIdGenerated: 1,
                }
            })
            pipeline.push({
                $sort: { updatedAt: -1 }
            })
            const report = await ORDER.aggregate(pipeline)
            let saleReport = await PRODUCT.populate(report,
                {
                    path: 'productId',
                    select: { _id: 0, categoryName: 1, productName: 1, MRP: 1, price: 1, ownerName: 1, }
                });
            if (saleReport) {
                res.send({ code: 200, data: { saleReport: saleReport, } })
            } else {
                res.send({ code: 200, data: [] })
            }

        }

    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.test = async (req, res) => {
    try {
        let { id } = req.body;

    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}