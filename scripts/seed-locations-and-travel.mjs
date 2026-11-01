/**
 * Seed script for location hierarchy and travel modes
 * This creates initial data for:
 * - State: Maharashtra
 * - Travel modes: Bike, Car, Public Transport
 * - Division: PEDIA, DERMA (if not already present)
 *
 * Run with: node scripts/seed-locations-and-travel.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const masterItemSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true },
    value: { type: Number },
    parent: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: {
      username: { type: String },
      name: { type: String },
    },
  },
  { timestamps: true }
);

masterItemSchema.index({ type: 1, name: 1 }, { unique: true });

const MasterItem = mongoose.models.MasterItem || mongoose.model('MasterItem', masterItemSchema);

const seedData = [
  // State
  {
    type: 'state',
    name: 'Maharashtra',
    sortOrder: 1,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },

  // Travel Modes
  {
    type: 'travel-mode',
    name: 'Bike',
    sortOrder: 1,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'travel-mode',
    name: 'Car',
    sortOrder: 2,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'travel-mode',
    name: 'Public Transport',
    sortOrder: 3,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },

  // Divisions
  {
    type: 'division',
    name: 'PEDIA',
    description: 'Pediatric division',
    sortOrder: 1,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'division',
    name: 'DERMA',
    description: 'Dermatology division',
    sortOrder: 2,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'division',
    name: 'DREAM',
    description: 'Dream division',
    sortOrder: 3,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },

  // Sample Districts in Maharashtra
  {
    type: 'district',
    name: 'Pune',
    parent: 'Maharashtra',
    sortOrder: 1,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'district',
    name: 'Mumbai City',
    parent: 'Maharashtra',
    sortOrder: 2,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'district',
    name: 'Mumbai Suburban',
    parent: 'Maharashtra',
    sortOrder: 3,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'district',
    name: 'Thane',
    parent: 'Maharashtra',
    sortOrder: 4,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'district',
    name: 'Nagpur',
    parent: 'Maharashtra',
    sortOrder: 5,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },

  // Sample Talukas in Pune District
  {
    type: 'taluka',
    name: 'Haveli',
    parent: 'Pune',
    sortOrder: 1,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'taluka',
    name: 'Mulshi',
    parent: 'Pune',
    sortOrder: 2,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'taluka',
    name: 'Pune City',
    parent: 'Pune',
    sortOrder: 3,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'taluka',
    name: 'Maval',
    parent: 'Pune',
    sortOrder: 4,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },

  // Sample Villages in Haveli Taluka
  {
    type: 'village',
    name: 'Kharadi',
    parent: 'Haveli',
    sortOrder: 1,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'village',
    name: 'Hinjewadi',
    parent: 'Haveli',
    sortOrder: 2,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'village',
    name: 'Baner',
    parent: 'Haveli',
    sortOrder: 3,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
  {
    type: 'village',
    name: 'Wagholi',
    parent: 'Haveli',
    sortOrder: 4,
    isActive: true,
    createdBy: { username: 'system', name: 'System' },
  },
];

async function seed() {
  try {
    console.log('🌱 Starting seed process...');
    console.log('📡 Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const item of seedData) {
      try {
        await MasterItem.create(item);
        console.log(`✅ Created ${item.type}: ${item.name}`);
        created++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  Skipped (already exists): ${item.type} - ${item.name}`);
          skipped++;
        } else {
          console.error(`❌ Error creating ${item.type} - ${item.name}:`, error.message);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${seedData.length}`);
    console.log('\n🎉 Seed process completed!');

  } catch (error) {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

seed();
