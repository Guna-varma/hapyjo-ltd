import { IMAGE_ALLOCATION } from "@/lib/image-allocation";

export type IndustryId =
  | "industry-road-construction"
  | "industry-mining-support"
  | "industry-industrial-logistics"
  | "industry-infrastructure-development"
  | "industry-commercial-construction";

export interface IndustryDetail {
  id: IndustryId;
  title: string;
  tagline: string;
  shortDescription: string;
  imageIndex: number;
  /** Full content for detail page */
  intro: string;
  paragraphs: string[];
  /** "What we offer" or similar */
  offeringsTitle: string;
  offerings: string[];
  /** Equipment / capabilities */
  capabilitiesTitle: string;
  capabilities: string[];
  /** CTA line */
  ctaLine: string;
}

const INDUSTRIES: IndustryDetail[] = [
  {
    id: "industry-road-construction",
    title: "Road Construction",
    tagline: "Earthworks, paving, and road network delivery",
    shortDescription: "Full-spectrum support for road projects—from earthworks and base layers to paving and finishing.",
    imageIndex: IMAGE_ALLOCATION.industries[1],
    intro: "HapyJo supports road construction projects across Rwanda and the region with equipment deployment, site logistics, and workforce transport tailored to highway, rural, and urban road programmes.",
    paragraphs: [
      "Our fleet of excavators, graders, dump trucks, and compactors is deployed for earthworks, sub-base and base course placement, and asphalt or concrete paving operations. We work with contractors and government bodies on national and district road programmes.",
      "Site logistics include material haulage, plant positioning, and coordination with survey and quality teams. We provide both project-based deployment and long-term fleet support so your road project stays on schedule.",
    ],
    offeringsTitle: "What we deliver for road construction",
    offerings: [
      "Excavators and earthmoving equipment for cut-and-fill and drainage",
      "Dump trucks and tippers for aggregate and sub-base haulage",
      "Graders and compactors for base preparation and finishing",
      "Site logistics and material handling coordination",
      "Workforce transport for crews and supervisors",
    ],
    capabilitiesTitle: "Equipment & capabilities",
    capabilities: [
      "Heavy excavators and loaders",
      "Dump trucks (various capacities)",
      "Motor graders and compactors",
      "Transit mixers for concrete sections",
      "24/7 deployment and maintenance support",
    ],
    ctaLine: "Discuss your road project scope and get a deployment plan.",
  },
  {
    id: "industry-mining-support",
    title: "Mining Support",
    tagline: "Heavy equipment and logistics for mining operations",
    shortDescription: "Equipment rental and site support for quarrying, mining, and mineral extraction projects.",
    imageIndex: IMAGE_ALLOCATION.industries[4],
    intro: "Mining and quarry operations require reliable heavy equipment, haulage, and site logistics. HapyJo provides excavators, dump trucks, loaders, and support services for extraction, overburden removal, and material transport.",
    paragraphs: [
      "We support small and mid-scale mining and quarry projects with flexible rental terms and full deployment packages. Our operators are trained for demanding terrain and we maintain equipment to high availability standards.",
      "From initial site development to ongoing production haulage, we can scale fleet and support to match your project phase and output targets.",
    ],
    offeringsTitle: "What we deliver for mining support",
    offerings: [
      "Excavators and loaders for overburden and ore handling",
      "Dump trucks for haul roads and stockpile movement",
      "Site clearing and access road preparation",
      "Fleet management and maintenance support",
      "Operator and logistics coordination",
    ],
    capabilitiesTitle: "Equipment & capabilities",
    capabilities: [
      "Excavators (various sizes)",
      "Wheel loaders and articulated dump trucks",
      "Rigid dump trucks for long hauls",
      "Drilling and support equipment coordination",
      "24/7 availability for critical operations",
    ],
    ctaLine: "Get a tailored equipment and logistics plan for your mining or quarry project.",
  },
  {
    id: "industry-industrial-logistics",
    title: "Industrial Logistics",
    tagline: "Fleet and material handling for industrial sites",
    shortDescription: "Fleet deployment, material handling, and site logistics for manufacturing and industrial projects.",
    imageIndex: IMAGE_ALLOCATION.industries[2],
    intro: "Industrial sites need predictable, efficient movement of materials and equipment. HapyJo provides fleet deployment, material handling equipment, and logistics coordination for manufacturing, warehousing, and industrial construction.",
    paragraphs: [
      "We support plant construction, machinery moves, and ongoing material flows with forklifts, handlers, and transport. Our team coordinates with your schedule to minimise downtime and keep operations running.",
      "Whether you need short-term surge capacity or ongoing logistics support, we offer flexible terms and transparent reporting.",
    ],
    offeringsTitle: "What we deliver for industrial logistics",
    offerings: [
      "Material handling equipment (forklifts, handlers)",
      "Heavy lift and machinery move support",
      "Inbound and outbound material transport",
      "Site logistics and storage coordination",
      "Workforce and contractor transport",
    ],
    capabilitiesTitle: "Equipment & capabilities",
    capabilities: [
      "Forklifts and telehandlers",
      "Rigid and articulated trucks",
      "Crane and heavy lift coordination",
      "Warehouse and yard logistics",
      "Scheduled and on-demand service",
    ],
    ctaLine: "Outline your logistics needs and we’ll propose a deployment plan.",
  },
  {
    id: "industry-infrastructure-development",
    title: "Infrastructure Development",
    tagline: "Large-scale civil and public infrastructure support",
    shortDescription: "Equipment and site support for dams, bridges, water, and large civil infrastructure programmes.",
    imageIndex: IMAGE_ALLOCATION.industries[0],
    intro: "Infrastructure projects—dams, bridges, water supply, and major civil works—require robust equipment and coordinated site operations. HapyJo supports contractors and public-sector programmes with fleet deployment, earthworks, and logistics.",
    paragraphs: [
      "We provide excavators, dump trucks, cranes, and support equipment for earthworks, concrete works, and material supply. Our experience includes support to infrastructure contractors on nationally significant projects.",
      "Project-based and framework agreements are available. We work with your programme schedule and quality requirements to deliver reliable, scalable support.",
    ],
    offeringsTitle: "What we deliver for infrastructure",
    offerings: [
      "Earthworks and bulk excavation equipment",
      "Concrete supply and placement support",
      "Heavy lift and crane coordination",
      "Aggregate and material haulage",
      "Site logistics and workforce transport",
    ],
    capabilitiesTitle: "Equipment & capabilities",
    capabilities: [
      "Excavators and loaders (multiple sizes)",
      "Dump trucks and transit mixers",
      "Cranes and heavy lift equipment",
      "Compaction and finishing plant",
      "Full project lifecycle support",
    ],
    ctaLine: "Discuss your infrastructure project and equipment requirements.",
  },
  {
    id: "industry-commercial-construction",
    title: "Commercial Construction",
    tagline: "Site support for commercial and building projects",
    shortDescription: "Equipment and logistics for commercial buildings, retail, and mixed-use development.",
    imageIndex: IMAGE_ALLOCATION.industries[5],
    intro: "Commercial construction—office, retail, and mixed-use developments—benefits from timely earthworks, material delivery, and site logistics. HapyJo supports main contractors and developers with equipment rental and on-site coordination.",
    paragraphs: [
      "We provide excavators, loaders, and dump trucks for foundation works, basement excavation, and site preparation. Material handling and workforce transport keep your programme on track in busy urban and suburban sites.",
      "Flexible daily, weekly, or project-based terms allow you to scale equipment to project phase and avoid long-term lock-in.",
    ],
    offeringsTitle: "What we deliver for commercial construction",
    offerings: [
      "Excavation and foundation equipment",
      "Material delivery and waste removal",
      "Crane and lifting support coordination",
      "Site access and logistics planning",
      "Workforce and subcontractor transport",
    ],
    capabilitiesTitle: "Equipment & capabilities",
    capabilities: [
      "Excavators and mini excavators",
      "Dump trucks and tippers",
      "Loaders and telehandlers",
      "Waste and recycling haulage",
      "Scheduled deliveries and ad-hoc support",
    ],
    ctaLine: "Get equipment and logistics support for your next commercial build.",
  },
];

export const INDUSTRY_PAGE_IDS = INDUSTRIES.map((i) => i.id) as IndustryId[];

export function getIndustryById(id: string): IndustryDetail | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

/** For the Industries listing: same order as cards, with id for linking */
export function getIndustriesForListing(): { id: IndustryId; title: string; shortDescription: string; imageIndex: number }[] {
  return INDUSTRIES.map(({ id, title, shortDescription, imageIndex }) => ({
    id,
    title,
    shortDescription,
    imageIndex,
  }));
}
