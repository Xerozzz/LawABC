# Deploying ClearAir to AWS (Terraform)

This provisions a single EC2 instance that runs the whole app with Docker Compose:
**Caddy** (edge, optional auto-HTTPS) → **app** (Express serving the React build + API) → **Postgres**.
It's intentionally simple and cheap — right-sized for a user-testing prototype, easy to tear down.

## What you get

- One `t3.small` instance in your default VPC, with an Elastic IP (stable address)
- The app built and started automatically on first boot
- Generated Postgres/JWT secrets (never committed)
- Community **closed** (`COMMUNITY_ENABLED=false`) — no moderators during testing; demo posts are
  still seeded so the feed isn't empty if you reopen it

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

Testers just tap **Sign up** and create their own account (email + password, low-friction).

The community is closed while testing (its tab is replaced by **Triggers**, and `/api/reflections`
returns 403). To reopen it, set `COMMUNITY_ENABLED=true` in `/opt/clearair/.env` and restart the app:
`docker compose -f docker-compose.prod.yml up -d`. The feed is pre-seeded with demo reflections.

## HTTPS / custom domain (needed for the map's live geolocation)

Plain HTTP works for everything **except** "Check where I am now" on the Trigger Map and device notifications — browsers block geolocation/Notifications on insecure origins. (Adding triggers and pinning them by tapping the map works on plain HTTP.)

**With a domain:**
1. Point a domain's **DNS A record** at the Elastic IP from `terraform output public_ip`.
2. Set `site_address = "yourdomain.com"` in `terraform.tfvars`.
3. `terraform apply` again. Caddy auto-provisions a Let's Encrypt certificate.

**Without a domain (free, using sslip.io):**
A wildcard-DNS hostname like `54-179-1-2.sslip.io` resolves to `54.179.1.2`, so Caddy can
get a real certificate for it — no domain purchase needed. On the **already-running** instance
this avoids replacing the box (no data loss):

```bash
# 1. get the IP
terraform -chdir=infra output -raw public_ip        # e.g. 54.179.1.2
# 2. on the instance, set the hostname (dashes) + restart Caddy
ssh ec2-user@<ip>
cd /opt/clearair
sed -i 's/^SITE_ADDRESS=.*/SITE_ADDRESS=54-179-1-2.sslip.io/' .env   # use YOUR dashed IP
docker compose -f docker-compose.prod.yml up -d
```

Then open `https://54-179-1-2.sslip.io`. Caddy fetches a cert automatically (Let's Encrypt, with
ZeroSSL as fallback). This unlocks the map's live geolocation and Web Push. For a fresh `terraform
apply` deploy, set `site_address` in `terraform.tfvars` to the dashed-IP sslip hostname instead.

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

## Automatic deploys on push (GitHub Actions + SSM)

`.github/workflows/deploy.yml` redeploys the instance on every push to `main`, using AWS
Systems Manager to run the update on the box — **no SSH, no open ports**. One-time setup:

**1. Apply the SSM role** (added to the Terraform):

```bash
cd infra && terraform apply
```
This is an in-place update that attaches an instance profile — your database is preserved.
Wait ~2 minutes afterwards for the instance to register with SSM.

**2. Create a deploy IAM user** with an access key and these permissions (scoped policy recommended;
or quick-start with `AmazonSSMFullAccess` + `AmazonEC2ReadOnlyAccess`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["ec2:DescribeInstances"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["ssm:SendCommand", "ssm:GetCommandInvocation"], "Resource": "*" }
  ]
}
```

**3. Add repository secrets** (GitHub → Settings → Secrets and variables → Actions):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- *(optional variable)* `AWS_REGION` if not `ap-southeast-1`

After that, every push to `main` runs the workflow (see the **Actions** tab). It does
`git reset --hard origin/main` + `docker compose up -d --build` on the instance; the database
volume persists across deploys. You can also trigger it manually from the Actions tab
("Run workflow"). Until steps 1–3 are done, the workflow will appear and fail — that's expected.

## Pilot study data

Participation tracking and the study-team endpoints are documented in
[STUDY.md](STUDY.md). Quick version:

```bash
TOKEN=$(cd infra && terraform output -raw admin_token)
curl -s -H "x-admin-token: $TOKEN" http://<ip>/api/admin/participation.csv -o participation.csv
```

Nightly DB backups are installed on first boot (`ops/backup-db.sh`, 03:15 SGT,
kept 30 days in `/var/backups/clearair`). Set `S3_BUCKET` in
`/etc/cron.d/clearair-backup` to also copy them off the instance.

## Security notes (prototype-grade)

- SSH is restricted to `admin_cidr`; web ports 80/443 are open (as they must be).
- Generated secrets live in the instance's user-data and in Terraform **state** — keep `terraform.tfstate` private (it's gitignored). For anything beyond a prototype, use a remote state backend (e.g. S3 + DynamoDB lock) and a secrets manager.
- Postgres runs in a container with a persistent volume on the instance — fine for testing; use RDS with backups for production.
