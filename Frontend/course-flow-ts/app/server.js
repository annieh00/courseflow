// server.js (at Frontend/course-flow-ts/server.js)
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rmp = require("ratemyprofessor-api"); // snow4060 wrapper

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

// GET /api/school?name=Iowa%20State%20University
app.get("/api/school", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    if (!name) return res.status(400).json({ error: "name required" });
    const edges = await rmp.searchSchool(name); // returns edges[]
    res.json({ edges });
  } catch (e) {
    console.error("api/school error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// GET /api/professorsAtSchoolId?name=Jean&schoolId=<global_id>
app.get("/api/professorsAtSchoolId", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    const schoolId = String(req.query.schoolId || "").trim();
    if (!name || !schoolId) {
      return res.status(400).json({ error: "name and schoolId required" });
    }
    const edges = await rmp.searchProfessorsAtSchoolId(name, schoolId);
    res.json({ edges });
  } catch (e) {
    console.error("api/professorsAtSchoolId error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// optional convenience: summary by professor name
app.get("/api/professor/summary", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    const schoolId = String(req.query.schoolId || "").trim();
    if (!name || !schoolId) {
      return res.status(400).json({ error: "name and schoolId required" });
    }
    const info = await rmp.getProfessorRatingAtSchoolId(name, schoolId);
    res.json(info);
  } catch (e) {
    console.error("api/professor/summary error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// optional: build a link by legacyId (tid)
app.get("/api/professor/summaryById", (req, res) => {
  const tid = Number(req.query.tid);
  if (!Number.isFinite(tid)) return res.status(400).json({ error: "numeric tid required" });
  res.json({ link: `https://www.ratemyprofessors.com/professor/${tid}` });
});

const PORT = process.env.PORT || 8082; // ← default 8082
app.listen(PORT, () => console.log(`RMP proxy listening on port ${PORT}`));
