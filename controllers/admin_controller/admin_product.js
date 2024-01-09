const mongoose = require("mongoose");
const Joi = require("joi");
const md5 = require('md5');
const awsUpload = require("../../helpers/aws-upload");
var awsUploadHelper = new awsUpload();
const aws = require("aws-sdk");
require('dotenv').config();

aws.config.update({
    secretAccessKey: process.env.secretAccessKey,
    accessKeyId: process.env.accessKeyId
    //   region: 'Asia Pacific(Mumbai)'
});
require("../../models/user_model");
require("../../models/role");
require("../../models/product");
require("../../models/category");
require("../../models/order");
require("../../models/banner");
require("../../models/blog");

const { uploadS3 } = require('../../helpers/multer-upload');


var BLOG = mongoose.model("blog");

var USER = mongoose.model("user");
var ROLE = mongoose.model("role");
var CATEGORY = mongoose.model("category");
var PRODUCT = mongoose.model("product");
var ORDER = mongoose.model("order");
var BANNER = mongoose.model("banner");


exports.addproduct = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            SKU: Joi.string().uppercase().required(),
            userId: Joi.string().required(),
            HSN: Joi.string().uppercase().required(),
            productDetails: Joi.array().items(),
            productName: Joi.string().required(),
            productDesc: Joi.string().required(),
            funFacts: Joi.string().allow('', null),
            returnReplace: Joi.string().allow('', null),
            productSpecification: Joi.string().required(),
            // ownerUniqueId: Joi.string().required(),
            price: Joi.string().required(),
            MRP: Joi.string().required(),
            gst: Joi.string().required(),
            categoryName: Joi.string().uppercase().required(),
            quantity: Joi.string().required(),
            // color: Joi.array().items(),
            // size: Joi.array().items(),
            // productGenderType: Joi.string(),
            bestSellers: Joi.boolean().required(),
            featured: Joi.boolean().required(),
            // ownerName: Joi.string().required(),
            itemWeight: Joi.string().required(),
            isAvailable: Joi.boolean().required(),
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
        const checkAdmin = await USER.findById(result.value.userId)
        if (!checkAdmin) {
            res.send({ code: 400, err: "User Id Not Available" })
        } else {
            const checkSKU = await PRODUCT.findOne({ SKU: result.value.SKU })
            if (checkSKU) {
                res.send({ code: 400, err: "SKU Already Taken" })
            } else {
                let productAdd = new PRODUCT({
                    SKU: result.value.SKU,
                    HSN: result.value.HSN,
                    // categoryId: result.value.categoryId,
                    MRP: result.value.MRP,
                    gst: result.value.gst + "%",
                    price: result.value.price,
                    quantity: result.value.quantity,
                    // color: result.value.color,
                    userId: result.value.userId,
                    // size: result.value.size,
                    productName: result.value.productName,
                    itemWeight: result.value.itemWeight,
                    funFacts: result.value.funFacts,
                    returnReplace: result.value.returnReplace,
                    productSpecification: result.value.productSpecification,
                    productDesc: result.value.productDesc,
                    // productGenderType: result.value.productGenderType,
                    // ownerUniqueId: result.value.ownerUniqueId,
                    bestSellers: result.value.bestSellers,
                    featured: result.value.bestSellers,
                    categoryName: result.value.categoryName,
                    productDetails: result.value.productDetails,
                    // ownerName: result.value.ownerName,
                    isAvailable: result.value.isAvailable

                })
                const productData = await productAdd.save();
                res.send({ code: 200, message: "Product Add Successfully Please Upload Images", data: { productId: productData._id } })
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }


}




