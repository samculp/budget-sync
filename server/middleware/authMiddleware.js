import jwt from "jsonwebtoken"

function authMiddleware (req, res, next) {
  const token = req.headers['authorization']
  if (!token) return res.status(400).send({ error: "No token provided" })

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(400).send({ error: "Invalid token" })
    req.userId = decoded.userId
    next()
  })
}

export default authMiddleware