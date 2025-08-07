import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const uri = process.env.MONGO_URI || ""

async function db() {
  try {
    await mongoose.connect(uri, {
      dbName: "expense-tracker"
    })
    console.log("✅ MongoDB Connected")
  } catch (error) {
    console.error("❌ MongoDB Connection Error: ", error)
  }
}

export default db