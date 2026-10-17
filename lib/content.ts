export type ConceptId = 'distribution' | 'inverse';
export type QuestionRole = 'diagnosis' | 'probe' | 'practice' | 'retry' | 'transfer';
export type DiagnosticHypothesis = 'possible-slip' | 'possible-conceptual-gap' | 'possible-understanding' | 'uncertain';
export type Question = {
  id: string; concept: ConceptId; role: QuestionRole; prompt: string; math?: string;
  expected: string; kind: 'expression' | 'number'; knownErrors: string[]; knownErrorTypes?: string[]; hint: string;
};
export type Concept = {
  id: ConceptId; title: string; subtitle: string; prerequisite: string; duration: string;
  intro: string; visual: string; worked: string[]; questions: Record<QuestionRole, Question>; probeVariants: Question[];
};
function question(concept: ConceptId, role: QuestionRole, data: Omit<Question, 'id' | 'concept' | 'role'>, id = `${concept}-${role}`): Question {
  return { ...data, id, concept, role };
}

// Expanded diagnostic probe bank: original, deterministic, and dependency-free.
// Original fixed questions are preserved below.
export type ProbeDifficulty = 'foundation' | 'intermediate' | 'challenge';
export type ProbeMetadata = {
  family: string;
  difficulty: ProbeDifficulty;
  focuses: string[];
  source: 'original-generated';
};
const extraProbeMetadata: Record<string, ProbeMetadata> = {};
const familySerial: Record<string, number> = {};
const pad = (n: number) => String(n).padStart(3, '0');
const signed = (n: number) => n < 0 ? `-${Math.abs(n)}` : `+${n}`;
const signedSpaced = (n: number) => n < 0 ? ` - ${Math.abs(n)}` : ` + ${n}`;
const varTerm = (coefficient: number, variable = 'x') => coefficient === 0 ? '0' : coefficient === 1 ? variable : coefficient === -1 ? `-${variable}` : `${coefficient}${variable}`;
const linear = (a: number, c: number, variable = 'x') => c === 0 ? varTerm(a, variable) : `${varTerm(a, variable)}${signed(c)}`;
const binomial = (a: number, c: number, variable = 'x') => `(${varTerm(a, variable)}${signedSpaced(c)})`;
const bankPick = <T,>(arr: T[], i: number): T => arr[i % arr.length];

function createExtra(concept: ConceptId, family: string, difficulty: ProbeDifficulty, focuses: string[], data: Omit<Question, 'id' | 'concept' | 'role'>): Question {
  const key = `${concept}-${family}`;
  const number = (familySerial[key] ?? 0) + 1;
  familySerial[key] = number;
  const id = `${concept}-probe-${family}-${pad(number)}`;
  const seen = new Set<string>();
  const distinctErrors = data.knownErrors.filter(err => err.trim() && err.replace(/\s/g, '') !== data.expected.replace(/\s/g, '') && !seen.has(err.replace(/\s/g, '')) && (seen.add(err.replace(/\s/g, '')) || true));
  // Existing engine recognizes three historical labels only. Extra focus labels
  // live in metadata, not in knownErrorTypes, to avoid breaking rule dispatch.
  extraProbeMetadata[id] = { family, difficulty, focuses, source: 'original-generated' };
  return question(concept, 'probe', { ...data, knownErrors: distinctErrors }, id);
}

