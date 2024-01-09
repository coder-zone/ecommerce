var mongoose = require("mongoose");
var ProductSchema = new mongoose.Schema({
  // categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "category" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user",index: true },
  productCategory: String,
  productCategoryType: String,
  productMenu: String,
  SKU: String,
  categoryName: String,
  HSN: String,
  productName: String,
  productDesc: String,
  productSpecification: String,
  funFacts: String,
  returnReplace: String,
  manufactureDetails: {},
  ownerName: String,
  productGenderType: String,
  ownerUniqueId: {type:String,index: true},
  productDetails: [],
  quantity: String,
  color: [],
  size: [],
  price: String,
  MRP: String,
  gst: String,
  itemWeight: String,
  inCart: [{ customerId: { type: mongoose.Schema.Types.ObjectId, ref: "user", }, quantity: String, color: String, size: String },],
  productImg: [],
  isAvailable: { type: Boolean, default: true },
  bestSellers: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  path: String,
  approved: { type: String, default: "pending" },
  review: [{ customerId: { type: mongoose.Schema.Types.ObjectId, ref: "user", }, star: String, comment: String, createAt: { type: Date, default: new Date() } }]

}, {
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model("product", ProductSchema);
