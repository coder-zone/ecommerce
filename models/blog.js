const { boolean } = require("joi");
var mongoose = require("mongoose");
var BlogSchema = new mongoose.Schema({
  blogName: String,
  blogDesc: String,
  blogImg: String
}, {
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model("blog", BlogSchema);
