# All firewall rules
resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.network_name}-allow-ssh"
  network = var.network_name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.ssh_source_ranges
  target_tags   = ["lab-instance"]
}

resource "google_compute_firewall" "allow_http_https" {
  name    = "${var.network_name}-allow-http-https"
  network = var.network_name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["lab-instance"]
}

resource "google_compute_firewall" "allow_app_ports" {
  count   = length(var.app_ports) > 0 ? 1 : 0
  name    = "${var.network_name}-allow-app-ports"
  network = var.network_name

  allow {
    protocol = "tcp"
    ports    = var.app_ports
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["lab-instance"]
}

resource "google_compute_firewall" "allow_icmp" {
  name    = "${var.network_name}-allow-icmp"
  network = var.network_name

  allow {
    protocol = "icmp"
  }

  source_ranges = ["0.0.0.0/0"]
}