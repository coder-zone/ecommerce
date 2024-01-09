var mongoose = require("mongoose");
var RoleSchema = new mongoose.Schema({
    roleName: String,
    module: [{ _id: false, moduleName: String, view: { type: Boolean, default: false }, update: { type: Boolean, default: false }, delete: { type: Boolean, default: false } }],
    active: { type: Boolean, default: true }
}, {
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model("role", RoleSchema);
