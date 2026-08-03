locals {
  tags = {
    Project   = var.project_name
    ManagedBy = "terraform"
  }
}

# --- Generated secrets (url-safe: no special chars so the DATABASE_URL stays valid) ---
resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

# --- Networking: use the account's default VPC/subnet to keep the prototype simple ---
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Latest Amazon Linux 2023 AMI (x86_64) via SSM — no hardcoded AMI ids.
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_key_pair" "this" {
  key_name   = "${var.project_name}-key"
  public_key = var.ssh_public_key
  tags       = local.tags
}

resource "aws_security_group" "this" {
  name        = "${var.project_name}-sg"
  description = "ClearAir prototype: web in, SSH from admin only"
  vpc_id      = data.aws_vpc.default.id
  tags        = local.tags

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH (admin only)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "app" {
  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = var.instance_type
  subnet_id                   = data.aws_subnets.default.ids[0]
  key_name                    = aws_key_pair.this.key_name
  vpc_security_group_ids      = [aws_security_group.this.id]
  associate_public_ip_address = true

  root_block_device {
    volume_size = var.root_volume_gb
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    repo_url          = var.repo_url
    repo_branch       = var.repo_branch
    site_address      = var.site_address
    postgres_password = random_password.postgres.result
    jwt_secret        = random_password.jwt.result
  })

  # Re-run bootstrap if the deploy inputs change.
  user_data_replace_on_change = true

  tags = merge(local.tags, { Name = "${var.project_name}-app" })
}

resource "aws_eip" "this" {
  instance = aws_instance.app.id
  domain   = "vpc"
  tags     = merge(local.tags, { Name = "${var.project_name}-eip" })
}