function buildDistributionProbes(): Question[] {
  const out: Question[] = [];
  const add = (family: string, level: ProbeDifficulty, focuses: string[], data: Omit<Question, 'id' | 'concept' | 'role'>) => out.push(createExtra('distribution', family, level, focuses, data));
  const phrasings = [
    'Hilangkan tanda kurung dan sederhanakan.',
    'Tuliskan ekspresi aljabar yang setara tanpa tanda kurung.',
    'Kembangkan perkalian ke setiap suku.',
    'Sederhanakan dengan menggunakan sifat distributif.',
    'Ubah menjadi bentuk tanpa kurung yang nilainya tetap sama.'
  ];
  for (let i = 0; i < 44; i++) {
    const k = 2 + i % 8, c = 1 + (i * 5 + Math.floor(i / 8)) % 23;
    add('positive-add', 'foundation', ['missed-constant','missed-variable'], {
      prompt: bankPick(phrasings, i), math: `${k}(x + ${c})`, expected: linear(k, k*c), kind: 'expression',
      knownErrors: [linear(k,c),linear(1,k*c)], knownErrorTypes: ['missed-constant','missed-variable'], hint: 'Terapkan pengali ke x dan ke bilangan di dalam kurung.' });
  }
  for (let i = 0; i < 44; i++) {
    const k = 2 + i % 8, c = 1 + (i * 7 + Math.floor(i / 8)) % 23;
    add('positive-sub', 'foundation', ['missed-constant','missed-variable','subtraction-sign'], {
      prompt: bankPick(phrasings, i + 2), math: `${k}(x - ${c})`, expected: linear(k, -k*c), kind: 'expression',
      knownErrors: [linear(k,-c),linear(1,-k*c)], knownErrorTypes: ['missed-constant','missed-variable'], hint: 'Pengali berlaku juga untuk suku yang bertanda minus.' });
  }
  for (let i = 0; i < 36; i++) {
    const k = 2 + i%7, c = 1 + (i*5 + Math.floor(i/7))%19;
    add('negative-add', 'intermediate', ['missed-constant','missed-variable','negative-multiplier'], {
      prompt: bankPick(phrasings,i+1), math: `-${k}(x + ${c})`, expected: linear(-k,-k*c), kind: 'expression',
      knownErrors: [linear(-k,c),linear(1,-k*c)], knownErrorTypes: ['missed-constant','missed-variable'], hint: 'Pengali negatif mengubah tanda setiap suku hasil perkalian.' });
  }
  for (let i = 0; i < 36; i++) {
    const k = 2 + i%7, c = 1 + (i*7 + Math.floor(i/7))%19;
    add('negative-sub', 'intermediate', ['missed-constant','missed-variable','double-negative'], {
      prompt: bankPick(phrasings,i+3), math: `-${k}(x - ${c})`, expected: linear(-k,k*c), kind: 'expression',
      knownErrors: [linear(-k,-c),linear(1,k*c)], knownErrorTypes: ['missed-constant','missed-variable'], hint: 'Negatif dikali negatif menghasilkan positif.' });
  }
  for (let i = 0; i < 40; i++) {
    const k=2+i%6,a=2+Math.floor(i/6)%6,c=1+(i*7)%17;
    add('coefficient-add', 'intermediate', ['missed-constant','missed-variable','coefficient'], {
      prompt: bankPick(phrasings,i), math:`${k}(${a}x + ${c})`,expected:linear(k*a,k*c),kind:'expression',
      knownErrors:[linear(k*a,c),linear(a,k*c)],knownErrorTypes:['missed-constant','missed-variable'],hint:'Kalikan pengali dengan koefisien x dan konstanta.' });
  }
  for (let i = 0; i < 40; i++) {
    const k=2+i%6,a=2+Math.floor(i/6)%6,c=1+(i*11)%17;
    add('coefficient-sub', 'intermediate', ['missed-constant','missed-variable','subtraction-sign'], {
      prompt:bankPick(phrasings,i+1),math:`${k}(${a}x - ${c})`,expected:linear(k*a,-k*c),kind:'expression',
      knownErrors:[linear(k*a,-c),linear(a,-k*c)],knownErrorTypes:['missed-constant','missed-variable'],hint:'Suku yang dikurangkan juga harus dikalikan.' });
  }
  for (let i = 0; i < 36; i++) {
    const k=2+i%7,a=1+Math.floor(i/7)%4,b=1+(i*3)%5,minus=i%2===1;
    add('two-variables', 'intermediate', ['distribute-all-terms','variable-distinction'], {
      prompt:bankPick(phrasings,i+2), math:`${k}(${varTerm(a)} ${minus?'-':'+'} ${varTerm(b,'y')})`,
      expected:`${varTerm(k*a)}${minus?'-':'+'}${varTerm(k*b,'y')}`,kind:'expression',
      knownErrors:[`${varTerm(k*a)}${minus?'-':'+'}${varTerm(b,'y')}`,`${varTerm(a)}${minus?'-':'+'}${varTerm(k*b,'y')}`],hint:'x dan y adalah suku berbeda; keduanya tetap dikalikan.' });
  }
  for (let i = 0; i < 36; i++) {
    const k=2+i%7,a=1+Math.floor(i/7)%5,b=1+(i*3)%7,minus=i%2===1;
    add('three-terms', 'intermediate', ['third-term-omitted','distribute-all-terms'], {
      prompt:bankPick(phrasings,i+3),math:`${k}(x + ${a}y ${minus?'-':'+'} ${b})`,
      expected:`${varTerm(k)}+${varTerm(k*a,'y')}${minus?'-':'+'}${k*b}`,kind:'expression',
      knownErrors:[`${varTerm(k)}+${varTerm(k*a,'y')}${minus?'-':'+'}${b}`,`${varTerm(k)}+${varTerm(a,'y')}${minus?'-':'+'}${k*b}`],hint:'Periksa semua tiga suku sebelum menulis hasil.' });
  }
  for (let i = 0; i < 30; i++) {
    const k=2+i%7,c=1+(i*9)%17;
    add('inside-negative-x','intermediate',['negative-variable','sign-handling'],{
      prompt:bankPick(phrasings,i+4),math:`${k}(-x + ${c})`,expected:linear(-k,k*c),kind:'expression',
      knownErrors:[linear(k,k*c),linear(-k,c)],hint:'-x berarti koefisien x adalah -1.' });
  }
  for (let i = 0; i < 30; i++) {
    const k=2+i%7,c=1+(i*3)%19,t=1+(i*11)%13;
    add('trailing-offset','intermediate',['outside-term','order-of-operations'],{
      prompt:'Kembangkan kurung dahulu, lalu gabungkan konstanta.',math:`${k}(x + ${c}) + ${t}`,expected:linear(k,k*c+t),kind:'expression',
      knownErrors:[linear(k,c+t),linear(k,k*(c+t))],hint:'Bilangan di luar tanda kurung tidak ikut dikalikan.' });
  }
  for (let i = 0; i < 30; i++) {
    const k=2+i%7,c=1+(i*5)%19,t=1+(i*7)%13;
    add('leading-offset','intermediate',['outside-term','sign-handling'],{
      prompt:'Kembangkan kurung dan sederhanakan hingga tidak ada suku sejenis.',math:`${t} - ${k}(x + ${c})`,expected:linear(-k,t-k*c),kind:'expression',
      knownErrors:[linear(-k,t+c),linear(k,t-k*c)],hint:'Tanda minus di depan hasil kali memengaruhi kedua suku.' });
  }
  for (let i = 0; i < 30; i++) {
    const k=2+i%8,c=1+(i*7)%23;
    add('factor-on-right','foundation',['missed-constant','commutativity'],{
      prompt:'Pengali berada di kanan kurung. Kembangkan ekspresi tersebut.',math:`(x + ${c})${k}`,expected:linear(k,k*c),kind:'expression',
      knownErrors:[linear(k,c),linear(1,k*c)],knownErrorTypes:['missed-constant','missed-variable'],hint:'Posisi pengali di kiri atau kanan tidak mengubah hasil.' });
  }
  for (let i = 0; i < 30; i++) {
    const k=2+i%8,c=1+(i*5)%19;
    const wrong=linear(k,c);
    add('repair-a-solution','foundation',['missed-constant','error-analysis'],{
      prompt:`Seorang siswa menulis ${k}(x + ${c}) = ${wrong}. Tulis hasil pengembangan yang benar.`,math:`${k}(x + ${c})`,expected:linear(k,k*c),kind:'expression',
      knownErrors:[wrong,linear(1,k*c)],knownErrorTypes:['missed-constant','missed-variable'],hint:'Periksa apakah suku konstanta ikut dikalikan.' });
  }
  for (let i = 0; i < 36; i++) {
    const k=2+i%8,c=1+(i*7)%23;
    add('fill-constant','foundation',['missed-constant','targeted-coefficient'],{
      prompt:'Tentukan angka untuk mengisi titik-titik (cukup tulis angkanya).',math:`${k}(x + ${c}) = ${varTerm(k)} + ...`,expected:String(k*c),kind:'number',
      knownErrors:[String(c),String(k+c)],hint:'Konstanta di dalam kurung ikut dikalikan.' });
  }
  for (let i = 0; i < 36; i++) {
    const k=2+i%8,a=2+Math.floor(i/8)%6,c=1+(i*7)%13;
    add('fill-variable','foundation',['missed-variable','targeted-coefficient'],{
      prompt:'Tentukan koefisien x yang hilang (cukup tulis angkanya).',math:`${k}(${a}x + ${c}) = ...x + ${k*c}`,expected:String(k*a),kind:'number',
      knownErrors:[String(a),String(k+a)],hint:'Koefisien x juga harus dikalikan.' });
  }
  const objects=['kotak pensil','bungkus stiker','rak buku','kantong kelereng','wadah permen','paket alat tulis','amplop kartu','dus mainan'];
  for (let i = 0; i < 48; i++) {
    const k=2+i%9,c=1+(i*5+Math.floor(i/9))%16,obj=bankPick(objects,i);
    add('context-groups','foundation',['context-transfer','missed-constant'],{
      prompt:`Ada ${k} ${obj}. Masing-masing berisi x barang utama dan ${c} barang tambahan. Tuliskan total barang tanpa kurung.`,
      math:`${k}(x + ${c})`,expected:linear(k,k*c),kind:'expression',
      knownErrors:[linear(k,c),linear(1,k*c)],knownErrorTypes:['missed-constant','missed-variable'],hint:'Jumlah barang pada setiap kelompok harus dihitung sebanyak jumlah kelompok.' });
  }
  for (let i = 0; i < 28; i++) {
    const k=2+i%7,j=2+(i*3)%6,c=1+(i*5)%13,d=1+(i*7)%11;
    add('two-parentheses','challenge',['combine-like-terms','multiple-distributions'],{
      prompt:'Kembangkan kedua kurung dan gabungkan suku sejenis.',math:`${k}(x + ${c}) + ${j}(x - ${d})`,
      expected:linear(k+j,k*c-j*d),kind:'expression',
      knownErrors:[linear(k+j,c-j*d),linear(k+j,k*c-d)],hint:'Distribusikan pada masing-masing kurung sebelum menggabungkan.' });
  }
  for (let i = 0; i < 20; i++) {
    const k=2+i%5,j=2+(i*3)%4,c=1+(i*5)%9;
    add('nested-parentheses','challenge',['nested-distribution','hierarchy'],{
      prompt:'Kembangkan kurung bagian dalam terlebih dahulu, kemudian kurung luar.',math:`${k}(${j}(x + ${c}))`,
      expected:linear(k*j,k*j*c),kind:'expression',
      knownErrors:[linear(k*j,j*c),linear(j,k*j*c)],hint:'Pengali luar berlaku untuk keseluruhan hasil kurung dalam.' });
  }
  for (let i = 0; i < 15; i++) {
    const k=i%3===0?0:1,c=2+i*2,a=1+i%4;
    add('neutral-multiplier','foundation',['zero-and-one','edge-cases'],{
      prompt:'Kembangkan atau sederhanakan sesuai sifat perkalian.',math:`${k}(${varTerm(a)} + ${c})`,
      expected:k===0?'0':linear(a,c),kind:'expression',
      knownErrors:k===0?[linear(a,c),linear(0,c)]:[linear(a+1,c),linear(a,c+1)],hint:'Mengalikan dengan nol dan satu memiliki aturan khusus.' });
  }
  return out;
}

