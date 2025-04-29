const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const app = express();
const { scrapeLogic } = require("./scrapeLogic");

// Enable CORS
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Vraksh Scraping API!" });
});

app.get("/api/scrape", scrapeLogic);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
