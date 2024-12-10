############################################
# Data Visualization
############################################
resource "aws_s3_object" "metadata_data_visualization" {
  bucket = aws_s3_bucket.metadata_bucket.id
  key    = "sec_filing_table_sample/metadata.json"
  source = "${path.module}/../metadata/sec_filing_table_sample/metadata.json"

  depends_on = [
    aws_s3_bucket.metadata_bucket
  ]
}