const { ObjectId } = require("mongodb");
var mongoose = require("mongoose");
mongoose.set('debug', true);

var UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  emailId: { type: String, unique: true, index: true },
  phoneNo: String,
  password: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: "role", index: true },
  address: [{ _id: false, _id: ObjectId, name: String, address: String, city: String, state: String, country: String, zipCode: String, defaultAddress: { type: Boolean, default: false }, updateAt: { type: Date, default: new Date() } }],
  profileImg: String,
  userUniqueId: { type: String, index: true },
  otherMedia: [{ url: String, docsName: String, docsNo: String }],
  active: { type: Boolean, default: true },
  wishlist: [{ productId: { type: mongoose.Schema.Types.ObjectId, ref: "product", }, like: Boolean },],
}, {
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model("user", UserSchema);
