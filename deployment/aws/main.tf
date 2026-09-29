# Terraform Reference Architecture for AWS Enterprise Deployment
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

# 1. Dedicated S3 Bucket for Multi-Tenant Document Storage
resource "aws_s3_bucket" "document_vault" {
  bucket        = "enterprise-ai-documents-${var.environment}"
  force_destroy = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_encryption" {
  bucket = aws_s3_bucket.document_vault.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 2. Managed PostgreSQL 16 RDS
resource "aws_db_instance" "postgres" {
  identifier          = "enterprise-ai-db-${var.environment}"
  engine              = "postgres"
  engine_version      = "16.1"
  instance_class      = "db.t4g.medium"
  allocated_storage   = 50
  max_allocated_storage = 500
  storage_encrypted   = true
  username            = "enterprise_admin"
  password            = "Sup3rS3cur3DbPassw0rd!"
  multi_az            = true
  skip_final_snapshot = false
  final_snapshot_identifier = "enterprise-ai-db-final-snapshot"
}

# 3. Managed ElastiCache Redis Cluster
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "enterprise-ai-cache"
  engine               = "redis"
  node_type            = "cache.t4g.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# 4. ECS Fargate Cluster & Service
resource "aws_ecs_cluster" "ai_cluster" {
  name = "enterprise-ai-cluster-${var.environment}"
}

resource "aws_ecs_task_definition" "backend_task" {
  family                   = "enterprise-ai-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/enterprise-ai-backend:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
        }
      ]
      environment = [
        { name = "DATABASE_URL", value = "postgresql://enterprise_admin:Sup3rS3cur3DbPassw0rd!@${aws_db_instance.postgres.endpoint}/enterprise_agent" },
        { name = "REDIS_URL", value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379/0" },
        { name = "USE_REDIS_CACHE", value = "True" },
        { name = "VECTOR_DB_TYPE", value = "qdrant" }
      ]
    }
  ])
}

output "s3_bucket_name" {
  value = aws_s3_bucket.document_vault.bucket
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}
