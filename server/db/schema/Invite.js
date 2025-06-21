import mongoose from "mongoose"

const InviteSchema = new mongoose.Schema({
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: "Budget", required: true },
  invitedEmail: { type: String, required: true },
  customMessage: { type: String, default: "" },
  status: { type: String, enum: ["Pending", "Accepted", "Declined"], default: "Pending"},
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("Invite", InviteSchema)