# Instance + static IP
resource "google_compute_address" "static_ip" {
  name    = "${var.name}-static-ip"
  region  = var.region
  project = var.project_id
}

resource "google_compute_instance" "vm" {
  name         = "${var.name}-vm"
  machine_type = var.machine_type
  zone         = var.zone
  project      = var.project_id
  tags         = var.tags

  boot_disk {
    initialize_params {
      image = var.disk_image
      size  = var.disk_size_gb
    }
  }

  network_interface {
    subnetwork = var.subnetwork_id
    access_config {
      nat_ip = google_compute_address.static_ip.address
    }
  }

  metadata = {
    ssh-keys = "ansible:${file(var.ssh_public_key_path)}"
  }

  lifecycle {
    # Prevent accidental destruction of running instances
    prevent_destroy = false   # flip to true once stable
  }
}