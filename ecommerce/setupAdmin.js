require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/users");

const setupAdmin = async () => {
  try {
    const mongoUri = "mongodb+srv://vip:mm1234@vip.157qzfp.mongodb.net/?appName=vip";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: "ouscollection@admin.com" });
    
    if (existingAdmin) {
      console.log("Admin user already exists");
      // Update password if needed
      existingAdmin.password = "ouscollection2026.";
      await existingAdmin.setPassword("ouscollection2026.");
      await existingAdmin.save();
      console.log("Admin password updated successfully");
    } else {
      // Create new admin user
      const adminUser = new User({
        email: "ouscollection@admin.com",
        name: "Admin",
        isAdmin: true
      });
      
      // Set password using passport-local-mongoose
      await adminUser.setPassword("ouscollection2026.");
      await adminUser.save();
      console.log("Admin user created successfully");
      console.log("Email: ouscollection@admin.com");
      console.log("Password: ouscollection2026.");
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error setting up admin:", error);
    process.exit(1);
  }
};

setupAdmin();
