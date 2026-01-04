function getRawOwnerAnswer(lead) {
  if (lead.questions) {
    const key = Object.keys(lead.questions).find((k) =>
      k.toLowerCase().includes('eigentümer')
    );
    if (key) return lead.questions[key];
  }
  return null;
}

function checkRules(rawValue) {
  const normalized = String(rawValue).toLowerCase().trim();

  const yesSignals = [
    'ja',
    'yes',
    'true',
    '1',
    'wahr',
    'sicher',
    'yep',
    'klar',
    'genau',
  ];
  const noSignals = ['nein', 'no', 'false', '0', 'miete', 'rent', 'mieter'];

  if (yesSignals.includes(normalized)) return 'CONFIRMED';
  if (noSignals.includes(normalized)) return 'DENIED';

  return 'UNKNOWN';
}

module.exports = { getRawOwnerAnswer, checkRules };
