# AI Cost Monitoring Dashboard Setup Guide

This guide explains how to set up monitoring dashboards for AI API costs using Grafana or Metabase. This is critical for tracking expenses, especially with Groq API usage for quiz, flashcard, and essay generation.

## Overview

The Quiz Hub backend uses Groq API (OpenAI-compatible) for AI content generation. Monitoring costs helps:
- Track spending per user/tier
- Identify expensive operations
- Set budgets and alerts
- Optimize prompt engineering
- Plan capacity

## Architecture

```
FastAPI Backend → Logging → Database/Time Series DB → Grafana/Metabase
```

## Option 1: Grafana Setup (Recommended for Real-time Monitoring)

### Prerequisites

- Docker and Docker Compose
- PostgreSQL or InfluxDB (for time-series data)
- Grafana instance

### Step 1: Add Logging to Backend

Create a cost tracking utility:

```python
# backend/utils/cost_tracking.py
import logging
import time
from typing import Optional
from datetime import datetime

logger = logging.getLogger("cost_tracking")

def log_ai_request(
    operation: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    cost_usd: float,
    user_id: Optional[str] = None,
    project_id: Optional[int] = None,
    duration_ms: Optional[float] = None
):
    """Log AI API request for cost tracking"""
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "operation": operation,  # "quiz_generation", "flashcard_generation", "essay_generation", "chat"
        "model": model,  # "openai/gpt-oss-120b"
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "cost_usd": cost_usd,
        "user_id": user_id,
        "project_id": project_id,
        "duration_ms": duration_ms,
    }
    
    # Log as JSON for easy parsing
    logger.info(f"AI_COST: {json.dumps(log_data)}")
    
    # Optionally write to database
    # db.execute("INSERT INTO ai_cost_logs ...")
```

### Step 2: Integrate Cost Tracking

Update generation functions to track costs:

```python
# backend/utils/utils.py (example)
from backend.utils.cost_tracking import log_ai_request

def generate_quiz(url: str, num_questions: int, difficulty: str):
    start_time = time.time()
    
    # ... existing generation code ...
    
    # Calculate costs (example pricing - update with actual Groq rates)
    input_tokens = len(prompt) // 4  # Rough estimate
    output_tokens = len(response) // 4
    cost_per_1k_input = 0.0001  # Example: $0.0001 per 1k input tokens
    cost_per_1k_output = 0.0002  # Example: $0.0002 per 1k output tokens
    cost_usd = (input_tokens / 1000 * cost_per_1k_input) + (output_tokens / 1000 * cost_per_1k_output)
    
    duration_ms = (time.time() - start_time) * 1000
    
    log_ai_request(
        operation="quiz_generation",
        model="openai/gpt-oss-120b",
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost_usd,
        user_id=current_user.id if current_user else None,
        duration_ms=duration_ms
    )
    
    return quiz_data
```

### Step 3: Set Up PostgreSQL for Cost Logs

Create a table to store cost logs:

```sql
-- migrations/add_ai_cost_logs.sql
CREATE TABLE IF NOT EXISTS ai_cost_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    operation VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost_usd DECIMAL(10, 6) NOT NULL,
    user_id VARCHAR(255),
    project_id INTEGER,
    duration_ms DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_cost_logs_timestamp ON ai_cost_logs(timestamp);
CREATE INDEX idx_ai_cost_logs_user_id ON ai_cost_logs(user_id);
CREATE INDEX idx_ai_cost_logs_operation ON ai_cost_logs(operation);
```

