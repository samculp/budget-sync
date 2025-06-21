import express from "express"
import User from "../db/schema/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import auth from "../middleware/authMiddleware.js"

const router = express.Router()

// @route   POST /users/register
// @desc    Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    let user = await User.findOne({ email: email })
    if (user) return res.status(400).send({ error: "User already exists" })

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = User({
      name,
      email,
      password: hashedPassword
    })

    await user.save()

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "24h"})

    res.status(201).send({ message: "User registered successfully", token })
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   POST /users/login
// @desc    Login an existing user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).send({ error: "Invalid email" })

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) return res.status(400).send({ error: "Invalid password"})

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "24h"})

    res.status(200).send({ message: "Login successful", token})
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   GET /users/profile
// @desc    Get user profile information
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    if (!user) return res.status(404).send({ error: "User not found" })
    res.status(200).send(user)
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

// @route   PUT /users/profile
// @desc    Update user profile information
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, password } = req.body

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).send({ error: "User not found" })

    // make sure email is not already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) return res.status(400).send({ error: "This email is already taken" })
      user.email = email
    }

    // update name if provided
    if (name) {
      user.name = name
    }

    // update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(password, salt)
    }

    await user.save()

    // return updated user without password
    const updatedUser = await User.findById(req.userId).select("-password")
    res.status(200).send(updatedUser)
  } catch (error) {
    res.status(500).send({ error: "Internal server error" })
  }
})

export default router