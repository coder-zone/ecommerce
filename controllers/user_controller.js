const mongoose = require("mongoose");
const Joi = require("joi");
const md5 = require('md5');
const JWT = require("../helpers/jwt_generate");
const { parse } = require("dotenv");
const { pipeline } = require("nodemailer/lib/xoauth2");
const request = require("request");
var ObjectID = require('mongodb').ObjectID;
const awsUpload = require("../helpers/aws-upload");
var awsUploadHelper = new awsUpload();
require("../models/user_model");
require("../models/product");
require("../models/category");
require("../models/order");
require("../models/delivery");

const EMAIL = require('../helpers/email');
var EMAILER = new EMAIL();

var USER = mongoose.model("user");
var CATEGORY = mongoose.model("category");
var PRODUCT = mongoose.model("product");
var ORDER = mongoose.model("order");
var DELIVERY = mongoose.model("delivery");
exports.signUp = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            firstName: Joi.string().required(),
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
        const findUser = await USER.findOne({ emailId: result.value.emailId })
        if (findUser) {
            res.send({ code: 400, err: "Email Already Registered" })
        } else {

            result.value.role = "6192626b8423aa2b0a7d23a2"
            let user = new USER({
                firstName: result.value.firstName,
                emailId: result.value.emailId,
                password: md5(result.value.password),
                role: result.value.role,
            })
            const userDetails = await user.save();
            await EMAILER.welcomeEmail(result.value.firstName)
            res.send({ code: 200, message: "Create Successfully" })
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.login = async (req, res) => {
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
        const findCustomer = await USER.find({ emailId: result.value.emailId }, { _id: 1, role: 1, password: 1, firstName: 1, lastName: 1, emailId: 1, phoneNo: 1, profileImg: 1 })
        if (!findCustomer[0]) {
            res.send({ code: 400, err: "invalid emailId" })
        } else {
            if (findCustomer[0].password == md5(result.value.password)) {
                let token = JWT.generateToken(findCustomer[0]._id);
                if (token) {
                    let matchquery = { _id: mongoose.Types.ObjectId(findCustomer[0]._id) };
                    let pipeline = []
                    pipeline.push({
                        "$match": {
                            inCart: {
                                $elemMatch: {
                                    customerId: mongoose.Types.ObjectId(findCustomer[0]._id),
                                }
                            }
                        }
                    })
                    pipeline.push({
                        $project: {
                            inCart: {
                                $filter: {
                                    input: '$inCart',
                                    as: 'inCart',
                                    cond: { $eq: ['$$inCart.customerId', mongoose.Types.ObjectId(findCustomer[0]._id)] }
                                }
                            },
                        }
                    })

                    pipeline.push({
                        $unwind: "$inCart"
                    })
                    pipeline.push({
                        $group: {
                            _id: "$inCart.customerId", count: { $sum: 1 },
                        }
                    })
                    let cartCount = await PRODUCT.aggregate(pipeline)
                    let pipeline1 = []
                    pipeline1.push({ $match: matchquery });
                    pipeline1.push({
                        $unwind: "$wishlist"
                    })
                    // pipeline.push({
                    //     $unwind: "$cartData.inCart"
                    // })
                    pipeline1.push({
                        $group: {
                            _id: null, count: { $sum: 1 },
                        }
                    })
                    const wishlistList = await USER.aggregate(pipeline1)
                    res.send({
                        code: 200, message: "Login Successfully", data: {
                            _id: findCustomer[0]._id, role: findCustomer[0].role, firstName: findCustomer[0].firstName, lastName: findCustomer[0].lastName,
                            emailId: findCustomer[0].emailId, phoneNo: findCustomer[0].phoneNo, img: findCustomer[0].profileImg, token, cartCount, wishlistList
                        }
                    })
                } else {
                    res.send({ code: 400, err: "Something Error" });
                }
            } else {
                res.send({ code: 400, err: "Wrong Password" })

            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}


exports.addRemoveWishlist = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            productId: Joi.string().required(),
            wishlistId: Joi.string(),
            role: Joi.string().required(),
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
        const checkCustomer = await USER.find({ _id: mongoose.Types.ObjectId(result.value.customerId), role: mongoose.Types.ObjectId(result.value.role) })
        if (!checkCustomer[0]) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            const wishlistExist = await USER.find({ "wishlist.productId": { $eq: mongoose.Types.ObjectId(result.value.productId) }, _id: { $eq: mongoose.Types.ObjectId(result.value.customerId) } });
            console.log(JSON.stringify(wishlistExist))

            if (result.value.wishlistId) {
                if (wishlistExist.length <= 0)
                    res.send({ code: 400, message: "Product Not There In The Wishlist" });
                else {
                    const deleteWishlist = await USER.updateMany(
                        {},
                        { $pull: { wishlist: { _id: mongoose.Types.ObjectId(result.value.wishlistId) } } },
                        { multi: true }
                    );
                    res.send({ code: 200, message: "Remove Successfully" })
                }

            } else {

                if (wishlistExist.length > 0) {
                    res.send({ code: 400, message: "Wishlist Already Added" })
                } else {
                    checkCustomer[0].wishlist.push({
                        productId: result.value.productId,
                        like: true
                    })
                    let response = await checkCustomer[0].save()
                    for (let i = 0; i < response.wishlist.length; i++) {
                        console.log(response.wishlist[i].productId)
                        console.log(mongoose.Types.ObjectId(result.value.productId))
                        if (response.wishlist[i].productId.toString() === mongoose.Types.ObjectId(result.value.productId).toString()) {
                            let returnRes = {
                                _id: response.wishlist[i]._id,
                                productId: result.value.productId,
                                like: true
                            }
                            res.send({ code: 200, message: "Add Successfully", data: returnRes })
                            break;
                        }
                    }
                }


            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}


exports.wishlistList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            page: Joi.string().required(),
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
        const checkCustomer = await USER.find({ _id: mongoose.Types.ObjectId(result.value.customerId) })
        if (!checkCustomer[0]) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            var pagelength = 10
            let skip = (result.value.page - 1) * pagelength;
            let matchquery = { _id: mongoose.Types.ObjectId(result.value.customerId) };
            let pipeline = []
            pipeline.push({ $match: matchquery });
            pipeline.push({
                $unwind: "$wishlist"
            })
            pipeline.push({
                $lookup: {
                    from: 'products',
                    let: { wishListId: '$wishlist.productId' },
                    pipeline: [
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$$wishListId", "$_id"] },
                                            { $eq: ["$isAvailable", true] }
                                        ]
                                }

                            }
                        },
                    ],
                    as: "wishlistData"
                }

            })
            pipeline.push({
                $unwind: "$wishlistData"
            })

            pipeline.push({
                $project: {
                    _id: 0,
                    customerId: "$_id",
                    count: 1,
                    productDetails: {
                        wishlistId: "$wishlist._id", productId: "$wishlist.productId", like: "$wishlist.like",
                        productName: "$wishlistData.productName", productDesc: "$wishlistData.productName",
                        categoryName: "$wishlistData.categoryName",
                        price: "$wishlistData.price",
                        MRP: "$wishlistData.MRP",
                        productImg: "$wishlistData.productImg",
                    }
                },
            });
            pipeline.push({
                $sort: {
                    "updatedAt": -1
                },
            })
            pipeline.push({
                $facet: {
                    wishList: [
                        { $skip: skip },
                        { $limit: pagelength }
                    ],
                    pagination: [
                        { $count: "totalWishList" }
                    ]
                }
            })
            const wishList = await USER.aggregate(pipeline)
            if (wishList[0]) {
                if (wishList[0].pagination[0]) {
                    let count = wishList[0].pagination[0].totalWishList;
                    count = Math.ceil(parseInt(count / pagelength));
                    res.send({
                        code: 200, data: {
                            wishList: wishList[0],
                            count
                        }
                    })
                } else {
                    res.send({ code: 200, data: [] })

                }
            } else {
                res.send({ code: 200, data: [] })
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}




