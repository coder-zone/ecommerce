const mongoose = require("mongoose");
const Joi = require("joi");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const shortid = require("shortid");
const axios = require('axios').default;
const { findByIdAndUpdate } = require("../models/user_model");
const md5 = require('md5');
const request = require("request");

require("../models/user_model");
require("../models/product");
require("../models/category");
require("../models/order");
require("../models/blog");
require("../models/banner");


var BLOG = mongoose.model("blog");

var USER = mongoose.model("user");
var CATEGORY = mongoose.model("category");
var PRODUCT = mongoose.model("product");
var ORDER = mongoose.model("order");
var BANNER = mongoose.model("banner");

const EMAIL = require('../helpers/email');
var EMAILER = new EMAIL();

exports.homePage = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string()
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
        let matchquery = { approved: "yes", bestSellers: true, featured: true, isAvailable: true, productImg: { $exists: true, $ne: [] } };
        pipeline.push({ $match: matchquery });
        pipeline.push({
            $lookup: {
                from: 'users',
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and:
                                    [
                                        { $in: ["$$productId", "$wishlist.productId"] },
                                        { $eq: ["$_id", mongoose.Types.ObjectId(result.value.customerId)] }
                                    ]
                            }

                        }
                    },
                    {
                        $unwind: "$wishlist"
                    }, {
                        $match:
                        {
                            $expr:
                            {
                                $and:
                                    [
                                        { $eq: ["$$productId", "$wishlist.productId"] },
                                    ]
                            }

                        }
                    },
                ],
                as: "wishlist"
            }

        })
        pipeline.push({
            $project: {
                // _id: 1,
                HSN: 1,
                price: 1,
                MRP: 1,
                color: 1,
                size: 1,
                productCategory: 1,
                productCategoryType: 1,
                userId: 1,
                productMenu: 1,
                featured: 1,
                itemWeight: 1,
                productName: 1,
                productDesc: 1,
                productSpecification: 1,
                funFacts: 1,
                manufactureDetails: 1,
                ownerUniqueId: 1,
                isAvailable: 1,
                bestSellers: 1,
                ownerName: 1,
                productImg: 1,
                approved: 1,
                categoryName: 1,
                review: 1,
                bestSellers: 1,
                // wishlist: { $cond: { if: { $isArray: "$wishlist.wishlist" }, then: { $sum: "$wishlist.wishlist" }, else: "NA" } },
                "wishlist.wishlist": 1,
                // count:1
            }

        })
        pipeline.push({
            $group: {
                _id: { categoryName: "$categoryName" }, data: { $push: '$$ROOT' }
            },
        })

        pipeline.push({
            $project: {
                _id: 1,
                listProduct: {
                    $slice: ["$data", 6],
                },

            }
        })
        pipeline.push({
            $sort: {
                "_id": 1,
                "updatedAt": -1
            },
        })
        const homePage = await PRODUCT.aggregate(pipeline)
        pipeline.pop(pipeline)
        pipeline.pop(pipeline)
        let pipeline1 = []
        pipeline1.push(...pipeline)
        pipeline1.push({
            $project: {
                _id: 1,
                listProduct: {
                    $slice: ["$data", 3],
                },

            }
        })
        pipeline1.push({
            $sort: {
                "_id": 1,
                "updatedAt": -1
            },
        })
        const bestSellers = await PRODUCT.aggregate(pipeline1)
        const blogList = await BLOG.find({}).sort({ updatedAt: -1 }).limit(4)
        if (!homePage) {
            res.send({ code: 200, data: [] })
        } else {
            if (!bestSellers) {
                res.send({ code: 200, data: { homePage: homePage, bestSellers: [] } })

            } else {

                res.send({ code: 200, data: { homePage: homePage, bestSellers: bestSellers, blogList: blogList } })

            }
        }

    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.productList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            page: Joi.string().required(),
            categoryId: Joi.string(),
            customerId: Joi.string(),
            categoryName: Joi.string().uppercase().required(),
            searchRangefrom: Joi.string(),
            searchGender: Joi.array().items(),
            searchRangeto: Joi.string(),
            color: Joi.array().items(),
            size: Joi.array().items(),

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
        var pagelength = 10
        let skip = (result.value.page - 1) * pagelength;
        let serachString = ""
        if (result.value.categoryName == "FOOD") {
            serachString = result.value.categoryName
        } else if (result.value.categoryName == "HANDICRAFTS") {
            serachString = result.value.categoryName
        } else if (result.value.categoryName == "APPAREL") {
            serachString = "APPAREL"
            if (result.value.color) {
                pipeline.push({
                    "$match": { "color": { "$in": result.value.color } }
                })
            }
            if (result.value.size) {
                pipeline.push({
                    "$match": { "size": { "$in": result.value.size } }
                })
            }
            if (result.value.searchGender) {
                pipeline.push({
                    "$match": { "productGenderType": { "$in": result.value.searchGender } }
                })
            }
        }

        pipeline.push({
            "$match": { "categoryName": serachString, "approved": "yes", isAvailable: true, productImg: { $exists: true, $ne: [] } }

        })
        if (result.value.searchRangefrom && result.value.searchRangeto) {
            pipeline.push(
                {
                    $addFields: {
                        regex: {
                            $regexFind: {
                                input: "$price",
                                regex: "^\\d+"
                            }
                        }
                    }
                },
                {
                    $set: {
                        price_num: {
                            $convert: {
                                input: "$regex.match",
                                to: "int"
                            }
                        }
                    }
                },
                {

                    "$match": { 'price_num': { $gte: parseInt(result.value.searchRangefrom), $lte: parseInt(result.value.searchRangeto) } }

                })
        }
        pipeline.push({
            $lookup: {
                from: 'users',
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and:
                                    [
                                        { $in: ["$$productId", "$wishlist.productId"] },
                                        { $eq: ["$_id", mongoose.Types.ObjectId(result.value.customerId)] }
                                    ]
                            }

                        }
                    },
                    {
                        $unwind: "$wishlist"
                    }, {
                        $match:
                        {
                            $expr:
                            {
                                $and:
                                    [
                                        { $eq: ["$$productId", "$wishlist.productId"] },
                                    ]
                            }

                        }
                    },
                ],
                as: "wishlist"
            }

        })
        pipeline.push({
            $project: {
                // _id: 1,
                HSN: 1,
                price: 1,
                MRP: 1,
                color: 1,
                size: 1,
                productCategory: 1,
                productCategoryType: 1,
                userId: 1,
                productMenu: 1,
                featured: 1,
                itemWeight: 1,
                productName: 1,
                productDesc: 1,
                productSpecification: 1,
                funFacts: 1,
                manufactureDetails: 1,
                ownerUniqueId: 1,
                isAvailable: 1,
                bestSellers: 1,
                ownerName: 1,
                productImg: 1,
                approved: 1,
                categoryName: 1,
                productGenderType: 1,
                review: 1,
                // wishlist: { $cond: { if: { $isArray: "$wishlist.wishlist" }, then: { $size: "$wishlist.wishlist" }, else: "NA" } },
                "wishlist.wishlist": 1
            }

        })
        pipeline.push({
            $sort: { updatedAt: -1 }
        })
        // pipeline.push({
        //     $skip: skip
        // })
        // pipeline.push({
        //     $limit: pagelength
        // })
        const productList = await PRODUCT.aggregate(pipeline)
        // const productList = await PRODUCT.aggregate(pipeline)

        //const productList = await PRODUCT.find({ "categoryName": { "$regex": serachString, "$options": "i" }, approved: true, isAvailable: true, }, { _id: 1, productName: 1, productDesc: 1, categoryName: 1, price: 1, MRP: 1, productImg: 1, }).skip(skip).limit(pagelength).sort({ updatedAt: -1 })
        const countAll = await PRODUCT.find({ "categoryName": { "$regex": serachString, "$options": "i" }, approved: "yes", isAvailable: true, }).count()
        if (productList) {
            let count = countAll
            // count = Math.ceil(parseInt(count / pagelength));
            res.send({ code: 200, data: { productList: productList } })
        } else {
            res.send({ code: 400, data: { productList: [], } })

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.productDetails = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            // page: Joi.string().required(),
            productId: Joi.string().required(),
            categoryName: Joi.string().required(),
            customerId: Joi.string()
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
        if (result.value.customerId) {
            let pipeline1 = []
            pipeline1.push({
                "$match": {
                    "_id": mongoose.Types.ObjectId(result.value.productId),
                    // inCart: {
                    //     $elemMatch: {
                    //         customerId: mongoose.Types.ObjectId(result.value.customerId),
                    //     }
                    // }
                }
            })

            pipeline1.push({
                $project: {
                    userId: 1,
                    SKU: 1,
                    categoryName: 1,
                    HSN: 1,
                    productName: 1,
                    productDesc: 1,
                    productSpecification: 1,
                    funFacts: 1,
                    ownerName: 1,
                    productGenderType: 1,
                    ownerUniqueId: 1,
                    productDetails: 1,
                    quantity: 1,
                    color: 1,
                    size: 1,
                    price: 1,
                    MRP: 1,
                    itemWeight: 1,
                    productImg: 1,
                    isAvailable: 1,
                    bestSellers: 1,
                    featured: 1,
                    approved: 1,
                    review: 1,
                    createdAt: 1,
                    returnReplace: 1,
                    gst: 1,
                    updatedAt: 1,
                    inCart: {
                        $filter: {
                            input: '$inCart',
                            as: 'inCart',
                            cond: { $eq: ['$$inCart.customerId', mongoose.Types.ObjectId(result.value.customerId)] }
                        }
                    },
                }
            })
            let product = await PRODUCT.aggregate(pipeline1)
            let reviewData = await PRODUCT.populate(product, { path: "review.customerId", select: { firstName: 1, lastName: 1 } })
            var productDetails = reviewData[0]
        } else {
            var productDetails = await PRODUCT.findById(result.value.productId, { inCart: 0 }).populate('review.customerId', { firstName: 1, lastName: 1 })
        }
        if (!productDetails) {
            res.send({ code: 400, err: "No Data Found" })
        } else {
            let pipeline = []
            pipeline.push({
                "$match": { "categoryName": { "$regex": result.value.categoryName, "$options": "i" }, "approved": "yes", isAvailable: true, productImg: { $exists: true, $ne: [] } }
                // { "categoryName": { "$regex": result.value.categoryName, "$options": "i" }
            })
            pipeline.push({
                $lookup: {
                    from: 'users',
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $in: ["$$productId", "$wishlist.productId"] },
                                            { $eq: ["$_id", mongoose.Types.ObjectId(result.value.customerId)] }
                                        ]
                                }

                            }
                        },
                        {
                            $unwind: "$wishlist"
                        }, {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$$productId", "$wishlist.productId"] },
                                        ]
                                }

                            }
                        },
                    ],
                    as: "wishlist"
                }

            })
            pipeline.push({
                $project: {
                    HSN: 1,
                    price: 1,
                    MRP: 1,
                    color: 1,
                    size: 1,
                    productCategory: 1,
                    productCategoryType: 1,
                    userId: 1,
                    productMenu: 1,
                    featured: 1,
                    itemWeight: 1,
                    productName: 1,
                    productDesc: 1,
                    productSpecification: 1,
                    funFacts: 1,
                    manufactureDetails: 1,
                    ownerUniqueId: 1,
                    isAvailable: 1,
                    bestSellers: 1,
                    ownerName: 1,
                    productImg: 1,
                    approved: 1,
                    categoryName: 1,
                    review: 1,
                    returnReplace: 1,
                    // wishlist: { $cond: { if: { $isArray: "$wishlist.wishlist" }, then: { $size: "$wishlist.wishlist" }, else: "NA" } },
                    "wishlist.wishlist": 1
                }

            })
            pipeline.push({
                $sort: { updatedAt: -1 }
            })
            pipeline.push({
                $limit: 10
            })
            const alsoLike = await PRODUCT.aggregate(pipeline)
            // const alsoLike = await PRODUCT.find({ "categoryName": { "$regex": result.value.categoryName, "$options": "i" }, approved: true }, { _id: 1, productName: 1, productDesc: 1, categoryName: 1, price: 1, MRP: 1, productImg: 1 })
            res.send({ code: 200, data: { productDetails, alsoLike } })

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}


