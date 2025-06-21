import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import db from "./db/connection.js"
import userRoutes from "./routes/userRoutes.js"
import expenseRoutes from "./routes/expenseRoutes.js"
import budgetRoutes from "./routes/budgetRoutes.js"
import inviteRoutes from "./routes/inviteRoutes.js"
import auth from "./middleware/authMiddleware.js"

dotenv.config()

const PORT = process.env.PORT || "5000"
const app = express()
const rebootId = Date.now().toString()
db()

// middleware
app.use(cors())
app.use(express.json())

app.use("/api/users", userRoutes)
app.use("/api/expenses", expenseRoutes)
app.use("/api/budgets", budgetRoutes)
app.use("/api/invites", inviteRoutes)

app.get("/api/reboot-id", (req, res) => {
  res.status(200).send({ rebootId })
})

app.get('/api/health', (req, res) => {
  res.status(200).send({ status: "ok" })
})

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`)
})