### Step 4: Docker Compose for Grafana Stack

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: quiz_hub_monitoring
      POSTGRES_USER: monitoring
      POSTGRES_PASSWORD: ${MONITORING_DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - postgres

volumes:
  postgres_data:
  grafana_data:
```

### Step 5: Configure Grafana Data Source

Create `grafana/provisioning/datasources/postgres.yml`:

```yaml
apiVersion: 1

datasources:
  - name: PostgreSQL
    type: postgres
    access: proxy
    url: postgres:5432
    database: quiz_hub_monitoring
    user: monitoring
    secureJsonData:
      password: ${MONITORING_DB_PASSWORD}
    jsonData:
      sslmode: disable
```

### Step 6: Create Grafana Dashboard

Create dashboard JSON or use Grafana UI to create panels:

**Key Panels:**
1. **Total Cost Over Time** (Line chart)
   ```sql
   SELECT 
     DATE_TRUNC('hour', timestamp) as time,
     SUM(cost_usd) as total_cost
   FROM ai_cost_logs
   WHERE timestamp >= NOW() - INTERVAL '7 days'
   GROUP BY time
   ORDER BY time
   ```

2. **Cost by Operation** (Pie chart)
   ```sql
   SELECT 
     operation,
     SUM(cost_usd) as total_cost
   FROM ai_cost_logs
   WHERE timestamp >= NOW() - INTERVAL '7 days'
   GROUP BY operation
   ```

3. **Cost per User** (Bar chart)
   ```sql
   SELECT 
     user_id,
     SUM(cost_usd) as total_cost,
     COUNT(*) as request_count
   FROM ai_cost_logs
   WHERE timestamp >= NOW() - INTERVAL '7 days'
     AND user_id IS NOT NULL
   GROUP BY user_id
   ORDER BY total_cost DESC
   LIMIT 20
   ```

4. **Token Usage** (Time series)
   ```sql
   SELECT 
     DATE_TRUNC('hour', timestamp) as time,
     SUM(input_tokens) as input_tokens,
     SUM(output_tokens) as output_tokens,
     SUM(total_tokens) as total_tokens
   FROM ai_cost_logs
   WHERE timestamp >= NOW() - INTERVAL '24 hours'
   GROUP BY time
   ORDER BY time
   ```

5. **Average Response Time** (Gauge)
   ```sql
   SELECT 
     AVG(duration_ms) as avg_duration_ms
   FROM ai_cost_logs
   WHERE timestamp >= NOW() - INTERVAL '1 hour'
   ```

### Step 7: Set Up Alerts

Configure Grafana alerts for:
- Daily cost exceeds budget threshold
- Unusual spike in requests
- High error rates

Example alert rule:
```yaml
- uid: cost_budget_alert
  title: Daily Cost Exceeds Budget
  condition: A
  data:
    - refId: A
      queryType: ''
      relativeTimeRange:
        from: 86400
        to: 0
      datasourceUid: postgres
      model:
        rawSql: |
          SELECT SUM(cost_usd) as daily_cost
          FROM ai_cost_logs
          WHERE timestamp >= NOW() - INTERVAL '1 day'
        format: table
  noDataState: NoData
  execErrState: Alerting
  for: 0s
  annotations:
    description: Daily AI cost has exceeded $10
```

## Option 2: Metabase Setup (Better for Business Intelligence)

### Step 1: Install Metabase

```bash
docker run -d -p 3000:3000 \
  -e MB_DB_TYPE=postgres \
  -e MB_DB_DBNAME=quiz_hub_monitoring \
  -e MB_DB_PORT=5432 \
  -e MB_DB_USER=monitoring \
  -e MB_DB_PASS=${MONITORING_DB_PASSWORD} \
  -e MB_DB_HOST=postgres \
  --name metabase \
  metabase/metabase:latest
```

### Step 2: Connect to Database

1. Open Metabase at `http://localhost:3000`
2. Complete setup wizard
3. Add PostgreSQL database connection
4. Point to `ai_cost_logs` table

### Step 3: Create Key Questions

**Daily Cost Report:**
```sql
SELECT 
  DATE(timestamp) as date,
  SUM(cost_usd) as daily_cost,
  COUNT(*) as request_count,
  AVG(cost_usd) as avg_cost_per_request
FROM ai_cost_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC
```

**Cost by User Tier:**
```sql
SELECT 
  u.subscription_plan,
  SUM(c.cost_usd) as total_cost,
  COUNT(*) as request_count,
  AVG(c.cost_usd) as avg_cost
FROM ai_cost_logs c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.timestamp >= CURRENT_DATE - INTERVAL '7 days'
  AND c.user_id IS NOT NULL
GROUP BY u.subscription_plan
```

**Most Expensive Operations:**
```sql
SELECT 
  operation,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost,
  MAX(cost_usd) as max_cost,
  COUNT(*) as count
FROM ai_cost_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY operation
ORDER BY total_cost DESC
```

## Option 3: Simple Log-Based Monitoring (Quick Start)

For quick setup without databases:

### Step 1: Structured Logging

Ensure logs are in JSON format:

```python
import json
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.FileHandler('ai_costs.log'),
        logging.StreamHandler()
    ]
)

def log_cost(operation, cost_usd, **kwargs):
    log_entry = {
        "type": "ai_cost",
        "operation": operation,
        "cost_usd": cost_usd,
        **kwargs
    }
    logging.info(json.dumps(log_entry))
```

### Step 2: Parse Logs with Script

```python
# scripts/analyze_costs.py
import json
from collections import defaultdict
from datetime import datetime

costs_by_operation = defaultdict(float)
costs_by_day = defaultdict(float)

with open('ai_costs.log') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'ai_cost':
                operation = data.get('operation', 'unknown')
                cost = data.get('cost_usd', 0)
                costs_by_operation[operation] += cost
                
                # Parse timestamp if available
                if 'timestamp' in data:
                    day = data['timestamp'][:10]  # YYYY-MM-DD
                    costs_by_day[day] += cost
        except:
            pass

print("Costs by Operation:")
for op, cost in sorted(costs_by_operation.items(), key=lambda x: x[1], reverse=True):
    print(f"  {op}: ${cost:.4f}")

print("\nCosts by Day:")
for day, cost in sorted(costs_by_day.items()):
    print(f"  {day}: ${cost:.4f}")

print(f"\nTotal: ${sum(costs_by_operation.values()):.4f}")
```

## Cost Calculation Reference

Update these with actual Groq API pricing:

```python
# backend/config/ai_pricing.py
GROQ_PRICING = {
    "openai/gpt-oss-120b": {
        "input_per_1k": 0.0001,  # $0.0001 per 1k input tokens
        "output_per_1k": 0.0002,  # $0.0002 per 1k output tokens
    },
    # Add other models as needed
}

def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate cost in USD"""
    if model not in GROQ_PRICING:
        return 0.0
    
    pricing = GROQ_PRICING[model]
    input_cost = (input_tokens / 1000) * pricing["input_per_1k"]
    output_cost = (output_tokens / 1000) * pricing["output_per_1k"]
    return input_cost + output_cost
```

## Best Practices

1. **Log Everything**: Log all AI API calls, even failed ones
2. **Include Context**: Log user_id, project_id, operation type
3. **Track Latency**: Monitor response times to identify slow operations
4. **Set Budgets**: Configure alerts when daily/monthly budgets are exceeded
5. **Regular Reviews**: Review dashboards weekly to identify trends
6. **Optimize Prompts**: Use cost data to identify expensive operations and optimize

## Troubleshooting

**Issue: Logs not appearing in Grafana**
- Check PostgreSQL connection settings
- Verify logs are being written to database
- Check Grafana data source configuration

**Issue: Costs seem incorrect**
- Verify token counting logic
- Check pricing constants match actual API rates
- Review log entries for anomalies

**Issue: High latency**
- Check database indexes on timestamp and user_id columns
- Consider using time-series database (InfluxDB) for better performance
- Optimize dashboard queries

## Next Steps

1. Set up cost tracking in backend
2. Choose monitoring solution (Grafana recommended)
3. Create initial dashboards
4. Set up alerts for budget thresholds
5. Review and optimize based on data

