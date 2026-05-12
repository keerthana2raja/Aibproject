require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
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
const platformRoutes = require("./routes/platformRoutes");
const { isSqliteMode } = require("./config/sqlite");

const app = express();
app.use(compression()); // gzip all API responses

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://aimplify-1jeq0m2z2-keerthana-raj-s-projects.vercel.app",
      /\.vercel\.app$/,
      "https://amplify.infovision.io",
      "https://www.amplify.infovision.io",
      "https://aimplify.infovision.io",
      "https://www.aimplify.infovision.io",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "AIMPLIFY API Docs",
    swaggerOptions: { persistAuthorization: true },
  }),
);

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
app.use("/v1/platform", platformRoutes);

// NOTE: /v1/uploads static serving removed — files now live in Vercel Blob (public URLs stored in DB).

// Legacy registration routes (kept for backward compatibility)
app.use("/v1", registrationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
