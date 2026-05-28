output "ssh_firewall_name" {
  value = google_compute_firewall.allow_ssh.name
}

output "app_firewall_name" {
  value = length(var.app_ports) > 0 ? google_compute_firewall.allow_app_ports[0].name : null
}