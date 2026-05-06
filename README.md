# GradeX - Multi-Tenant School Management & Grading System

GradeX is a state-of-the-art, multi-tenant academic platform designed to streamline school administration, grading, and reporting. Built with a modern tech stack, it provides a seamless experience for Super Admins, School Administrators, Teachers, and Students.

## 🚀 Key Features

### 🏢 Multi-Tenant Infrastructure
*   **White-Labeling**: Each school can have its own branding, including logos and digital signatures on report cards.
*   **Isolated Data**: Secure multi-tenancy ensuring data privacy between different institutions.
*   **Custom Grading Rules**: Schools can define their own grading scales (e.g., A+, A, B, etc.) with specific GPA values and percentage ranges.

### 🎓 Academic Management
*   **Hierarchical Structure**: Manage Classes, Sections, and Subjects with ease.
*   **Teacher Assignments**: Map teachers to specific classes and subjects for focused data entry.
*   **Student Information System (SIS)**: Comprehensive student profiles including admission details, guardian information, and academic history.

### 📝 Advanced Grading & Reporting
*   **Smart Mark Entry**: Intuitive interface for teachers to enter Theory and Practical marks.
*   **Automated Calculation Engine**: Instant calculation of percentages, grades, subject GPAs, and overall weighted GPA.
*   **Professional PDF Report Cards**: High-quality, printable report cards generated dynamically with school branding, zebra-striped performance tables, and summary bars.
*   **Result Verification**: Status tracking (Pass/Fail/Absent) and result locking mechanisms.

### 🔒 Security & Roles
*   **RBAC (Role-Based Access Control)**: Granular permissions for Super Admin, Admin, Teacher, and Student.
*   **Secure Authentication**: JWT-based authentication with bcrypt password hashing.

## 🛠 Tech Stack

*   **Frontend**: React 19, Vite, Tailwind CSS 4, Radix UI, Zustand, Lucide React.
*   **Backend**: Node.js, Express 5.
*   **Database**: PostgreSQL with Prisma ORM (Neon for serverless hosting).
*   **Media**: Cloudinary for logo and signature storage.
*   **PDF Generation**: PDFKit for precision report card design.

## 📈 What's Done So Far

- [x] Multi-tenant database schema design.
- [x] Super Admin dashboard for school management and onboarding.
- [x] Secure authentication and role-based routing.
- [x] Dynamic school-specific branding (logos and signatures).
- [x] Comprehensive grading engine with custom school rules.
- [x] Bulk calculation of exam results.
- [x] Professional PDF Report Card generator.
- [x] Modern, responsive Dashboards for Admins and Teachers.

## 💡 Further Improvements & Features

### 📅 Short-Term
*   **Bulk Import/Export**: Enable CSV/Excel imports for student lists and bulk mark entry.
*   **Attendance Tracking**: A module for teachers to record daily attendance.
*   **Exam Timetable**: Schedule exams and notify students/parents.

### 🚀 Long-Term
*   **Student/Parent Mobile App**: Real-time notifications and easy access to results and attendance.
*   **Fee Management System**: Integrated payment gateways for school fee collection.
*   **Analytics Dashboard**: Visual trends of student performance and class-wise comparisons using charts.
*   **Communication Portal**: In-app messaging between teachers, parents, and administrators.
*   **Library & Inventory Management**: Modules for managing school resources.
*   **i18n Support**: Multilingual support, including local calendars (e.g., Bikram Sambat).

## 🛠 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/gradex.git
    cd gradex
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root and server directories with the following keys:
    *   `DATABASE_URL`
    *   `JWT_SECRET`
    *   `CLOUDINARY_URL`

4.  **Database Migration**:
    ```bash
    npx prisma migrate dev
    ```

5.  **Run the application**:
    ```bash
    npm run dev:full
    ```

---
Built with ❤️ for better academic management.
