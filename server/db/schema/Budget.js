import mongoose from "mongoose"

const BudgetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  totalAmount: { type: Number, required: true },
  spent: { type: Number },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Expense" }],
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("Budget", BudgetSchema)