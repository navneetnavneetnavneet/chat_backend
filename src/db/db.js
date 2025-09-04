const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_ATLAS_URI);
    console.log("Database Connection Established");
  } catch (error) {
    console.log(error);
    
    console.log("Database Connection Failed !");
  }
};

module.exports = connectDatabase;
