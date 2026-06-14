# AWS Deployment Guide — AI Quote Generator

This guide covers building the Docker image, running it locally, and deploying to AWS. The application ships as a **single container** that serves the React UI (nginx) and the Express API on one port.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Local Docker Run](#local-docker-run)
4. [Environment Variables](#environment-variables)
5. [AWS Deployment Options](#aws-deployment-options)
6. [Option A — Amazon ECS Fargate (Recommended)](#option-a--amazon-ecs-fargate-recommended)
7. [Option B — EC2 with Docker Compose](#option-b--ec2-with-docker-compose)
8. [Option C — AWS App Runner](#option-c--aws-app-runner)
9. [Authentication on AWS](#authentication-on-aws)
10. [HTTPS and Custom Domain](#https-and-custom-domain)
11. [Persistence and Backups](#persistence-and-backups)
12. [CI/CD with GitHub Actions](#cicd-with-github-actions)
13. [Operations](#operations)
14. [Troubleshooting](#troubleshooting)

---

## Architecture

```
                    ┌─────────────────────────────────────┐
  Internet ────────►│  ALB / App Runner / EC2 :80/443     │
                    │  ┌───────────────────────────────┐  │
                    │  │  Docker container             │  │
                    │  │  ┌─────────┐   ┌───────────┐  │  │
                    │  │  │ nginx   │──►│ Express   │  │  │
                    │  │  │ :80     │   │ API :3001 │  │  │
                    │  │  │ (React) │   │ (Prisma)  │  │  │
                    │  │  └─────────┘   └─────┬─────┘  │  │
                    │  │                      │        │  │
                    │  │              ┌───────▼──────┐ │  │
                    │  │              │ /data volume │ │  │
                    │  │              │ SQLite + PDFs│ │  │
                    │  │              └──────────────┘ │  │
                    │  └───────────────────────────────┘  │
                    └─────────────────────────────────────┘
```

| Component | Port | Notes |
|-----------|------|-------|
| nginx | 80 (exposed) | Serves static frontend, proxies `/api/*` to backend |
| Express API | 3001 (internal) | Not exposed outside the container |
| SQLite DB | — | `file:/data/app.db` on persistent volume |
| PDF storage | — | `/data/pdfs` on same volume |

**Health check:** `GET /api/health` → `{ "status": "ok" }`

---

## Prerequisites

- Docker 24+ and Docker Compose v2
- AWS CLI v2 configured (`aws configure`)
- An AWS account with permissions for ECR, ECS (or EC2/App Runner), IAM, VPC, and optionally Cognito
- (Production) A domain and ACM certificate for HTTPS

---

## Local Docker Run

### 1. Build and start

```bash
cd /path/to/Proposal

# Optional: configure environment
cp .env.docker.example .env
# Edit .env — set JWT_SECRET and passwords before any shared deployment

docker compose up --build -d
```

### 2. Verify

```bash
curl http://localhost:8080/api/health
# {"status":"ok","timestamp":"..."}

open http://localhost:8080
```

### 3. Default login (AUTH_MODE=local)

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@motherson.com | Admin123!  |
| User  | user@motherson.com  | User123!   |

Change these in `.env` before deploying to any shared environment.

### 4. Stop

```bash
docker compose down          # keep data volume
docker compose down -v       # delete SQLite + PDFs
```

### 5. Seed sample quotes (optional)

Set `SEED_ON_START=true` in `.env`, then `docker compose up -d --force-recreate`.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_MODE` | No | `local` | `local` or `cognito` |
| `JWT_SECRET` | **Yes (prod)** | — | Signing key for local JWT auth |
| `JWT_EXPIRES_IN` | No | `8h` | Token lifetime |
| `LOCAL_ADMIN_EMAIL` | No | admin@motherson.com | Local admin account |
| `LOCAL_ADMIN_PASSWORD` | No | Admin123! | Local admin password |
| `LOCAL_USER_EMAIL` | No | user@motherson.com | Local user account |
| `LOCAL_USER_PASSWORD` | No | User123! | Local user password |
| `COGNITO_REGION` | Cognito | — | e.g. `us-east-1` |
| `COGNITO_USER_POOL_ID` | Cognito | — | User pool ID |
| `COGNITO_CLIENT_ID` | Cognito | — | App client ID |
| `COGNITO_ADMIN_GROUP` | No | `admin` | Cognito group for admin role |
| `COGNITO_USER_GROUP` | No | `user` | Cognito group for user role |
| `DATABASE_URL` | No | `file:/data/app.db` | SQLite path (use `/data` volume) |
| `PDF_STORAGE_PATH` | No | `/data/pdfs` | Generated PDF directory |
| `SEED_ON_START` | No | `false` | Run sample seed on container start |
| `PORT` | No | `3001` | Internal API port (do not expose publicly) |

Generate a production secret:

```bash
openssl rand -base64 32
```

---

## AWS Deployment Options

| Option | Best for | Complexity | Persistent storage |
|--------|----------|------------|-------------------|
| **ECS Fargate** | Production, auto-scaling | Medium | EFS mount at `/data` |
| **EC2 + Compose** | Single-instance, lowest cost | Low | EBS volume |
| **App Runner** | Quick POC (single instance) | Lowest | Limited — not ideal for SQLite |

**Recommendation:** Use **ECS Fargate + EFS** for production workloads that need durable quotes and PDFs.

---

## Option A — Amazon ECS Fargate (Recommended)

### Step 1 — Push image to Amazon ECR

```bash
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO=ai-quote-generator

aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION 2>/dev/null || true

aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t $ECR_REPO:latest .
docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

### Step 2 — Create EFS for persistence

```bash
# Create EFS file system (note the FileSystemId)
aws efs create-file-system --region $AWS_REGION --performance-mode generalPurpose --tags Key=Name,Value=ai-quote-generator-data

# Create mount targets in each private subnet used by ECS tasks
aws efs create-mount-target \
  --file-system-id fs-XXXXXXXX \
  --subnet-id subnet-XXXXXXXX \
  --security-groups sg-XXXXXXXX
```

### Step 3 — Store secrets in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name ai-quote-generator/prod \
  --secret-string '{
    "JWT_SECRET":"YOUR_GENERATED_SECRET",
    "LOCAL_ADMIN_PASSWORD":"YourSecurePassword1!",
    "LOCAL_USER_PASSWORD":"YourSecurePassword2!"
  }'
```

For Cognito mode, include `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, etc.

### Step 4 — ECS task definition (excerpt)

Create a Fargate task with:

- **Container image:** `$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ai-quote-generator:latest`
- **Container port:** `80`
- **CPU / Memory:** `512` / `1024` (minimum; use `1024`/`2048` under load)
- **Environment:** `AUTH_MODE`, `NODE_ENV=production`
- **Secrets:** map `JWT_SECRET`, passwords from Secrets Manager
- **Mount EFS** at `/data` (access point recommended)
- **Health check:** `CMD curl -f http://localhost/api/health || exit 1`

Example EFS volume block in task definition JSON:

```json
{
  "name": "app-data",
  "efsVolumeConfiguration": {
    "fileSystemId": "fs-XXXXXXXX",
    "transitEncryption": "ENABLED",
    "authorizationConfig": {
      "accessPointId": "fsap-XXXXXXXX",
      "iam": "ENABLED"
    }
  }
}
```

Container mount:

```json
{
  "sourceVolume": "app-data",
  "containerPath": "/data",
  "readOnly": false
}
```

### Step 5 — Application Load Balancer

1. Create an **Application Load Balancer** (internet-facing).
2. Target group: port **80**, health check path **`/api/health`**, matcher `200`.
3. Listener **443** with ACM certificate → forward to target group.
4. Optional HTTP **80** listener → redirect to HTTPS.

### Step 6 — ECS service

```bash
aws ecs create-service \
  --cluster your-cluster \
  --service-name ai-quote-generator \
  --task-definition ai-quote-generator:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=80"
```

Use **desired-count 1** for SQLite (single-writer). Do not scale horizontally without migrating to PostgreSQL/RDS.

### Step 7 — Security groups

| Rule | Source | Port | Purpose |
|------|--------|------|---------|
| ALB ingress | 0.0.0.0/0 | 443 | Public HTTPS |
| ECS task ingress | ALB security group | 80 | Traffic from ALB only |
| EFS ingress | ECS task security group | 2049 | NFS for `/data` |

---

## Option B — EC2 with Docker Compose

Best for a single VM deployment with minimal AWS service overhead.

### 1. Launch EC2

- AMI: **Amazon Linux 2023** or **Ubuntu 22.04**
- Instance: `t3.small` or larger
- Storage: 30 GB+ gp3 root volume **plus** optional dedicated EBS for `/data`
- Security group: allow **80** and **443** from your IP or `0.0.0.0/0`

### 2. Install Docker on the instance

```bash
# Amazon Linux 2023
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Install compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

### 3. Deploy application

```bash
git clone <your-repo-url> ai-quote-generator
cd ai-quote-generator
cp .env.docker.example .env
# Edit .env with production secrets

docker compose up --build -d
```

### 4. Persist data on EBS (recommended)

```bash
sudo mkfs -t xfs /dev/xvdf
sudo mkdir -p /mnt/app-data
sudo mount /dev/xvdf /mnt/app-data
echo '/dev/xvdf /mnt/app-data xfs defaults,nofail 0 2' | sudo tee -a /etc/fstab
```

Update `docker-compose.yml` volume:

```yaml
volumes:
  - /mnt/app-data:/data
```

### 5. HTTPS with Caddy or nginx reverse proxy (on host)

Example Caddy (`/etc/caddy/Caddyfile`):

```
quotes.yourdomain.com {
    reverse_proxy localhost:8080
}
```

---

## Option C — AWS App Runner

Fastest path for a demo. **Caveat:** App Runner has limited volume support; SQLite data may be lost on redeploy. Use only for evaluation, not production.

```bash
aws apprunner create-service \
  --service-name ai-quote-generator \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/ai-quote-generator:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "80",
        "RuntimeEnvironmentVariables": {
          "AUTH_MODE": "local",
          "JWT_SECRET": "your-secret"
        }
      }
    },
    "AutoDeploymentsEnabled": false
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/api/health",
    "Interval": 20,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 3
  }'
```

---

## Authentication on AWS

### Local JWT mode (`AUTH_MODE=local`)

- Works out of the box with seeded admin/user accounts.
- Set strong passwords and `JWT_SECRET` via Secrets Manager.
- Suitable for internal teams behind a VPN or ALB.

### AWS Cognito mode (`AUTH_MODE=cognito`)

1. Create a **Cognito User Pool** with email sign-in.
2. Create an **App Client** with `USER_PASSWORD_AUTH` enabled (if using username/password login).
3. Create groups: `admin`, `user`.
4. Assign users to groups for role-based access.
5. Set environment variables:

```env
AUTH_MODE=cognito
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_ADMIN_GROUP=admin
COGNITO_USER_GROUP=user
```

6. ECS task role needs `cognito-idp:AdminInitiateAuth` if using server-side auth flows (optional depending on setup).

The frontend calls `/api/auth/login`; the backend issues or forwards tokens based on mode.

---

## HTTPS and Custom Domain

1. Request an **ACM certificate** in the same region as the ALB.
2. Validate via DNS (Route 53 recommended).
3. Attach certificate to ALB HTTPS listener.
4. Create a Route 53 **A record** (alias) pointing to the ALB.

---

## Persistence and Backups

SQLite and generated PDFs live under `/data`:

| Path | Content |
|------|---------|
| `/data/app.db` | Quotes, users, admin settings |
| `/data/pdfs/` | Generated proposal PDFs |

### Backup (EC2 / EFS)

```bash
# On EC2
docker compose exec app tar czf /tmp/backup.tar.gz -C /data .
aws s3 cp /tmp/backup.tar.gz s3://your-backup-bucket/ai-quote-generator/$(date +%F).tar.gz
```

Schedule with **EventBridge + Lambda** or a cron job on EC2.

### Restore

```bash
docker compose down
tar xzf backup.tar.gz -C /mnt/app-data   # or EFS mount
docker compose up -d
```

---

## CI/CD with GitHub Actions

Example workflow (`.github/workflows/deploy-ecr.yml`):

```yaml
name: Build and Push to ECR

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        env:
          ECR_REGISTRY: ${{ steps.login.outputs.registry }}
          ECR_REPOSITORY: ai-quote-generator
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
```

Trigger ECS redeploy with a new task definition revision or enable **ECS rolling update** on image tag change.

---

## Operations

### View logs

```bash
# Local
docker compose logs -f app

# ECS
aws logs tail /ecs/ai-quote-generator --follow
```

### Update to a new version

```bash
docker compose pull    # if using registry image
docker compose up -d --build
```

On ECS: push new image tag, update service to force new deployment.

### Resource sizing

| Load | CPU | Memory |
|------|-----|--------|
| Dev / demo | 0.5 vCPU | 1 GB |
| Production (< 50 users) | 1 vCPU | 2 GB |
| Heavy PDF generation | 2 vCPU | 4 GB |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `502 Bad Gateway` from ALB | Container not healthy | Check `docker logs`; verify `/api/health` returns 200 |
| `Session expired` immediately | `JWT_SECRET` changed between restarts | Use a fixed secret in Secrets Manager |
| Database empty after redeploy | No persistent volume | Mount EFS/EBS at `/data` |
| `prisma db push` fails on start | EFS permissions | Use EFS access point with `755` on `/data` |
| PDF download fails | Missing auth header | User must be logged in; token sent via `Authorization` |
| Cognito login fails | Wrong pool/client or missing `USER_PASSWORD_AUTH` | Verify Cognito app client settings |
| Container exits immediately | Invalid env or port conflict | Run `docker compose logs app` |

### Manual health check inside container

```bash
docker compose exec app curl -f http://localhost/api/health
docker compose exec app ls -la /data
```

---

## Quick Reference

```bash
# Build image
docker build -t ai-quote-generator:latest .

# Run locally
docker compose up -d

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag ai-quote-generator:latest <account>.dkr.ecr.<region>.amazonaws.com/ai-quote-generator:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/ai-quote-generator:latest
```

For development without Docker, see [README.md](./README.md).
