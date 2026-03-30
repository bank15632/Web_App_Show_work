import type { TrackerPhase } from "@/lib/tracker/types";

export interface TrackerChecklistTemplateItem {
  key: string;
  label: string;
  description: string;
}

export interface TrackerChecklistTemplateSection {
  key: string;
  title: string;
  description: string;
  items: TrackerChecklistTemplateItem[];
}

export const trackerPhaseChecklistTemplates: Record<
  TrackerPhase,
  TrackerChecklistTemplateSection[]
> = {
  concept: [
    {
      key: "project_brief",
      title: "Project Brief",
      description: "กรอบตั้งต้นของโปรเจกต์ต้องชัดก่อนแตกเป็นงานย่อย",
      items: [
        {
          key: "client_objectives",
          label: "Client objectives confirmed",
          description: "ยืนยันโจทย์, เป้าหมาย และขอบเขตงานหลักของโปรเจกต์",
        },
        {
          key: "site_information",
          label: "Site information collected",
          description: "รวบรวมข้อมูล site, ข้อจำกัด และข้อมูลตั้งต้นครบแล้ว",
        },
        {
          key: "concept_direction",
          label: "Concept direction approved",
          description: "มี design direction หรือ mood/approach ที่ใช้เป็นฐานต่อยอด",
        },
      ],
    },
  ],
  schematic: [
    {
      key: "schematic_package",
      title: "Schematic Package",
      description: "เช็กว่าชุดสเก็ตช์และ zoning พร้อมคุยต่อในทีมแล้ว",
      items: [
        {
          key: "zoning_plan",
          label: "Zoning and planning diagram",
          description: "มี zoning หรือ adjacency ที่อธิบาย flow ของพื้นที่ได้",
        },
        {
          key: "schematic_layout",
          label: "Schematic layout",
          description: "มี layout หลักพร้อมฟังก์ชันและขนาดคร่าว ๆ",
        },
        {
          key: "material_direction",
          label: "Material direction",
          description: "มีภาพรวมวัสดุและ character หลักของพื้นที่",
        },
      ],
    },
  ],
  design_development: [
    {
      key: "dd_package",
      title: "Design Development",
      description: "ตรวจความพร้อมของชุดพัฒนาแบบก่อนเข้าชุดก่อสร้าง",
      items: [
        {
          key: "dimensioned_plan",
          label: "Dimensioned floor plan",
          description: "แปลนหลักมีมิติและจุดอ้างอิงที่ใช้เดินแบบต่อได้",
        },
        {
          key: "interior_elevations",
          label: "Interior elevations",
          description: "รูปด้านหลักของพื้นที่สำคัญครบและสัมพันธ์กับแปลน",
        },
        {
          key: "material_schedule",
          label: "Material and finish selections",
          description: "วัสดุและ finish หลักได้รับการเลือกและอัปเดตแล้ว",
        },
        {
          key: "consultant_coordination",
          label: "Consultant coordination round complete",
          description: "ได้ประสานงานข้าม discipline รอบสำคัญแล้ว",
        },
      ],
    },
  ],
  construction_documents: [
    {
      key: "architectural_set",
      title: "Architectural Drawing Set",
      description: "เช็กชุดแบบหลักที่ควรมีในหมวด construction documents",
      items: [
        {
          key: "floor_plan",
          label: "Floor plan",
          description: "แปลนพื้นครบพร้อมมิติ, tag และ reference ที่จำเป็น",
        },
        {
          key: "reflected_ceiling_plan",
          label: "Reflected ceiling plan",
          description: "แปลนฝ้าเพดานครบพร้อมระดับ, pattern และ reference",
        },
        {
          key: "elevations",
          label: "Elevations",
          description: "รูปด้านหลักของทุกจุดสำคัญถูกจัดชุดเรียบร้อยแล้ว",
        },
        {
          key: "sections",
          label: "Sections",
          description: "รูปตัดหลักแสดงสัมพันธ์ของพื้น, ฝ้า และ built-in ชัดเจน",
        },
        {
          key: "details",
          label: "Details and enlarged drawings",
          description: "จุดต่อ, รายละเอียด built-in และ enlarged views ครบพอออกแบบก่อสร้าง",
        },
      ],
    },
    {
      key: "mep_and_coordination",
      title: "MEP and Coordination",
      description: "เช็กแบบงานระบบและ coordination ที่ต้องออกพร้อมกัน",
      items: [
        {
          key: "electrical_plan",
          label: "Electrical lighting plan",
          description: "แปลนไฟฟ้า/แสงสว่างพร้อมตำแหน่งโคม, switch และ circuit สำคัญ",
        },
        {
          key: "power_plan",
          label: "Power and outlet plan",
          description: "ปลั๊กไฟ, power requirement และตำแหน่งใช้งานพิเศษครบ",
        },
        {
          key: "sanitary_plan",
          label: "Sanitary / plumbing plan",
          description: "แปลนสุขาภิบาลหรือ plumbing ที่เกี่ยวข้องถูกออกครบแล้ว",
        },
        {
          key: "isometric",
          label: "Isometric / system diagram",
          description: "มี isometric หรือ diagram สำหรับงานที่ต้องอธิบายระบบเพิ่ม",
        },
        {
          key: "consultant_overlay",
          label: "Consultant overlay checked",
          description: "ผ่านการซ้อนแบบและเคลียร์ clash สำคัญกับทีมที่เกี่ยวข้องแล้ว",
        },
      ],
    },
    {
      key: "issue_readiness",
      title: "Issue Readiness",
      description: "เช็กความพร้อมก่อนส่งชุดแบบหรือออก revision",
      items: [
        {
          key: "drawing_index",
          label: "Drawing index and sheet list",
          description: "sheet list, drawing index และเลขชุดแบบอัปเดตตรงกันแล้ว",
        },
        {
          key: "legend_notes",
          label: "Legends, notes, and abbreviations",
          description: "legend, general notes และตัวย่อที่ต้องใช้มีครบและสอดคล้องกัน",
        },
        {
          key: "title_block_issue_info",
          label: "Title block and issue information",
          description: "วันที่ออกแบบ, revision และข้อมูล title block ครบทุกแผ่น",
        },
        {
          key: "internal_qc",
          label: "Internal QC complete",
          description: "มีการตรวจทานภายในก่อนปล่อย drawing set แล้ว",
        },
      ],
    },
  ],
  tender: [
    {
      key: "tender_issue",
      title: "Tender Issue Set",
      description: "เช็กความพร้อมของชุด bid/tender ก่อนปล่อยออก",
      items: [
        {
          key: "bid_set",
          label: "Bid set packaged",
          description: "รวม drawing set และเอกสารแนบที่ใช้ส่งราคาไว้ครบแล้ว",
        },
        {
          key: "boq_alignment",
          label: "BOQ / quantity alignment",
          description: "รายการปริมาณและ drawing set อ้างอิงกันได้ถูกต้อง",
        },
        {
          key: "clarification_log",
          label: "Clarification log ready",
          description: "มีที่เก็บคำถามและคำชี้แจงสำหรับช่วง tender แล้ว",
        },
      ],
    },
  ],
  construction: [
    {
      key: "construction_admin",
      title: "Construction Admin",
      description: "รายการสำคัญที่ควรถูกติดตามระหว่างก่อสร้าง",
      items: [
        {
          key: "rfi_tracking",
          label: "RFI tracking active",
          description: "มีการติดตาม RFI และกำหนด owner สำหรับตอบคำถามแล้ว",
        },
        {
          key: "submittal_tracking",
          label: "Submittal tracking active",
          description: "มี log สำหรับ shop drawing และ material approval แล้ว",
        },
        {
          key: "site_issue_log",
          label: "Site issue log updated",
          description: "ปัญหาหน้างานและ defect สำคัญถูกบันทึกต่อเนื่อง",
        },
        {
          key: "as_built_markup",
          label: "As-built markup maintained",
          description: "มีการเก็บ mark-up ของหน้างานไว้เพื่อเตรียม as-built",
        },
      ],
    },
  ],
  handover: [
    {
      key: "handover_package",
      title: "Handover Package",
      description: "เช็กชุดส่งมอบก่อนปิดโปรเจกต์",
      items: [
        {
          key: "snag_list_closed",
          label: "Snag / punch list closed",
          description: "รายการเก็บงานสำคัญถูกปิดครบแล้ว",
        },
        {
          key: "as_built_drawings",
          label: "As-built drawings ready",
          description: "แบบ as-built ถูกจัดทำและส่งมอบพร้อมใช้งาน",
        },
        {
          key: "om_manuals",
          label: "O&M manuals collected",
          description: "คู่มือใช้งานและเอกสารส่งมอบถูกรวบรวมครบแล้ว",
        },
      ],
    },
  ],
};
