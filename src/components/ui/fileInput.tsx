import axios from "axios";
import { useState } from "react";
import { ApiErrorAlert } from "@/components/shared/api-error-alert";
import { apiClient } from "@/lib/api/client";

interface ImageKitAuthParams {
  token: string;
  expire: number | string;
  signature: string;
}

interface FileInputProps {
  logo?: string;
  setlogo: (url: string) => void;
}

export default function FileInput({ logo, setlogo }: FileInputProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<unknown>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);

      const { data: auth } = await apiClient.get<ImageKitAuthParams>("/imagekit/auth");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
      formData.append("signature", auth.signature);
      formData.append("expire", String(auth.expire));
      formData.append("token", auth.token);
      formData.append("folder", "/companies");

      const { data } = await axios.post<{ url: string; fileId: string }>(
        "https://upload.imagekit.io/api/v1/files/upload",
        formData,
      );

      setlogo(data.url);
    } catch (error) {
      setUploadError(error);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <ApiErrorAlert error={uploadError} fallback="Unable to upload logo. Please try again." />
      <div className="flex h-11 w-full items-center gap-3 rounded-xl border bg-white px-4 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          accept="image/*"
          disabled={uploading}
          onChange={handleUpload}
          type="file"
        />
        {uploading ? <p className="text-muted-foreground">Uploading...</p> : null}
      </div>
      {logo ? (
        <img alt="Company logo preview" className="h-16 w-16 rounded-lg border object-cover" src={logo} />
      ) : null}
    </div>
  );
}
