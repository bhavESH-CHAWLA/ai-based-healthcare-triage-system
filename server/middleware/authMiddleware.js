const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    // 2. Check if token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided, access denied" });
    }

    // 3. Extract token
    const token = authHeader.split(" ")[1];

    // 4. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach user data to request
    req.user = decoded;

    // 6. Continue to next middleware/controller
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