exports.addRemoveCart = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            productId: Joi.string(),
            quantity: Joi.string(),
            roleId: Joi.string().required(),
            size: Joi.string().uppercase(),
            color: Joi.string(),
            cartId: Joi.string()
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
        const checkCustomer = await USER.find({ _id: mongoose.Types.ObjectId(result.value.customerId), role: mongoose.Types.ObjectId(result.value.roleId) })
        if (!checkCustomer[0]) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            if (result.value.cartId) {
                if (result.value.quantity) {
                    if (result.value.size && result.value.color) {
                        const updateQuantity = await PRODUCT.updateOne(
                            { inCart: { $elemMatch: { _id: mongoose.Types.ObjectId(result.value.cartId) } } },
                            { $set: { "inCart.$.quantity": result.value.quantity, "inCart.$.color": result.value.color, "inCart.$.size": result.value.size } }
                        );
                        if (!updateQuantity) {
                            res.send({ code: 400, err: "Something Error" })

                        } else {
                            res.send({ code: 200, message: "Add Successfully" })
                        }
                    } else {
                        const updateQuantity = await PRODUCT.updateOne(
                            { inCart: { $elemMatch: { _id: mongoose.Types.ObjectId(result.value.cartId) } } },
                            { $set: { "inCart.$.quantity": result.value.quantity } }
                        );
                        if (!updateQuantity) {
                            res.send({ code: 400, err: "Something Error" })

                        } else {
                            res.send({ code: 200, message: "Add Successfully" })
                        }
                    }
                } else {
                    const removeCart = await PRODUCT.updateMany(
                        {},
                        { $pull: { inCart: { _id: mongoose.Types.ObjectId(result.value.cartId) } } },
                        { multi: true }
                    );
                    if (!removeCart) {
                        res.send({ code: 400, err: "No Data Found" })
                    } else {
                        res.send({ code: 200, message: "Cart Deleted Successfully" })
                    }
                }
            } else {
                if (result.value.productId) {
                    const findPorduct = await PRODUCT.findById(result.value.productId)
                    if (findPorduct) {
                        if (findPorduct.categoryName == "APPAREL") {
                            if (result.value.size && result.value.color) {
                                const findCart = await PRODUCT.find({
                                    _id: mongoose.Types.ObjectId(result.value.productId),
                                    inCart: {
                                        $elemMatch: {
                                            customerId: mongoose.Types.ObjectId(result.value.customerId),
                                            size: result.value.size, color: result.value.color
                                        }
                                    }

                                }, { "inCart.$": 1, })
                                // console.log(findCart)
                                if (findCart.length) {
                                    let quantity = parseInt(result.value.quantity) + parseInt(findCart[0].inCart[0].quantity)
                                    const updateQuantity = await PRODUCT.updateOne(
                                        { inCart: { $elemMatch: { _id: findCart[0].inCart[0]._id } } },
                                        { $set: { "inCart.$.quantity": quantity } }
                                    );
                                    if (!updateQuantity) {
                                        res.send({ code: 400, err: "Something Error" })

                                    } else {
                                        res.send({ code: 200, message: "Add Successfully" })
                                    }
                                } else {
                                    findPorduct.inCart.push({
                                        "customerId": result.value.customerId,
                                        "quantity": result.value.quantity,
                                        "size": result.value.size,
                                        "color": result.value.color
                                    })
                                    await findPorduct.save()
                                    res.send({ code: 200, message: "Cart Add Successfully" })
                                }
                            } else {
                                res.send({ code: 400, err: "Size And Color Required" })
                            }
                        } else {
                            if (parseInt(findPorduct.quantity) < parseInt(result.value.quantity)) {
                                res.send({ code: 200, err: "Not Available" })
                            } else {
                                // const checkCart = await PRODUCT.find({ inCart: { $elemMatch: { customerId: mongoose.Types.ObjectId(result.value.customerId), quantity: result.value.quantity, size: null } } },)
                                // if (checkCart.length) {
                                //     res.send({ code: 400, message: "already in cart" })
                                // } else {
                                findPorduct.inCart.push({
                                    "customerId": result.value.customerId,
                                    "quantity": result.value.quantity,
                                })
                                await findPorduct.save()
                                res.send({ code: 200, message: "Cart Add Successfully" })
                            }
                            // }
                        }
                    } else {
                        res.send({ code: 200, err: "Something Error" })

                    }
                } else {
                    res.send({ code: 200, err: "Product Id Is Required" })

                }
            }
            // let previousQuantity = 0
            // let quantity = findPorduct.inCart.find(s => s.customerId == result.value.customerId)
            // // console.log(quantity.quantity)
            // if (!quantity) {
            //     quantity = {};
            //     quantity.quantity = 0
            // }
            // previousQuantity = parseInt(findPorduct.quantity) + parseInt(quantity.quantity)
            // console.log(previousQuantity)

            // previousQuantity = parseInt(previousQuantity) - parseInt(result.value.quantity)
            // findPorduct.set({ quantity: previousQuantity })


        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.cartList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            roleId: Joi.string().required(),
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

        const checkCustomer = await USER.find({ _id: mongoose.Types.ObjectId(result.value.customerId), role: mongoose.Types.ObjectId(result.value.roleId) })
        if (!checkCustomer[0]) {
            res.send({ code: 400, err: "no user found" })
        } else {
            let pipeline1 = []
            pipeline1.push({
                "$match": {
                    inCart: {
                        $elemMatch: {
                            customerId: mongoose.Types.ObjectId(result.value.customerId),
                        }
                    }
                }
            })

            pipeline1.push({
                $project: {
                    productName: 1,
                    productImg: 1,
                    price: 1,
                    MRP: 1,
                    inCart: {
                        $filter: {
                            input: '$inCart',
                            as: 'inCart',
                            cond: { $eq: ['$$inCart.customerId', mongoose.Types.ObjectId(result.value.customerId)] }
                        }
                    },
                }
            })

            pipeline1.push({
                $unwind: "$inCart"
            })
            let cartList = await PRODUCT.aggregate(pipeline1)
            if (!cartList) {
                res.send({ code: 400, data: { cartList: [] } })
            } else {
                let List = []
                for (data of cartList) {
                    List.push({
                        cartDetails: {
                            customerId: data.inCart.customerId,
                            quantity: data.inCart.quantity,
                            productName: data.productName,
                            productId: data._id,
                            size: data.inCart.size,
                            color: data.inCart.color,
                            cartId: data.inCart._id,
                            productImg: data.productImg,
                            price: data.price,
                            MRP: data.MRP,
                        }

                    })
                }
                res.send({ code: 200, data: { cartList: List } })

            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.createOrder = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            shippingAddress: Joi.object().required(),
            roleId: Joi.string().required(),
            products: Joi.array().items().required(),
            totalAmount: Joi.string().required(),
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
        const checkCustomer = await USER.find({ _id: mongoose.Types.ObjectId(result.value.customerId), role: mongoose.Types.ObjectId(result.value.roleId) })
        if (!checkCustomer[0]) {
            res.send({ code: 400, err: "no user found" })
        } else {
            let number = Math.floor(100000 + Math.random() * 900000);
            let orderNo = "ORWE" + number
            let saveOrder = new ORDER({
                orderIdGenerated: orderNo,
                customerId: result.value.customerId,
                shippingAddress: result.value.shippingAddress,
                products: result.value.products,
                totalAmount: result.value.totalAmount
            })
            const orderId = await saveOrder.save()
            res.send({ code: 200, data: { _id: orderId._id, orderId: orderId.orderIdGenerated, amount: orderId.totalAmount } })

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.productReview = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            productId: Joi.string().required(),
            star: Joi.string().required(),
            comment: Joi.string().required(),
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
        const findProduct = await PRODUCT.findById(result.value.productId)
        if (!findProduct) {
            res.send({ code: 400, err: "No Data Found" })

        } else {
            findProduct.review.push({
                customerId: result.value.customerId,
                star: result.value.star,
                comment: result.value.comment
            })
            await findProduct.save()
            res.send({ code: 200, message: "Review Add Successfully" })
        }

    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.editProfile = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            firstName: Joi.string(),
            lastName: Joi.string(),
            emailId: Joi.string().email(),
            phoneNo: Joi.string().length(10).pattern(/^[0-9]+$/),
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
        const checkCustomer = await USER.findById(result.value.customerId)
        if (!checkCustomer) {
            res.send({ code: 400, err: "no data found" })

        } else {
            const updateCustomer = await USER.updateOne({ _id: mongoose.Types.ObjectId(result.value.customerId) }, {
                firstName: result.value.firstName,
                lastName: result.value.lastName,
                emailId: result.value.emailId,
                phoneNo: result.value.phoneNo
            }, { upsert: true })
            if (!updateCustomer) {
                res.send({ code: 400, err: "Something Error" })
            } else {
                res.send({ code: 200, message: "Update Successfully" })
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.addNewAddress = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            address: Joi.array().items({
                name: Joi.string(),
                address: Joi.string(),
                city: Joi.string(),
                state: Joi.string(),
                country: Joi.string(),
                zipCode: Joi.string(),
            }).required(),
            addressId: Joi.string(),
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

        const checkCustomer = await USER.findById(result.value.customerId)
        if (!checkCustomer) {
            res.send({ code: 400, err: "No Data Found" })

        } else {
            console.log(" Enry ");
            if (result.value.addressId) {

                /*const findAddress = await USER.find(
                    {"address._id": mongoose.Types.ObjectId(result.value.addressId)}, 
                    {_id: 0, address: {$elemMatch: {_id: mongoose.Types.ObjectId(result.value.addressId)}}});
*/
                const update_data = {
                    "address.$.name": result.value.address[0].name,
                    "address.$.address": result.value.address[0].address,
                    "address.$.city": result.value.address[0].city,
                    "address.$.state": result.value.address[0].state,
                    "address.$.country": result.value.address[0].country,
                    "address.$.zipCode": result.value.address[0].zipCode,

                }

                findAddress = await USER.updateOne(

                    { address: { $elemMatch: { _id: mongoose.Types.ObjectId(result.value.addressId) } } },
                    { $set: update_data }
                );

                res.send({ code: 200, message: findAddress.matchedCount == 0 ? "Addresss Not Found " : " Successfully updated" })
            } else {
                if (checkCustomer.address.length == 5) {
                    res.send({ code: 400, err: "Already Have 5 Address" })
                } else {
                    result.value.address[0]._id = new ObjectID()
                    checkCustomer.address = checkCustomer.address.concat(result.value.address)
                    const addressDetails = await checkCustomer.save()
                    res.send({ code: 200, message: "Add Successfully", data: { _id: result.value.address[0]._id } })
                }
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}
exports.addressList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
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
        const checkCustomer = await USER.findById(result.value.customerId).sort({ "address.updateAt": -1 })
        if (!checkCustomer) {
            res.send({ code: 400, err: "No Data Found" })
        } else {
            res.send({ code: 200, data: { addressList: checkCustomer.address } })

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.delete_address = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            addressId: Joi.string().required(),
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

        const deleteAddress = await USER.updateMany(
            {},
            { $pull: { address: { _id: mongoose.Types.ObjectId(result.value.addressId) } } },
            { multi: true }
        );
        if (!deleteAddress) {
            res.send({ code: 400, err: "No Data Found" })
        } else {
            res.send({ code: 200, data: "Address Deleted Successfully" })
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}



exports.orderList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
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
        const orderList = await ORDER.find({ customerId: mongoose.Types.ObjectId(result.value.customerId), paymentSatus: { $ne: 'pending' } }).sort({ updatedAt: -1 }).populate("products.productId", { productName: 1, productImg: 1, price: 1, MRP: 1 })
        if (orderList.length) {
            res.send({ code: 200, data: orderList })

        } else {
            res.send({ code: 400, data: [] })
        }

    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.checkPincodePickk = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            toPincode: Joi.string().required(),
            productId: Joi.string().required(),
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
        var url =
            "https://pickrr.com/api/check-pincode-service/?" +
            "auth_token=" +
            "c91dd1ad7a776d6698b17619788be8a1209735" +
            "&from_pincode=" +
            "411014" +
            "&to_pincode=" +
            result.value.toPincode
        console.log(url)
        var options = {
            method: "GET",
            url: url,
        };
        request(options, async (error, response, body) => {
            if (error) {
                console.log(error);
            } else {
                let jsonData = JSON.parse(body)
                if (jsonData.err) {
                    res.send({ status: 400, err: jsonData.err });
                } else {
                    if (jsonData.courier_list.length) {
                        if (jsonData.courier_list[0].pincode__region__city__state__name == 'MAHARASHTRA') {
                            res.send({ status: 200, data: { deliveryDate: jsonData.courier_list[0].edd_stamp, rate: 40 } });

                        } else {
                            res.send({ status: 200, data: { deliveryDate: jsonData.courier_list[0].edd_stamp, rate: 65 } });

                        }
                        // const charges = await deliveryCharges(result.value.productId, result.value.toPincode)
                        // if (charges.status === 400) {
                        //     res.send({ status: 400, err: "something err" });

                        // } else {
                        // res.send({ status: 200, data: { deliveryDate: jsonData.courier_list[0].edd_stamp, rate: charges.rate } });
                        // res.send({ status: 200, data: { deliveryDate: jsonData.courier_list[0], } });
                        // }
                    }
                }
            }
        });
    } catch (err) {
        res.send({ status: 400, err: err.message });

    }
};

function deliveryCharges(productId, toPincode) {
    return new Promise(async (resolve, reject) => {
        const findProduct = await PRODUCT.findById(productId)
        if (!findProduct) {
            resolve({
                status: 400
            })
        } else {
            var url =
                "https://pickrr.com/api-v2/client/fetch-price-calculator-generic/?" +
                "auth_token=" +
                "c91dd1ad7a776d6698b17619788be8a1209735" +
                "&shipment_type=forward" +
                "&pickup_pincode=" +
                "560041" +
                "&drop_pincode=" +
                toPincode +
                "&delivery_mode=express" +
                "&length=" +
                findProduct.productDetails[0].length +
                "&breadth=" +
                findProduct.productDetails[1].breadth +
                "&height=" +
                findProduct.productDetails[2].height
                + "&weight=" +
                1 +
                "&payment_mode=prepaid"

            console.log(url)
            var options = {
                method: "GET",
                url: url,
            };
            request(options, async (error, response, body) => {
                if (error) {
                    resolve({
                        status: 400
                    })
                } else {
                    let jsonData = JSON.parse(body)
                    if (jsonData.rate_list.length) {
                        resolve({
                            status: 200,
                            rate: jsonData.rate_list[0].delivered_charges
                        })
                    }

                }

            });
        }
    })
}


exports.trackOrder = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            tracking_id: Joi.string().required()
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
        var url =
            "https://async.pickrr.com/track/tracking/?" +
            "tracking_id=" +
            result.value.tracking_id +
            "&auth_token=" +
            "c91dd1ad7a776d6698b17619788be8a1209735"
        console.log(url)
        var options = {
            method: "GET",
            url: url,
        };
        request(options, async (error, response, body) => {
            if (error) {
                console.log(error);
            } else {
                let jsonData = JSON.parse(body)
                res.send({ code: 200, data: jsonData })
            }
        });
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}


exports.count = async (req, res) => {
    try {
        let validation = Joi.object().keys({
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
        let matchquery = { _id: mongoose.Types.ObjectId(result.value.customerId) };
        let pipeline = []
        pipeline.push({ $match: matchquery });
        pipeline.push({
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "inCart.customerId",
                as: "cartData",
            },
        });
        pipeline.push({
            $unwind: "$cartData"
        })
        pipeline.push({
            $unwind: "$cartData.inCart"
        })
        pipeline.push({
            $group: {
                _id: null, count: { $sum: 1 },
            }
        })
        const cartCount = await USER.aggregate(pipeline)
        if (!cartCount) {
            res.send({ code: 400, data: { cartCount: [] } })

        } else {
            res.send({ code: 200, data: cartCount })

        }
    } catch (err) {

    }
}


exports.profileUpload = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            customerId: Joi.string().required(),
            base64: Joi.string().required(),
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
        const findCustomer = await USER.findById(result.value.customerId)
        if (!findCustomer) {
            res.send({ code: 400, err: "No Customer Found" })
        } else {
            let url = await awsUploadHelper.uploadImage(result.value.base64, result.value.customerId)
            if (url.success) {
                await USER.findByIdAndUpdate(result.value.customerId, { $set: { profileImg: url.url } }, { new: true })
                res.send({ code: 200, message: "Uploaded Successfully", data: url.url })
            } else {
                res.send({ code: 400, err: "Something Wrong" })

            }
        }
    } catch (err) {
        res.send({
            code: 400, err: err.message
        })
    }
}