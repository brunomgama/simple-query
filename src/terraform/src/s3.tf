locals {
  landing_bucket  = "dv-landing-bucket"
  metadata_bucket = "dv-metadata-bucket"
  analysis_bucket = "dv-analysis-bucket"
}

##################################################
# LANDING Bucket
##################################################
resource "aws_s3_bucket" "landing_bucket" {
  bucket = local.landing_bucket
  tags   = var.bucket_tags
}

resource "aws_s3_bucket_policy" "landing_bucket_policy" {
  bucket = aws_s3_bucket.landing_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowSpecificAccess",
        Effect = "Allow",
        Principal = {
          AWS = var.user_arn
        },
        Action   = var.policy_actions,
        Resource = "${aws_s3_bucket.landing_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "cors_configuration_landing" {
  bucket = aws_s3_bucket.landing_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "DELETE"]
    allowed_origins = [var.permanent_link]
    expose_headers  = []
    max_age_seconds = 3000
  }
}

##################################################
# METADATA Bucket
##################################################
resource "aws_s3_bucket" "metadata_bucket" {
  bucket = local.metadata_bucket
  tags   = var.bucket_tags
}

resource "aws_s3_bucket_policy" "metadata_bucket_policy" {
  bucket = aws_s3_bucket.metadata_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowSpecificAccess",
        Effect = "Allow",
        Principal = {
          AWS = var.user_arn
        },
        Action   = var.policy_actions,
        Resource = "${aws_s3_bucket.metadata_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "cors_configuration_landing" {
  bucket = aws_s3_bucket.metadata_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "DELETE"]
    allowed_origins = [var.permanent_link]
    expose_headers  = []
    max_age_seconds = 3000
  }
}

##################################################
# ANALYSIS Bucket
##################################################
resource "aws_s3_bucket" "analysis_bucket" {
  bucket = local.analysis_bucket
  tags   = var.bucket_tags
}

resource "aws_s3_bucket_policy" "analysis_bucket_policy" {
  bucket = aws_s3_bucket.analysis_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowSpecificAccess",
        Effect = "Allow",
        Principal = {
          AWS = var.user_arn
        },
        Action   = var.policy_actions,
        Resource = "${aws_s3_bucket.analysis_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "cors_configuration_analysis" {
  bucket = aws_s3_bucket.analysis_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "DELETE", "GET", "HEAD"]
    allowed_origins = [var.permanent_link]
    expose_headers  = []
    max_age_seconds = 3000
  }
}