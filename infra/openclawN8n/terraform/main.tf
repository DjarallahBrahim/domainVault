module "network" {
  source = "./modules/network"

  project_id = var.project_id
  region     = var.region
  vpc_name   = "lab-vpc"
  subnet_cidr = "10.0.1.0/24"
}

module "firewall" {
  source = "./modules/firewall"

  network_name = module.network.vpc_name
  # Pass only the ports each app actually needs
  app_ports = ["3001", "5678"]
}

module "clawbot" {
  source = "./modules/compute"

  project_id          = var.project_id
  region              = var.region
  zone                = var.zone
  name                = "clawbot"
  machine_type        = var.machine_type
  subnetwork_id       = module.network.subnet_id
  ssh_public_key_path = var.ssh_public_key_path
  tags                = ["lab-instance"]
}

module "n8n" {
  source = "./modules/compute"

  project_id          = var.project_id
  region              = var.region
  zone                = var.zone
  name                = "n8n"
  machine_type        = var.machine_type
  subnetwork_id       = module.network.subnet_id
  ssh_public_key_path = var.ssh_public_key_path
  tags                = ["lab-instance"]
}