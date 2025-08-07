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

    // Check if user is a member of the budget they're trying to add an expense to
    if (budgetId) {
      const budget = await Budget.findOne({ 
        _id: budgetId, 
        members: userId 
      })
      
      if (!budget) {
        return res.status(403).send({ error: "You are not a member of this budget" })
      }
    }

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
    const expense = await Expense.findOne({ _id: req.params.id })

    if (!expense) {
      return res.status(404).send({ error: "Expense not found" })
    }

    // Check if user is a member of the budget that contains this expense
    if (expense.budgetId) {
      const budget = await Budget.findOne({ 
        _id: expense.budgetId, 
        members: req.userId 
      })
      
      if (!budget) {
        return res.status(403).send({ error: "You are not a member of this budget" })
      }
    } else {
      // If expense has no budget, only the owner can edit it
      if (expense.userId.toString() !== req.userId) {
        return res.status(403).send({ error: "You can only edit your own expenses" })
      }
    }

    // If setting budgetId to null, check if user is a member of the current budget
    if (budgetId === null && expense.budgetId) {
      const currentBudget = await Budget.findOne({ 
        _id: expense.budgetId, 
        members: req.userId 
      })
      if (!currentBudget) {
        return res.status(403).send({ error: "You are not a member of this budget" })
      }
    }

    // Check if the budgetId has changed
    if (budgetId !== undefined) {
      if (budgetId === null && expense.budgetId) {
        // Remove the expense from its current budget (setting budgetId to null)
        await Budget.findByIdAndUpdate(expense.budgetId, { $pull: { expenses: expense._id } })
        console.log("Removed expense from budget (setting to null)")
      } else if (budgetId && budgetId !== expense.budgetId?.toString()) {
        // Remove the expense ID from the old budget
        if (expense.budgetId) {
          await Budget.findByIdAndUpdate(expense.budgetId, { $pull: { expenses: expense._id } })
          console.log("Removed expense from old budget")
        }
        // Add the expense ID to the new budget
        await Budget.findByIdAndUpdate(budgetId, { $addToSet: { expenses: expense._id } })
        console.log("Added expense to new budget")
      }
    }

    // Update the expense - only update fields that are provided
    if (amount !== undefined) expense.amount = amount
    if (category !== undefined) expense.category = category
    if (description !== undefined) expense.description = description
    if (budgetId !== undefined) expense.budgetId = budgetId || null; // Update budgetId if provided

    await expense.save()
    res.status(200).send(expense)
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
router.delete("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id })

    if (!expense) return res.status(404).send({ error: "Expense not found" })

    // Check if user is a member of the budget that contains this expense
    if (expense.budgetId) {
      const budget = await Budget.findOne({ 
        _id: expense.budgetId, 
        members: req.userId 
      })
      
      if (!budget) {
        return res.status(403).send({ error: "You are not a member of this budget" })
      }
    } else {
      // If expense has no budget, only the owner can delete it
      if (expense.userId.toString() !== req.userId) {
        return res.status(403).send({ error: "You can only delete your own expenses" })
      }
    }

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

// @route   GET /api/expenses/budget/:budgetId
// @desc    Get all expenses for a specific budget (including all members)
router.get("/budget/:budgetId", auth, async (req, res) => {
  try {
    // First verify the user is a member of this budget
    const budget = await Budget.findOne({ 
      _id: req.params.budgetId, 
      members: req.userId 
    })
    
    if (!budget) {
      return res.status(404).send({ error: "Budget not found or you are not a member" })
    }
    
    // Get all expenses for this budget (from all members)
    const expenses = await Expense.find({ 
      budgetId: req.params.budgetId 
    }).populate('userId', 'name email')
    
    res.status(200).send(expenses)
  } catch (error) {
    console.error(error)
    res.status(500).send({ error: "Internal server error" })
  }
})

export default router