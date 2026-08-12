// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rmp = require("ratemyprofessor-api");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

// /api/school?name=Iowa%20State%20University
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

// /api/professorsAtSchoolId?name=Jean&schoolId=<globalId>
app.get("/api/professorsAtSchoolId", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    const schoolId = String(req.query.schoolId || "").trim();
    if (!name || !schoolId) return res.status(400).json({ error: "name and schoolId required" });
    const edges = await rmp.searchProfessorsAtSchoolId(name, schoolId);
    res.json({ edges });
  } catch (e) {
    console.error("api/professorsAtSchoolId error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// optional convenience route
app.get("/api/professor/summary", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    const schoolId = String(req.query.schoolId || "").trim();
    if (!name || !schoolId) return res.status(400).json({ error: "name and schoolId required" });
    const info = await rmp.getProfessorRatingAtSchoolId(name, schoolId);
    res.json(info);
  } catch (e) {
    console.error("api/professor/summary error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});
// --- School summary by weighted averaging teacher ratings ---
// GET /api/school/summary?name=Iowa%20State%20University
app.get("/api/school/summary", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    if (!name) return res.status(400).json({ error: "name required" });

    // 1) find the school global id
    const schoolEdges = await rmp.searchSchool(name);
    if (!Array.isArray(schoolEdges) || schoolEdges.length === 0) {
      return res.status(404).json({ error: `School not found: ${name}` });
    }
    const schoolId = schoolEdges[0].node.id;

    // 2) fetch a broad set of professors at that school by fanning out over letters
    // (This wrapper returns *all* results for a query; we aggregate & de-dupe.)
    const queries = "abcdefghijklmnopqrstuvwxyz".split("");
    const dedup = new Map(); // key: legacyId (tid), val: node

    for (const q of queries) {
      const edges = await rmp.searchProfessorsAtSchoolId(q, schoolId);
      for (const e of edges || []) {
        const n = e?.node || {};
        const tid = n.legacyId;
        if (!tid || typeof tid !== "number") continue;
        // Prefer the node which has a larger numRatings
        const existing = dedup.get(tid);
        if (!existing || (n.numRatings ?? 0) > (existing.numRatings ?? 0)) {
          dedup.set(tid, {
            firstName: n.firstName || "",
            lastName: n.lastName || "",
            department: n.department || "",
            avgRating: typeof n.avgRating === "number" ? n.avgRating : 0,
            numRatings: typeof n.numRatings === "number" ? n.numRatings : 0,
          });
        }
      }
    }

    // 3) compute weighted average
    let weightSum = 0;
    let weighted = 0;
    for (const v of dedup.values()) {
      if (v.avgRating > 0 && v.numRatings > 0) {
        weighted += v.avgRating * v.numRatings;
        weightSum += v.numRatings;
      }
    }
    const overall = weightSum > 0 ? +(weighted / weightSum).toFixed(1) : 0;

    // You can fill categories if you later compute them—set placeholders for now.
    // RMP doesn’t expose those via this wrapper.
    const categories = {
      Facilities: null, Happiness: null, Opportunities: null, Reputation: null, Clubs: null,
      Safety: null, Location: null, Social: null, Food: null, Internet: null,
    };

    return res.json({
      id: schoolId,
      name,
      location: "Ames, IA",
      overall,
      ratingsCount: weightSum, // total # of ratings used in the aggregation
      categories,
    });
  } catch (e) {
    console.error("api/school/summary error:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// optional link by legacyId (tid)
app.get("/api/professor/summaryById", (req, res) => {
  const tid = Number(req.query.tid);
  if (!Number.isFinite(tid)) return res.status(400).json({ error: "numeric tid required" });
  res.json({ link: `https://www.ratemyprofessors.com/professor/${tid}` });
});

const PORT = process.env.PORT || 8082;
app.listen(PORT, () => console.log(`RMP proxy listening on port ${PORT}`));
