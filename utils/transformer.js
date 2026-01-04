const { PhoneNumberFormat, PhoneNumberUtil } = require('google-libphonenumber');
const phoneUtil = PhoneNumberUtil.getInstance();

// ==================================================================
// HELPER 1: PHONE NORMALIZATION
// ==================================================================
// [AI-ASSISTED]: Formats raw numbers to E.164 (e.g. +49170...)
// This ensures the customer API always gets clean, dialable numbers.
function normalizePhone(rawPhone) {
  try {
    if (!rawPhone) return '';
    // 'DE' is the default region if no country code is present
    const number = phoneUtil.parseAndKeepRawInput(rawPhone, 'DE');
    return phoneUtil.format(number, PhoneNumberFormat.E164);
  } catch (e) {
    // If it fails (e.g. text instead of numbers), return original
    return rawPhone;
  }
}

// ==================================================================
// HELPER 2: ADDRESS SPLITTER
// ==================================================================
// [AI-ASSISTED]: Splits "Venner Straße 23 Und 24" -> "Venner Straße", "23 Und 24"
function splitAddress(fullAddress) {
  if (!fullAddress) return { street: '', housenumber: '' };

  // Lazy Match: Captures street name until the FIRST number sequence starts
  const regex = /^(.*?)\s+(\d+.*)$/;

  const match = fullAddress.match(regex);

  if (match) {
    return {
      street: match[1],
      housenumber: match[2],
    };
  }

  // Fallback: Put everything in street if no number found
  return { street: fullAddress, housenumber: '' };
}

// ==================================================================
// [AI-ASSISTED]
// CONFIG: SEMANTIC ATTRIBUTE MAPPING
// ==================================================================
const ATTRIBUTE_MAPPING = [
  {
    // Use specific words for .some() matching (avoid 'wo', 'welche')
    questionKeywords: ['installieren', 'immobilientyp', 'gebäudeart'],
    targetAttribute: 'solar_property_type',
    valueMap: {
      'Ein-/Zweifamilienhaus': 'Einfamilienhaus',
      Einfamilienhaus: 'Einfamilienhaus',
      Zweifamilienhaus: 'Zweifamilienhaus',
      Doppelhaushälfte: 'Einfamilienhaus',
      Reihenhaus: 'Einfamilienhaus',
      Mehrfamilienhaus: 'Mehrfamilienhaus',
      'Mehrfamilienhaus / Wohnanlage': 'Mehrfamilienhaus',
      Firmengebäude: 'Firmengebäude',
      Gewerbe: 'Industrie',
      Scheune: 'Scheune/Landwirtschaft',
    },
  },
  {
    questionKeywords: ['dachform'],
    targetAttribute: 'solar_roof_type',
    valueMap: {
      Satteldach: 'Satteldach',
      Flachdach: 'Flachdach',
      Pultdach: 'Pultdach',
      Walmdach: 'Walmdach',
      Krüppelwalmdach: 'Krüppelwalmdach',
      Mansardendach: 'Mansardendach',
      Zwerchdach: 'Zwerchdach',
      Sonstige: 'Andere',
    },
  },
  {
    questionKeywords: ['alter', 'baujahr', 'wann gebaut'],
    targetAttribute: 'solar_roof_age',
    valueMap: {
      'nach 1990': 'Jünger als 30 Jahre',
      solar_Nach_1990: 'Jünger als 30 Jahre',
      'vor 1990': 'Älter als 30 Jahre',
      'solar_Vor 1990': 'Älter als 30 Jahre',
      'Vor 1990': 'Älter als 30 Jahre',
      'Nach 1990': 'Jünger als 30 Jahre',
      'Fast neu': 'Gerade erst gebaut',
      'Noch in Planung': 'Erst in Planung',
      Neubau: 'Gerade erst gebaut',
    },
  },
  {
    questionKeywords: ['zustand', 'dachzustand'],
    targetAttribute: 'solar_roof_condition',
    valueMap: {
      Gut: 'Guter Zustand',
      'Guter Zustand': 'Guter Zustand',
      Neu: 'Neubau',
      Neubau: 'Neubau',
      Renovierungsbedürftig: 'Renovierungsbedürftig',
      Alt: 'Renovierungsbedürftig',
    },
  },
  {
    questionKeywords: ['nutzen', 'verwendung', 'solarstrom'],
    targetAttribute: 'solar_usage',
    valueMap: {
      Eigenverbrauch: 'Eigenverbrauch',
      Volleinspeisung: 'Netzeinspeisung',
      Beides: 'Netzeinspeisung und Eigenverbrauch',
    },
  },
  {
    questionKeywords: ['speicher', 'batterie'],
    targetAttribute: 'solar_power_storage',
    valueMap: {
      Ja: 'Ja',
      Nein: 'Nein',
      Vielleicht: 'Noch nicht sicher',
      Unsicher: 'Noch nicht sicher',
      'Noch nicht sicher': 'Noch nicht sicher',
    },
  },
  {
    questionKeywords: ['kaufen', 'mieten', 'finanzierung'],
    targetAttribute: 'solar_offer_type',
    valueMap: {
      Kaufen: 'Kaufen',
      Mieten: 'Mieten',
      'Beides interessant': 'Beides interessant',
      Miete: 'Mieten',
      Kauf: 'Kaufen',
      'Eigenkapital vorhanden': 'Kaufen',
    },
  },
  {
    questionKeywords: ['material', 'dachmaterial', 'ziegel'],
    targetAttribute: 'solar_roof_material',
    valueMap: {
      Dachziegel: 'Dachziegel',
      Ziegel: 'Dachziegel',
      Schiefer: 'Schiefer',
      Bitumen: 'Bitumen',
      Blech: 'Blech/Trapezblech',
      Holz: 'Holzdach',
    },
  },
  {
    questionKeywords: ['ausrichtung', 'himmelsrichtung'],
    targetAttribute: 'solar_south_location',
    valueMap: {
      Süd: 'Süd',
      'Süd/West': 'Süd-West',
      'Süd/Ost': 'Süd-Ost',
      Ost: 'Ost',
      West: 'West',
      Ja: 'Ja',
    },
  },
  {
    questionKeywords: ['stromverbrauch', 'kwh'],
    targetAttribute: 'solar_energy_consumption',
    isNumeric: true,
  },
  {
    questionKeywords: ['dachfläche', 'qm', 'm2', 'area'],
    targetAttribute: 'solar_area',
    isNumeric: true,
  },
];

