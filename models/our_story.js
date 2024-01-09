var mongoose = require("mongoose");
var OurStorySchema = new mongoose.Schema({
  img: String,
  name: String,
  ownerUniqueId: { type: String, index: true },
  storyDesc: String




}, {
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model("ourstory", OurStorySchema);
