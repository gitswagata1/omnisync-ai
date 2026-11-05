# Unit Economics — OmniSync AI

> Per-customer economics at the Growth tier ($300/month).

---

## Revenue per Customer

| Item | Monthly | Annual |
|:-----|--------:|-------:|
| SaaS subscription | $300 | $3,600 |
| WhatsApp msg markup (~15% on pass-through) | $18 | $216 |
| LLM overage (average) | $8 | $96 |
| **Total revenue** | **$326** | **$3,912** |

---

## COGS per Customer

| Cost Item | Monthly | % of Revenue | Notes |
|:----------|--------:|:------------:|:------|
| WhatsApp API (Meta) | $18 | 5.5% | ~2,000 msgs × $0.009 avg (India pricing) |
| LLM API (OpenAI GPT-4o) | $24 | 7.4% | ~1,000 evals + digests at ~$0.024 each |
| Infrastructure (pro-rated) | $10 | 3.1% | Server, DB, Redis, S3 share across tenants |
| **Total COGS** | **$52** | **15.9%** | |

---

## Margins

| Metric | Value |
|:-------|------:|
| **Gross profit / customer / month** | $274 |
| **Gross margin** | **84.0%** |

At scale (Year 3), LLM costs drop further with fine-tuned open-source models:

| Scenario | LLM Cost | Gross Margin |
|:---------|:---------|:-------------|
| Current (GPT-4o API) | $24/mo | 84.0% |
| Fine-tuned Llama on GPU | $6/mo | 89.5% |
| Hybrid (Llama + GPT-4o for complex) | $12/mo | 87.1% |

---

## Customer Acquisition Cost (CAC)

| Channel | CAC | % of Customers |
|:--------|----:|:--------------:|
| Founder-led outbound | $200 | 40% |
| Content marketing / inbound | $600 | 25% |
| Referral program | $150 | 20% |
| Events / partnerships | $800 | 15% |
| **Blended CAC** | **$420** | |

---

## Lifetime Value (LTV)

| Parameter | Value |
|:----------|------:|
| Monthly revenue | $326 |
| Gross margin | 84% |
| Monthly churn | 5% |
| Customer lifetime | 20 months (1 / churn) |
| **LTV** | **$5,477** |

---

## Key Ratios

| Ratio | Value | Benchmark |
|:------|------:|:----------|
| **LTV : CAC** | **13.0x** | Excellent (>3x is healthy) |
| **Payback period** | **1.5 months** | Excellent (<12 months is healthy) |
| **CAC as % of ACV** | **10.7%** | Strong (<25% is target) |

---

## Sensitivity Analysis

| If monthly churn is... | LTV | LTV:CAC |
|:----------------------|-----:|--------:|
| 3% | $9,128 | 21.7x |
| 5% (base case) | $5,477 | 13.0x |
| 7% | $3,912 | 9.3x |
| 10% | $2,738 | 6.5x |

Even at 10% monthly churn (aggressive downside), LTV:CAC remains above 3x.
