##################################################
# S3 Bucket Notification
##################################################

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.start_execution_lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.landing_bucket.arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.landing_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.start_execution_lambda.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""     # Optional: specify a folder prefix
    filter_suffix       = ".pdf" # Optional: specify file type (e.g., ".jpg")
  }
}