import React from 'react';
import Navbar from '../components/Navbar';
import MarkdownRenderer from '../components/MarkdownRenderer';

const TEST_CONTENT = `
# Sistem Persamaan Linear

Sistem persamaan linear adalah kumpulan **dua atau lebih** persamaan linear yang saling terkait.

## Bentuk Umum

Untuk tiga variabel $(x, y, z)$:

$$
\\begin{cases}
a_1x + b_1y + c_1z = d_1 \\\\
a_2x + b_2y + c_2z = d_2 \\\\
a_3x + b_3y + c_3z = d_3
\\end{cases}
$$

dengan $a, b, c, d \\in \\mathbb{R}$ dan $a, b, c$ tidak semuanya nol.

## Tiga Kemungkinan Solusi

1. **Memiliki satu solusi** — jika ketiga bidang berpotongan di satu titik
2. **Tidak memiliki solusi** — jika bidang-bidang sejajar
3. **Tak hingga solusi** — jika bidang berimpit

> 💡 **Catatan:** Sistem persamaan linear adalah dasar dari banyak topik matematika lanjutan.

## Rumus Cepat

Rumus untuk menghitung akar persamaan kuadrat $ax^2 + bx + c = 0$:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

### Contoh Tabel

| Variabel | Nilai |
|----------|-------|
| $x$      | 5     |
| $y$      | 3     |
| $z$      | 2     |

---

**Semangat belajar!** 🚀
`;

const TestMateri = () => {
  return (
    <div className="page-bg min-h-screen pb-20">
      <div className="grid-pattern"></div>
      <Navbar />
      <div className="page-content max-w-3xl mx-auto px-4 pt-8 pb-6">
        <div className="card-elevated rounded-2xl p-6 sm:p-8">
          <MarkdownRenderer content={TEST_CONTENT} />
        </div>
      </div>
    </div>
  );
};

export default TestMateri;