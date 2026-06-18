const fs = require('fs');
const spec = {
  ja: {
    openRequestExists: "未完了の売却申請があります。プロフィールの申請履歴から入金を完了してください。",
    depositInsufficient: "⚠ 入金不足: 受領 {received} EP / 不足 {shortfall} EP。不足分 {shortfall} EP を同じアドレスへ再送金してください。",
    depositOverpaid: "申請数量を {overpaid} EP 超える入金がありましたが、そのまま受領しました。",
    recheckDeposit: "再確認する",
    statusWaiting: "入金待ち",
    statusInsufficient: "入金不足",
    statusConfirmed: "入金確認済み"
  },
  en: {
    openRequestExists: "You already have an unfinished sell request. Please complete its deposit first — see the request history in your profile.",
    depositInsufficient: "⚠ Insufficient deposit: received {received} EP / {shortfall} EP short. Please send the remaining {shortfall} EP to the same address.",
    depositOverpaid: "We received {overpaid} EP more than requested. The excess has been accepted as part of this request.",
    recheckDeposit: "Check again",
    statusWaiting: "Awaiting deposit",
    statusInsufficient: "Insufficient deposit",
    statusConfirmed: "Deposit confirmed"
  },
  zh: {
    openRequestExists: "您有未完成的出售申请。请先完成该申请的入金（可在个人资料的申请记录中查看）。",
    depositInsufficient: "⚠ 入金不足：已收到 {received} EP / 还差 {shortfall} EP。请将差额 {shortfall} EP 再次发送到同一地址。",
    depositOverpaid: "收到的 EP 超出申请数量 {overpaid} EP，超出部分已一并计入本次申请。",
    recheckDeposit: "重新确认",
    statusWaiting: "等待入金",
    statusInsufficient: "入金不足",
    statusConfirmed: "入金已确认"
  }
};
let fail = 0;
for (const lang of ['ja','en','zh']) {
  const data = JSON.parse(fs.readFileSync('messages/' + lang + '.json', 'utf8'));
  const lifai = data.lifai;
  // key order check: 7 keys immediately after checkDeposit
  const keys = Object.keys(lifai);
  const idx = keys.indexOf('checkDeposit');
  const after = keys.slice(idx + 1, idx + 8);
  const expectedOrder = Object.keys(spec[lang]);
  if (JSON.stringify(after) !== JSON.stringify(expectedOrder)) {
    console.log('ORDER MISMATCH', lang, after); fail++;
  }
  if (keys[keys.length - 1] !== 'statusConfirmed') {
    console.log('NOTE', lang, 'lifai does not end at statusConfirmed:', keys.slice(idx + 8));
  }
  for (const [k, v] of Object.entries(spec[lang])) {
    if (lifai[k] !== v) {
      fail++;
      console.log('MISMATCH', lang, k);
      console.log('  expected:', JSON.stringify(v));
      console.log('  actual  :', JSON.stringify(lifai[k]));
      const a = v, b = lifai[k] || '';
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) { console.log('  first diff at char', i, JSON.stringify(a[i]), 'vs', JSON.stringify(b[i])); break; }
      }
    }
  }
}
console.log(fail === 0 ? 'ALL EXACT MATCH + JSON PARSE OK' : 'FAILURES: ' + fail);
