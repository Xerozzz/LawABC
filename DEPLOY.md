# Deploying ClearAir to AWS (Terraform)

This provisions a single EC2 instance that runs the whole app with Docker Compose:
**Caddy** (edge, optional auto-HTTPS) → **app** (Express serving the React build + API) → **Postgres**.
It's intentionally simple and cheap — right-sized for a user-testing prototype, easy to tear down.

## What you get

- One `t3.small` instance in your default VPC, with an Elastic IP (stable address)
- The app built and started automatically on first boot
- Generated Postgres/JWT secrets (never committed)
- Demo community content seeded so testers don't see an empty feed

Rough cost: ~US$15/month for the instance while it's running, plus a few cents of storage. `terraform destroy` stops all charges.

## Prerequisites

1. **AWS account** + credentials configured locally (`aws configure`, or env vars). Terraform uses them; they are never sent to the instance.
2. **Terraform** ≥ 1.5 installed.
3. **An SSH key pair** — create one if needed: `ssh-keygen -t ed25519`.
4. **The app repo must be public** (the instance clones it with no credentials). `github.com/Xerozzz/LawABC` — make sure it's public, or fork/mirror it publicly and set `repo_url`.

## Deploy

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set admin_cidr (your IP), ssh_public_key, repo_url
terraform init
terraform plan
terraform apply
```

After apply, Terraform prints `app_url`. **Wait ~3–6 minutes** for first boot to build the images, then open it. To watch progress:

```bash
ssh ec2-user@<public_ip>
sudo tail -f /var/log/cloud-init-output.log
```

## Test accounts

Testers just tap **Sign up** and create their own account (email + password, low-friction). The community feed is pre-seeded with demo reflections.

## HTTPS / custom domain (needed for the map's live geolocation)

Plain HTTP works for everything **except** "Check where I am now" on the Trigger Map and device notifications — browsers block geolocation/Notifications on insecure origins.

To enable HTTPS:
1. Point a domain's **DNS A record** at the Elastic IP from `terraform output public_ip`.
2. Set `site_address = "yourdomain.com"` in `terraform.tfvars`.
3. `terraform apply` again. Caddy auto-provisions a Let's Encrypt certificate.

## Updating the app after a code change

```bash
ssh ec2-user@<public_ip>
cd /opt/clearair
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Tear down

```bash
cd infra
terraform destroy
```

## Test the production build locally first (optional, recommended)

No AWS needed — this is the exact image the server runs:

```bash
cp .env.prod.example .env      # in the repo root; edit the two secrets
docker compose -f docker-compose.prod.yml up --build
# open http://localhost
```

## Security notes (prototype-grade)

- SSH is restricted to `admin_cidr`; web ports 80/443 are open (as they must be).
- Generated secrets live in the instance's user-data and in Terraform **state** — keep `terraform.tfstate` private (it's gitignored). For anything beyond a prototype, use a remote state backend (e.g. S3 + DynamoDB lock) and a secrets manager.
- Postgres runs in a container with a persistent volume on the instance — fine for testing; use RDS with backups for production.