exports.razorOrderCreate = async (req, res) => {
    try {
        // var razorpay = new Razorpay({
        //     key_id: "rzp_test_BcBcOEIzNixuaL",
        //     key_secret: "uV01XLl4kAiRWj0uOMzqqVN6",
        // });

        var razorpay = new Razorpay({
            key_id: "rzp_live_qFzIuPctYdI6Gb",
            key_secret: "SPDCfXRy8ya88SbP74OyIaRQ",
        });

        let validation = Joi.object().keys({
            // page: Joi.string().required(),
            amount: Joi.string().required(),
            orderId: Joi.string().required(),
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

        // const payment_capture = 6;
        const checkOrder = await ORDER.findById(result.value.orderId)
        if (!checkOrder) {
            res.send({ code: 400, err: "No Order Found" });
        } else {
            if (parseInt(checkOrder.totalAmount) == parseInt(result.value.amount)) {
                let amount = parseInt(result.value.amount) * 100
                let currency = "INR";
                let options = {
                    amount,
                    currency,
                    receipt: shortid.generate(),
                    // payment_capture,
                };
                try {
                    const response = await razorpay.orders.create(options);
                    console.log(response);
                    const saveOrder = await ORDER.findByIdAndUpdate(result.value.orderId, { $set: { orderGenerate: response } }, { new: true })
                    res.send({ code: 200, data: response, key: "rzp_live_qFzIuPctYdI6Gb" });
                } catch (err) {
                    console.log(err);
                }
            } else {
                res.send({ code: 400, err: "Amount Mismatch" })

            }
        }

    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}




exports.verification = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            responce: Joi.object().required(),
            orderId: Joi.string().required(),
            customerId: Joi.string().required(),
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
        let body = result.value.responce.razorpay_order_id + "|" + result.value.responce.razorpay_payment_id;

        var expectedSignature = crypto.createHmac('sha256', 'SPDCfXRy8ya88SbP74OyIaRQ')
            .update(body.toString())
            .digest('hex');
        if (parseInt(result.value.responce.status_code) === 200) {
            if (expectedSignature === result.value.responce.razorpay_signature) {
                const updateRemoveCart = await cartRemoveAfterPayment(result.value.orderId, result.value.customerId)
                if (updateRemoveCart == 200) {
                    await ORDER.findOneAndUpdate({ _id: mongoose.Types.ObjectId(result.value.orderId) }, { $set: { orderStatus: "confirm", paymentSatus: "success", paymentDetails: result.value.responce } }, { new: true })
                    await sendSmsOrderConfirm(result.value.customerId, result.value.orderId)
                    res.send({ signatureIsValid: "true", status: 200, message: "Payment Verfied Succesfully!" });
                } else {
                    res.send({ signatureIsValid: "false", status: 400, message: "Payment Not Verfied" });
                }
            }
        } else {
            await ORDER.findOneAndUpdate({ _id: mongoose.Types.ObjectId(result.value.orderId) }, { $set: { orderStatus: "cancel", paymentSatus: "failed", paymentDetails: result.value.responce } }, { new: true })
            res.send({ signatureIsValid: "false", status: 400, message: "Payment Not Verfied" });
        }
    } catch (error) {
        res.send({ status: 400, err: err.message });
    }
}

async function sendSmsOrderConfirm(customerId, orderId) {
    try {
        const findCust = await USER.findById(customerId)
        const findOrder = await ORDER.findById(orderId)
        var url =
            "http://bhashsms.com/api/sendmsg.php?user=GTTFoundation&" +
            "pass=" +
            "GTTFoundation@123" +
            "&sender=" +
            "Vchimn" +
            "&phone=" +
            findCust.phoneNo +
            "&text=" +
            `Order Confirmation: Thanks for shopping on VChimni. 
            Your order has been successfully placed with ${findOrder.orderIdGenerated} on ${findOrder.updatedAt} ${findOrder.totalAmount}.
             For further transactions and to avail delivery of placed item/s kindly contact
             9420443489.` +
            "SMS&priority=ndnd&stype=normal"
        console.log(url)
        var options = {
            method: "GET",
            url: url,
        };
        request(options, async (error, response, body) => {
            if (error) {
                console.log(error);
                return
            } else {
                let jsonData = JSON.parse(body)
                console.log(jsonData);
                await EMAILER.orderConfirm(findCust.firstName, findOrder.orderIdGenerated, findOrder.totalAmount)
                return
            }
        });
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}


async function cartRemoveAfterPayment(orderId, customerId) {
    try {
        const findOrder = await ORDER.findById(orderId)
        if (findOrder) {
            for (let i = 0; i < findOrder.products.length; i++) {
                const findProduct = await PRODUCT.findById(findOrder.products[i].productId, { quantity: 1, inCart: 1 })
                if (findProduct) {
                    let quantity = parseInt(findProduct.quantity) - parseInt(findOrder.products[i].quantity)
                    // console.log(quantity)
                    await PRODUCT.updateMany(
                        { _id: mongoose.Types.ObjectId(findOrder.products[i].productId) },
                        { $pull: { inCart: { customerId: mongoose.Types.ObjectId(customerId) } } },
                        // { $addToSet: { quantity: quantity } },
                        { multi: true }
                    );
                    if (quantity == 0) {
                        await PRODUCT.findByIdAndUpdate(findOrder.products[i].productId, { $set: { quantity: quantity, isAvailable: false } }, { multi: true });
                    } else {
                        await PRODUCT.findByIdAndUpdate(findOrder.products[i].productId, { $set: { quantity: quantity } }, { multi: true });
                    }
                }
                // console.log(findProduct)
            }
        }
        return 200
    } catch (err) {
        return err

    }

}


exports.blogList = async (req, res) => {
    try {
        if (req.body.blogId) {
            const blogList = await BLOG.findById(req.body.blogId)
            if (!blogList) {
                res.send({ code: 400, err: "Something Error" })

            } else {
                res.send({ code: 200, data: blogList })

            }
        } else {
            const blogList = await BLOG.find({})
            if (!blogList) {
                res.send({ code: 400, err: "No Data Found" })

            } else {
                res.send({ code: 200, data: blogList })

            }
        }

    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}
exports.bannerList = async (req, res) => {
    try {
        const bannerList = await BANNER.find({})
        if (!bannerList) {
            res.send({ code: 400, err: "No Data Found" })

        } else {
            res.send({ code: 200, data: bannerList })

        }

    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}
exports.forgotPassword = async (req, res) => {
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
        const checkUser = await USER.find({ emailId: result.value.emailId })
        if (!checkUser) {
            res.send({ code: 400, err: "Invalid EmailId" })
        } else {
            await USER.findByIdAndUpdate(checkUser[0]._id, { $set: { password: md5(result.value.password) } }, { new: true })
            res.send({ code: 200, message: "Password Update Successfully" })
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.newsLetter = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            emailId: Joi.string().email().required(),
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
        const data = await EMAILER.newsData(result.value.emailId)

        res.send({ code: 200, message: "Sent Successfully" })
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}