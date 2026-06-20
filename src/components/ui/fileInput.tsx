import axios from "axios";
import { useState } from "react";

export default function FileInput({logo,setlogo}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      // 1. auth parameters lo
      const { data: auth } = await axios.get(
        "http://localhost:5001/api/imagekit/auth",
        {
          withCredentials: true,
        }
      );

      // 2. form data banao
      const formData = new FormData();

      formData.append("file", file);
      formData.append("fileName", file.name);

      formData.append("publicKey", import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);

      formData.append("signature", auth.signature);
      formData.append("expire", auth.expire);
      formData.append("token", auth.token);

      // optional
      formData.append("folder", "/companies");

      // 3. direct ImageKit upload
      const { data } = await axios.post(
        "https://upload.imagekit.io/api/v1/files/upload",
        formData
      );
      setlogo(data.url)
      console.log("Uploaded URL:", data.url);
      console.log("File ID:", data.fileId);

      // save URL in DB
      /*
      await axios.post("/api/company/logo", {
        logoUrl: data.url,
        fileId: data.fileId
      });
      */

    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20">
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
      />

      {uploading && <p>Uploading...</p>}
    </div>
  );
}