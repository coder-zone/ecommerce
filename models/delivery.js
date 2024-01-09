const { boolean } = require("joi");
var mongoose = require("mongoose");
var DeliverySchema = new mongoose.Schema({
  order_Id: { type: mongoose.Schema.Types.ObjectId, ref: "order",index: true },
  // servicePincode: {},
  dispatchDetails: {}
}, {
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model("delivery", DeliverySchema);
