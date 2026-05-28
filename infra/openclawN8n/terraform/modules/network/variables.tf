variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "vpc_name" {
  type    = string
  default = "lab-vpc"
}

variable "subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}