function buildInverseProbes(): Question[] {
  const out: Question[]=[];
  const add=(family: string, level: ProbeDifficulty, focuses: string[], data: Omit<Question, 'id'|'concept'|'role'>) => out.push(createExtra('inverse',family,level,focuses,data));
  const instructions=['Tentukan nilai x.','Temukan bilangan yang belum diketahui.','Selesaikan persamaan berikut.','Berapa nilai x agar persamaan benar?','Gunakan operasi invers untuk mencari x.'];
  for (let i=0;i<42;i++) {
    const a=2+i%19,x=1+(i*7+Math.floor(i/19))%30,b=x+a;
    add('undo-addition','foundation',['add-instead-of-subtract','opposite-operation'],{
      prompt:bankPick(instructions,i),math:`x + ${a} = ${b}`,expected:String(x),kind:'number',knownErrors:[String(b+a)],knownErrorTypes:['add-instead-of-subtract'],hint:'Kurangi kedua sisi dengan bilangan yang sama.' });
  }
  for (let i=0;i<36;i++) {
    const a=2+i%17,x=1+(i*7+Math.floor(i/17))%30,b=x+a;
    add('commuted-addition','foundation',['add-instead-of-subtract','commutative-order'],{
      prompt:bankPick(instructions,i+2),math:`${a} + x = ${b}`,expected:String(x),kind:'number',knownErrors:[String(b+a)],knownErrorTypes:['add-instead-of-subtract'],hint:'x tetap dapat dicari dengan mengurangi sisi hasil.' });
  }
  for (let i=0;i<42;i++) {
    const a=2+i%19,x=6+(i*9+Math.floor(i/19))%42,b=x-a;
    add('undo-subtraction','foundation',['subtract-instead-of-add','opposite-operation'],{
      prompt:bankPick(instructions,i+1),math:`x - ${a} = ${b}`,expected:String(x),kind:'number',knownErrors:[String(b-a)],hint:'Untuk membalikkan pengurangan, tambahkan bilangan yang sama.' });
  }
  for (let i=0;i<36;i++) {
    const a=9+(i*5)%48,x=1+(i*7)%20,b=a-x;
    add('constant-minus-x','intermediate',['order-reversal','isolate-negative-variable'],{
      prompt:bankPick(instructions,i+3),math:`${a} - x = ${b}`,expected:String(x),kind:'number',knownErrors:[String(a+b),String(b-a)],hint:'Perhatikan bahwa x adalah bilangan yang dikurangkan, bukan bilangan awal.' });
  }
  for (let i=0;i<36;i++) {
    const a=3+i%16,x=-(1+(i*7)%20),b=x+a;
    add('negative-solution','intermediate',['integer-solution','add-instead-of-subtract'],{
      prompt:bankPick(instructions,i),math:`x + ${a} = ${b}`,expected:String(x),kind:'number',knownErrors:[String(b+a)],knownErrorTypes:['add-instead-of-subtract'],hint:'Hasil akhir bisa berupa bilangan negatif.' });
  }
  for (let i=0;i<36;i++) {
    const a=18+i%17,x=1+(i*11)%17,b=x-a;
    add('negative-result','intermediate',['subtract-instead-of-add','negative-rhs'],{
      prompt:bankPick(instructions,i+2),math:`x - ${a} = ${b}`,expected:String(x),kind:'number',knownErrors:[String(b-a)],hint:'Hasil pengurangan di kanan boleh negatif; tambah untuk membaliknya.' });
  }
  for (let i=0;i<32;i++) {
    const a=2+i%19,x=-(1+(i*7)%25),b=x+a;
    add('subtract-negative','intermediate',['signed-numbers','add-negative'],{
      prompt:bankPick(instructions,i+4),math:`x - (-${a}) = ${b}`,expected:String(x),kind:'number',knownErrors:[String(b+a),String(b-a*2)],hint:'Mengurangi bilangan negatif setara dengan menambah bilangan positif.' });
  }
  for (let i=0;i<35;i++) {
    const a=2+i%17,x=1+(i*11)%31,b=x+a;
    add('equation-flipped','foundation',['equality-symmetry','add-instead-of-subtract'],{
      prompt:bankPick(instructions,i+1),math:`${b} = x + ${a}`,expected:String(x),kind:'number',knownErrors:[String(b+a)],knownErrorTypes:['add-instead-of-subtract'],hint:'Persamaan tetap sama maknanya meskipun kedua sisi ditukar.' });
  }
  for (let i=0;i<34;i++) {
    const a=2+i%12,c=1+(i*7+Math.floor(i/12))%14,x=1+(i*11+Math.floor(i/12))%22,b=x+a-c;
    add('numeric-both-sides','intermediate',['balance-both-sides','order-of-operations'],{
      prompt:'Sederhanakan ruas kanan lalu temukan x.',math:`x + ${a} = ${b} + ${c}`,expected:String(x),kind:'number',
      knownErrors:[String(b+c+a),String(b+a)],hint:'Hitung kedua ruas secara konsisten; jangan mengubah satu ruas saja.' });
  }
  for (let i=0;i<28;i++) {
    const a=2+i%12,c=1+(i*7)%11,x=3+(i*5)%20,b=x-a-c;
    add('grouped-subtraction','intermediate',['parentheses-as-group','opposite-operation'],{
      prompt:'Cari nilai x. Kerjakan jumlah di dalam kurung dengan benar.',math:`x - (${a} + ${c}) = ${b}`,expected:String(x),kind:'number',
      knownErrors:[String(b-a-c),String(b+a-c)],hint:'Satu kelompok yang dikurangkan perlu dikembalikan utuh.' });
  }
  for (let i=0;i<38;i++) {
    const a=2+i%18,x=1+(i*7)%31,b=x+a,wrong=b+a;
    add('repair-wrong-answer','foundation',['error-analysis','add-instead-of-subtract'],{
      prompt:`Seorang siswa mengatakan x = ${wrong} untuk persamaan berikut. Tentukan x yang benar.`,math:`x + ${a} = ${b}`,expected:String(x),kind:'number',
      knownErrors:[String(wrong)],knownErrorTypes:['add-instead-of-subtract'],hint:'Substitusikan kandidat nilai x untuk memeriksa apakah benar.' });
  }
  for (let i=0;i<35;i++) {
    const a=2+i%17,x=2+(i*7)%29,b=x+a;
    add('missing-inverse-step','foundation',['reasoning-step','add-instead-of-subtract'],{
      prompt:'Isi hasil operasi invers berikut dengan sebuah bilangan.',math:`x + ${a} = ${b}; x = ${b} - ${a} = ...`,expected:String(x),kind:'number',knownErrors:[String(b+a)],knownErrorTypes:['add-instead-of-subtract'],hint:'Hitung pengurangan yang sudah dituliskan.' });
  }
  const gains=[['Dinda','stiker'],['Fajar','buku'],['Rara','kelereng'],['Riko','pensil'],['Nadia','poin'],['Bima','kartu'],['Sari','kupon'],['Eka','koleksi foto']];
  for (let i=0;i<45;i++) {
    const a=2+i%17,x=1+(i*7)%31,b=x+a,[name,item]=bankPick(gains,i);
    add('context-gain','foundation',['model-words','undo-addition'],{
      prompt:`${name} awalnya memiliki beberapa ${item}. Setelah memperoleh ${a} lagi, jumlahnya ${b}. Berapa jumlah awalnya?`,
      math:`x + ${a} = ${b}`,expected:String(x),kind:'number',knownErrors:[String(b+a)],knownErrorTypes:['add-instead-of-subtract'],hint:'Cari jumlah sebelum penambahan terjadi.' });
  }
  const losses=[['Nina','stiker'],['Andi','kartu'],['Yuni','permen'],['Toni','buku'],['Rani','kelereng'],['Budi','poin'],['Lia','kupon']];
  for (let i=0;i<45;i++) {
    const a=2+i%17,x=13+(i*7)%33,b=x-a,[name,item]=bankPick(losses,i);
    add('context-loss','foundation',['model-words','undo-subtraction'],{
      prompt:`${name} memiliki sejumlah ${item}, lalu memberikan ${a} kepada temannya. Kini tersisa ${b}. Berapa jumlah awal ${item} ${name}?`,
      math:`x - ${a} = ${b}`,expected:String(x),kind:'number',knownErrors:[String(b-a)],hint:'Jumlah awal lebih besar daripada jumlah setelah diberikan.' });
  }
  for (let i=0;i<32;i++) {
    const a=2+i%13,x=-9+(i*7)%20,b=x+a;
    add('context-temperature','intermediate',['negative-solution','context-transfer'],{
      prompt:`Suhu mula-mula x °C. Setelah naik ${a} °C, suhu menjadi ${b} °C. Berapa suhu awal (dalam °C)?`,
      math:`x + ${a} = ${b}`,expected:String(x),kind:'number',knownErrors:[String(b+a)],knownErrorTypes:['add-instead-of-subtract'],hint:'Suhu awal diperoleh dengan mengurangi kenaikan dari suhu akhir.' });
  }
  for (let i=0;i<20;i++) {
    const a=2+i%7,x=2+(i*5)%16,b=a*x;
    add('undo-multiplication','challenge',['multiplicative-inverse','extension'],{
      prompt:'Tantangan lanjutan: cari x dengan membalik operasi perkalian.',math:`${a}x = ${b}`,expected:String(x),kind:'number',
      knownErrors:[String(b*a),String(b-a)],hint:'Gunakan pembagian untuk membalik perkalian.' });
  }
  for (let i=0;i<20;i++) {
    const a=2+i%7,x=2+(i*7)%16,c=1+(i*3)%15,b=a*x+c;
    add('two-step-equation','challenge',['two-step-inverse','extension'],{
      prompt:'Tantangan lanjutan: selesaikan persamaan dua langkah.',math:`${a}x + ${c} = ${b}`,expected:String(x),kind:'number',
      knownErrors:[String(b-c),String(b+c)],hint:'Hilangkan penjumlahan terlebih dahulu, lalu bagi dengan koefisien x.' });
  }
  return out;
}

