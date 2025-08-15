const mongoose = require("mongoose");

module.exports.connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Database Connection Established");
  } catch (error) {
    console.log("Database Connection Failed !");
  }
};
