import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_management_db');
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ [MongoDB Connection Error]: ${error.message}`);
    console.error(`👉 Ensure MongoDB is running on port 27017!`);
    console.error(`   Run: mongod --dbpath "d:\\mernstack2\\data\\db"\n`);
    process.exit(1);
  }
};
