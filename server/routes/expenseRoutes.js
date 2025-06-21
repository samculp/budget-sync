import express from "express"
import Expense from "../db/schema/Expense.js"
import Budget from "../db/schema/Budget.js"
import auth from "../middleware/authMiddleware.js"

const router = express.Router()

// @route   POST /api/expenses
// @desc    Add a new expense
router.post("/", auth, async (req, res) => {
  try {
    const { budgetId, amount, category, description } = req.body
    const userId = req.userId // Get userId from auth middleware

    const expense = new Expense({
      budgetId: budgetId || null,
      userId,
      amount,
      category,
      description
    })

    await expense.save()

    if (budgetId) {
      await Budget.findByIdAndUpdate(budgetId, { $addToSet: { expenses: expense._id } })
    }

    res.status(201).send(expense)
  } catch (error) {
    console.error(error)
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   GET /api/expenses
// @desc    Get all expenses for the logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId }).populate('budgetId')
    res.status(200).send(expenses)
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   GET /api/expenses/:id
// @desc    Get a single expense by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id })
    if (!expense) {
      return res.status(404).send({ error: "Expense not found" })
    }
    res.status(200).send(expense)
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   PUT /api/expenses/:id
// @desc    Update an existing expense
router.put("/:id", auth, async (req, res) => {
  try {
    const { budgetId, amount, category, description } = req.body
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId })

    if (!expense) {
      return res.status(404).send({ error: "Expense not found" })
    }

    // Check if the budgetId has changed
    if (budgetId && budgetId !== expense.budgetId.toString()) {
      // Remove the expense ID from the old budget
      await Budget.findByIdAndUpdate(expense.budgetId, { $pull: { expenses: expense._id } })
      // Add the expense ID to the new budget
      await Budget.findByIdAndUpdate(budgetId, { $addToSet: { expenses: expense._id } })
    }

    // Update the expense
    expense.amount = amount
    expense.category = category
    expense.description = description
    if (budgetId) expense.budgetId = budgetId; // Update budgetId if provided

    await expense.save()
    res.status(200).send(expense)
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
router.delete("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId })

    if (!expense) return res.status(404).send({ error: "Expense not found" })

    // Remove the expense from the budget
    if (expense.budgetId) {
      await Budget.findByIdAndUpdate(expense.budgetId, { $pull: {expenses: expense._id} })
    }

    // Delete the expense
    await Expense.findByIdAndDelete(req.params.id)

    res.status(200).send({ message: "Expense deleted successfully" })
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

export default router