exports.addEditCategory = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            adminId: Joi.string().required(),
            categoryName: Joi.string().required(),
            parentName: Joi.string(),
            childName: Joi.string(),
            active: Joi.boolean(),
            categoryId: Joi.string(),
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
        const checkAdmin = await USER.findById(result.value.adminId)
        if (!checkAdmin) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            if (result.value.categoryId) {
                // const findCategory = await CATEGORY.findById(result.value.categoryId)
                // if (!findCategory) {
                //     res.send({ code: 400, err: "error" })
                // } else {
                //     let data = {
                //         categoryName: result.value.categoryName,
                //         active: result.value.active
                //     }
                //     findCategory.set(data);
                //     await findCategory.save();
                res.send({ code: 200, message: "Going On" })
                // }

            } else {
                let path = ""
                if (result.value.parentName && result.value.childName) {
                    path = result.value.categoryName + '/' + result.value.parentName + '/' + result.value.childName
                } else if (result.value.parentName) {
                    path = result.value.categoryName + '/' + result.value.parentName
                } else {
                    path = result.value.categoryName
                }
                let categorytAdd = new CATEGORY({
                    categoryName: result.value.categoryName,
                    adminId: result.value.adminId,
                    parentName: result.value.parentName,
                    childName: result.value.childName,
                    path: path
                })
                await categorytAdd.save();
                res.send({ code: 200, message: "Category Add Successfully" })
            }

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.listCategory = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            adminId: Joi.string().required(),
            role: Joi.string().uppercase().required(),
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
        const findAdmin = await USER.find({ _id: mongoose.Types.ObjectId(result.value.adminId), role: result.value.role })
        if (!findAdmin[0]) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            const list = await CATEGORY.find({ active: true }, { _id: 1, categoryName: 1, active: 1, updatedAt: 1 })
            res.send({ code: 200, data: list })
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.createRole = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            roleName: Joi.string().uppercase(),
            // adminId: Joi.string().required(),
            module: Joi.array().items({ moduleName: Joi.string(), view: Joi.boolean(), update: Joi.boolean(), delete: Joi.boolean() }),
            active: Joi.boolean(),
            roleId: Joi.string(),
            onEdit: Joi.boolean(),
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
        // const findAdmin = await USER.findById(result.value.adminId).populate("role", { roleName: 1 })
        // if (!findAdmin) {
        //     res.send({ code: 400, err: "Not Authorized" })

        // } else {
        // if (findAdmin.role.roleName == 'ADMIN') {
        if (result.value.roleId) {
            const findRole = await ROLE.findById(result.value.roleId)
            if (!findRole) {
                res.send({ code: 400, err: "Something Error" })

            } else {
                if (!result.value.onEdit) {
                    res.send({ code: 200, data: { roleId: findRole._id, module: findRole.module, active: findRole.active, roleName: findRole.roleName } })
                } else {
                    delete findRole.roleName
                    delete findRole.module
                    delete findRole.active
                    for (let i = 0; i < result.value.module.length; i++) {
                        if (result.value.module[i].update == true || result.value.module[i].delete == true) {
                            result.value.module[i].view = true
                        }
                    }
                    findRole.set({
                        roleName: result.value.roleName,
                        module: result.value.module,
                        active: result.value.active
                    })
                    await findRole.save()
                    res.send({ code: 200, message: "Edited Successfully" })
                }
            }

        } else {
            const findRole = await ROLE.find({ roleName: result.value.roleName })
            if (findRole[0]) {
                res.send({ code: 400, err: "Role Is Already Exixts" })
            } else {
                for (let i = 0; i < result.value.module.length; i++) {
                    if (result.value.module[i].update == true || result.value.module[i].delete == true) {
                        result.value.module[i].view = true
                    }
                }
                let saveRole = new ROLE({
                    roleName: result.value.roleName,
                    module: result.value.module,
                    active: result.value.active,

                })
                await saveRole.save()
                res.send({ code: 200, message: "Created Successfull" })

            }
        }
        // } else {
        //     res.send({ code: 400, err: "Not Authorized" })

        // }
        // }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.getRole = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            adminId: Joi.string().required(),
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
        const findAdmin = await USER.findById(result.value.adminId).populate("role", { roleName: 1 })
        if (!findAdmin) {
            res.send({ code: 400, err: "Not Authorized" })

        } else {
            if (findAdmin.role.roleName == 'ADMIN') {
                const getAllRole = await ROLE.find({ roleName: { $nin: ["ADMIN", "CUSTOMER"] } }, { roleName: 1, active: 1 })
                if (!getAllRole) {
                    res.send({ code: 400, err: "Something Error" })

                } else {
                    res.send({ code: 200, data: getAllRole })
                }
            } else {
                res.send({ code: 400, err: "Not Authorized" })

            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}
exports.addProductImg = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            base64: Joi.array().items().required(),
            productId: Joi.string().required(),
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

        if (result.value.base64.length) {
            const findUser = await USER.findById(result.value.userId)
            if (!findUser) {
                res.send({ code: 400, err: "Not Authorized" })
            } else {
                var url = []
                for (let i = 0; i < result.value.base64.length; i++) {
                    if (result.value.base64[i].isBase64) {
                        var imgData = result.value.base64[i].img;
                        // condition starts here
                        const s3 = new aws.S3();

                        var base64data = imgData.split(",");
                        // let type = extname(imgData);
                        const type = imgData.split(";")[0].split("/")[1];

                        buf = Buffer.from(
                            result.value.base64[i].img.replace(/^data:image\/\w+;base64,/, ""),
                            "base64"
                        );
                        var data = {
                            Bucket: "udhyogini-media",
                            Key:
                                "assets/product/Image/" +
                                result.value.productId +
                                "/" +
                                Date.now() +
                                "." +
                                type,
                            ACL: "public-read",
                            Body: buf,
                            ContentEncoding: "base64",
                            ContentType: `image/${type}`,
                        };
                        try {
                            await s3.putObject(data).promise();
                            url.push(process.env.accessUrl + data.Key)

                        } catch (error) {
                            console.log(error);
                        }
                    } else {
                        url.push(result.value.base64[i].img)
                    }
                }
                await PRODUCT.findByIdAndUpdate(result.value.productId, { $set: { productImg: url } }, { new: true, upsert: true })
                res.send({
                    code: 200,
                    message: "Uploaded Successfully"
                })
            }
        } else {
            res.send({ code: 400, err: "Image Required" })

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
};


exports.getUserList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            adminId: Joi.string().required(),
            role: Joi.string().uppercase().required(),
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
        const matchRole = await ROLE.find({ roleName: result.value.role })
        if (!matchRole[0]) {
            res.send({ code: 400, err: "No Role Found" })
        } else {
            if (matchRole[0].roleName == 'ADMIN') {
                const findAdmin = await USER.find({ _id: mongoose.Types.ObjectId(result.value.adminId), role: mongoose.Types.ObjectId(matchRole[0]._id) })
                if (!findAdmin[0]) {
                    res.send({ code: 400, err: "No User Found" })
                } else {
                    // var pagelength = 10
                    // let skip = (1 - 1) * pagelength;
                    let pipeline = []
                    let matchquery = { roleName: { $nin: ["ADMIN", "CUSTOMER"] } }
                    pipeline.push({
                        $match: matchquery
                    })
                    pipeline.push({
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "role",
                            as: "roleData",
                        },
                    });
                    pipeline.push({
                        $unwind: "$roleData"
                    })
                    pipeline.push({
                        $sort: {
                            "roleData.updatedAt": -1
                        },
                    })
                    pipeline.push({
                        $project: {
                            _id: 0,
                            userDetails: {
                                _id: "$roleData._id",
                                firstName: "$roleData.firstName",
                                lastName: "$roleData.lastName",
                                active: "$roleData.active",
                                roleId: "$roleData.role",
                                roleName: "$roleName",
                                userUniqueId: "$roleData.userUniqueId"
                            },

                        }
                    })

                    // pipeline.push({
                    //     $facet: {
                    //         // userList: [{ $skip: skip }, { $limit: pagelength }],
                    //         totalCount: [
                    //             {
                    //                 $count: 'totalCount'
                    //             }
                    //         ]
                    //     }
                    // })
                    const findUserList = await ROLE.aggregate(pipeline)
                    if (findUserList) {
                        // let count = findUserList[0].totalCount[0].totalCount;
                        // count = Math.ceil(parseInt(count / pagelength));
                        res.send({ code: 200, data: { details: findUserList } })
                    } else {
                        res.send({ code: 200, data: [] })
                    }
                }
            } else {
                res.send({ code: 400, err: "Not Authroized" })
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.getUser = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            adminId: Joi.string().required(),
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
        const findAdmin = await USER.find({ _id: mongoose.Types.ObjectId(result.value.adminId) })
        if (!findAdmin[0]) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            const findUser = await USER.findById(result.value.userId).populate("role", { roleName: 1 })
            if (!findUser) {
                res.send({ code: 400, err: "No Data Found" })

            } else {
                res.send({ code: 200, data: { userId: findUser._id, firstName: findUser.firstName, lastName: findUser.lastName, gender: findUser.gender, active: findUser.active, role: findUser.role, phoneNo: findUser.phoneNo, emailId: findUser.emailId } })

            }

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}
exports.productApprovalList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            adminId: Joi.string().required(),
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
        const findAdmin = await USER.find({ _id: mongoose.Types.ObjectId(result.value.adminId) })
        if (!findAdmin[0]) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            var pagelength = 10
            let skip = (1 - 1) * pagelength;
            let pipeline = []
            pipeline.push({
                $group: {
                    _id: { ownerUniqueId: "$ownerUniqueId", ownerName: "$ownerName" }, totalProduct: { $sum: 1 }, totalApproval: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$approved", "yes"] },
                                then: 1, else: 0
                            }
                        },
                    },

                }

            })
            pipeline.push({
                $project: {
                    _id: 0,
                    ownerUniqueId: "$_id.ownerUniqueId",
                    ownerName: "$_id.ownerName",
                    totalProduct: "$totalProduct",
                    totalApproval: "$totalApproval"

                }
            })

            pipeline.push({
                $sort: {
                    "updatedAt": -1
                },
            })
            pipeline.push({
                $facet: {
                    approvedList: [{ $skip: skip }, { $limit: pagelength }],
                    totalCount: [
                        {
                            $count: 'totalCount'
                        }
                    ]
                }
            })
            const productApprovalList = await PRODUCT.aggregate(pipeline)
            if (productApprovalList) {
                let count = productApprovalList[0].totalCount[0] ? productApprovalList[0].totalCount[0].totalCount : 0;
                count = Math.ceil(parseInt(count / pagelength));
                res.send({ code: 200, data: { productApprovalList: productApprovalList[0].approvedList, count: count } })
            } else {
                res.send({ code: 200, data: [] })
            }

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}


