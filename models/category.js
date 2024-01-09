const { boolean } = require("joi");
var mongoose = require("mongoose");
var CategorySchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  categoryName: String,
  parentName: String,
  childName: String,
  path: String,
  active: { type: Boolean, default: true },
}, {
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model("category", CategorySchema);
