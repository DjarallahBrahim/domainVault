output "clawbot_public_ip" {
  description = "Clawbot VM public IP"
  value       = module.clawbot.public_ip
}

output "n8n_public_ip" {
  description = "n8n VM public IP"
  value       = module.n8n.public_ip
}

output "vpc_name" {
  value = module.network.vpc_name
}