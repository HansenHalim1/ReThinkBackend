export type ConceptId = 'distribution' | 'inverse';
export type QuestionRole = 'diagnosis' | 'probe' | 'practice' | 'retry' | 'transfer';
export type Question = {
  id: string; concept: ConceptId; role: QuestionRole; prompt: string; math?: string;
  expected: string; kind: 'expression' | 'number'; knownErrors: string[]; hint: string;
};
export type Concept = {
  id: ConceptId; title: string; subtitle: string; prerequisite: string; duration: string;
  intro: string; visual: string; worked: string[]; questions: Record<QuestionRole, Question>;
};
function question(concept: ConceptId, role: QuestionRole, data: Omit<Question, 'id' | 'concept' | 'role'>): Question {
  return { ...data, id: `${concept}-${role}`, concept, role };
}
export const concepts: Concept[] = [
  {
    id: 'distribution', title: 'Sifat distributif', subtitle: 'Satu pengali, semua suku', prerequisite: 'Perkalian & penjumlahan', duration: '8–12 menit',
    intro: 'Mengapa pengali di luar kurung harus menyentuh setiap suku? Kita telusuri bersama.',
    visual: 'Tiga kelompok yang masing-masing berisi x dan 2 berarti ada tiga x dan tiga pasangan 2. Pengali berlaku untuk seluruh isi kelompok.',
    worked: ['Contoh berbeda: 2(x + 4)', 'Kalikan 2 dengan x → 2x', 'Kalikan 2 dengan 4 → 8', 'Gabungkan kedua hasil: 2x + 8'],
    questions: {
      diagnosis: question('distribution', 'diagnosis', { prompt: 'Hilangkan tanda kurung. Tuliskan bentuk aljabar yang setara.', math: '3(x + 2)', expected: '3x+6', kind: 'expression', knownErrors: ['3x+2', 'x+6'], hint: 'Perhatikan apakah pengali di luar kurung sudah diterapkan ke setiap suku di dalamnya.' }),
      probe: question('distribution', 'probe', { prompt: 'Cek konsep: jika empat kelompok masing-masing berisi x dan 3, bagaimana bentuk totalnya tanpa kurung?', math: '4(x + 3)', expected: '4x+12', kind: 'expression', knownErrors: ['4x+3', 'x+12'], hint: 'Jumlah kelompok berlaku untuk bagian x dan bagian bilangan.' }),
      practice: question('distribution', 'practice', { prompt: 'Bagian pertama sudah diberikan. Lengkapi bilangan yang kosong.', math: '5(x + 2) = 5x + …', expected: '10', kind: 'number', knownErrors: ['2'], hint: 'Ada lima kelompok, dan setiap kelompok menyumbang dua satuan.' }),
      retry: question('distribution', 'retry', { prompt: 'Sekarang kerjakan sendiri. Hilangkan tanda kurung.', math: '4(x + 5)', expected: '4x+20', kind: 'expression', knownErrors: ['4x+5'], hint: '' }),
      transfer: question('distribution', 'transfer', { prompt: 'Tiga kotak masing-masing berisi x pensil biru dan 4 pensil merah. Tuliskan ekspresi jumlah semua pensil tanpa kurung.', expected: '3x+12', kind: 'expression', knownErrors: ['3x+4'], hint: '' }),
    },
  },
  {
    id: 'inverse', title: 'Operasi invers', subtitle: 'Jaga keseimbangan persamaan', prerequisite: 'Penjumlahan & pengurangan', duration: '8–12 menit',
    intro: 'Persamaan adalah keseimbangan. Cari nilai yang belum diketahui dengan operasi yang membalikkan langkah sebelumnya.',
    visual: 'Jika x ditambah 5 sama dengan 8, kurangi 5 dari kedua sisi. Mengubah kedua sisi dengan operasi yang sama menjaga keseimbangan.',
    worked: ['Contoh berbeda: x + 4 = 10', 'Balikkan +4 dengan −4 pada kedua sisi', 'x + 4 − 4 = 10 − 4', 'Sederhanakan: x = 6'],
    questions: {
      diagnosis: question('inverse', 'diagnosis', { prompt: 'Tentukan nilai x. Kamu boleh menulis angka atau x = angka.', math: 'x + 5 = 8', expected: '3', kind: 'number', knownErrors: ['13'], hint: 'Operasi apa yang membatalkan penambahan? Terapkan operasi yang sama di kedua sisi.' }),
      probe: question('inverse', 'probe', { prompt: 'Cek konsep: sebuah bilangan ditambah 3 menjadi 7. Berapa bilangan semula?', math: 'x + 3 = 7', expected: '4', kind: 'number', knownErrors: ['10'], hint: 'Temukan bilangan sebelum tiga ditambahkan.' }),
      practice: question('inverse', 'practice', { prompt: 'Kurangi 6 pada kedua sisi, lalu lengkapi hasilnya.', math: 'x + 6 = 11 → x = 11 − 6 = …', expected: '5', kind: 'number', knownErrors: ['17'], hint: 'Hitung selisih antara sebelas dan enam.' }),
      retry: question('inverse', 'retry', { prompt: 'Kerjakan sendiri, tanpa petunjuk. Tentukan nilai x.', math: 'x + 7 = 12', expected: '5', kind: 'number', knownErrors: ['19'], hint: '' }),
      transfer: question('inverse', 'transfer', { prompt: 'Setelah mendapat 4 buku baru, Rani memiliki 13 buku. Berapa buku yang dimiliki Rani sebelumnya?', expected: '9', kind: 'number', knownErrors: ['17'], hint: '' }),
    },
  },
];
export const getConcept = (id: ConceptId) => concepts.find(c => c.id === id)!;
export const getQuestion = (id: string) => concepts.flatMap(c => Object.values(c.questions)).find(q => q.id === id);
