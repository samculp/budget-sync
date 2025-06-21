import express from "express"
import Invite from "../db/schema/Invite.js"
import Budget from "../db/schema/Budget.js" // Import Budget model if needed for validation
import User from "../db/schema/User.js"
import { sendInvitationEmail } from "../utils/emailService.js"
import auth from "../middleware/authMiddleware.js"

const router = express.Router()

// @route   POST /api/invites
// @desc    Create a new invite
router.post("/", auth, async (req, res) => {
  try {
    const { budgetId, invitedEmail, customMessage } = req.body

    // Check if the budget exists and the user is a member
    const budget = await Budget.findById(budgetId)
    if (!budget) {
      return res.status(404).send({ error: "Budget not found" })
    }

    // Check if user is a member of the budget
    if (!budget.members.includes(req.userId)) {
      return res.status(403).send({ error: "You are not a member of this budget" })
    }

    // Get the inviter's name
    const inviter = await User.findById(req.userId)
    if (!inviter) {
      return res.status(404).send({ error: "User not found" })
    }

    // Check if invite already exists for this email and budget and that it has been more than 24 hours
    const existingInvite = await Invite.findOne({ 
      budgetId, 
      invitedEmail, 
      status: "Pending" 
    })

    const elapsedTime = Date.now() - (existingInvite?.createdAt || 0)
    const oneDay = 24 * 60 * 60 * 1000

    if (existingInvite && elapsedTime < oneDay) {
      return res.status(400).send({ error: "An invitation has already been sent to this email for this budget. Please wait 24 hours before sending another invitation." })
    }

    // Create a new invite
    const invite = new Invite({
      budgetId,
      invitedEmail,
      customMessage: customMessage || "",
      status: "Pending"
    })

    await invite.save()

    // Send invitation email
    const emailResult = await sendInvitationEmail(
      invitedEmail,
      budget.name,
      inviter.name,
      customMessage
    )
      
    if (!emailResult.success) {
      // If email fails, we might want to delete the invite or mark it as failed
      console.error('Failed to send email:', emailResult.error)
      // For now, we'll still save the invite but log the email failure
    }

    res.status(201).send({
      ...invite.toObject(),
      emailSent: emailResult.success,
      emailError: emailResult.error
    })
  } catch (error) {
    console.error(error)
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   GET /api/invites
// @desc    Retrieve all invites for a specific budget
router.get("/", auth, async (req, res) => {
  try {
    const { budgetId, email } = req.query // Expecting budgetId or email as query parameters
    
    let query = {}
    if (budgetId) {
      query.budgetId = budgetId
    }
    if (email) {
      query.invitedEmail = email
      query.status = "Pending" // Only get pending invites for the user
    }
    
    const invites = await Invite.find(query).populate('budgetId', 'name')
    res.status(200).send(invites)
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   GET /api/invites/:id
// @desc    Fetch a specific invite by its ID
router.get("/:id", auth, async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id)
    if (!invite) {
      return res.status(404).send({ error: "Invite not found" })
    }
    res.status(200).send(invite)
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   PUT /api/invites/:id
// @desc    Update the status of an invite
router.put("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ["Pending", "Accepted", "Declined"]

    if (!validStatuses.includes(status)) {
      return res.status(400).send({ error: "Invalid status" })
    }

    const invite = await Invite.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )

    if (!invite) {
      return res.status(404).send({ error: "Invite not found" })
    }

    // If the invite is accepted, add the user to the budget
    if (status === "Accepted") {
      try {
        const budget = await Budget.findById(invite.budgetId)
        if (budget && !budget.members.includes(req.userId)) {
          budget.members.push(req.userId)
          await budget.save()
          
          // Add the budget to the user's budgets array
          await User.findByIdAndUpdate(
            req.userId,
            { $addToSet: { budgets: budget._id } }
          )
        }
      } catch (error) {
        console.error('Error adding user to budget:', error)
      }
    }

    res.status(200).send(invite)
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   DELETE /api/invites/:id
// @desc    Delete an invite
router.delete("/:id", auth, async (req, res) => {
  try {
    const invite = await Invite.findByIdAndDelete(req.params.id)
    if (!invite) {
      return res.status(404).send({ error: "Invite not found" })
    }
    res.status(200).send({ message: "Invite deleted successfully" })
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ error: "Internal server error" })
  }
})

export default router
