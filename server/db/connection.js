import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const uri = process.env.MONGO_URI || ""

async function db() {
  try {
    await mongoose.connect(uri, {
      dbName: "expense-tracker"
    })
    console.log("MongoDB connected successfully!")
  } catch (error) {
    console.error("MongoDB connection error: ", error)
  }
}

export default db