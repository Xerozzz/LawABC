variable "region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "ap-southeast-1" # Singapore
}

variable "project_name" {
  description = "Name prefix used for tagging resources."
  type        = string
  default     = "clearair"
}

variable "instance_type" {
  description = "EC2 instance type. t3.small (2GB) is the practical minimum for the in-place Docker build; use t3.medium if builds run out of memory."
  type        = string
  default     = "t3.small"
}

variable "admin_cidr" {
  description = "CIDR allowed to SSH to the instance (e.g. \"1.2.3.4/32\" — your public IP). Use 0.0.0.0/0 only if you must."
  type        = string
}

variable "ssh_public_key" {
  description = "Contents of an SSH public key to install for the ec2-user (e.g. contents of ~/.ssh/id_ed25519.pub)."
  type        = string
}

variable "repo_url" {
  description = "Public git URL of the app repo the instance clones and builds. Must be publicly reachable (no credentials are provided to the instance)."
  type        = string
  default     = "https://github.com/Xerozzz/LawABC.git"
}

variable "repo_branch" {
  description = "Branch to deploy."
  type        = string
  default     = "main"
}

variable "site_address" {
  description = "Caddy edge address. \":80\" serves plain HTTP; set a hostname (e.g. \"clearair.example.com\") for automatic HTTPS — point its DNS A record at the instance's Elastic IP first."
  type        = string
  default     = ":80"
}

variable "root_volume_gb" {
  description = "Root EBS volume size in GB."
  type        = number
  default     = 20
}
