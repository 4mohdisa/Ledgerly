"use client"

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const uploadedFiles = event.target.files;
    setLoading(true);
    setError(null);

    try {
      // Process files here
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setFiles([...files, ...uploadedFiles]);
    } catch (err) {
      setError('Failed to upload files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 text-red-500">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Upload Files</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file">Choose Files</Label>
              <Input 
                id="file" 
                type="file" 
                multiple 
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>
            
            {loading && (
              <div className="w-full">
                <Progress value={50} className="w-full" />
              </div>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {files.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Uploaded Files</h2>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="p-2 border rounded">
                {file.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}