const { boolean } = require("joi");
var mongoose = require("mongoose");
var BannerSchema = new mongoose.Schema({
  bannerImg: String,
  redirecturl: String

}, {
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model("banner", BannerSchema);
