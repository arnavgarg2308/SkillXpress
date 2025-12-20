// jobback.js — FINAL JOB MATCH BACKEND

const express = require("express");
const cors = require("cors");

const app = express();

/* ================================
   MIDDLEWARE
   ================================ */
app.use(cors());
app.use(express.json());

/* ================================
   JOB CONFIG (STATIC DATA)
   ================================ */

const JOB_REQUIREMENTS = {

  /* ================= SOFTWARE DEVELOPMENT ================= */

  "Software Engineer": {
    DSA: 80,
    Programming: 80,
    OOP: 70,
    Git: 60
  },

  "Software Developer": {
    Programming: 80,
    Debugging: 70,
    Git: 60,
    OOP: 60
  },

  "Junior Software Developer": {
    Programming: 70,
    Git: 50,
    Basics: 60
  },

  "Associate Software Engineer": {
    Programming: 70,
    OOP: 60,
    Git: 60
  },

  "Application Developer": {
    Programming: 75,
    APIs: 70,
    Debugging: 60
  },

  /* ================= WEB DEVELOPMENT ================= */

  "Frontend Developer": {
    HTML: 85,
    CSS: 80,
    JavaScript: 85,
    React: 75
  },

  "Backend Developer": {
    "Node.js": 85,
    Express: 75,
    SQL: 80,
    APIs: 75
  },

  "Full Stack Developer": {
    HTML: 75,
    CSS: 70,
    JavaScript: 85,
    React: 75,
    "Node.js": 80,
    SQL: 75
  },

  "Web Developer": {
    HTML: 85,
    CSS: 80,
    JavaScript: 75
  },

  "MERN Stack Developer": {
    MongoDB: 80,
    Express: 75,
    React: 80,
    "Node.js": 80
  },

  "MEAN Stack Developer": {
    MongoDB: 80,
    Express: 75,
    Angular: 80,
    "Node.js": 80
  },

  /* ================= MOBILE DEVELOPMENT ================= */

  "Android Developer": {
    Java: 80,
    Kotlin: 75,
    AndroidSDK: 80,
    APIs: 70
  },

  "iOS Developer": {
    Swift: 80,
    iOSSDK: 80,
    APIs: 70
  },

  "Flutter Developer": {
    Dart: 80,
    Flutter: 85,
    APIs: 70
  },

  "React Native Developer": {
    JavaScript: 80,
    React: 75,
    ReactNative: 85
  },

  "Mobile Application Developer": {
    MobileDevelopment: 80,
    APIs: 70
  },

  /* ================= DATA & AI ================= */

  "Data Analyst": {
    Python: 80,
    SQL: 85,
    Excel: 75,
    DataAnalysis: 80
  },

  "Business Data Analyst": {
    SQL: 80,
    Excel: 80,
    BusinessAnalysis: 75
  },

  "Data Scientist": {
    Python: 85,
    Statistics: 85,
    MachineLearning: 80,
    DataAnalysis: 80
  },

  "Machine Learning Engineer": {
    Python: 85,
    MachineLearning: 85,
    ModelDeployment: 75
  },

  "AI Engineer": {
    Python: 85,
    MachineLearning: 80,
    AIConcepts: 80
  },

  "Big Data Engineer": {
    BigData: 80,
    SQL: 80,
    ETL: 75
  },

  /* ================= CLOUD & DEVOPS ================= */

  "Cloud Engineer": {
    AWS: 85,
    Linux: 80,
    Networking: 75
  },

  "Cloud Solutions Architect": {
    AWS: 85,
    CloudArchitecture: 85,
    SystemDesign: 80
  },

  "DevOps Engineer": {
    Linux: 80,
    Docker: 85,
    CICD: 80
  },

  "Site Reliability Engineer": {
    Linux: 80,
    Monitoring: 80,
    Automation: 75
  },

  "Platform Engineer": {
    Linux: 80,
    Cloud: 80,
    Infrastructure: 75
  },

  /* ================= CYBER SECURITY ================= */

  "Cyber Security Analyst": {
    Networking: 80,
    SecurityFundamentals: 85,
    Linux: 75
  },

  "Information Security Analyst": {
    Security: 85,
    RiskAnalysis: 80
  },

  "Network Security Engineer": {
    Networking: 85,
    Firewalls: 80,
    Security: 80
  },

  "Ethical Hacker": {
    PenetrationTesting: 85,
    Networking: 80,
    Security: 85
  },

  "SOC Analyst": {
    Monitoring: 80,
    IncidentResponse: 80,
    Security: 80
  },

  /* ================= DESIGN ================= */

  "UI Designer": {
    Figma: 85,
    UIDesign: 80
  },

  "UX Designer": {
    UXResearch: 85,
    Wireframing: 80
  },

  "UI/UX Designer": {
    Figma: 85,
    UIDesign: 80,
    UXResearch: 80
  },

  "Product Designer": {
    DesignThinking: 80,
    Prototyping: 80
  },

  "Interaction Designer": {
    InteractionDesign: 80,
    UX: 80
  },

  /* ================= TESTING ================= */

  "Software Tester": {
    ManualTesting: 80,
    TestCases: 80
  },

  "QA Engineer": {
    Testing: 80,
    Automation: 80
  },

  "Manual Tester": {
    ManualTesting: 85
  },

  "Automation Test Engineer": {
    Automation: 85,
    TestingTools: 80
  },

  "Performance Tester": {
    PerformanceTesting: 85,
    LoadTesting: 80
  },

  /* ================= SYSTEMS ================= */

  "System Engineer": {
    Linux: 80,
    SystemAdministration: 80
  },

  "Network Engineer": {
    Networking: 85,
    Routing: 80,
    Switching: 80
  },

  "IT Support Engineer": {
    Troubleshooting: 85,
    ITSupport: 80
  },

  "Infrastructure Engineer": {
    Servers: 80,
    Networking: 80
  },

  /* ================= DATABASE ================= */

  "Database Administrator (DBA)": {
    SQL: 85,
    DatabaseManagement: 85
  },

  "Data Engineer": {
    SQL: 80,
    ETL: 80,
    Pipelines: 75
  },

  "Backend Systems Engineer": {
    BackendSystems: 80,
    APIs: 80
  },

  /* ================= EMERGING TECH ================= */

  "ML Researcher": {
    MachineLearning: 85,
    Research: 85
  },

  "Blockchain Developer": {
    Blockchain: 85,
    SmartContracts: 80
  },

  "Web3 Developer": {
    Blockchain: 80,
    Web3: 85
  },

  "AR/VR Developer": {
    AR: 80,
    VR: 80
  },

  /* ================= ENTERPRISE ================= */

  "ERP Consultant": {
    ERPSystems: 85,
    BusinessProcesses: 80
  },

  "CRM Developer": {
    CRM: 85,
    APIs: 75
  },

  "Salesforce Developer": {
    Salesforce: 85,
    Apex: 80
  },

  "Business Systems Analyst": {
    BusinessAnalysis: 85,
    Systems: 80
  },

  /* ================= PRODUCT ================= */

  "Product Engineer": {
    ProductDevelopment: 80,
    Engineering: 80
  },

  "Technical Product Manager": {
    ProductManagement: 85,
    TechnicalKnowledge: 80
  },

  "Associate Product Manager": {
    ProductManagement: 80
  },

  "Program Manager": {
    ProgramManagement: 85,
    Coordination: 80
  },

  /* ================= OTHER ================= */

  "Game Developer": {
    GameDevelopment: 85,
    Programming: 80
  },

  "Embedded Systems Engineer": {
    EmbeddedSystems: 85,
    "C/C++": 80
  },

  "IoT Developer": {
    IoT: 85,
    Networking: 75
  }

};
/* ================================
   1️⃣ GET ALL JOB ROLES
   ================================ */
