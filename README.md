# PRIMEST Solar Lead Middleware

A production-ready middleware service that validates and transforms solar leads before forwarding them to customer APIs. Built to handle the complexities of German solar lead data with precision.

## 🎯 Business Goal

Transform raw, variable-quality solar leads into perfectly formatted customer-ready data, while filtering out non-matching leads to maximize sales team efficiency and conversion rates.

## ✅ Requirements Implemented

- ✅ **Region filter**: Only accepts zipcodes in `66***` (5-digit format validation)
- ✅ **Ownership validation**: Hybrid approach (deterministic rules + LLM fallback)
- ✅ **Complete attribute mapping**: Maps lead questions to all required `solar_*` API attributes
- ✅ **German address parsing**: Splits complex addresses like `"Venner Straße 23 Und 24"`
- ✅ **Phone normalization**: Converts German numbers to E.164 format using Google's libphonenumber
- ✅ **GDPR compliance**: Explicit `optin: true` for all leads
- ✅ **Data quality**: Enum validation for all dropdown fields per customer specification

## 🌐 Live Deployment

The service is running 24/7 and ready to process leads:

**Webhook URL**:  
`https://primest-middleware.onrender.com/webhook`

✓ Actively processing leads  
✓ Complete validation pipeline operational  
✓ Returns clear status responses for all requests

## 🧠 Architecture Design

### Modular Structure

### Core Validation Pipeline

1. **Zipcode Pre-filter** - Reject non-66\*\*\* leads immediately (saves resources)
2. **Ownership Verification** - Hybrid system:
   - Step 1: Deterministic rules (fast path for clear answers)
   - Step 2: LLM fallback only for ambiguous cases (precision where it matters)
3. **Data Transformation** - Semantic mapping of questions to customer attributes
4. **Data Quality Enforcement** - Phone normalization, enum validation, GDPR compliance
5. **Customer API Forwarding** - Secure transmission with proper authentication

### Why This Approach?

> **"Ownership validation is the gatekeeper of lead quality. A non-owner lead has near-zero conversion value for a solar installer. So I invested extra intelligence here to avoid false negatives. Other attributes (roof type, property type) are enrichment data, even if imperfect, the lead can still be processed. But if we misclassify ownership, we either lose a qualified lead or waste sales effort."**

## 🛠️ Technical Highlights

### Hybrid Ownership Validation

- **Rules-based first**: Fast processing for clear answers (`Ja`, `Nein`, `true`, `false`)
- **LLM fallback**: Only activated for ambiguous cases (cost-efficient)
- **Fail-safe design**: Defaults to `DENIED` on LLM errors (protects data quality)

### Semantic Attribute Mapping

- **Fuzzy keyword matching**: Finds relevant questions even with wording variations
- **Enum normalization**: Maps real-world answers to strict API enum values
- **Comprehensive coverage**: All customer-defined attributes supported

### German Data Handling

- **Address splitter**: Handles complex German address formats with number ranges
- **Phone normalization**: Converts `0172 7598887` → `+491727598887` (E.164 standard)
- **Local terminology**: Understands German solar terms (`Dachform`, `Eigentümer`, etc.)

## 🤖 AI Usage Disclosure

Per assignment guidelines, AI assistance was used for:

- `[AI-ASSISTED]` Phone number normalization logic
- `[AI-ASSISTED]` German address splitting regex
- `[AI-ASSISTED]` Semantic attribute mapping configuration
- `[AI-ASSISTED]` Hybrid ownership validation service **(OpenAI integration boilerplate)**

## ▶️ How to Run Locally

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Fill in your credentials in .env
# OPENAI_API_KEY=sk-proj-xxxx
# USER_ID=user_id_here
# FAKE_CUSTOMER_TOKEN=your_token_here

# Start the server
npm start
```

### Test the webhook

```
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Owner",
    "email": "test@example.com",
    "phone": "0170 1234567",
    "zipcode": "66111",
    "city": "Saarbrücken",
    "questions": {
      "Sind Sie der Eigentümer der Immobilie?": "Ja"
    }
  }'
```

## 💡 Extra Value Added

### Revenue Protection Focus

- **Phone normalization**: Ensures sales teams can actually dial leads (un-dialable numbers kill conversions)
- **Strict enum validation**: Prevents CRM rejection due to invalid attribute values
- **Opt-in compliance**: Explicit GDPR consent reduces legal risk

### Operational Excellence

- **Comprehensive logging**: Clear status messages for every lead
- **Error resilience**: Graceful degradation on API failures
- **Configurable**: Easy to adapt to new customer requirements
