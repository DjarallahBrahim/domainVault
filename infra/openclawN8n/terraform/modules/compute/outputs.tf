output "public_ip" {
  description = "Static public IP of the instance"
  value       = google_compute_address.static_ip.address
}

output "instance_name" {
  value = google_compute_instance.vm.name
}

output "instance_id" {
  value = google_compute_instance.vm.id
}