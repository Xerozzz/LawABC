output "public_ip" {
  description = "Elastic IP of the instance."
  value       = aws_eip.this.public_ip
}

output "app_url" {
  description = "URL to open the prototype. If you set a hostname in site_address, use https://<that-host> once DNS points here."
  value       = var.site_address == ":80" ? "http://${aws_eip.this.public_ip}" : "http://${aws_eip.this.public_ip} (or https://${trimprefix(var.site_address, ":")} once DNS + TLS are ready)"
}

output "ssh_command" {
  description = "SSH into the instance (use the private key matching ssh_public_key)."
  value       = "ssh ec2-user@${aws_eip.this.public_ip}"
}

output "first_boot_note" {
  description = "The instance builds the app on first boot; allow a few minutes before the site responds."
  value       = "First boot runs 'docker compose up --build' — allow ~3-6 minutes. Check progress: ssh in, then 'sudo tail -f /var/log/cloud-init-output.log'."
}
