const { boolean } = require("joi");
var mongoose = require("mongoose");
var OrderSchema = new mongoose.Schema({
  orderIdGenerated: {type:String,index: true},
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "user",index: true },
  shippingAddress: { name: String, address: String, state: String, country: String, zipCode: String, city: String, phoneNo: String },
  products: [{ productId: { type: mongoose.Schema.Types.ObjectId, ref: "product",index: true }, quantity: String },],
  totalAmount: String,
  paymentDetails: {},
  orderGenerate: {},
  tracking_id: String,
  orderStatus: { type: String, default: "pending" },
  paymentSatus: { type: String, default: "pending" },
  deliveryDate:Date
}, {
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model("order", OrderSchema);
