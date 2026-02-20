variable "server_id" {
  description = "The Mittwald mStudio server ID where the project will be created"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy (e.g., '1.0.0', 'latest')"
  type        = string
  default     = "latest"
}

variable "dockerhub_username" {
  description = "Docker Hub username for pulling images"
  type        = string
}

variable "dockerhub_password" {
  description = "Docker Hub password for pulling images"
  type        = string
  sensitive   = true
}

variable "mittwald_api_key" {
  type        = string
  description = "The API token for the Mittwald API"
  sensitive   = true
}
