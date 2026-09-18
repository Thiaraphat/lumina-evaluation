/**
 * Lumina Electric Air — question bank (Thai)
 * Single source of truth so the evaluation flow and the results dashboard
 * always show identical wording.
 */

const LIKERT_OPTIONS = [
  { value: 5, label: 'มากที่สุด' },
  { value: 4, label: 'มาก' },
  { value: 3, label: 'ปานกลาง' },
  { value: 2, label: 'น้อย' },
  { value: 1, label: 'น้อยที่สุด' }
];

const GENERAL_COMMON_FIELDS = [
  {
    key: 'gender',
    label: 'เพศ',
    options: ['ชาย', 'หญิง', 'ไม่ประสงค์ระบุ']
  },
  {
    key: 'age_range',
    label: 'ช่วงอายุ',
    options: ['ต่ำกว่า 20 ปี', '20–29 ปี', '30–39 ปี', '40–49 ปี', '50 ปีขึ้นไป']
  },
  {
    key: 'lumina_experience',
    label: 'ประสบการณ์การใช้งานระบบ Lumina',
    options: ['ยังไม่เคยใช้งานจริง', 'เคยใช้งาน', 'ใช้งานเป็นประจำ']
  }
];

const CUSTOMER_EXTRA_FIELD = {
  key: 'customer_channel',
  label: 'ช่องทางที่ใช้ติดต่อหรือรับบริการจาก Lumina',
  options: ['แอป', 'LINE', 'ติดต่อร้านโดยตรง', 'มากกว่า 1 ช่องทาง']
};

const TECHNICIAN_EXTRA_FIELD = {
  key: 'technician_experience',
  label: 'ประสบการณ์การทำงานเป็นช่างเครื่องปรับอากาศ',
  options: ['ต่ำกว่า 1 ปี', '1–3 ปี', '4–6 ปี', 'มากกว่า 6 ปี']
};

const CUSTOMER_QUESTIONS = [
  { id: 1, title: 'ด้านความสะดวกในการใช้งาน', text: 'ระบบ Lumina ช่วยให้การติดต่อและขอรับบริการเครื่องปรับอากาศมีความสะดวกมากขึ้น' },
  { id: 2, title: 'ด้านการออกแบบและส่วนติดต่อผู้ใช้ (UI/UX)', text: 'การจัดวางเมนู ปุ่ม และข้อมูลภายในระบบมีความเหมาะสมและเข้าใจง่าย' },
  { id: 3, title: 'ด้านความชัดเจนของข้อมูล', text: 'ข้อมูลเกี่ยวกับบริการ ราคา รายละเอียดเครื่องปรับอากาศ และสถานะการให้บริการมีความชัดเจน' },
  { id: 4, title: 'ด้านการจองบริการ', text: 'ระบบช่วยให้การจองคิวและติดตามข้อมูลการให้บริการทำได้ง่ายและเป็นระบบ' },
  { id: 5, title: 'ด้านการติดตามสถานะงาน', text: 'ระบบช่วยให้สามารถทราบสถานะการให้บริการของช่างได้อย่างชัดเจน' },
  { id: 6, title: 'ด้านข้อมูลเครื่องปรับอากาศ', text: 'ระบบช่วยให้ข้อมูลเกี่ยวกับเครื่องปรับอากาศของลูกค้าได้รับการจัดเก็บและค้นหาได้สะดวก' },
  { id: 7, title: 'ด้านการติดต่อสื่อสาร', text: 'ระบบช่วยให้การติดต่อกับแอดมินหรือเจ้าหน้าที่เกี่ยวกับการใช้บริการทำได้สะดวกขึ้น' },
  { id: 8, title: 'ด้านประสิทธิภาพของระบบ', text: 'ระบบช่วยลดความซ้ำซ้อน ความผิดพลาด และขั้นตอนในการติดต่อขอรับบริการ' },
  { id: 9, title: 'ด้านประโยชน์ที่ได้รับ', text: 'ระบบ Lumina ช่วยให้การใช้บริการเครื่องปรับอากาศมีความเป็นระบบและตอบสนองความต้องการของลูกค้าได้' },
  { id: 10, title: 'ด้านความพึงพอใจโดยรวม', text: 'โดยรวมแล้ว ท่านมีความพึงพอใจต่อระบบ Lumina Electric Air' }
];

