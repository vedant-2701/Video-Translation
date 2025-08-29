"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import VideoPreview from "~/components/VideoPreview";
import LanguageSelector from "~/components/LanguageSelector";
import ProgressBar from "~/components/ProgressBar";

// --- TYPE DEFINITIONS ---
// For better type safety and code readability
type JobStatus = "idle" | "uploading" | "processing" | "complete" | "failed";

interface Job {
    id: string | null;
    status: JobStatus;
    progress: number;
    finalVideoUrl: string | null;
    subtitleUrl: string | null;
}

// --- MOCK API FUNCTIONS ---
// These functions simulate interactions with your FastAPI backend.
// Replace these with actual fetch calls to your API endpoints.

/**
 * Simulates uploading a file and creating a translation job.
 * @param file - The video file to upload.
 * @param language - The target language for translation.
 * @param onUploadProgress - A callback to report upload progress.
 * @returns A promise that resolves with the initial job data.
 */
const uploadVideoAndStartJob = (
    file: File,
    language: string,
    onUploadProgress: (progress: number) => void
): Promise<{ jobId: string }> => {
    return new Promise((resolve) => {
        console.log(
            `Starting upload for ${file.name} to translate to ${language}`
        );
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            onUploadProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                const newJobId = `job_${Date.now()}`;
                console.log("Upload complete, job created with ID:", newJobId);
                resolve({ jobId: newJobId });
            }
        }, 200);
    });
};

/**
 * Simulates polling the backend for the status of a translation job.
 * @param jobId - The ID of the job to check.
 * @returns A promise that resolves with the current job status and final URLs if complete.
 */
const pollJobStatus = (
    jobId: string
): Promise<{
    status: JobStatus;
    finalVideoUrl: string | null;
    subtitleUrl: string | null;
}> => {
    return new Promise((resolve, reject) => {
        console.log(`Polling status for job ID: ${jobId}`);
        // Simulate the backend processing the video, which takes time.
        setTimeout(() => {
            const isSuccess = Math.random() > 0.1; // 90% success rate for simulation
            if (isSuccess) {
                console.log("Job complete, returning final URLs.");
                resolve({
                    status: "complete",
                    finalVideoUrl:
                        "https://placehold.co/1920x1080/1E3A8A/FFFFFF/mp4?text=Translated+Video",
                    subtitleUrl: "https://placehold.co/subtitle.vtt", // Placeholder for VTT file
                });
            } else {
                console.error("Job processing failed.");
                reject({ status: "failed" });
            }
        }, 8000); // Simulate an 8-second processing time
    });
};

// --- MAIN PAGE COMPONENT ---

