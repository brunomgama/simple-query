# AI File Interpreter Decoder

![AWS](https://img.shields.io/badge/Amazon_AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

## 📄 Overview
The **File Interpreter Decoder** is a web application designed to extract structured data from PDF documents using AWS services. The application supports uploading PDF files and metadata in JSON format, with the metadata containing queries for specific information extraction. Extracted results can be accessed and analyzed on the results page.

---

## 🌟 Features

### 🚀 **File Upload**
- Upload PDF documents and corresponding metadata in JSON format.
- Automatically stores files and metadata in designated S3 buckets (`dv-landing-bucket` and `dv-metadata-bucket`).

### ⚙️ **Processing**
- Processes uploaded PDFs using AWS Textract.
- Supports extraction of key-value pairs, query answers, tables, and other structured data.
- Saves extracted results in the `dv-analysis-bucket`.

### 🔍 **Results Viewer**
- View and filter results on the results page.
- Organize data by queries or view all extracted data in a table.
- Filter by data type (e.g., LINE, WORD, KEY_VALUE_SET, QUERY).

---

## 🛠️ Technologies

- **Next.js**: Frontend framework for building the user interface.
- **Terraform**: Infrastructure as Code (IaC) to automate deployment and resource management on AWS.

---

## 📜 Metadata Example

When uploading a PDF file, a corresponding metadata file in JSON format is required. The metadata contains queries that AWS Textract uses to extract specific information from the document. Below is an example of the metadata structure:

```json
{
  "query": {
    "PAYSTUB_YTD_GROSS": {
      "Text": "What is the Project duration?"
    },
    "PAYSTUB_CURRENT_GROSS": {
      "Text": "What is the Initial contract duration?"
    }
  }
}
```

In this example:
- `PAYSTUB_YTD_GROSS` and `PAYSTUB_CURRENT_GROSS` are aliases for the queries.
- The `Text` field defines the specific questions Textract will use to extract data.

This flexible structure allows users to tailor queries for various types of documents.

---

## 🧩 Architecture

![System Architecture](public/Diagram.png)

### 📥 File Upload
1. Upload PDFs and metadata via the home page form.
2. Files are stored in:
    - `dv-landing-bucket` for PDFs.
    - `dv-metadata-bucket` for metadata.

### 📡 Processing
1. S3 triggers an AWS Lambda function upon file upload.
2. Lambda invokes AWS Textract with the document and metadata queries.
3. Extracted data is saved in the `dv-analysis-bucket`.

### 📈 Results Viewer
1. The results page fetches data from the `dv-analysis-bucket`.
2. Users can filter, view, and analyze the extracted information.

---

## 💼 AWS Services and Estimated Costs (eu-west-1)

| **Service**         | **Usage**                                                                 | **Approx. Cost (Monthly)** |
|----------------------|--------------------------------------------------------------------------|---------------------------|
| **Amazon S3**        | Storage for uploaded files, metadata, and results (10 GB total/month).  | ~€1.15                   |
| **AWS Lambda**       | Processing uploaded documents (100,000 invocations, 512 MB memory).     | ~€2.50                   |
| **Amazon Textract**  | Document analysis (1,000 pages/month).                                  | ~€1.50                   |
| **CloudWatch Logs**  | Logging Lambda invocations (50 GB logs/month).                          | ~€5.00                   |
| **IAM**              | Managed roles for secure access.                                        | Free                     |
| **API Gateway**      | For frontend-Lambda communication (if used, 1 million requests/month).  | ~€3.00                   |

**Total Approx. Monthly Cost**: **~€13.15** (Costs may vary depending on actual usage).

---

## 📄 File Structure

### 🖥️ Frontend (Next.js)

#### **`home.tsx`**
- Allows users to upload PDFs and metadata.
- Tracks the progress of uploads and processing.
- Provides navigation to the results page.

#### **`results.tsx`**
- Displays extracted results from the `dv-analysis-bucket`.
- Filters data by type and organizes it into tabs (Query Results and All Data).

### 🛠️ Backend (AWS Lambda)

- **Metadata Parsing**:
    - Reads the JSON metadata to generate Textract queries.

- **Textract Integration**:
    - Processes PDFs to extract structured data.
    - Supports forms, tables, key-value pairs, and custom queries.

- **Output Generation**:
    - Saves the extracted data as CSV files in `dv-analysis-bucket`.

---

## 💻 Local Development

### Prerequisites
- AWS Account with configured S3 buckets and IAM roles.
- Node.js and Terraform installed on your machine.

### Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Environment Variables**:  
   Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_AWS_REGION=eu-west-1
   NEXT_PUBLIC_AWS_ACCESS_KEY_ID=<your-access-key-id>
   NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
   NEXT_PUBLIC_LAMBDA_FUNCTION_NAME=<lambda-function-name>
   NEXT_PUBLIC_S3_BUCKET=dv-landing-bucket
   NEXT_PUBLIC_S3_METADATA_BUCKET=dv-metadata-bucket
   NEXT_PUBLIC_S3_ANALYSIS_BUCKET=dv-analysis-bucket
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Deploy Infrastructure with Terraform**:  
   Navigate to the Terraform directory and deploy:
   ```bash
   terraform init
   terraform apply
   ```

---

## 🚦 How to Use

### Home Page
1. **Upload File and Metadata**:
    - Enter the file name.
    - Select a PDF document and its metadata (JSON file).
    - Click **Start Process** to initiate processing.

2. **Check Results**:
    - Once processing is complete, click **Check Results** to view the extracted data.

### Results Page
1. **View Results**:
    - Select a processed file to load its data.
    - Use the filter to narrow down results by type.

2. **Switch Tabs**:
    - View **Query Results** for specific questions and answers.
    - View **All Data** for the complete processed data.

---

## 🛡️ Troubleshooting

- **File Upload Errors**:
    - Ensure the uploaded file is in PDF format.
    - Verify the metadata follows the correct JSON structure.

- **Processing Errors**:
    - Check AWS CloudWatch logs for Lambda function errors.

- **Missing Results**:
    - Verify the `dv-analysis-bucket` contains the processed results.

---

## 🤝 Contributing

1. Fork this repository.
2. Create a feature branch (`feature-branch-name`).
3. Push your changes and open a pull request.
