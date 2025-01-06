"use client"

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UploadFormData {
  file: FileList;
}

export function UploadForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<UploadFormData>();
  const [progress, setProgress] = React.useState<number>(0);

  const onSubmit = (data: UploadFormData) => {
    console.log("File Data:", data);
    // Add logic to handle file upload
    // Simulate progress
    setProgress(50);
    setTimeout(() => setProgress(100), 1000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Upload File</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label>File</label>
            <Input type="file" {...register("file", { required: true })} />
            {errors.file && <span>This field is required</span>}
          </div>
          <Button type="submit">Submit</Button>
        </form>
        <div>Progress: {progress}%</div>
      </DialogContent>
    </Dialog>
  );
}
