"use client";
import { useState, useCallback } from "react";
import { put } from "@vercel/blob";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
  url?: string;
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB

    const isPdfByMime = file.type === "application/pdf";
    const isPdfByExt = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfByMime && !isPdfByExt) {
      return "Only PDF files are allowed.";
    }

    if (file.size > maxSize) {
      return "File size too large. Maximum size is 10MB.";
    }

    return null;
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading" as const,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setIsUploading(true);

    // Upload files to Vercel Blob
    for (const file of Array.from(files)) {
      const error = validateFile(file);
      const fileId = newFiles.find((f) => f.name === file.name)?.id;

      if (error) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: "error" as const, error } : f
          )
        );
        continue;
      }

      try {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: 25 } : f))
        );
        // Read file as base64 and send to API
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const commaIndex = result.indexOf(",");
            resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const resp = await fetch("/api/upload-videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name,
            contentType: file.type,
          }),
        });

        if (!resp.ok) throw new Error("Upload failed");
        const data: { url: string; downloadUrl?: string } = await resp.json();

        // Update progress to 100%
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "success" as const,
                  progress: 100,
                  url: data.url,
                }
              : f
          )
        );

        console.log(`File uploaded successfully: ${data.url}`);
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error" as const,
                  error: "Failed to upload file. Please try again.",
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFileUpload(e.target.files);
      }
    },
    [handleFileUpload]
  );

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "white",
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "1rem",
          }}
        >
          Upload Patient Files
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: "1.1rem",
            color: "#6b7280",
            marginBottom: "2rem",
          }}
        >
          Upload patient files securely and manage your healthcare data
        </p>

        <div
          style={{
            border: "2px dashed #d1d5db",
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
            backgroundColor: isDragOver ? "#f3f4f6" : "white",
            transition: "all 0.2s ease",
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div
            style={{
              fontSize: "3rem",
              color: "#9ca3af",
              marginBottom: "1rem",
            }}
          >
            📁
          </div>

          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "0.5rem",
            }}
          >
            Drop files here or click to browse
          </h3>

          <p
            style={{
              color: "#6b7280",
              marginBottom: "1.5rem",
            }}
          >
            Supported format: PDF (Max 10MB)
          </p>

          <label
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              transition: "background-color 0.2s ease",
            }}
          >
            <input
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              style={{ display: "none" }}
            />
            Choose Files
          </label>
        </div>

        {uploadedFiles.length > 0 && (
          <div
            style={{
              marginTop: "2rem",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#374151",
                  margin: 0,
                }}
              >
                Uploaded Files ({uploadedFiles.length})
              </h3>
            </div>

            <div>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid #f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <span style={{ fontSize: "1.25rem" }}>📄</span>
                    <div>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#374151",
                          margin: "0 0 0.25rem 0",
                        }}
                      >
                        {file.name}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    {file.status === "uploading" && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            width: "64px",
                            height: "8px",
                            backgroundColor: "#e5e7eb",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${file.progress}%`,
                              height: "100%",
                              backgroundColor: "#3b82f6",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                          }}
                        >
                          {file.progress}%
                        </span>
                      </div>
                    )}

                    {file.status === "success" && (
                      <span style={{ color: "#10b981", fontSize: "1.25rem" }}>
                        ✅
                      </span>
                    )}

                    {file.status === "error" && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ color: "#ef4444", fontSize: "1.25rem" }}>
                          ❌
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#ef4444",
                          }}
                        >
                          {file.error}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => removeFile(file.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        fontSize: "1rem",
                        padding: "0.25rem",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
