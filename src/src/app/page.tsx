"use client";

import { useState } from "react";
import { S3, Lambda } from "aws-sdk";
import {useRouter} from "next/navigation";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [lambdaStatus, setLambdaStatus] = useState<string>("Not Checked");

  const router = useRouter();

  const [progressStatus, setProgressStatus] = useState({
    fileUpload: "pending",
    metadataUpload: "pending",
    lambdaExecution: "pending"
  });

  const s3 = new S3({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  });

  const lambda = new Lambda({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleMetadataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMetadata(event.target.files[0]);
    }
  };

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
  };

  const updateProgress = (type: string, status: string) => {
    setProgressStatus((prev) => ({
      ...prev,
      [type]: status,
    }));
  };

  const handleFileUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a file to upload.");
      return;
    }
    if (!fileName) {
      setUploadStatus("Please provide a file name.");
      return;
    }
    if (!metadata) {
      setUploadStatus("Please provide a metadata file.");
      return;
    }

    setUploadStatus("Uploading...");

    try {
      updateProgress("fileUpload", "inProgress");
      await s3
          .upload({
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET!,
            Key: fileName + ".pdf",
            Body: file,
            ContentType: file.type,
          })
          .promise();

      updateProgress("fileUpload", "success");

      updateProgress("metadataUpload", "inProgress");
      await s3
          .upload({
            Bucket: process.env.NEXT_PUBLIC_S3_METADATA_BUCKET!,
            Key: fileName + "/metadata.json",
            Body: metadata,
            ContentType: metadata.type,
          })
          .promise();

      updateProgress("metadataUpload", "success");

      await checkLambdaStatus();

      setFile(null);
      setMetadata(null);
      setFileName("");
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("Failed to upload file. Please try again.");
      updateProgress("fileUpload", "error");
      updateProgress("metadataUpload", "error");
    }
  };

  const checkResults = async () => {
    router.push("/results");
  }

  const checkLambdaStatus = async () => {
    try {
      updateProgress("lambdaExecution", "inProgress");

      const response = await lambda
          .invoke({
            FunctionName: process.env.NEXT_PUBLIC_LAMBDA_FUNCTION_NAME!,
            InvocationType: "RequestResponse",
          })
          .promise();

      if (response.StatusCode === 200) {
        setLambdaStatus("Lambda executed successfully.");
        updateProgress("lambdaExecution", "success");
      } else {
        setLambdaStatus("Lambda execution failed.");
        updateProgress("lambdaExecution", "error");
      }
    } catch (error) {
      console.error("Error invoking Lambda function:", error);
      setLambdaStatus("Error checking Lambda status.");
      updateProgress("lambdaExecution", "error");
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "inProgress":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-start p-6">
        <h1 className="text-4xl font-bold text-left text-[#2f2f2f] mb-6">
          File Interpreter Decoder
        </h1>

        <div className="w-full space-y-6">
          <div className="text-2xl font-semibold text-[#2f2f2f] mb-4">Name</div>
          <div className="w-full space-y-4">
            <input
                type="text"
                placeholder="Enter file name"
                value={fileName}
                onChange={handleFileNameChange}
                className="w-full p-4 border border-gray-300 rounded-md text-sm text-[#2f2f2f]"
            />
          </div>

          <div className="flex w-full space-x-6">
            <div className="w-1/2 space-y-4">
              <div className="text-2xl font-semibold text-[#2f2f2f] mb-4">File</div>
              <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-4 border border-gray-300 rounded-md text-sm text-[#2f2f2f]"
              />
            </div>

            <div className="w-1/2 space-y-4">
              <div className="text-2xl font-semibold text-[#2f2f2f] mb-4">Metadata</div>
              <input
                  type="file"
                  onChange={handleMetadataChange}
                  className="w-full p-4 border border-gray-300 rounded-md text-sm text-[#2f2f2f]"
              />
            </div>
          </div>

          <div className="mt-6 w-full space-y-4">
            <div>
              <div className="text-xl font-semibold text-[#2f2f2f] mb-2">File Upload</div>
              <div className={`w-full h-2 rounded-md ${getProgressColor(progressStatus.fileUpload)}`}/>
            </div>
            <div>
              <div className="text-xl font-semibold text-[#2f2f2f] mb-2">Metadata Upload</div>
              <div className={`w-full h-2 rounded-md ${getProgressColor(progressStatus.metadataUpload)}`}/>
            </div>
            <div>
              <div className="text-xl font-semibold text-[#2f2f2f] mb-2">Lambda Execution</div>
              <div className={`w-full h-2 rounded-md ${getProgressColor(progressStatus.lambdaExecution)}`}/>
            </div>
          </div>

          <div className="flex w-full justify-between space-x-4">
            <button
                onClick={handleFileUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
            >
              Start Process
            </button>

            <button
                onClick={checkResults}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition ml-auto"
            >
              Check Results
            </button>
          </div>
        </div>
      </div>
  );
}
