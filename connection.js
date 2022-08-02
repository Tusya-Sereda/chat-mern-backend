require("dotenv").config();

const mongoose = require("mongoose");

mongoose.connect(`${process.env.MONGO_DB}`, () => {
  console.log("Connected to MongoDB");
});
