require("dotenv").config();

const mongoose = require("mongoose");

mongoose.connect(
  `${process.env.MONGO_DB}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("Connected to MongoDB");
  }
);