exports.userProductApproval = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            adminId: Joi.string().required(),
            ownerUniqueId: Joi.string().required(),
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
        const findAdmin = await USER.find({ _id: mongoose.Types.ObjectId(result.value.adminId) })
        if (!findAdmin[0]) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            const productList = await PRODUCT.find({ ownerUniqueId: result.value.ownerUniqueId }, { _id: 1, ownerUniqueId: 1, approved: 1, productName: 1, categoryName: 1 })
            res.send({ code: 200, data: productList })

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.productApprovalAdmin = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
            productId: Joi.string().required(),
            approved: Joi.string().required(),

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
            res.send({ code: 400, err: "No Data Found" })

        } else {
            const findProductAndUpdate = await PRODUCT.findByIdAndUpdate(result.value.productId, { $set: { approved: result.value.approved } }, { new: true })
            if (!findProductAndUpdate) {
                res.send({ code: 400, err: "No Data Found" })

            } else {
                res.send({ code: 200, message: "Update Successfull" })
            }
        }

    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}


exports.searchOwnerId = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            searchString: Joi.string().required(),

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
        const findOwnerId = await USER.find({ userUniqueId: { "$regex": result.value.searchString, "$options": "i" }, userUniqueId: { $ne: 'WC10000', $exists: true }, active: true }, { _id: 0, firstName: 1, lastName: 1, userUniqueId: 1 })
        if (!findOwnerId[0]) {
            res.send({ code: 400, err: "No Data Found" })

        } else {
            res.send({ code: 200, data: findOwnerId })

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.productsList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
            isFranchise: Joi.boolean(),
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
            if (result.value.isFranchise) {
                const products = await PRODUCT.find({ ownerUniqueId: findUser.userUniqueId }, { productName: 1, ownerUniqueId: 1, productDesc: 1, quantity: 1, isAvailable: 1, categoryName: 1, approved: 1 }).sort({ "updatedAt": -1 })
                if (!products) {
                    res.send({ code: 400, err: "No Data Found" })

                } else {
                    res.send({ code: 200, data: { products: products } })

                }
            } else {
                const products = await PRODUCT.find({}, { productName: 1, ownerUniqueId: 1, productDesc: 1, quantity: 1, isAvailable: 1, categoryName: 1, approved: 1 }).sort({ "updatedAt": -1 })
                if (!products) {
                    res.send({ code: 400, err: "No Data Found" })

                } else {
                    res.send({ code: 200, data: { products: products } })

                }
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}

exports.getEditProduct = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
            productId: Joi.string().required(),
            onEdit: Joi.boolean(),
            SKU: Joi.string().uppercase(),
            HSN: Joi.string().uppercase(),
            productDetails: Joi.array(),
            productName: Joi.string(),
            productDesc: Joi.string(),
            funFacts: Joi.string().allow(null, ''),
            returnReplace: Joi.string().allow(null, ''),
            productSpecification: Joi.string(),
            ownerUniqueId: Joi.string(),
            price: Joi.string(),
            MRP: Joi.string(),
            gst: Joi.string(),
            categoryName: Joi.string().uppercase(),
            quantity: Joi.string(),
            color: Joi.array().items(),
            size: Joi.array().items(),
            productGenderType: Joi.string(),
            bestSellers: Joi.boolean(),
            featured: Joi.boolean(),
            ownerName: Joi.string(),
            itemWeight: Joi.string(),
            isAvailable: Joi.boolean(),
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
            if (result.value.onEdit) {
                await PRODUCT.findByIdAndUpdate(result.value.productId, result.value, { new: true })
                res.send({ code: 200, message: "Update Successfully" })
            } else {
                const productDetails = await PRODUCT.findById(result.value.productId, { inCart: 0 }).sort({ "updatedAt": -1 })
                if (!productDetails) {
                    res.send({ code: 400, err: "No Data Found" })

                } else {
                    res.send({ code: 200, data: { productDetails: productDetails } })

                }
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}



exports.getOrderList = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
            fromDate: Joi.string(),
            toDate: Joi.string(),
            status: Joi.string().lowercase(),
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
                if (result.value.fromDate && result.value.toDate) {
                    pipeline.push({
                        $addFields: {
                            onlyDate: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$updatedAt'
                                }
                            }
                        }
                    })
                    if (result.value.status == 'all') {
                        pipeline.push({
                            $match: { onlyDate: { $gte: result.value.fromDate, $lte: result.value.toDate } }
                        })
                    } else {
                        pipeline.push({
                            $match: { onlyDate: { $gte: result.value.fromDate, $lte: result.value.toDate }, paymentSatus: result.value.status }
                        })
                    }
                    pipeline.push({
                        "$unwind": "$products"

                    })
                }
                pipeline.push({
                    $match: { orderStatus: { $ne: null } }
                })
                pipeline.push({
                    $sort: { updatedAt: -1 }
                })
                const prodyct = await ORDER.aggregate(pipeline)
                let orders = await ORDER.populate(prodyct, { path: 'products.productId customerId', select: { categoryName: 1, quantity: 1, productName: 1, SKU: 1, HSN: 1, price: 1, MRP: 1, firstName: 1, lastName: 1, phoneNo: 1, emailId: 1 } });
                if (!orders) {
                    res.send({ code: 400, data: { orders: [] } })

                } else {
                    res.send({ code: 200, data: { orders: orders } })

                }
            } else {
                let pipeline = []
                if (result.value.fromDate && result.value.toDate) {
                    pipeline.push({
                        $addFields: {
                            onlyDate: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$updatedAt'
                                }
                            }
                        }
                    })
                    if (result.value.status == 'all') {
                        pipeline.push({
                            $match: { onlyDate: { $gte: result.value.fromDate, $lte: result.value.toDate } }
                        })
                    } else {
                        pipeline.push({
                            $match: { onlyDate: { $gte: result.value.fromDate, $lte: result.value.toDate }, paymentSatus: result.value.status }
                        })
                    }
                }
                pipeline.push({
                    $match: { orderStatus: { $ne: null } }
                })
                pipeline.push({
                    "$unwind": "$products"

                })
                pipeline.push({
                    $sort: { updatedAt: -1 }
                })
                const productList = await ORDER.aggregate(pipeline)
                let orders = await ORDER.populate(productList, { path: 'products.productId customerId', match: { ownerUniqueId: findUser.userUniqueId }, select: { categoryName: 1, quantity: 1, productName: 1, SKU: 1, firstName: 1, HSN: 1, price: 1, MRP: 1 } });
                orders = orders.filter((s) => s.products.productId)
                if (!orders) {
                    res.send({ code: 400, data: { orders: [] } })
                } else {
                    res.send({ code: 200, data: { orders: orders } })
                }
            }

        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
}


