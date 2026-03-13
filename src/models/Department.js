const mongoose = require("mongoose");
const createLookupModel = require("./helpers/buildLookupModel");

module.exports = createLookupModel("Department", {
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty"
  }
});
