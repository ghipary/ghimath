// Data dummy materi untuk testing
// PDF pakai link contoh dari W3C (bisa dibuka di iframe)
// Nanti akan diganti dengan data dari Firebase Storage

export const dummyMaterials = [
  {
    id: "mat-001",
    title: "Persamaan Linear Satu Variabel",
    level: "SMP",
    grade: 7,
    topic: "Aljabar",
    description: "Belajar menyelesaikan persamaan linear satu variabel dengan mudah dan menyenangkan.",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "persamaan-linear.pdf",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    published: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mat-002",
    title: "Teorema Pythagoras",
    level: "SMP",
    grade: 8,
    topic: "Geometri",
    description: "Memahami hubungan sisi-sisi segitiga siku-siku dan penerapannya dalam kehidupan sehari-hari.",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "pythagoras.pdf",
    videoUrl: null,
    published: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mat-003",
    title: "Persamaan Kuadrat",
    level: "SMA",
    grade: 10,
    topic: "Aljabar",
    description: "Mengenal bentuk umum persamaan kuadrat dan cara menyelesaikannya dengan berbagai metode.",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "persamaan-kuadrat.pdf",
    videoUrl: null,
    published: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mat-004",
    title: "Statistika Dasar",
    level: "SMP",
    grade: 8,
    topic: "Statistika",
    description: "Mengenal mean, median, dan modus. Serta cara menyajikan data dalam diagram.",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "statistika.pdf",
    videoUrl: null,
    published: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mat-005",
    title: "Trigonometri Dasar",
    level: "SMA",
    grade: 10,
    topic: "Trigonometri",
    description: "Mengenal sinus, cosinus, dan tangen. Serta penerapannya dalam segitiga.",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "trigonometri.pdf",
    videoUrl: null,
    published: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mat-006",
    title: "Limit Fungsi",
    level: "SMA",
    grade: 11,
    topic: "Kalkulus",
    description: "Memahami konsep limit fungsi aljabar dan cara menyelesaikannya.",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "limit-fungsi.pdf",
    videoUrl: null,
    published: true,
    createdAt: new Date().toISOString()
  }
];

// Daftar topik untuk filter
export const topics = ["Semua", "Aljabar", "Geometri", "Statistika", "Trigonometri", "Kalkulus"];

// Daftar kelas untuk filter
export const grades = ["Semua", 7, 8, 9, 10, 11, 12];