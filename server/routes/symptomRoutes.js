const express = require("express");
const router = express.Router();

const {
  createSymptom,
  getMySymptoms,
  getAllSymptoms
} = require("../controllers/symptomController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware("patient"), createSymptom);
router.get("/my", authMiddleware, roleMiddleware("patient"), getMySymptoms);
router.get("/all", authMiddleware, roleMiddleware("doctor", "admin"), getAllSymptoms);

module.exports = router;
