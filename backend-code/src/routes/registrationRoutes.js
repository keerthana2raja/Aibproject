const express = require("express");
const router = express.Router();
const {
  listRegistrations,
  registerAsset,
  getRegistration,
  patchRegistration,
} = require("../controllers/registrationController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");

// swagger: GET /getAssetDetails
router.get("/getAssetDetails", protect, listRegistrations);

// swagger: POST /registerAsset
router.post("/registerAsset", protect, validate(["name", "family", "description"]), registerAsset);

// swagger: GET /getAssetDetails/:id
router.get("/getAssetDetails/:id", protect, getRegistration);

// swagger: PATCH /updateAssetRegistry/:id
router.patch("/updateAssetRegistry/:id", protect, authorize("governance", "admin"), patchRegistration);

module.exports = router;
