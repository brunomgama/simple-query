"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { S3 } from "aws-sdk";

export default function Results() {
    const [activeTab, setActiveTab] = useState("A");
    const [s3Objects, setS3Objects] = useState<{ name: string }[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [parsedCSV, setParsedCSV] = useState<string[][] | null>(null);
    const [filterOption, setFilterOption] = useState<string>("All");
    const router = useRouter();

    const s3 = new S3({
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    });

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
    };

    const goHome = async () => {
        router.push("/");
    };

    const fetchS3Objects = async () => {
        try {
            const response = await s3
                .listObjectsV2({ Bucket: process.env.NEXT_PUBLIC_S3_ANALYSIS_BUCKET! })
                .promise();
            const objects =
                response.Contents?.map((item) => ({ name: item.Key || "Unknown" })) || [];
            setS3Objects(objects);
        } catch (error) {
            console.error("Error fetching S3 objects:", error);
        }
    };

    const fetchFileContent = async (fileName: string) => {
        try {
            const response = await s3
                .getObject({
                    Bucket: process.env.NEXT_PUBLIC_S3_ANALYSIS_BUCKET!,
                    Key: fileName,
                })
                .promise();
            const csvContent = response.Body?.toString() || "";
            parseCSV(csvContent);
        } catch (error) {
            console.error("Error fetching file content:", error);
        }
    };

    const parseCSV = (csv: string) => {
        const rows = csv.split("\n").map((line) => line.split(","));
        setParsedCSV(rows);
    };

    const handleFileSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = event.target.value;
        setSelectedFile(selected);
        if (selected) {
            fetchFileContent(selected);
        }
    };

    const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterOption(event.target.value);
    };

    const filteredCSV =
        parsedCSV &&
        parsedCSV.filter((row) => {
            if (filterOption === "All") return true;
            const blockTypeIndex = parsedCSV[0].indexOf("BlockType");
            return row[blockTypeIndex] === filterOption;
        });

    useEffect(() => {
        fetchS3Objects();
    }, []);

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-start p-6">
            <h1 className="text-4xl font-bold text-left text-black mb-6">Results Page</h1>

            {/* Tabs Navigation */}
            <div className="flex space-x-6 mb-6">
                <button
                    onClick={() => handleTabClick("A")}
                    className={`px-6 py-2 rounded-lg ${
                        activeTab === "A" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
                    } transition-colors`}
                >
                    Query Results
                </button>
                <button
                    onClick={() => handleTabClick("B")}
                    className={`px-6 py-2 rounded-lg ${
                        activeTab === "B" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
                    } transition-colors`}
                >
                    All Data
                </button>
            </div>

            {/* Tab Content */}
            <div className="w-full">
                {activeTab === "A" && (
                    <div className="p-6 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-black mb-4">Questions and Answers</h2>
                        <div className="flex items-center text-black space-x-4 mb-4">
                            <select
                                value={selectedFile || ""}
                                onChange={handleFileSelection}
                                className="border rounded px-3 py-2"
                            >
                                <option value="" disabled>
                                    -- Select a file --
                                </option>
                                {s3Objects.map((obj, index) => (
                                    <option key={index} value={obj.name}>
                                        {obj.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            {filteredCSV &&
                                filteredCSV
                                    .filter((row) => {
                                        const blockTypeIndex = filteredCSV[0].indexOf("BlockType");
                                        return row[blockTypeIndex] === "QUERY";
                                    })
                                    .map((row, index) => {
                                        const question = row[10];
                                        const answer = row[11].trim();

                                        return (
                                            question ? (
                                                <div key={index} className="p-4 bg-blue-50 rounded-lg shadow-md">
                                                    <h3 className="text-xl font-semibold text-black">{question}</h3>
                                                    <p className="text-gray-800 mt-2">{answer}</p>
                                                </div>
                                            ) : (
                                                <div key={index}></div>
                                            )
                                        );
                                    })}
                        </div>


                    </div>
                )}

                {activeTab === "B" && (
                    <div className="p-6 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-black mb-4">Content B</h2>
                        <div className="p-6 rounded-lg shadow-md">
                            <div className="flex items-center text-black space-x-4">
                                <select
                                    value={selectedFile || ""}
                                    onChange={handleFileSelection}
                                    className="border rounded px-3 py-2"
                                >
                                    <option value="" disabled>
                                        -- Select a file --
                                    </option>
                                    {s3Objects.map((obj, index) => (
                                        <option key={index} value={obj.name}>
                                            {obj.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={filterOption}
                                    onChange={handleFilterChange}
                                    className="border rounded px-3 py-2"
                                >
                                    <option value="All">All</option>
                                    <option value="LINE">Line</option>
                                    <option value="WORD">Word</option>
                                    <option value="KEY_VALUE_SET">Key Value</option>
                                    <option value="QUERY">Query</option>
                                </select>
                            </div>

                            {filteredCSV && (
                                <div className="mt-4 p-6 rounded-lg shadow-md overflow-auto">
                                    <table className="w-full border-collapse border text-sm">
                                        <thead>
                                        <tr>
                                            {parsedCSV[0]?.map((header, index) => (
                                                <th key={index} className="border px-4 py-2 text-left text-[#2f2f2f]">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredCSV.slice(1).map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex} className="border px-4 py-2 text-[#2f2f2f]">
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={goHome}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition mt-4"
            >
                Home
            </button>
        </div>
    );
}
