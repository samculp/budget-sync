import express from "express"
import Budget from "../db/schema/Budget.js"
import User from "../db/schema/User.js"
import auth from "../middleware/authMiddleware.js"

const router = express.Router()

// @route   POST /api/budgets
// @desc    Create a new budget
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, totalAmount, members } = req.body

    const budget = new Budget({
      name,
      description,
      totalAmount,
      spent: 0,
      members: members || [req.userId],
      expenses: []
    })

    await budget.save()
    
    // Update the user's budgets array
    await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { budgets: budget._id } }
    )
    
    res.status(201).send(budget)
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   GET /api/budgets
// @desc    Retrieve all budgets for the logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ members: req.userId })
    res.status(200).send(budgets)
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   GET /api/budgets/:id
// @desc    Fetch a specific budget by its ID
router.get("/:id", auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, members: req.userId }).populate("expenses")
    if (!budget) return res.status(400).send({ error: "Budget not found" })
    res.status(200).send(budget)
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   PUT /api/budgets/:id
// @desc    Update an existing budget
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description, totalAmount, spent, members } = req.body
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, members: req.userId },
      { name, description, totalAmount, spent, members },
      { new: true, runValidators: true }
    )

    if (!budget) return res.status(404).send({ error: "Budget not found" })
    res.status(200).send(budget)
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   PUT /api/budgets/:id/add-member
// @desc    Add a member to a budget (for accepting invites)
router.put("/:id/add-member", auth, async (req, res) => {
  try {
    const { userId } = req.body
    
    // Check if the budget exists
    const budget = await Budget.findById(req.params.id)
    if (!budget) {
      return res.status(404).send({ error: "Budget not found" })
    }
    
    // Add the user to the budget's members
    if (!budget.members.includes(userId)) {
      budget.members.push(userId)
      await budget.save()
      
      // Add the budget to the user's budgets array
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { budgets: budget._id } }
      )
    }
    
    res.status(200).send(budget)
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   GET /api/budgets/:id/collaborators
// @desc    Get all collaborators (members) of a budget
router.get("/:id/collaborators", auth, async (req, res) => {
  try {
    // Check if the budget exists and user is a member
    const budget = await Budget.findOne({ _id: req.params.id, members: req.userId })
    if (!budget) {
      return res.status(404).send({ error: "Budget not found or you are not a member" })
    }
    
    // Get all members with their names and emails
    const collaborators = await User.find(
      { _id: { $in: budget.members } },
      { name: 1, email: 1 }
    )
    
    res.status(200).send(collaborators)
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   PUT /api/budgets/:id/leave
// @desc    Leave a budget (remove user from members but don't delete budget)
router.put("/:id/leave", auth, async (req, res) => {
  try {
    // Check if the budget exists and user is a member
    const budget = await Budget.findOne({ _id: req.params.id, members: req.userId })
    if (!budget) {
      return res.status(404).send({ error: "Budget not found or you are not a member" })
    }
    
    // Remove the user from the budget's members
    budget.members = budget.members.filter(memberId => memberId.toString() !== req.userId)
    await budget.save()
    
    // Remove the budget from the user's budgets array
    await User.findByIdAndUpdate(
      req.userId,
      { $pull: { budgets: budget._id } }
    )
    
    res.status(200).send({ message: "Successfully left the budget" })
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
router.delete("/:id", auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, members: req.userId }) // Ensure the user is a member
    if (!budget) return res.status(404).send({ error: "Budget not found" })
    
    // Remove the budget from all members' budgets arrays
    await User.updateMany(
      { _id: { $in: budget.members } },
      { $pull: { budgets: budget._id } }
    )
    
    res.status(200).send({ message: "Budget deleted successfully" })
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

export default router