export const concepts: Concept[] = [
  {
    id: 'distribution', title: 'Sifat distributif', subtitle: 'Satu pengali, semua suku', prerequisite: 'Perkalian & penjumlahan', duration: '8–12 menit',
    intro: 'Mengapa pengali di luar kurung harus menyentuh setiap suku? Kita telusuri bersama.',
    visual: 'Tiga kelompok yang masing-masing berisi x dan 2 berarti ada tiga x dan tiga pasangan 2. Pengali berlaku untuk seluruh isi kelompok.',
    worked: ['Contoh berbeda: 2(x + 4)', 'Kalikan 2 dengan x → 2x', 'Kalikan 2 dengan 4 → 8', 'Gabungkan kedua hasil: 2x + 8'],
    questions: {
      diagnosis: question('distribution', 'diagnosis', { prompt: 'Hilangkan tanda kurung. Tuliskan bentuk aljabar yang setara.', math: '3(x + 2)', expected: '3x+6', kind: 'expression', knownErrors: ['3x+2', 'x+6'], knownErrorTypes: ['missed-constant', 'missed-variable'], hint: 'Perhatikan apakah pengali di luar kurung sudah diterapkan ke setiap suku di dalamnya.' }),
      probe: question('distribution', 'probe', { prompt: 'Cek konsep: jika empat kelompok masing-masing berisi x dan 3, bagaimana bentuk totalnya tanpa kurung?', math: '4(x + 3)', expected: '4x+12', kind: 'expression', knownErrors: ['4x+3', 'x+12'], knownErrorTypes: ['missed-constant', 'missed-variable'], hint: 'Jumlah kelompok berlaku untuk bagian x dan bagian bilangan.' }),
      practice: question('distribution', 'practice', { prompt: 'Bagian pertama sudah diberikan. Lengkapi bilangan yang kosong.', math: '5(x + 2) = 5x + …', expected: '10', kind: 'number', knownErrors: ['2'], hint: 'Ada lima kelompok, dan setiap kelompok menyumbang dua satuan.' }),
      retry: question('distribution', 'retry', { prompt: 'Sekarang kerjakan sendiri. Hilangkan tanda kurung.', math: '4(x + 5)', expected: '4x+20', kind: 'expression', knownErrors: ['4x+5'], hint: '' }),
      transfer: question('distribution', 'transfer', { prompt: 'Tiga kotak masing-masing berisi x pensil biru dan 4 pensil merah. Tuliskan ekspresi jumlah semua pensil tanpa kurung.', expected: '3x+12', kind: 'expression', knownErrors: ['3x+4'], hint: '' }),
    },
    probeVariants: [
      question('distribution', 'probe', { prompt: 'Tiga kantong masing-masing berisi x kelereng dan 5 kelereng. Tuliskan jumlah seluruh kelereng tanpa kurung.', math: '3(x + 5)', expected: '3x+15', kind: 'expression', knownErrors: ['3x+5', 'x+15'], knownErrorTypes: ['missed-constant', 'missed-variable'], hint: '' }, 'distribution-probe-groups'),
      question('distribution', 'probe', { prompt: 'Kalikan pengali ke setiap suku, lalu sederhanakan.', math: '2(x + 7)', expected: '2x+14', kind: 'expression', knownErrors: ['2x+7', 'x+14'], knownErrorTypes: ['missed-constant', 'missed-variable'], hint: '' }, 'distribution-probe-symbolic'),
      ...buildDistributionProbes(),
    ],
  },
  {
    id: 'inverse', title: 'Operasi invers', subtitle: 'Jaga keseimbangan persamaan', prerequisite: 'Penjumlahan & pengurangan', duration: '8–12 menit',
    intro: 'Persamaan adalah keseimbangan. Cari nilai yang belum diketahui dengan operasi yang membalikkan langkah sebelumnya.',
    visual: 'Jika x ditambah 5 sama dengan 8, kurangi 5 dari kedua sisi. Mengubah kedua sisi dengan operasi yang sama menjaga keseimbangan.',
    worked: ['Contoh berbeda: x + 4 = 10', 'Balikkan +4 dengan −4 pada kedua sisi', 'x + 4 − 4 = 10 − 4', 'Sederhanakan: x = 6'],
    questions: {
      diagnosis: question('inverse', 'diagnosis', { prompt: 'Tentukan nilai x. Kamu boleh menulis angka atau x = angka.', math: 'x + 5 = 8', expected: '3', kind: 'number', knownErrors: ['13'], knownErrorTypes: ['add-instead-of-subtract'], hint: 'Operasi apa yang membatalkan penambahan? Terapkan operasi yang sama di kedua sisi.' }),
      probe: question('inverse', 'probe', { prompt: 'Cek konsep: sebuah bilangan ditambah 3 menjadi 7. Berapa bilangan semula?', math: 'x + 3 = 7', expected: '4', kind: 'number', knownErrors: ['10'], knownErrorTypes: ['add-instead-of-subtract'], hint: 'Temukan bilangan sebelum tiga ditambahkan.' }),
      practice: question('inverse', 'practice', { prompt: 'Kurangi 6 pada kedua sisi, lalu lengkapi hasilnya.', math: 'x + 6 = 11 → x = 11 − 6 = …', expected: '5', kind: 'number', knownErrors: ['17'], hint: 'Hitung selisih antara sebelas dan enam.' }),
      retry: question('inverse', 'retry', { prompt: 'Kerjakan sendiri, tanpa petunjuk. Tentukan nilai x.', math: 'x + 7 = 12', expected: '5', kind: 'number', knownErrors: ['19'], hint: '' }),
      transfer: question('inverse', 'transfer', { prompt: 'Setelah mendapat 4 buku baru, Rani memiliki 13 buku. Berapa buku yang dimiliki Rani sebelumnya?', expected: '9', kind: 'number', knownErrors: ['17'], hint: '' }),
    },
    probeVariants: [
      question('inverse', 'probe', { prompt: 'Angka yang belum diketahui ditambah 6 menghasilkan 10. Berapa angka itu?', math: 'x + 6 = 10', expected: '4', kind: 'number', knownErrors: ['16'], knownErrorTypes: ['add-instead-of-subtract'], hint: '' }, 'inverse-probe-balance'),
      question('inverse', 'probe', { prompt: 'Dina memiliki sejumlah buku. Setelah mendapat 5 buku, jumlahnya menjadi 12. Berapa buku Dina sebelumnya?', math: 'x + 5 = 12', expected: '7', kind: 'number', knownErrors: ['17'], knownErrorTypes: ['add-instead-of-subtract'], hint: '' }, 'inverse-probe-context'),
      ...buildInverseProbes(),
    ],
  },
];
export const getConcept = (id: ConceptId) => concepts.find(c => c.id === id)!;
export const getProbeQuestions = (id: ConceptId) => [getConcept(id).questions.probe, ...getConcept(id).probeVariants];
export const getQuestion = (id: string) => concepts.flatMap(c => [...Object.values(c.questions), ...c.probeVariants]).find(q => q.id === id);