app.get("/jobs", (req, res) => {
  res.json({
    success: true,
    jobs: Object.keys(JOB_REQUIREMENTS)
  });
});

/* ================================
   2️⃣ JOB MATCH CALCULATION
   ================================ */
/*
INPUT:
{
  "skills": { "HTML":60, "CSS":50 },
  "jobs": ["Frontend Developer","Backend Developer"]
}

OUTPUT:
{
  "success": true,
  "results": {
    "Frontend Developer": 71,
    "Backend Developer": 32
  }
}
*/

app.post("/job-match", (req, res) => {
  const { skills, interests } = req.body;

  if (!skills || typeof skills !== "object") {
    return res.status(400).json({ success:false, error:"Skills required" });
  }

  const selectedJobs =
  interests && interests.length
    ? Object.keys(JOB_REQUIREMENTS).filter(job =>
        interests.includes(job)
      )
    : [];



  let results = {};

  selectedJobs.forEach(job => {
    const requirements = JOB_REQUIREMENTS[job];
    if (!requirements) return;

    let total = 0, matched = 0;

    Object.entries(requirements).forEach(([skill, reqVal]) => {
      total += reqVal;
      matched += Math.min(skills[skill] || 0, reqVal);
    });

    results[job] = Math.round((matched / total) * 100);
  });

  res.json({ success:true, results });
});


/* ================================
   SERVER START
   ================================ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Job Match backend LIVE on Render");
});
