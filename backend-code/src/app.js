require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const familyRoutes = require("./routes/familyRoutes");
const assetRoutes = require("./routes/assetRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const searchRoutes = require("./routes/searchRoutes");
const activityRoutes = require("./routes/activityRoutes");
const userRoutes = require("./routes/userRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const helpRoutes = require("./routes/helpRoutes");
const { isSqliteMode } = require("./config/sqlite");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: "AIMPLIFY API Docs",
  swaggerOptions: { persistAuthorization: true },
}));

app.get("/", (req, res) => res.redirect("/api-docs"));
app.get("/v1/health", (req, res) =>
  res.status(200).json({
    success: true,
    message: "AIMPLIFY API is running",
    db: isSqliteMode() ? "sqlite" : "mongodb",
  }),
);

app.use("/v1/auth", authRoutes);
app.use("/v1/dashboard", dashboardRoutes);
app.use("/v1/search", searchRoutes);
app.use("/v1/families", familyRoutes);
app.use("/v1/assets", assetRoutes);
app.use("/v1/submissions", submissionRoutes);
app.use("/v1/analytics", analyticsRoutes);
app.use("/v1/activity", activityRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/catalog", catalogRoutes);
app.use("/v1/help", helpRoutes);

const uploadsStaticRoot = path.join(process.cwd(), "data", "uploads");
app.use("/v1/uploads", express.static(uploadsStaticRoot, { maxAge: "1d", fallthrough: true }));

// Legacy registration routes (kept for backward compatibility)
app.use("/v1", registrationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
