import * as XLSX from 'xlsx'

/**
 * Parses a buffer (from multer) into an array of objects.
 * Supports .xlsx, .xls, and .csv
 */
export function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  
  return XLSX.utils.sheet_to_json(worksheet, { 
    defval: null, 
    raw: false,   
  })
}

/**
 * Standardizes common header variations into internal field names.
 */
function mapHeaders(data, mapping) {
  return data.map(row => {
    const standardized = {}
    Object.entries(mapping).forEach(([internal, variations]) => {
      const foundKey = Object.keys(row).find(key => 
        variations.includes(key.toLowerCase().trim())
      )
      standardized[internal] = foundKey ? String(row[foundKey]).trim() : null
    })
    return standardized
  })
}

export function mapStudentHeaders(data) {
  return mapHeaders(data, {
    'name': ['name', 'student name', 'full name', 'fullname'],
    'admissionNo': ['admissionno', 'admission no', 'admission number', 'id', 'enrollment no'],
    'rollNo': ['rollno', 'roll no', 'roll number', 'roll'],
    'guardianName': ['guardianname', 'guardian', 'parent name', 'father name', 'guardian name'],
    'dobAd': ['dobad', 'dob ad', 'date of birth ad', 'birth date ad'],
    'dobBs': ['dobbs', 'dob bs', 'date of birth bs', 'birth date bs'],
    'classId': ['classid', 'class id', 'class_id', 'class', 'grade'],
    'sectionId': ['sectionid', 'section id', 'section_id', 'section', 'group'],
  })
}

export function mapTeacherHeaders(data) {
  return mapHeaders(data, {
    'name': ['name', 'teacher name', 'full name', 'fullname'],
    'username': ['username', 'user', 'id', 'login'],
    'email': ['email', 'email address', 'mail'],
    'password': ['password', 'pass', 'pwd'],
  })
}

export function mapSubjectHeaders(data) {
  return mapHeaders(data, {
    'name': ['name', 'subject name', 'subject'],
    'code': ['code', 'subject code', 'id'],
    'creditHours': ['credithours', 'credit hours', 'credit', 'cr'],
    'theoryFullMarks': ['theoryfullmarks', 'theory fm', 'theory marks'],
    'practicalFullMarks': ['practicalfullmarks', 'practical fm', 'practical marks'],
    'passPercentage': ['passpercentage', 'pass %', 'pass percent'],
  })
}

export function mapClassHeaders(data) {
  return mapHeaders(data, {
    'name': ['name', 'class name', 'class', 'grade'],
    'sortOrder': ['sortorder', 'sort', 'order'],
    'sections': ['sections', 'section names', 'groups'],
  })
}
