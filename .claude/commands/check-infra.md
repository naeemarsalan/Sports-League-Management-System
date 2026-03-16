---
description: Check infrastructure health - Appwrite, Grafana, Prometheus
---

Check the health of project infrastructure.

## Appwrite
- Endpoint: https://appwrite.arsalan.io (v1.8.1)
- Project: 696436a5002d6f83aed7
- Check health: `curl -s https://appwrite.arsalan.io/v1/health`
- Check functions: Use Appwrite MCP or API to list function deployments and their status

## Grafana
- URL: http://172.16.2.252:3000
- Dashboard UID: b7523c99-7ffe-4bb2-8a69-fd4fa6cfc073
- Token: stored in GRAFANA_SERVICE_ACCOUNT_TOKEN env var
- Use Grafana MCP to check dashboard panels and alerts

## Prometheus
- URL: http://172.16.2.252:9090
- 14 targets up (K8s metrics only)
- Note: Appwrite application-level metrics are NOT available (port 9000 unreachable)

## Quick Health Check
```bash
curl -s https://appwrite.arsalan.io/v1/health | python3 -m json.tool
curl -s http://172.16.2.252:9090/api/v1/targets | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Targets up: {sum(1 for t in d[\"data\"][\"activeTargets\"] if t[\"health\"]==\"up\")}/{len(d[\"data\"][\"activeTargets\"])}')"
```
