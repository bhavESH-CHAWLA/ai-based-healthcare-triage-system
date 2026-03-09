const express = require("express");
const router = express.Router();

const {
  getAIConfigStatus,
  createTriage,
  getMyTriageHistory,
  getAllTriageReports,
  getFollowUpQuestions,
  getGuidance
} = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/status", authMiddleware, getAIConfigStatus);

router.post("/triage", authMiddleware, roleMiddleware("patient"), createTriage);
router.get("/triage/my", authMiddleware, roleMiddleware("patient"), getMyTriageHistory);
router.get("/triage/all", authMiddleware, roleMiddleware("doctor", "admin"), getAllTriageReports);

router.post("/follow-up", authMiddleware, roleMiddleware("patient"), getFollowUpQuestions);
router.post("/guidance", authMiddleware, getGuidance);

module.exports = router;
