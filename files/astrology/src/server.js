import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import adminRoute from "./backend/routes/admin.route.js";
import astrologyImageRoute from "./backend/routes/astrologyImage.route.js";
import readingEmailRoute from "./backend/routes/readingEmail.route.js";
import path from "path";



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ mount routes
app.use(adminRoute);
app.use(astrologyImageRoute);
app.use(readingEmailRoute);
app.use("/generated_images", express.static(path.join(process.cwd(), "generated_images")));


const PORT = 4000;
app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
