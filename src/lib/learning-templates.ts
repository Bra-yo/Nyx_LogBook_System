export type TemplateDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface LearningTemplateCompetencyGroup {
  name: string;
  description: string;
}

export interface LearningTemplateCompetency {
  name: string;
  description: string;
  difficulty: TemplateDifficulty;
  groups: LearningTemplateCompetencyGroup[];
  assessmentStructure: string[];
}

export interface LearningTemplate {
  id: string;
  name: string;
  description: string;
  learningAreaName: string;
  learningAreaDescription: string;
  competencies: LearningTemplateCompetency[];
  suggestedLearningPaths: string[];
}

export const learningTemplates: LearningTemplate[] = [
  {
    id: "computer-science",
    name: "Computer Science",
    description: "Core pathway for software, programming, systems, and data fundamentals.",
    learningAreaName: "Computer Science",
    learningAreaDescription: "Foundational computing and software engineering curriculum.",
    competencies: [
      {
        name: "Programming Fundamentals",
        description: "Build solid coding foundations using modern programming languages.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Variables and Logic", description: "Conditionals, loops, and data structures." },
          { name: "Algorithms", description: "Basic problem solving and algorithmic thinking." },
        ],
        assessmentStructure: ["Code challenge", "Practical lab submission", "Mentor feedback review"],
      },
      {
        name: "Software Engineering",
        description: "Apply engineering practices, testing, and collaboration.",
        difficulty: "INTERMEDIATE",
        groups: [
          { name: "Design Patterns", description: "Reusable software design approaches." },
          { name: "Testing", description: "Unit tests and quality assurance." },
        ],
        assessmentStructure: ["System design review", "Implementation demo", "Peer review"],
      },
    ],
    suggestedLearningPaths: ["Foundation to application development", "Software engineering practicum"],
  },
  {
    id: "software-engineering",
    name: "Software Engineering",
    description: "Engineering-oriented template for building products and delivery teams.",
    learningAreaName: "Software Engineering",
    learningAreaDescription: "Delivery-focused software engineering curriculum.",
    competencies: [
      {
        name: "Requirements Analysis",
        description: "Turn business needs into clear implementation requirements.",
        difficulty: "BEGINNER",
        groups: [
          { name: "User stories", description: "Capture stakeholder needs." },
          { name: "Acceptance criteria", description: "Measure successful delivery." },
        ],
        assessmentStructure: ["Requirement review", "Scope refinement", "Implementation validation"],
      },
      {
        name: "System Design",
        description: "Plan scalable systems and integrations.",
        difficulty: "ADVANCED",
        groups: [
          { name: "Architecture", description: "Component-level architecture design." },
          { name: "Security", description: "Secure integration design." },
        ],
        assessmentStructure: ["Architecture walkthrough", "Risk review", "Implementation sign-off"],
      },
    ],
    suggestedLearningPaths: ["Product delivery", "Engineering operations"],
  },
  {
    id: "networking",
    name: "Networking",
    description: "Networking architecture and operations template.",
    learningAreaName: "Networking",
    learningAreaDescription: "Network infrastructure, operations, and support curriculum.",
    competencies: [
      {
        name: "Networking Fundamentals",
        description: "Understand switching, routing, and protocols.",
        difficulty: "BEGINNER",
        groups: [
          { name: "LAN Concepts", description: "Local networking basics." },
          { name: "IP Routing", description: "Routing fundamentals." },
        ],
        assessmentStructure: ["Packet analysis task", "Lab configuration", "Mentor observation"],
      },
    ],
    suggestedLearningPaths: ["Campus network support", "Networking operations"],
  },
  {
    id: "cyber-security",
    name: "Cyber Security",
    description: "Security operations and defensive practices template.",
    learningAreaName: "Cyber Security",
    learningAreaDescription: "Security, compliance, and threat management curriculum.",
    competencies: [
      {
        name: "Threat Awareness",
        description: "Recognize common risks and incident patterns.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Risk identification", description: "Recognize cyber risks." },
          { name: "Controls", description: "Apply basic controls." },
        ],
        assessmentStructure: ["Threat assessment", "Briefing review", "Simulation task"],
      },
    ],
    suggestedLearningPaths: ["Security operations readiness", "Incident response fundamentals"],
  },
  {
    id: "artificial-intelligence",
    name: "Artificial Intelligence",
    description: "Template for AI and machine learning foundations.",
    learningAreaName: "Artificial Intelligence",
    learningAreaDescription: "AI and data-driven decision-making curriculum.",
    competencies: [
      {
        name: "Data Preparation",
        description: "Prepare datasets for experimentation and model training.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Cleaning", description: "Clean and transform data." },
          { name: "Labeling", description: "Structure training data." },
        ],
        assessmentStructure: ["Data audit", "Notebook review", "Mentor feedback"],
      },
      {
        name: "Machine Learning Concepts",
        description: "Understand training, validation, and evaluation.",
        difficulty: "INTERMEDIATE",
        groups: [
          { name: "Model training", description: "Build simple models." },
          { name: "Evaluation", description: "Assess model quality." },
        ],
        assessmentStructure: ["Model walkthrough", "Evaluation report", "Practical demo"],
      },
    ],
    suggestedLearningPaths: ["Applied AI workflows", "Model lifecycle management"],
  },
  {
    id: "business-administration",
    name: "Business Administration",
    description: "Management and operations template for business-focused learning pathways.",
    learningAreaName: "Business Administration",
    learningAreaDescription: "Business operations and leadership curriculum.",
    competencies: [
      {
        name: "Operations Management",
        description: "Coordinate work flows and service delivery.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Planning", description: "Plan work and resources." },
          { name: "Reporting", description: "Report progress and outcomes." },
        ],
        assessmentStructure: ["Operations case", "Portfolio review", "Reflection feedback"],
      },
    ],
    suggestedLearningPaths: ["Business operations", "Team coordination"],
  },
  {
    id: "accounting",
    name: "Accounting",
    description: "Accounting and financial controls template.",
    learningAreaName: "Accounting",
    learningAreaDescription: "Financial control and reporting curriculum.",
    competencies: [
      {
        name: "Bookkeeping",
        description: "Record financial transactions accurately.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Ledger posting", description: "Post daily transactions." },
          { name: "Reconciliation", description: "Reconcile balances." },
        ],
        assessmentStructure: ["Transaction review", "Reconciliation checklist", "Supervisor sign-off"],
      },
    ],
    suggestedLearningPaths: ["Financial administration", "Accounting support"],
  },
  {
    id: "finance",
    name: "Finance",
    description: "Finance and planning template.",
    learningAreaName: "Finance",
    learningAreaDescription: "Financial planning and reporting curriculum.",
    competencies: [
      {
        name: "Financial Planning",
        description: "Understand budgeting and forecasting practices.",
        difficulty: "INTERMEDIATE",
        groups: [
          { name: "Budgeting", description: "Create practical budgets." },
          { name: "Forecasting", description: "Track project financial outlooks." },
        ],
        assessmentStructure: ["Budget review", "Scenario analysis", "Mentor checkpoint"],
      },
    ],
    suggestedLearningPaths: ["Budgeting workflow", "Financial planning support"],
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Marketing and customer engagement template.",
    learningAreaName: "Marketing",
    learningAreaDescription: "Marketing campaigns and customer relationship curriculum.",
    competencies: [
      {
        name: "Campaign Planning",
        description: "Plan customer-facing marketing initiatives.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Audience segmentation", description: "Define target groups." },
          { name: "Content planning", description: "Structure campaign messaging." },
        ],
        assessmentStructure: ["Campaign brief", "Review presentation", "Feedback review"],
      },
    ],
    suggestedLearningPaths: ["Campaign execution", "Marketing communications"],
  },
  {
    id: "hospitality",
    name: "Hospitality",
    description: "Hospitality service and guest experience template.",
    learningAreaName: "Hospitality",
    learningAreaDescription: "Service operations and guest experience curriculum.",
    competencies: [
      {
        name: "Guest Experience",
        description: "Deliver consistent guest service standards.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Service standards", description: "Manage service quality." },
          { name: "Issue resolution", description: "Resolve guest concerns." },
        ],
        assessmentStructure: ["Service observation", "Guest feedback review", "Supervisor review"],
      },
    ],
    suggestedLearningPaths: ["Service delivery", "Guest operations"],
  },
  {
    id: "graphic-design",
    name: "Graphic Design",
    description: "Design thinking and creative production template.",
    learningAreaName: "Graphic Design",
    learningAreaDescription: "Creative design practice and visual communication curriculum.",
    competencies: [
      {
        name: "Visual Communication",
        description: "Craft compelling creative concepts.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Layout", description: "Compose visual layouts." },
          { name: "Typography", description: "Apply type systems." },
        ],
        assessmentStructure: ["Portfolio review", "Design critique", "Mentor feedback"],
      },
    ],
    suggestedLearningPaths: ["Design workflow", "Creative production"],
  },
  {
    id: "electrical-engineering",
    name: "Electrical Engineering",
    description: "Electrical systems and maintenance template.",
    learningAreaName: "Electrical Engineering",
    learningAreaDescription: "Electrical systems and technical service curriculum.",
    competencies: [
      {
        name: "Circuit Fundamentals",
        description: "Understand electrical principles and safety.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Safety", description: "Follow safe working practices." },
          { name: "Measurement", description: "Measure circuit performance." },
        ],
        assessmentStructure: ["Practical assessment", "Safety checklist", "Supervisor observation"],
      },
    ],
    suggestedLearningPaths: ["Field operations", "Maintenance readiness"],
  },
  {
    id: "mechanical-engineering",
    name: "Mechanical Engineering",
    description: "Mechanical systems and design template.",
    learningAreaName: "Mechanical Engineering",
    learningAreaDescription: "Mechanical operations and engineering practice curriculum.",
    competencies: [
      {
        name: "Mechanical Systems",
        description: "Understand maintenance and mechanical operation.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Maintenance", description: "Handle routine maintenance." },
          { name: "Inspection", description: "Inspect mechanical systems." },
        ],
        assessmentStructure: ["Hands-on assessment", "Inspection report", "Mentor review"],
      },
    ],
    suggestedLearningPaths: ["Technical maintenance", "Operations support"],
  },
  {
    id: "civil-engineering",
    name: "Civil Engineering",
    description: "Civil infrastructure and project delivery template.",
    learningAreaName: "Civil Engineering",
    learningAreaDescription: "Construction planning and civil project curriculum.",
    competencies: [
      {
        name: "Construction Planning",
        description: "Coordinate site and process planning activities.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Site planning", description: "Plan civil site work." },
          { name: "Documentation", description: "Track project records." },
        ],
        assessmentStructure: ["Site planning review", "Documentation audit", "Mentor feedback"],
      },
    ],
    suggestedLearningPaths: ["Site operations", "Project coordination"],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Healthcare delivery and patient service template.",
    learningAreaName: "Healthcare",
    learningAreaDescription: "Clinical operations and service delivery curriculum.",
    competencies: [
      {
        name: "Patient Care Standards",
        description: "Deliver safe and empathetic patient support.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Communication", description: "Provide patient-friendly communication." },
          { name: "Safety", description: "Follow patient safety practices." },
        ],
        assessmentStructure: ["Observation review", "Service reflection", "Clinical mentor review"],
      },
    ],
    suggestedLearningPaths: ["Patient support", "Clinical workflow readiness"],
  },
  {
    id: "nursing",
    name: "Nursing",
    description: "Nursing practice and patient care template.",
    learningAreaName: "Nursing",
    learningAreaDescription: "Clinical nursing practice curriculum.",
    competencies: [
      {
        name: "Clinical Practice",
        description: "Apply patient care and assessment principles.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Assessment", description: "Assess patient needs." },
          { name: "Care planning", description: "Plan patient care." },
        ],
        assessmentStructure: ["Clinical checklist", "Case reflection", "Clinical supervisor review"],
      },
    ],
    suggestedLearningPaths: ["Clinical placement readiness", "Patient care progression"],
  },
  {
    id: "clinical-medicine",
    name: "Clinical Medicine",
    description: "Clinical medicine and professional practice template.",
    learningAreaName: "Clinical Medicine",
    learningAreaDescription: "Clinical medicine competency curriculum.",
    competencies: [
      {
        name: "Clinical Reasoning",
        description: "Build structured clinical reasoning practices.",
        difficulty: "INTERMEDIATE",
        groups: [
          { name: "Case review", description: "Review clinical cases." },
          { name: "Documentation", description: "Document clinical notes." },
        ],
        assessmentStructure: ["Case discussion", "Documentation review", "Clinical mentor sign-off"],
      },
    ],
    suggestedLearningPaths: ["Clinical reasoning", "Professional practice"],
  },
  {
    id: "information-technology",
    name: "Information Technology",
    description: "IT support and operations template.",
    learningAreaName: "Information Technology",
    learningAreaDescription: "IT support and digital operations curriculum.",
    competencies: [
      {
        name: "IT Support",
        description: "Resolve end-user technology issues.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Troubleshooting", description: "Investigate IT issues." },
          { name: "Service desk", description: "Handle service requests." },
        ],
        assessmentStructure: ["Support case", "Service review", "Mentor sign-off"],
      },
    ],
    suggestedLearningPaths: ["Service desk readiness", "IT operations support"],
  },
  {
    id: "data-science",
    name: "Data Science",
    description: "Data analysis and insight generation template.",
    learningAreaName: "Data Science",
    learningAreaDescription: "Data analytics and evidence-based insight curriculum.",
    competencies: [
      {
        name: "Data Analysis",
        description: "Transform raw data into practical insights.",
        difficulty: "BEGINNER",
        groups: [
          { name: "Visualisation", description: "Create simple charts and dashboards." },
          { name: "Reporting", description: "Summarise findings clearly." },
        ],
        assessmentStructure: ["Analysis notebook", "Reporting review", "Mentor feedback"],
      },
    ],
    suggestedLearningPaths: ["Analytics workflow", "Insight delivery"],
  },
];

export function getLearningTemplateById(templateId: string) {
  return learningTemplates.find((template) => template.id === templateId) ?? null;
}
