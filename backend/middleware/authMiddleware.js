const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.error("No token provided");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 

    console.log("Authenticated Admin ID:", req.user.id);
    next();
  } catch (error) {
    console.error("Invalid token:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;

