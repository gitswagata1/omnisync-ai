# Pilot Measurement Data — Micro Turner Deployment

> Data collection template for the 8-week pilot (Weeks 1-2 baseline, Weeks 3-8 OmniSync deployment).

---

## Primary Metrics

### Follow-up Response Latency (L_resp)

Time between follow-up request sent and response received (hours).

| Week | Mon | Tue | Wed | Thu | Fri | Sat | Weekly Avg | Notes |
|:-----|:---:|:---:|:---:|:---:|:---:|:---:|:----------:|:------|
| W1 (baseline) | | | | | | | | |
| W2 (baseline) | | | | | | | | |
| W3 (deploy) | | | | | | | | |
| W4 | | | | | | | | |
| W5 | | | | | | | | |
| W6 | | | | | | | | |
| W7 | | | | | | | | |
| W8 | | | | | | | | |

### Missed Maintenance Deadlines (R_miss)

Count of maintenance tasks exceeding their deadline per week.

| Week | Bay 1 | Bay 2 | Bay 3 | Bay 4 | Bay 5 | Total | Notes |
|:-----|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:------|
| W1 (baseline) | | | | | | | |
| W2 (baseline) | | | | | | | |
| W3 (deploy) | | | | | | | |
| W4 | | | | | | | |
| W5 | | | | | | | |
| W6 | | | | | | | |
| W7 | | | | | | | |
| W8 | | | | | | | |

### Executive Status-Chasing Time (T_exec)

Self-reported daily time (minutes) spent by VPs soliciting updates.

| Week | VP 1 (Mon) | VP 1 (Fri) | VP 2 (Mon) | VP 2 (Fri) | Weekly Avg | Notes |
|:-----|:----------:|:----------:|:----------:|:----------:|:----------:|:------|
| W1 (baseline) | | | | | | |
| W2 (baseline) | | | | | | |
| W3 (deploy) | | | | | | |
| W4 | | | | | | |
| W5 | | | | | | |
| W6 | | | | | | |
| W7 | | | | | | |
| W8 | | | | | | |

### Duplicate Vendor Contact Rate (R_dup)

Instances where 2+ agents contact the same vendor about the same issue within 24 hours.

| Week | Count | Vendors Affected | Notes |
|:-----|:-----:|:----------------:|:------|
| W1 (baseline) | | | |
| W2 (baseline) | | | |
| W3 (deploy) | | | |
| W4 | | | |
| W5 | | | |
| W6 | | | |
| W7 | | | |
| W8 | | | |

---

## System Metrics (Weeks 3-8 only)

### Scheduler Performance

| Week | Executions | Success (1st) | Success (retry) | Failed | Escalated | Uptime % |
|:-----|:----------:|:-------------:|:---------------:|:------:|:---------:|:--------:|
| W3 | | | | | | |
| W4 | | | | | | |
| W5 | | | | | | |
| W6 | | | | | | |
| W7 | | | | | | |
| W8 | | | | | | |

### Context Sync Performance

| Week | Events | Avg Latency (s) | Conflicts Detected | Conflicts Resolved <1h |
|:-----|:------:|:----------------:|:------------------:|:----------------------:|
| W3 | | | | |
| W4 | | | | |
| W5 | | | | |
| W6 | | | | |
| W7 | | | | |
| W8 | | | | |

### LLM Evaluation Accuracy (sampled)

| Week | Samples | LLM=ACCEPT, Expert=ACCEPT | LLM=CLARIFY, Expert=CLARIFY | Disagreements | Accuracy % |
|:-----|:-------:|:-------------------------:|:---------------------------:|:-------------:|:----------:|
| W3 | | | | | |
| W4 | | | | | |
| W5 | | | | | |
| W6 | | | | | |
| W7 | | | | | |
| W8 | | | | | |

---

## Summary Statistics

| Metric | Baseline (W1-W2 avg) | Deployment (W3-W8 avg) | Δ% | p-value | Cliff's δ |
|:-------|:---------------------:|:----------------------:|:--:|:-------:|:---------:|
| L_resp (hours) | | | | | |
| R_miss (per month, projected) | | | | | |
| T_exec (min/day) | | | | | |
| R_dup (per week) | | | | | |
| L_sync (seconds) | N/A | | — | — | — |
| R_sched (uptime %) | N/A | | — | — | — |
| A_eval (accuracy %) | N/A | | — | — | — |

*Statistical tests: Wilcoxon signed-rank (non-parametric paired). Effect sizes: Cliff's delta.*