// ==================================================================
// MAIN FUNCTION: TRANSFORMER
// ==================================================================
function transformLeadData(sourceData) {
  const leadAttributes = {};
  const questions = sourceData.questions || {};

  // 1. Run Semantic Mapping (Questions -> API Attributes)
  ATTRIBUTE_MAPPING.forEach((config) => {
    const foundQuestionKey = Object.keys(questions).find((qKey) =>
      config.questionKeywords.some((keyword) =>
        qKey.toLowerCase().includes(keyword)
      )
    );

    if (foundQuestionKey) {
      let rawValue = questions[foundQuestionKey];

      if (config.valueMap) {
        if (config.valueMap[rawValue]) {
          leadAttributes[config.targetAttribute] = config.valueMap[rawValue];
        }
      } else {
        leadAttributes[config.targetAttribute] = String(rawValue);
      }
    }
  });

  // 2. FORCE OWNERSHIP VALIDATION
  // Stamp the lead as "Owner: Ja" since we validated it in the Controller
  leadAttributes['solar_owner'] = 'Ja';

  // 3. Handle Address Splitting
  const rawStreet = sourceData.street || '';
  const rawHouse = sourceData.housenumber || '';

  let finalAddress = { street: rawStreet, housenumber: rawHouse };

  if (!rawHouse && /\d/.test(rawStreet)) {
    finalAddress = splitAddress(rawStreet);
  }

  // 4. Construct Final Payload
  return {
    lead: {
      email: sourceData.email || '',
      first_name: sourceData.first_name || '',
      last_name: sourceData.last_name || '',
      street: finalAddress.street,
      housenumber: finalAddress.housenumber,
      postcode: sourceData.zipcode || '',
      city: sourceData.city || '',
      // USE THE PHONE NORMALIZER HERE:
      phone: normalizePhone(sourceData.phone),
      country: 'de',
    },
    product: {
      name: 'Solaranlagen', // Standardized domain term. In production, this would map to a specific CRM Product ID.
    },
    lead_attributes: leadAttributes,
    meta_attributes: {
      landingpage_url: sourceData.landingpage_url || '',
      unique_id: sourceData.unique_id || String(Date.now()),
      utm_campaign: sourceData.utm_campaign || '',
      ip: sourceData.ip || '',
      optin: true,
    },
  };
}

module.exports = { transformLeadData };