exports.editBlog = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            blogId: Joi.string().required(),
            blogName: Joi.string(),
            blogDesc: Joi.string(),
            img: Joi.object(),
            onEdit: Joi.boolean().required(),


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
        if (!result.value.onEdit) {
            const findBlog = await BLOG.findById(result.value.blogId)
            if (findBlog) {
                res.send({ code: 200, data: { blog: findBlog } })
            } else {
                res.send({ code: 400, err: "No Data Found" })
            }
        } else {
            if (result.value.img.edit) {
                let url = await awsUploadHelper.uploadblog(result.value.img.url)
                if (url.success) {
                    // let saveBlog = new BLOG({
                    //     blogName: result.value.blogName,
                    //     blogDesc: result.value.blogDesc,
                    //     blogImg: url.url
                    // })
                    await BLOG.findByIdAndUpdate(result.value.blogId, {
                        $set: {
                            blogName: result.value.blogName, blogDesc: result.value.blogDesc
                            , blogImg: url.url
                        }
                    })
                    res.send({ code: 200, message: "Updated Successfully" })
                } else {
                    res.send({ code: 400, err: "Something Wrong" })
                }
            } else {
                await BLOG.findByIdAndUpdate(result.value.blogId, { $set: { blogName: result.value.blogName, blogDesc: result.value.blogDesc } })
                res.send({ code: 200, message: "Updated Successfully" })
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.getOrderData = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
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
        const findUser = await USER.findById(result.value.userId).populate("role", { roleName: 1 })
        if (!findUser) {
            res.send({ code: 400, err: "No User Found" })
        } else {
            if (findUser.role.roleName != 'FRANCHISE' && findUser.role.roleName != 'CUSTOMER') {
                const findOrder = await ORDER.findById(result.value.orderId)
                    .populate({
                        path: 'customerId products.productId', select: { tracking_id: 1, categoryName: 1, productName: 1, SKU: 1, HSN: 1, price: 1, MRP: 1, firstName: 1, lastName: 1, phoneNo: 1, emailId: 1, _id: 0, orderStatus: 1 }
                    })
                res.send({ code: 200, data: findOrder })
            } else {
                res.send({ code: 400, err: "Not Authorized" })
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })
    }
}

exports.addDeleteBanner = async (req, res) => {
    try {
        let validation = Joi.object().keys({
            userId: Joi.string().required(),
            base64: Joi.string(),
            bannerId: Joi.string(),
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
            if (result.value.bannerId) {
                await BANNER.deleteOne({ _id: mongoose.Types.ObjectId(result.value.bannerId) })
                res.send({ code: 200, message: "Banner Delete Successfully" })
            } else {

                let url = await awsUploadHelper.uploadblog(result.value.base64)
                if (url.success) {
                    let saveBanner = new BANNER({
                        bannerImg: url.url
                    })
                    await saveBanner.save()
                    res.send({ code: 200, message: "Banner Add Successfully" })
                } else {
                    res.send({ code: 400, err: "Something Wrong" })
                }
            }
        }
    } catch (err) {
        res.send({ code: 400, err: err.message })

    }
};
