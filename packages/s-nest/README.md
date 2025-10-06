# Mantic NestJS Backend

A NestJS backend service for construction schedule processing.

Login:
gcloud auth application-default login

## Local Development with Docker

### Prerequisites

- Docker
- Docker Compose
- Node.js 18+

### Environment Setup

1. Create a .env.development file in the project root with:
   ```
   REDIS_HOST=redis
   REDIS_PORT=6379
   GOOGLE_APPLICATION_CREDENTIALS_HOST=/path/to/your/credentials.json
   ```

### Starting the Application

- Regular start: `npm run docker:dev`
- Start with rebuild (after dependency changes): `npm run docker:dev:build`
- Stop services: `npm run docker:dev:down`
- View logs: `npm run docker:dev:logs`
- Reauth with Firebase: `gcloud auth application-default login`

The application will be available at:

- API: http://localhost:3000
- Swagger Documentation: http://localhost:3000/api

### Available Scripts

- `npm run docker:dev` - Start containers
- `npm run docker:dev:build` - Rebuild and start containers
- `npm run docker:dev:down` - Stop containers
- `npm run docker:dev:logs` - View container logs
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run linter
- `npm run format` - Format code

## Tech Stack

- NestJS
- TypeScript
- Docker
- Redis
- Firebase Admin SDK
- OpenAI SDK
- BullMQ for queue management

## GCP Infrastructure

### Cloud Run Deployment

The application is deployed on Google Cloud Run:

- Region: us-central1
- Memory: 512Mi
- Min instances: 0
- Max instances: 10
- Service account: jbm-nest@mantic-ai.iam.gserviceaccount.com
- VPC Connector: mantic-connector
- VPC Egress: all-traffic (routes all outbound traffic through VPC)

### Redis Memorystore Instance

Redis is managed via Google Cloud Memorystore:

- Instance ID: mantic-memorystore
- Type: Basic
- Location: us-central1
- Total size: 1 GB
- Primary Endpoint: 10.93.117.187:6379
- Reserved IP Range: 10.93.117.184/29
- Network: mantic-vpc

### Network Architecture

#### VPC Network Configuration

The service uses a dedicated VPC for secure connectivity:

- VPC Name: mantic-vpc
- Allocated internal IP range: 10.83.221.0/24
- Subnet Name: mantic-subnet
- Subnet Range: 10.0.0.0/24

#### Serverless VPC Access Connector

Allows Cloud Run to access VPC resources:

- Name: mantic-connector
- Network: mantic-vpc
- Subnet: 10.8.0.0/28
- Region: us-central1
- Instance type: e2-micro
- Min instances: 2
- Max instances: 10

#### Static Outbound IP Configuration

For accessing external services with IP-based restrictions:

1. **Cloud Router**:

   - Name: mantic-router
   - Network: mantic-vpc
   - Region: us-central1

2. **Static IP**:

   - Name: mantic-static-ip
   - Region: us-central1
   - Address: 34.27.89.23

3. **Cloud NAT Gateway**:
   - Name: mantic-nat
   - Router: mantic-router
   - Region: us-central1
   - IP pool: mantic-static-ip

#### Firewall Rules

| Name                      | Direction | Network    | Priority | Allow                   | Deny | Disabled |
| ------------------------- | --------- | ---------- | -------- | ----------------------- | ---- | -------- |
| mantic-allow-internal     | INGRESS   | mantic-vpc | 1000     | udp                     | -    | No       |
| allow-redis-ingress       | INGRESS   | mantic-vpc | 1000     | tcp:6379                | -    | No       |
| mantic-allow-vpc-internal | INGRESS   | mantic-vpc | 1000     | tcp:6379,tcp:80,tcp:443 | -    | No       |
| mantic-allow-incoming     | INGRESS   | mantic-vpc | 1000     | icmp                    | -    | No       |
| mantic-allow-egress       | EGRESS    | mantic-vpc | 1000     | all                     | -    | No       |

### Service Account & Permissions

The service uses workload identity with a dedicated service account:

- Service Account: jbm-nest@mantic-ai.iam.gserviceaccount.com
- Identity Pool: jbm-nest-pool
- Identity Provider: jbm-nest-provider

Key permissions:

- roles/redis.viewer - View Redis instances
- roles/redis.dbConnectionUser - Connect to Redis instances
- roles/vpcaccess.user - Use VPC connectors
- roles/compute.networkUser - Use VPC network resources
- roles/servicenetworking.serviceAgent - Allow service networking connections
- roles/cloudbuild.builds.builder - For Cloud Build
- roles/firebase.admin - For Firebase access
- roles/run.invoker - For Cloud Run invocation
- roles/secretmanager.secretAccessor - For accessing secrets

### Environment Variables

Production environment variables:
NODE_ENV=production
REDIS_HOST=10.93.117.187
REDIS_PORT=6379
REDIS_TLS=false
REDIS_TLS_AUTH=false
REDIS_RETRY_STRATEGY=5000
REDIS_MAX_RETRIES=20
REDIS_ENABLE_OFFLINE_QUEUE=true
REDIS_DEBUG=true
REDIS_SHOW_FRIENDLY_ERROR_STACK=true
FIREBASE_PROJECT_ID=mantic-ai
FIREBASE_STORAGE_BUCKET=mantic-ai.appspot.com
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https

Secrets (managed via Secret Manager):

- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- TYPESENSE_API_KEY
- TYPESENSE_HOST

## Network Troubleshooting Guide

If experiencing connectivity issues:

1. **Verify VPC Configuration**:

   ```bash
   gcloud run services describe sansa-dev-nest --region=us-central1 --format="yaml(vpc)"
   ```

2. **Check Firewall Rules**:

   ```bash
   gcloud compute firewall-rules list --filter="network:mantic-vpc"
   ```

3. **Verify NAT Gateway**:

   ```bash
   gcloud compute routers nats describe mantic-nat --router=mantic-router --region=us-central1
   ```

4. **Test Static IP**:
   Deploy a test service that prints its outbound IP address.

5. **Common Fixes**:
   - Ensure `--vpc-egress=all-traffic` is set for external connectivity
   - Verify NAT gateway is properly configured with static IP
   - Check egress firewall rule exists and permits all outbound traffic
