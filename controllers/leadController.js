const axios = require('axios');
const config = require('../config/env');
const { getRawOwnerAnswer, checkRules } = require('../utils/validation');
const { transformLeadData } = require('../utils/transformer');
const { checkLLM } = require('../services/aiService');

exports.processLead = async (req, res) => {
  const lead = req.body;
  console.log('--------------------------------------------------');
  console.log(`📨 Received Lead: ${lead.first_name} ${lead.last_name}`);

  // --- STEP 1: ZIPCODE FILTER ---
  const zipcode = String(lead.zipcode || lead.postcode || '').trim();
  // [Regex : AI Assisted]
  // ^66 = Starts with 66
  // \d{3} = Followed by exactly 3 digits
  const zipcodeRegex = /^66\d{3}$/;

  if (!zipcodeRegex.test(zipcode)) {
    console.log(`❌ DECLINED: Zipcode ${zipcode} invalid or not in region 66.`);
    return res.json({ status: 'skipped', reason: 'Wrong region' });
  }

  // --- STEP 2: HYBRID OWNERSHIP CHECK ---
  const rawAnswer = getRawOwnerAnswer(lead);

  if (!rawAnswer) {
    console.log('❌ DECLINED: No ownership info found.');
    return res.json({ status: 'skipped', reason: 'Missing ownership data' });
  }

  // A. Check Rules
  let ownerStatus = checkRules(rawAnswer);

  // B. Check LLM (if Rules failed)
  if (ownerStatus === 'UNKNOWN') {
    ownerStatus = await checkLLM(rawAnswer);
  }

  if (ownerStatus !== 'CONFIRMED') {
    console.log(`❌ DECLINED: Not owner ("${rawAnswer}" -> ${ownerStatus})`);
    return res.json({ status: 'skipped', reason: 'Not owner' });
  }

  // --- STEP 3: SEND TO CUSTOMER ---
  console.log(`✅ ACCEPTED: Zip ${zipcode} & Owner Confirmed. Sending...`);

  try {
    const payload = transformLeadData(lead);

    const response = await axios.post(config.customerApiUrl, payload, {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    res.json({
      status: 'processed',
      upstream_response: response.data,
    });
  } catch (error) {
    console.error(
      `⚠️ API ERROR: ${error.response ? error.response.status : error.message}`
    );
    if (error.response) console.error(JSON.stringify(error.response.data));

    res.status(500).json({ status: 'error', message: error.message });
  }
};