export default function HomePage() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [targetLanguage, setTargetLanguage] = useState<string>("hindi");
    const [job, setJob] = useState<Job>({
        id: null,
        status: "idle",
        progress: 0,
        finalVideoUrl: null,
        subtitleUrl: null,
    });
    const [isDragging, setIsDragging] = useState(false); // New state for drag feedback

    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File | undefined) => {
        if (file) {
            setVideoFile(file);
            // Create a temporary local URL to show a preview immediately.
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            // Reset any previous job state
            setJob({
                id: null,
                status: "idle",
                progress: 0,
                finalVideoUrl: null,
                subtitleUrl: null,
            });
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0]);
    };

    // --- New Drag and Drop Handlers ---
    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault(); // This is necessary to allow dropping
        setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        processFile(event.dataTransfer.files?.[0]);
    };
    // ------------------------------------

    const handleTranslateClick = async () => {
        if (!videoFile) return;

        setJob((prev) => ({ ...prev, status: "uploading", progress: 0 }));

        try {
            // Step 1: Upload the file and get a job ID.
            const { jobId } = await uploadVideoAndStartJob(
                videoFile,
                targetLanguage,
                (progress) => setJob((prev) => ({ ...prev, progress }))
            );

            setJob((prev) => ({ ...prev, id: jobId, status: "processing" }));

            // Step 2: Poll for the job status until it's complete or failed.
            const poll = async () => {
                try {
                    const result = await pollJobStatus(jobId);
                    if (result.status === "complete") {
                        setJob((prev) => ({
                            ...prev,
                            status: "complete",
                            finalVideoUrl: result.finalVideoUrl,
                            subtitleUrl: result.subtitleUrl,
                        }));
                    } else {
                        // This case might not be reached with the current mock, but is good practice
                        setTimeout(poll, 5000); // Poll again after 5 seconds
                    }
                } catch (error) {
                    setJob((prev) => ({ ...prev, status: "failed" }));
                }
            };

            setTimeout(poll, 1000); // Start polling after a short delay
        } catch (error) {
            console.error("Upload failed:", error);
            setJob((prev) => ({ ...prev, status: "failed" }));
        }
    };

    const getStatusMessage = () => {
        switch (job.status) {
            case "uploading":
                return `Uploading... ${job.progress}%`;
            case "processing":
                return "Processing video... This may take a few moments.";
            case "complete":
                return "Translation complete!";
            case "failed":
                return "Translation failed. Please try again.";
            default:
                return "Upload a video to begin.";
        }
    };

    return (
        <main className="min-h-screen bg-brand-light p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold text-brand-dark">
                        VaniSetu
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Unified Video Translation Platform
                    </p>
                </header>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Upload & Configuration */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4 text-brand-dark">
                            1. Configure Translation
                        </h2>

                        {/* File Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload Video
                            </label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors duration-200 ${
                                    isDragging
                                        ? "border-brand-primary bg-brand-light"
                                        : "border-gray-300"
                                }`}
                            >
                                <div className="space-y-1 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary"
                                        >
                                            <span>Upload a file</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                accept="video/*"
                                                onChange={handleFileChange}
                                                ref={fileInputRef}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        MP4, MOV, AVI up to 500MB
                                    </p>
                                </div>
                            </div>
                            {videoFile && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Selected: {videoFile.name}
                                </p>
                            )}
                        </div>

                        {/* Language Selector */}
                        <div className="mb-6">
                            <LanguageSelector
                                selectedLanguage={targetLanguage}
                                onChange={setTargetLanguage}
                            />
                        </div>

                        {/* Translate Button */}
                        <button
                            onClick={handleTranslateClick}
                            disabled={
                                !videoFile ||
                                job.status === "uploading" ||
                                job.status === "processing"
                            }
                            className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {job.status === "uploading" ||
                            job.status === "processing"
                                ? "Processing..."
                                : "Translate Video"}
                        </button>
                    </div>

                    {/* Right Column: Previews & Status */}
                    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col gap-6">
                        {/* Status Area */}
                        <div className="text-center p-4 bg-brand-light rounded-lg">
                            <p
                                className={`text-lg font-semibold ${
                                    job.status === "processing"
                                        ? "animate-pulse"
                                        : ""
                                }`}
                            >
                                {getStatusMessage()}
                            </p>
                            {(job.status === "uploading" ||
                                job.status === "processing") && (
                                <div className="mt-2">
                                    <ProgressBar progress={job.progress} />
                                </div>
                            )}
                        </div>

                        {/* Original Video Preview */}
                        {previewUrl && (
                            <VideoPreview
                                src={previewUrl}
                                title="Original Video Preview"
                            />
                        )}

                        {/* Translated Video Preview */}
                        {job.status === "complete" && job.finalVideoUrl && (
                            <div>
                                <VideoPreview
                                    src={job.finalVideoUrl}
                                    title="Translated Video"
                                    subtitleUrl={job.subtitleUrl}
                                />
                                <a
                                    href={job.finalVideoUrl}
                                    download
                                    className="mt-4 w-full block text-center bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300"
                                >
                                    Download Translated Video
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