// New optional helpers. The original three exports retain their signatures.
export const getProbeMetadata = (id: string): ProbeMetadata | undefined => extraProbeMetadata[id];
export type ProbeFilter = {
  count?: number;
  family?: string;
  difficulty?: ProbeDifficulty;
  focus?: string;
  excludeIds?: string[];
  seed?: number;
};
/**
 * Choose a small diagnostic subset instead of presenting the entire bank.
 * A stable seed allows controlled variation and prevents random rerenders.
 * Returns only generated variants when filtering by family/difficulty/focus;
 * otherwise also considers the original probes.
 */
export function getTargetedProbeQuestions(concept: ConceptId, filter: ProbeFilter = {}): Question[] {
  const excludes = new Set(filter.excludeIds ?? []);
  const pool = getProbeQuestions(concept).filter(q => {
    if (excludes.has(q.id)) return false;
    const meta = extraProbeMetadata[q.id];
    if (filter.family && meta?.family !== filter.family) return false;
    if (filter.difficulty && meta?.difficulty !== filter.difficulty) return false;
    if (filter.focus && !meta?.focuses.includes(filter.focus)) return false;
    return true;
  });
  const seed = Math.max(0, Math.trunc(filter.seed ?? 0));
  // Deterministic selection without maintaining mutable runtime state.
  const shuffled = pool.map((q, i) => ({q, rank: ((i + 1) * 2654435761 + seed * 2246822519) >>> 0})).sort((a,b)=>a.rank-b.rank).map(item=>item.q);
  return shuffled.slice(0, Math.max(0, Math.trunc(filter.count ?? shuffled.length)));
}
export const getProbeBankStatistics = () => ({
  distribution: getProbeQuestions('distribution').length,
  inverse: getProbeQuestions('inverse').length,
  generated: Object.keys(extraProbeMetadata).length,
  families: [...new Set(Object.values(extraProbeMetadata).map(m=>m.family))].sort(),
});

