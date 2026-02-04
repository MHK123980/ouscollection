const mongoose = require("mongoose");
const Category = require("./models/category");
const dbConfig = require("./config/dbConfig");

// Connect to database
mongoose.connect(dbConfig.mongoURL);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async function() {
  console.log("Connected to MongoDB");
  
  try {
    // Check if parent categories already exist
    const existingMens = await Category.findOne({ categoryName: "Mens" });
    const existingWomens = await Category.findOne({ categoryName: "Womens" });
    
    if (!existingMens) {
      const mensCategory = new Category({
        categoryName: "Mens",
        isParent: true,
        parentCategory: null
      });
      await mensCategory.save();
      console.log("✓ Created 'Mens' parent category");
    } else {
      console.log("✓ 'Mens' category already exists");
      // Ensure it's marked as parent
      if (!existingMens.isParent) {
        existingMens.isParent = true;
        existingMens.parentCategory = null;
        await existingMens.save();
        console.log("✓ Updated 'Mens' to parent category");
      }
    }
    
    if (!existingWomens) {
      const womensCategory = new Category({
        categoryName: "Womens",
        isParent: true,
        parentCategory: null
      });
      await womensCategory.save();
      console.log("✓ Created 'Womens' parent category");
    } else {
      console.log("✓ 'Womens' category already exists");
      // Ensure it's marked as parent
      if (!existingWomens.isParent) {
        existingWomens.isParent = true;
        existingWomens.parentCategory = null;
        await existingWomens.save();
        console.log("✓ Updated 'Womens' to parent category");
      }
    }
    
    console.log("\nCategory setup completed successfully!");
    console.log("\nYou can now:");
    console.log("• Add subcategories under 'Mens' or 'Womens' in the admin panel");
    console.log("• Select parent category when creating new subcategories");
    console.log("• View category hierarchy in the category management table");
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error setting up categories:", error.message);
    mongoose.connection.close();
    process.exit(1);
  }
});
