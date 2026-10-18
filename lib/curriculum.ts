export type GradeLevel = 10 | 11 | 12;
export type Material = {
  id: string; grade: GradeLevel; title: string; summary: string; duration: string;
  objectives: string[]; explanation: string[]; formulas: string[];
  example: { problem: string; steps: string[] };
  quiz: { prompt: string; options: { id: string; text: string }[]; correctOption: string; explanation: string };
};
// ReThink learning sequence. Schools can distribute Fase F topics differently.
export const materials: Material[] = [
{
  "id": "x-exponents",
  "grade": 10,
  "title": "Eksponen dan logaritma",
  "summary": "Dari perkalian berulang ke pangkat yang belum diketahui.",
  "duration": "10–15 menit",
  "objectives": [
    "Menggunakan aturan pangkat",
    "Menghubungkan eksponen dengan logaritma"
  ],
  "explanation": [
    "Eksponen menyatakan perkalian berulang: 2³ berarti 2 × 2 × 2. Ketika dua pangkat dengan basis sama dikalikan, banyaknya faktor dijumlahkan. Aturan ini berlaku untuk perkalian, bukan penjumlahan.",
    "Logaritma membalik pertanyaan eksponen. Jika 2³ = 8, maka log₂ 8 = 3. Untuk logaritma real, basis harus positif dan bukan 1, serta bilangan yang dilogaritmakan harus positif."
  ],
  "formulas": [
    "aᵐ × aⁿ = aᵐ⁺ⁿ",
    "(aᵐ)ⁿ = aᵐⁿ",
    "logₐ b = c ⇔ aᶜ = b; a > 0, a ≠ 1, b > 0"
  ],
  "example": {
    "problem": "Tentukan log₂ 32.",
    "steps": [
      "Ubah pertanyaan menjadi 2 pangkat berapa yang menghasilkan 32.",
      "2 × 2 × 2 × 2 × 2 = 32.",
      "Jadi log₂ 32 = 5."
    ]
  },
  "quiz": {
    "prompt": "Berapakah nilai 3² × 3³?",
    "options": [
      {
        "id": "a",
        "text": "3⁶"
      },
      {
        "id": "b",
        "text": "3⁵"
      },
      {
        "id": "c",
        "text": "6⁵"
      },
      {
        "id": "d",
        "text": "9⁶"
      }
    ],
    "correctOption": "b",
    "explanation": "Basisnya sama, sehingga pangkat dijumlahkan: 3² × 3³ = 3²⁺³ = 3⁵."
  }
},
{
  "id": "x-linear",
  "grade": 10,
  "title": "Sistem persamaan linear",
  "summary": "Temukan satu solusi yang memenuhi beberapa persamaan.",
  "duration": "10–15 menit",
  "objectives": [
    "Menyelesaikan SPLDV dengan eliminasi",
    "Memeriksa solusi pada kedua persamaan"
  ],
  "explanation": [
    "Sistem persamaan meminta nilai variabel yang membuat semua persamaan benar sekaligus. Setiap persamaan dua variabel dapat dilihat sebagai garis; titik potongnya memenuhi keduanya.",
    "Eliminasi menghilangkan satu variabel dengan menjumlahkan atau mengurangkan persamaan. Gunakan operasi yang menjaga kesetaraan, lalu substitusikan hasilnya untuk menemukan variabel lain. Untuk tiga variabel, lakukan eliminasi bertahap hingga tersisa sistem dua variabel."
  ],
  "formulas": [
    "ax + by = c",
    "Solusi (x, y) harus memenuhi setiap persamaan"
  ],
  "example": {
    "problem": "Selesaikan x + y = 7 dan x − y = 1.",
    "steps": [
      "Jumlahkan kedua persamaan: 2x = 8.",
      "Bagi kedua sisi dengan 2: x = 4.",
      "Substitusikan: 4 + y = 7, jadi y = 3. Periksa: 4 − 3 = 1."
    ]
  },
  "quiz": {
    "prompt": "Jika x + y = 9 dan x − y = 3, berapakah x?",
    "options": [
      {
        "id": "a",
        "text": "3"
      },
      {
        "id": "b",
        "text": "4"
      },
      {
        "id": "c",
        "text": "6"
      },
      {
        "id": "d",
        "text": "12"
      }
    ],
    "correctOption": "c",
    "explanation": "Jumlahkan kedua persamaan: 2x = 12. Jadi x = 6 dan y = 3."
  }
},
{
  "id": "x-quadratic",
  "grade": 10,
  "title": "Persamaan dan fungsi kuadrat",
  "summary": "Kenali akar, parabola, dan titik balik.",
  "duration": "10–15 menit",
  "objectives": [
    "Menentukan akar persamaan kuadrat",
    "Menghubungkan akar dengan grafik fungsi"
  ],
  "explanation": [
    "Persamaan kuadrat memiliki pangkat variabel tertinggi dua. Akarnya adalah nilai x yang membuat bentuk kuadrat bernilai nol. Jika bentuknya dapat difaktorkan, gunakan sifat hasil kali nol: setidaknya satu faktor bernilai nol.",
    "Grafik y = ax² + bx + c berupa parabola. Untuk a > 0 grafik terbuka ke atas; untuk a < 0 terbuka ke bawah. Diskriminan memberi tahu banyaknya akar real, sedangkan sumbu simetri melewati titik balik."
  ],
  "formulas": [
    "ax² + bx + c = 0; a ≠ 0",
    "D = b² − 4ac",
    "x = (−b ± √D) / (2a)",
    "Sumbu simetri: x = −b / (2a)"
  ],
  "example": {
    "problem": "Cari akar x² − 5x + 6 = 0.",
    "steps": [
      "Cari dua bilangan yang hasil kalinya 6 dan jumlahnya −5: −2 dan −3.",
      "Faktorkan: (x − 2)(x − 3) = 0.",
      "Jadi x = 2 atau x = 3. Keduanya membuat fungsi bernilai nol."
    ]
  },
  "quiz": {
    "prompt": "Apa akar-akar dari x² − 7x + 12 = 0?",
    "options": [
      {
        "id": "a",
        "text": "2 dan 6"
      },
      {
        "id": "b",
        "text": "−3 dan −4"
      },
      {
        "id": "c",
        "text": "1 dan 12"
      },
      {
        "id": "d",
        "text": "3 dan 4"
      }
    ],
    "correctOption": "d",
    "explanation": "x² − 7x + 12 = (x − 3)(x − 4), sehingga akarnya 3 dan 4."
  }
},
{
  "id": "x-trigonometry",
  "grade": 10,
  "title": "Perbandingan trigonometri",
  "summary": "Hubungkan sudut dengan perbandingan sisi segitiga.",
  "duration": "10–15 menit",
  "objectives": [
    "Membedakan sisi depan, samping, dan miring",
    "Menggunakan sinus, kosinus, dan tangen"
  ],
  "explanation": [
    "Pada segitiga siku-siku, sisi miring berhadapan dengan sudut siku-siku. Sisi depan dan samping ditentukan terhadap sudut yang sedang dibahas. Jika sudut acuannya berubah, nama kedua sisi itu dapat bertukar.",
    "Sinus, kosinus, dan tangen adalah perbandingan sisi. Segitiga dengan sudut sama memiliki perbandingan yang sama walaupun ukurannya berbeda. Gunakan satuan sudut yang konsisten saat memakai kalkulator."
  ],
  "formulas": [
    "sin θ = depan / miring",
    "cos θ = samping / miring",
    "tan θ = depan / samping"
  ],
  "example": {
    "problem": "Sebuah segitiga siku-siku memiliki sisi depan 3, samping 4, dan miring 5 terhadap sudut θ. Tentukan sin θ.",
    "steps": [
      "Pilih dua sisi untuk sinus: depan dan miring.",
      "Substitusikan panjangnya: sin θ = 3 / 5.",
      "Panjang sisi samping tidak dipakai pada perbandingan sinus."
    ]
  },
  "quiz": {
    "prompt": "Sisi depan sudut θ adalah 6 dan sisi sampingnya 8. Berapa tan θ?",
    "options": [
      {
        "id": "a",
        "text": "3/4"
      },
      {
        "id": "b",
        "text": "4/3"
      },
      {
        "id": "c",
        "text": "3/5"
      },
      {
        "id": "d",
        "text": "4/5"
      }
    ],
    "correctOption": "a",
    "explanation": "Tangen membandingkan sisi depan dengan samping: 6/8 = 3/4."
  }
},
{
  "id": "x-statistics",
  "grade": 10,
  "title": "Statistika dan penyajian data",
  "summary": "Baca sebaran data, bukan hanya satu angka rata-rata.",
  "duration": "10–15 menit",
  "objectives": [
    "Menghitung mean dan median",
    "Membaca ukuran penyebaran sederhana"
  ],
  "explanation": [
    "Mean membagi jumlah semua nilai dengan banyaknya data. Median adalah nilai tengah setelah data diurutkan. Untuk banyak data genap, median adalah rata-rata dua nilai tengah. Modus adalah nilai yang paling sering muncul.",
    "Ukuran pusat perlu dibaca bersama sebaran data. Jangkauan adalah selisih nilai terbesar dan terkecil. Nilai yang sangat ekstrem dapat menggeser mean, sehingga median kadang lebih mewakili pusat data."
  ],
  "formulas": [
    "Mean = jumlah nilai / banyak data",
    "Jangkauan = maksimum − minimum"
  ],
  "example": {
    "problem": "Tentukan median data 8, 2, 6, 4, 10.",
    "steps": [
      "Urutkan data: 2, 4, 6, 8, 10.",
      "Ada lima nilai, sehingga median berada pada urutan ketiga.",
      "Median = 6; mean juga 30/5 = 6 pada contoh ini."
    ]
  },
  "quiz": {
    "prompt": "Berapa mean dari data 4, 6, 8, dan 10?",
    "options": [
      {
        "id": "a",
        "text": "6"
      },
      {
        "id": "b",
        "text": "8"
      },
      {
        "id": "c",
        "text": "7"
      },
      {
        "id": "d",
        "text": "28"
      }
    ],
    "correctOption": "c",
    "explanation": "Jumlah data adalah 28, banyak data 4. Mean = 28/4 = 7."
  }
},
{
  "id": "x-probability",
  "grade": 10,
  "title": "Peluang dasar",
  "summary": "Bedakan semua kemungkinan dengan kejadian yang dicari.",
  "duration": "10–15 menit",
  "objectives": [
    "Menyusun ruang sampel sederhana",
    "Menghitung peluang pada hasil yang sama mungkin"
  ],
  "explanation": [
    "Ruang sampel memuat semua hasil yang mungkin. Kejadian adalah kumpulan hasil yang memenuhi syarat tertentu. Untuk hasil yang sama mungkin, peluang diperoleh dari banyak hasil yang diinginkan dibagi banyak seluruh hasil.",
    "Nilai peluang berada antara 0 dan 1. Peluang 0 menyatakan kejadian mustahil, sedangkan 1 menyatakan kejadian pasti. Komplemen kejadian A adalah semua hasil yang tidak termasuk A."
  ],
  "formulas": [
    "P(A) = n(A) / n(S), untuk hasil yang sama mungkin",
    "P(bukan A) = 1 − P(A)"
  ],
  "example": {
    "problem": "Dadu adil dilempar sekali. Berapa peluang mendapat bilangan genap?",
    "steps": [
      "Ruang sampel: 1, 2, 3, 4, 5, 6.",
      "Bilangan genap: 2, 4, 6, sebanyak tiga hasil.",
      "P(genap) = 3/6 = 1/2."
    ]
  },
  "quiz": {
    "prompt": "Pada satu lemparan dadu adil, berapa peluang mendapat angka lebih dari 4?",
    "options": [
      {
        "id": "a",
        "text": "1/6"
      },
      {
        "id": "b",
        "text": "1/3"
      },
      {
        "id": "c",
        "text": "1/2"
      },
      {
        "id": "d",
        "text": "2/3"
      }
    ],
    "correctOption": "b",
    "explanation": "Angka yang memenuhi adalah 5 dan 6, jadi peluangnya 2/6 = 1/3."
  }
},
{
  "id": "xi-functions",
  "grade": 11,
  "title": "Fungsi dan domain",
  "summary": "Pahami aturan yang memasangkan setiap masukan ke satu keluaran.",
  "duration": "10–15 menit",
  "objectives": [
    "Menghitung nilai fungsi",
    "Menentukan batasan domain sederhana"
  ],
  "explanation": [
    "Fungsi memasangkan setiap anggota domain dengan tepat satu keluaran. Notasi f(x) menyatakan nilai keluaran saat masukannya x; f(x) bukan berarti f dikalikan x.",
    "Domain adalah himpunan masukan yang diizinkan. Pada fungsi pecahan, penyebut tidak boleh nol. Pada akar kuadrat dalam bilangan real, bagian di dalam akar harus tidak negatif. Periksa batasan ini sebelum menghitung."
  ],
  "formulas": [
    "f(x) = 2x + 3 ⇒ f(a) = 2a + 3",
    "f(x) = 1/(x − a) ⇒ x ≠ a"
  ],
  "example": {
    "problem": "Jika f(x) = 2x + 3, tentukan f(4).",
    "steps": [
      "Ganti setiap x dengan 4.",
      "Hitung 2 × 4 + 3.",
      "Diperoleh f(4) = 11."
    ]
  },
  "quiz": {
    "prompt": "Nilai mana yang harus dikeluarkan dari domain f(x) = 1/(x − 2)?",
    "options": [
      {
        "id": "a",
        "text": "0"
      },
      {
        "id": "b",
        "text": "−2"
      },
      {
        "id": "c",
        "text": "1"
      },
      {
        "id": "d",
        "text": "2"
      }
    ],
    "correctOption": "d",
    "explanation": "Untuk x = 2, penyebut menjadi nol. Maka domainnya semua bilangan real kecuali 2."
  }
},
{
  "id": "xi-composition",
  "grade": 11,
  "title": "Komposisi dan invers fungsi",
  "summary": "Rangkai dua aturan, lalu telusuri kembali arahnya.",
  "duration": "10–15 menit",
  "objectives": [
    "Menentukan urutan komposisi fungsi",
    "Menemukan invers fungsi linear"
  ],
  "explanation": [
    "Komposisi menjalankan satu fungsi lalu memasukkan hasilnya ke fungsi lain. Pada (f ∘ g)(x), kerjakan g terlebih dahulu. Urutan penting: f ∘ g umumnya berbeda dari g ∘ f.",
    "Fungsi invers mengembalikan keluaran ke masukan semula. Suatu fungsi memiliki invers pada domain yang membuatnya satu-satu. Untuk mencari invers fungsi linear, tulis y = f(x), selesaikan x dalam y, lalu tukar nama variabel."
  ],
  "formulas": [
    "(f ∘ g)(x) = f(g(x))",
    "f(x) = ax + b ⇒ f⁻¹(x) = (x − b)/a; a ≠ 0"
  ],
  "example": {
    "problem": "Jika f(x) = 2x dan g(x) = x + 3, tentukan (f ∘ g)(4).",
    "steps": [
      "Hitung g(4) = 4 + 3 = 7.",
      "Masukkan hasilnya ke f: f(7) = 2 × 7.",
      "Jadi (f ∘ g)(4) = 14."
    ]
  },
  "quiz": {
    "prompt": "Jika f(x) = 3x − 6, berapakah f⁻¹(9)?",
    "options": [
      {
        "id": "a",
        "text": "1"
      },
      {
        "id": "b",
        "text": "5"
      },
      {
        "id": "c",
        "text": "9"
      },
      {
        "id": "d",
        "text": "21"
      }
    ],
    "correctOption": "b",
    "explanation": "Selesaikan 3x − 6 = 9: 3x = 15 dan x = 5. Invers mengembalikan 9 ke masukan 5."
  }
},
{
  "id": "xi-transformations",
  "grade": 11,
  "title": "Transformasi grafik fungsi",
  "summary": "Lihat bagaimana pergeseran mengubah grafik.",
  "duration": "10–15 menit",
  "objectives": [
    "Membedakan translasi horizontal dan vertikal",
    "Mengenali refleksi grafik"
  ],
  "explanation": [
    "Menambahkan konstanta di luar fungsi menggeser seluruh keluaran. Grafik y = f(x) + k bergeser ke atas k satuan jika k positif. Mengubah masukan memiliki arah berbeda: y = f(x − h) bergeser ke kanan h satuan.",
    "Tanda minus di luar fungsi mencerminkan grafik terhadap sumbu x. Tanda minus pada masukan mencerminkan terhadap sumbu y. Menelusuri satu titik yang sudah dikenal membantu memeriksa arah transformasi."
  ],
  "formulas": [
    "y = f(x − h) + k: geser (h, k)",
    "y = −f(x): refleksi terhadap sumbu x",
    "y = f(−x): refleksi terhadap sumbu y"
  ],
  "example": {
    "problem": "Dari y = x² menjadi y = (x − 2)² + 3, ke mana titik puncaknya berpindah?",
    "steps": [
      "Puncak awal adalah (0, 0).",
      "Bentuk x − 2 menggeser grafik dua satuan ke kanan.",
      "Tambahan +3 menggesernya tiga satuan ke atas. Puncak baru (2, 3)."
    ]
  },
  "quiz": {
    "prompt": "Grafik y = f(x) − 4 adalah grafik awal yang digeser…",
    "options": [
      {
        "id": "a",
        "text": "4 satuan ke kiri"
      },
      {
        "id": "b",
        "text": "4 satuan ke kanan"
      },
      {
        "id": "c",
        "text": "4 satuan ke bawah"
      },
      {
        "id": "d",
        "text": "4 satuan ke atas"
      }
    ],
    "correctOption": "c",
    "explanation": "Pengurangan 4 terjadi pada nilai keluaran, sehingga setiap titik bergeser 4 satuan ke bawah."
  }
},
{
  "id": "xi-circles",
  "grade": 11,
  "title": "Lingkaran, busur, dan juring",
  "summary": "Hubungkan sudut pusat dengan bagian lingkaran.",
  "duration": "10–15 menit",
  "objectives": [
    "Menghitung panjang busur dan luas juring",
    "Menghubungkan sudut pusat dan sudut keliling"
  ],
  "explanation": [
    "Busur adalah bagian keliling lingkaran; juring adalah daerah yang dibatasi dua jari-jari dan sebuah busur. Jika sudut pusatnya θ derajat, bagian yang diambil adalah θ/360 dari lingkaran penuh.",
    "Sudut keliling yang menghadap busur sama besarnya setengah sudut pusat. Pastikan busur yang dibandingkan benar-benar sama. Panjang busur memiliki satuan panjang, sedangkan luas juring memiliki satuan luas."
  ],
  "formulas": [
    "Panjang busur = (θ/360°) × 2πr",
    "Luas juring = (θ/360°) × πr²",
    "Sudut pusat = 2 × sudut keliling pada busur sama"
  ],
  "example": {
    "problem": "Tentukan luas juring dengan sudut pusat 90° dan jari-jari 4 cm.",
    "steps": [
      "Bagian lingkaran = 90/360 = 1/4.",
      "Luas lingkaran penuh = π × 4² = 16π cm².",
      "Luas juring = 1/4 × 16π = 4π cm²."
    ]
  },
  "quiz": {
    "prompt": "Sudut pusat yang menghadap suatu busur adalah 100°. Berapa sudut keliling pada busur yang sama?",
    "options": [
      {
        "id": "a",
        "text": "25°"
      },
      {
        "id": "b",
        "text": "50°"
      },
      {
        "id": "c",
        "text": "100°"
      },
      {
        "id": "d",
        "text": "200°"
      }
    ],
    "correctOption": "b",
    "explanation": "Sudut keliling besarnya setengah sudut pusat: 100°/2 = 50°."
  }
},
{
  "id": "xi-bivariate",
  "grade": 11,
  "title": "Statistika bivariat dan korelasi",
  "summary": "Baca hubungan dua variabel melalui diagram pencar.",
  "duration": "10–15 menit",
  "objectives": [
    "Mengenali arah hubungan dua variabel",
    "Membedakan korelasi dan sebab akibat"
  ],
  "explanation": [
    "Data bivariat mencatat dua variabel pada setiap objek, misalnya waktu belajar dan nilai tes. Diagram pencar menampilkan setiap pasangan sebagai satu titik sehingga pola hubungan lebih mudah terlihat.",
    "Pola naik menunjukkan hubungan positif; pola turun menunjukkan hubungan negatif. Titik yang tersebar tanpa pola linear menunjukkan hubungan linear lemah. Korelasi tidak membuktikan sebab akibat karena faktor lain dapat memengaruhi keduanya."
  ],
  "formulas": [
    "−1 ≤ r ≤ 1 untuk koefisien korelasi Pearson",
    "r mendekati 1: hubungan linear positif kuat",
    "r mendekati −1: hubungan linear negatif kuat"
  ],
  "example": {
    "problem": "Diagram pencar menunjukkan titik-titik cenderung turun dari kiri ke kanan. Apa artinya?",
    "steps": [
      "Saat nilai variabel pertama meningkat, variabel kedua cenderung menurun.",
      "Arah hubungan ini disebut korelasi negatif.",
      "Pola itu belum membuktikan bahwa variabel pertama menyebabkan perubahan variabel kedua."
    ]
  },
  "quiz": {
    "prompt": "Nilai r = 0,92 menunjukkan…",
    "options": [
      {
        "id": "a",
        "text": "hubungan linear positif kuat"
      },
      {
        "id": "b",
        "text": "hubungan linear negatif kuat"
      },
      {
        "id": "c",
        "text": "tidak ada hubungan linear"
      },
      {
        "id": "d",
        "text": "hubungan sebab akibat yang pasti"
      }
    ],
    "correctOption": "a",
    "explanation": "Nilai r dekat dengan +1 berarti hubungan linear positif kuat. Nilai ini tidak memastikan sebab akibat."
  }
},
{
  "id": "xi-regression",
  "grade": 11,
  "title": "Regresi linear",
  "summary": "Gunakan pola data untuk membuat perkiraan.",
  "duration": "10–15 menit",
  "objectives": [
    "Menggunakan persamaan garis regresi",
    "Membatasi interpretasi prediksi"
  ],
  "explanation": [
    "Regresi linear merangkum kecenderungan data dengan garis perkiraan ŷ = a + bx. Koefisien b menyatakan perubahan keluaran yang diperkirakan untuk setiap kenaikan satu satuan x; a adalah perkiraan keluaran ketika x = 0.",
    "Prediksi di dalam rentang data disebut interpolasi. Prediksi jauh di luar rentang data, atau ekstrapolasi, lebih tidak pasti karena pola mungkin berubah. Hasil regresi adalah perkiraan, bukan kepastian untuk setiap orang atau kejadian."
  ],
  "formulas": [
    "ŷ = a + bx",
    "Perubahan prediksi = b × perubahan x"
  ],
  "example": {
    "problem": "Model perkiraan nilai tes adalah ŷ = 50 + 4x, dengan x jam latihan. Prediksi untuk x = 3?",
    "steps": [
      "Substitusikan x = 3.",
      "Hitung ŷ = 50 + 4 × 3.",
      "Prediksi nilainya 62; hasil sebenarnya dapat berbeda."
    ]
  },
  "quiz": {
    "prompt": "Pada model ŷ = 20 + 5x, berapa kenaikan prediksi jika x bertambah 2?",
    "options": [
      {
        "id": "a",
        "text": "5"
      },
      {
        "id": "b",
        "text": "20"
      },
      {
        "id": "c",
        "text": "10"
      },
      {
        "id": "d",
        "text": "30"
      }
    ],
    "correctOption": "c",
    "explanation": "Gradien b = 5. Untuk kenaikan x sebesar 2, perubahan prediksi adalah 5 × 2 = 10."
  }
},
{
  "id": "xii-sequences",
  "grade": 12,
  "title": "Barisan dan deret",
  "summary": "Bedakan pola suku dengan jumlah seluruh suku.",
  "duration": "10–15 menit",
  "objectives": [
    "Membedakan barisan aritmetika dan geometri",
    "Menghitung suku ke-n dan jumlah sederhana"
  ],
  "explanation": [
    "Barisan aritmetika memiliki beda tetap antarsuku, sedangkan barisan geometri memiliki rasio tetap. Periksa selisih atau pembagian dua suku berurutan untuk mengenali polanya.",
    "Barisan membahas urutan suku; deret menjumlahkan suku-sukunya. Dalam rumus suku ke-n, pengulangan beda atau rasio terjadi n − 1 kali karena suku pertama sudah dihitung sebagai a."
  ],
  "formulas": [
    "Aritmetika: Uₙ = a + (n − 1)d",
    "Sₙ = n(2a + (n − 1)d)/2",
    "Geometri: Uₙ = arⁿ⁻¹",
    "Sₙ = a(rⁿ − 1)/(r − 1); r ≠ 1"
  ],
  "example": {
    "problem": "Tentukan suku ke-6 dari 3, 7, 11, 15, …",
    "steps": [
      "Suku pertama a = 3 dan beda d = 4.",
      "Gunakan U₆ = 3 + (6 − 1) × 4.",
      "U₆ = 23. Ini suku keenam, bukan jumlah enam suku."
    ]
  },
  "quiz": {
    "prompt": "Berapa jumlah lima suku pertama barisan 2, 4, 6, 8, …?",
    "options": [
      {
        "id": "a",
        "text": "10"
      },
      {
        "id": "b",
        "text": "20"
      },
      {
        "id": "c",
        "text": "30"
      },
      {
        "id": "d",
        "text": "32"
      }
    ],
    "correctOption": "c",
    "explanation": "Lima sukunya adalah 2, 4, 6, 8, 10. Jumlahnya 30."
  }
},
{
  "id": "xii-interest",
  "grade": 12,
  "title": "Bunga tunggal dan majemuk",
  "summary": "Bandingkan pertumbuhan yang tetap dan berlipat.",
  "duration": "10–15 menit",
  "objectives": [
    "Membedakan dasar perhitungan bunga",
    "Menghitung nilai akhir dalam model sederhana"
  ],
  "explanation": [
    "Pada bunga tunggal, bunga setiap periode dihitung dari modal awal. Pada bunga majemuk, bunga periode berikutnya dihitung dari saldo yang sudah bertambah, sehingga pertumbuhan mengikuti pola geometri.",
    "Samakan satuan tingkat bunga dengan periode waktunya. Model dasar di sini mengabaikan biaya, pajak, dan perubahan tingkat bunga. Persentase 10% ditulis 0,10 saat digunakan dalam perhitungan."
  ],
  "formulas": [
    "Bunga tunggal: Mₙ = M₀(1 + ni)",
    "Bunga majemuk: Mₙ = M₀(1 + i)ⁿ"
  ],
  "example": {
    "problem": "Modal 100 satuan bertumbuh dengan bunga majemuk 10% per tahun selama dua tahun.",
    "steps": [
      "Tahun pertama: 100 × 1,10 = 110.",
      "Tahun kedua: 110 × 1,10 = 121.",
      "Nilai akhir 121; pada bunga tunggal nilainya 120."
    ]
  },
  "quiz": {
    "prompt": "Modal 200 mendapat bunga tunggal 5% per tahun selama 3 tahun. Nilai akhirnya?",
    "options": [
      {
        "id": "a",
        "text": "210"
      },
      {
        "id": "b",
        "text": "230"
      },
      {
        "id": "c",
        "text": "231,525"
      },
      {
        "id": "d",
        "text": "250"
      }
    ],
    "correctOption": "b",
    "explanation": "M = 200(1 + 3 × 0,05) = 200 × 1,15 = 230."
  }
},
{
  "id": "xii-annuities",
  "grade": 12,
  "title": "Anuitas dan pinjaman",
  "summary": "Lihat pembagian pembayaran tetap menjadi bunga dan pokok.",
  "duration": "10–15 menit",
  "objectives": [
    "Membedakan angsuran pokok dan bunga",
    "Menghitung sisa pokok pada satu periode"
  ],
  "explanation": [
    "Anuitas adalah pembayaran berkala dengan total tetap dalam model tingkat bunga tetap. Untuk pinjaman, setiap pembayaran terdiri atas bunga periode berjalan dan angsuran pokok.",
    "Bunga dihitung dari sisa pokok. Saat sisa pokok turun, bagian bunga mengecil sehingga bagian pembayaran yang mengurangi pokok membesar. Pada anuitas biasa, pembayaran dilakukan pada akhir setiap periode."
  ],
  "formulas": [
    "Bunga periode = i × sisa pokok awal periode",
    "Angsuran pokok = pembayaran − bunga",
    "A = Pi / (1 − (1 + i)⁻ⁿ); i > 0, pembayaran akhir periode"
  ],
  "example": {
    "problem": "Sisa pokok 1.000, bunga 1% per bulan, pembayaran akhir bulan 110. Berapa pokok tersisa?",
    "steps": [
      "Bunga bulan ini = 1% × 1.000 = 10.",
      "Bagian pembayaran untuk pokok = 110 − 10 = 100.",
      "Sisa pokok baru = 1.000 − 100 = 900."
    ]
  },
  "quiz": {
    "prompt": "Sisa pokok 500, bunga periode 2%, dan pembayaran 60. Berapa angsuran pokoknya?",
    "options": [
      {
        "id": "a",
        "text": "10"
      },
      {
        "id": "b",
        "text": "50"
      },
      {
        "id": "c",
        "text": "60"
      },
      {
        "id": "d",
        "text": "70"
      }
    ],
    "correctOption": "b",
    "explanation": "Bunga = 0,02 × 500 = 10. Angsuran pokok = 60 − 10 = 50."
  }
},
{
  "id": "xii-counting",
  "grade": 12,
  "title": "Kaidah pencacahan",
  "summary": "Hitung kemungkinan dengan aturan penjumlahan dan perkalian.",
  "duration": "10–15 menit",
  "objectives": [
    "Memilih aturan untuk pilihan alternatif atau bertahap",
    "Memperhatikan larangan pengulangan"
  ],
  "explanation": [
    "Aturan perkalian digunakan ketika sebuah hasil dibuat melalui beberapa tahap. Jika tahap pertama memiliki m pilihan dan setiap pilihan dilanjutkan dengan n pilihan, ada m × n hasil.",
    "Aturan penjumlahan digunakan untuk pilihan alternatif yang tidak tumpang tindih. Jika kategori bertumpang tindih, hasil yang termasuk keduanya harus dikurangi agar tidak dihitung dua kali. Selalu baca apakah pengulangan diizinkan."
  ],
  "formulas": [
    "Tahap berurutan: m × n",
    "Pilihan terpisah: m + n",
    "n(A ∪ B) = n(A) + n(B) − n(A ∩ B)"
  ],
  "example": {
    "problem": "Ada 3 pilihan baju dan 2 pilihan celana. Berapa pasangan pakaian berbeda?",
    "steps": [
      "Setiap baju dapat dipasangkan dengan dua celana.",
      "Ada tiga kelompok yang masing-masing berisi dua pasangan.",
      "Jumlah pasangan = 3 × 2 = 6."
    ]
  },
  "quiz": {
    "prompt": "Kode dua digit dibuat dari 1, 2, 3, 4 tanpa pengulangan. Ada berapa kode?",
    "options": [
      {
        "id": "a",
        "text": "4"
      },
      {
        "id": "b",
        "text": "8"
      },
      {
        "id": "c",
        "text": "12"
      },
      {
        "id": "d",
        "text": "16"
      }
    ],
    "correctOption": "c",
    "explanation": "Digit pertama memiliki 4 pilihan, digit kedua tinggal 3. Jumlah kode = 4 × 3 = 12."
  }
},
{
  "id": "xii-combinatorics",
  "grade": 12,
  "title": "Permutasi dan kombinasi",
  "summary": "Tentukan apakah urutan membuat hasil menjadi berbeda.",
  "duration": "10–15 menit",
  "objectives": [
    "Membedakan pemilihan dan penyusunan",
    "Menghitung permutasi dan kombinasi sederhana"
  ],
  "explanation": [
    "Permutasi menghitung susunan ketika urutan penting. Memilih ketua dan wakil berbeda dari memilih dua anggota tim: menukar jabatan mengubah hasil, sedangkan menukar urutan nama anggota tidak.",
    "Kombinasi menghitung pilihan tanpa memperhatikan urutan. Pembagian dengan r! menghapus hitungan berulang dari susunan anggota yang sama. Rumus dasar ini digunakan untuk objek berbeda tanpa pengulangan."
  ],
  "formulas": [
    "n! = n × (n − 1) × … × 1; 0! = 1",
    "P(n,r) = n!/(n − r)!",
    "C(n,r) = n!/(r!(n − r)!)"
  ],
  "example": {
    "problem": "Dari 5 siswa, pilih 2 anggota tim tanpa jabatan. Berapa tim yang mungkin?",
    "steps": [
      "Urutan tidak penting: tim Ani–Budi sama dengan Budi–Ani.",
      "Gunakan C(5,2) = (5 × 4)/(2 × 1).",
      "Ada 10 tim berbeda."
    ]
  },
  "quiz": {
    "prompt": "Dari 4 siswa dipilih satu ketua dan satu wakil yang berbeda. Ada berapa susunan?",
    "options": [
      {
        "id": "a",
        "text": "6"
      },
      {
        "id": "b",
        "text": "8"
      },
      {
        "id": "c",
        "text": "12"
      },
      {
        "id": "d",
        "text": "16"
      }
    ],
    "correctOption": "c",
    "explanation": "Jabatan membuat urutan penting: 4 pilihan ketua × 3 pilihan wakil = 12."
  }
},
{
  "id": "xii-compound-probability",
  "grade": 12,
  "title": "Peluang majemuk dan bersyarat",
  "summary": "Hubungkan kejadian, irisan, dan informasi tambahan.",
  "duration": "10–15 menit",
  "objectives": [
    "Membedakan kejadian saling lepas dan saling bebas",
    "Menghitung peluang bersyarat sederhana"
  ],
  "explanation": [
    "Kejadian saling lepas tidak dapat terjadi bersamaan; irisannya kosong. Kejadian saling bebas tidak saling mengubah peluang. Kedua istilah ini memiliki arti berbeda dan tidak dapat dipertukarkan.",
    "Peluang bersyarat membatasi ruang sampel pada informasi yang sudah diketahui. Saat mengambil objek tanpa pengembalian, komposisi ruang sampel berubah sehingga peluang pengambilan berikutnya ikut berubah."
  ],
  "formulas": [
    "P(A ∪ B) = P(A) + P(B) − P(A ∩ B)",
    "Saling bebas: P(A ∩ B) = P(A)P(B)",
    "P(A | B) = P(A ∩ B)/P(B); P(B) > 0"
  ],
  "example": {
    "problem": "Koin adil dan dadu adil dilempar. Berapa peluang mendapat gambar dan angka 6?",
    "steps": [
      "P(gambar) = 1/2 dan P(6) = 1/6.",
      "Kedua percobaan saling bebas.",
      "P(gambar dan 6) = 1/2 × 1/6 = 1/12."
    ]
  },
  "quiz": {
    "prompt": "Kantong berisi 3 bola merah dan 2 biru. Setelah satu merah diambil tanpa dikembalikan, peluang bola berikutnya merah adalah…",
    "options": [
      {
        "id": "a",
        "text": "3/5"
      },
      {
        "id": "b",
        "text": "2/5"
      },
      {
        "id": "c",
        "text": "1/2"
      },
      {
        "id": "d",
        "text": "3/4"
      }
    ],
    "correctOption": "c",
    "explanation": "Tersisa 2 merah dan 2 biru, total 4 bola. Peluang merah berikutnya = 2/4 = 1/2."
  }
}
];
export const gradeLevels: GradeLevel[] = [10, 11, 12];
export const getMaterial = (id: string) => materials.find(material => material.id === id);
export type MaterialProgress = { moduleId: string; completed: boolean; attempts: number; revision: number };
export type CurriculumProgress = Record<string, MaterialProgress>;
export function pretestsComplete(sessions: Partial<Record<'distribution' | 'inverse', { stage: string }>>) {
  return sessions.distribution?.stage === 'complete' && sessions.inverse?.stage === 'complete';
}
export function publicMaterial(material: Material) {
  const { correctOption: _correct, explanation: _explanation, ...quiz } = material.quiz;
  return { ...material, quiz };
}
