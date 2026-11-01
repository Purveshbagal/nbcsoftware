import mongoose from "mongoose";

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/your-database";

// MasterItem Schema
const masterItemSchema = new mongoose.Schema({
  type: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  value: mongoose.Schema.Types.Mixed,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const MasterItem = mongoose.models.MasterItem || mongoose.model("MasterItem", masterItemSchema);

async function seedModeOfTravel() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Define mode of travel options
    const modeOfTravelOptions = [
      { type: "mode-of-travel", name: "Bike", value: 5, sortOrder: 1, isActive: true },
      { type: "mode-of-travel", name: "Car", value: 8, sortOrder: 2, isActive: true },
      { type: "mode-of-travel", name: "Public Transport", value: 3, sortOrder: 3, isActive: true },
    ];

    // Check if mode-of-travel entries already exist
    const existingCount = await MasterItem.countDocuments({ type: "mode-of-travel" });

    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing mode-of-travel entries.`);
      console.log("Updating existing entries and adding new ones if needed...");

      for (const option of modeOfTravelOptions) {
        await MasterItem.findOneAndUpdate(
          { type: option.type, name: option.name },
          option,
          { upsert: true, new: true }
        );
        console.log(`✓ ${option.name} - Rate: ₹${option.value}/km`);
      }
    } else {
      console.log("No existing mode-of-travel entries found. Creating new entries...");

      const result = await MasterItem.insertMany(modeOfTravelOptions);
      console.log(`✓ Created ${result.length} mode-of-travel entries:`);
      result.forEach(item => {
        console.log(`  - ${item.name} - Rate: ₹${item.value}/km`);
      });
    }

    console.log("\n✅ Mode of travel seeding completed successfully!");

    // Display all mode-of-travel entries
    const allEntries = await MasterItem.find({ type: "mode-of-travel", isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    console.log("\nAll active mode-of-travel entries:");
    allEntries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.name} - Rate: ₹${entry.value}/km`);
    });

  } catch (error) {
    console.error("Error seeding mode of travel:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

seedModeOfTravel();
