import mongoose from "mongoose"

const ExpenseSchema = new mongoose.Schema({
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: "Budget", required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true, enum: ["Food", "Rent", "Travel", "Entertainment", "Utility", "Other"]},
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("Expense", ExpenseSchema)