/** Three probes using different structures to test a suspected misconception. */
export function getDiagnosticProbeSequence(concept: ConceptId, suspectedError: string, seed = 0): Question[] {
  const familiesByError: Record<ConceptId, Record<string,string[]>> = {
    distribution: {
      'missed-constant': ['positive-add','repair-a-solution','context-groups'],
      'missed-variable': ['coefficient-add','fill-variable','factor-on-right'],
      'subtraction-sign': ['positive-sub','negative-sub','inside-negative-x'],
      'negative-multiplier': ['negative-add','negative-sub','inside-negative-x'],
      'distribute-all-terms': ['three-terms','two-variables','coefficient-add'],
    },
    inverse: {
      'add-instead-of-subtract': ['undo-addition','repair-wrong-answer','context-gain'],
      'subtract-instead-of-add': ['undo-subtraction','context-loss','grouped-subtraction'],
      'order-reversal': ['constant-minus-x','equation-flipped','numeric-both-sides'],
      'signed-numbers': ['negative-solution','subtract-negative','context-temperature'],
    }
  };
  const families = familiesByError[concept][suspectedError] ??
    (concept === 'distribution' ? ['positive-add','positive-sub','context-groups'] : ['undo-addition','undo-subtraction','context-gain']);
  return families.flatMap((family, index) => getTargetedProbeQuestions(concept, { family, count: 1, seed: seed + index * 101 }));
}
