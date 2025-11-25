# AppMat Migration Guide (2025 Standard)

## 1. Folder Structure Changes
- Legacy `src/services-old/` removed
- New structure under `src/services/*`
- CLI scripts moved to `/scripts`

## 2. Feature Flags
- Enabled Claude Sonnet 4.5
- Controlled by K8s patch and env var

## 3. Deployment Flow
- Staging → promote-to-prod workflow
- Rollback via rollback.yml

## 4. Push System Upgrade
- Device registration moved to new service layer
- Unified notify API

## 5. API Alignment
- Orders API standardized
- Payments & callback unified