const TECHNICIAN_QUESTIONS = [
  { id: 1, title: 'ด้านความสะดวกในการใช้งาน', text: 'ระบบ Lumina ช่วยให้การปฏิบัติงานและการรับข้อมูลเกี่ยวกับงานบริการมีความสะดวกมากขึ้น' },
  { id: 2, title: 'ด้านการออกแบบและส่วนติดต่อผู้ใช้ (UI/UX)', text: 'การจัดวางเมนู ปุ่ม และข้อมูลภายในระบบมีความเหมาะสมและเข้าใจง่ายสำหรับการทำงานของช่าง' },
  { id: 3, title: 'ด้านความชัดเจนของข้อมูล', text: 'ข้อมูลเกี่ยวกับงาน ลูกค้า สถานที่ และรายละเอียดการให้บริการมีความชัดเจนและเพียงพอต่อการปฏิบัติงาน' },
  { id: 4, title: 'ด้านการรับข้อมูลงาน', text: 'ระบบช่วยให้ช่างสามารถตรวจสอบงานที่ได้รับมอบหมายและรายละเอียดของงานได้อย่างสะดวก' },
  { id: 5, title: 'ด้านการอัปเดตสถานะงาน', text: 'ระบบช่วยให้ช่างสามารถอัปเดตสถานะการปฏิบัติงานได้ง่ายและเป็นขั้นตอน' },
  { id: 6, title: 'ด้านข้อมูลเครื่องปรับอากาศ', text: 'ระบบช่วยให้ช่างสามารถดูข้อมูลเครื่องปรับอากาศของลูกค้าเพื่อใช้ประกอบการทำงานได้สะดวก' },
  { id: 7, title: 'ด้านการติดต่อสื่อสารกับแอดมิน', text: 'ระบบช่วยให้ช่างสามารถติดต่อและประสานงานกับแอดมินได้สะดวกขึ้น' },
  { id: 8, title: 'ด้านประสิทธิภาพในการทำงาน', text: 'ระบบช่วยลดขั้นตอน ความซ้ำซ้อน และความผิดพลาดในการปฏิบัติงาน' },
  { id: 9, title: 'ด้านประโยชน์ที่ได้รับ', text: 'ระบบ Lumina ช่วยให้การทำงานของช่างมีความเป็นระบบและสามารถประสานงานกับแอดมินได้ดีขึ้น' },
  { id: 10, title: 'ด้านความพึงพอใจโดยรวม', text: 'โดยรวมแล้ว ท่านมีความพึงพอใจต่อระบบ Lumina Electric Air' }
];

// Neutral dimension labels for the dashboard's "All" filter, where a single
// question row represents both a customer-worded and a technician-worded
// question. Using either group's actual wording to represent both would
// misattribute it, so this set intentionally has no full question "text" —
// only the shared dimension name.
const NEUTRAL_QUESTIONS = [
  { id: 1, title: 'ด้านความสะดวกในการใช้งาน' },
  { id: 2, title: 'ด้านการออกแบบและส่วนติดต่อผู้ใช้ (UI/UX)' },
  { id: 3, title: 'ด้านความชัดเจนของข้อมูล' },
  { id: 4, title: 'ด้านการจองบริการ / การรับข้อมูลงาน' },
  { id: 5, title: 'ด้านการติดตามสถานะงาน / การอัปเดตสถานะงาน' },
  { id: 6, title: 'ด้านข้อมูลเครื่องปรับอากาศ' },
  { id: 7, title: 'ด้านการติดต่อสื่อสาร' },
  { id: 8, title: 'ด้านประสิทธิภาพของระบบ / การทำงาน' },
  { id: 9, title: 'ด้านประโยชน์ที่ได้รับ' },
  { id: 10, title: 'ด้านความพึงพอใจโดยรวม' }
];

function getQuestionsFor(evaluatorType) {
  return evaluatorType === 'technician' ? TECHNICIAN_QUESTIONS : CUSTOMER_QUESTIONS;
}

function getExtraFieldFor(evaluatorType) {
  return evaluatorType === 'technician' ? TECHNICIAN_EXTRA_FIELD : CUSTOMER_EXTRA_FIELD;
}

// Used only by the results dashboard, which also has an "all" filter that
// getQuestionsFor() does not support (it only knows customer/technician,
// which is correct for the evaluator-facing flow and must stay that way).
function getLabelSetFor(filter) {
  if (filter === 'technician') return TECHNICIAN_QUESTIONS;
  if (filter === 'customer') return CUSTOMER_QUESTIONS;
  return NEUTRAL_QUESTIONS;
}
