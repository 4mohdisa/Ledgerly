"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DateRangePickerWithRange } from "@/components/app/date-range-picker"
import { DateRange } from "react-day-picker"
import { Upload, X, FileText } from 'lucide-react'
import { cn } from "@/lib/utils"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
  file_name: z.string().min(1, "File name is required").max(100, "File name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  transaction_date_range: z.object({
    from: z.date({ required_error: "Start date is required" }),
    to: z.date({ required_error: "End date is required" })
  }).refine((data) => data.from <= data.to, {
    message: "End date cannot be before start date",
    path: ["to"]
  }).optional()
})

type FormValues = z.infer<typeof formSchema>

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file_name: "",
      description: "",
      transaction_date_range: undefined
    }
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Set the file name field to the original file name (without extension)
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, "")
      form.setValue("file_name", fileName)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    form.setValue("file_name", "")
  }

  const onSubmit = async (values: FormValues) => {
    if (!file) {
      return
    }

    setIsSubmitting(true)

    try {
      // Here you would typically upload the file and form data
      console.log('Submitting:', {
        file,
        values
      })
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Reset form and close dialog
      setFile(null)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Upload Transactions</DialogTitle>
          <DialogDescription>
            Upload your financial transaction file and provide necessary details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - File upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">CSV, XLS, PDF (MAX. 10MB)</p>
                    </div>
                    <input 
                      id="dropzone-file" 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept=".csv,.xls,.xlsx,.pdf"
                    />
                  </label>
                </div>
                {file && (
                  <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Right side - Form fields */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="file_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter file name" maxLength={100} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transaction_date_range"
                  render={({ field: { value, onChange } }) => (
                    <FormItem>
                      <FormLabel>Transaction Date Range</FormLabel>
                      <FormControl>
                        <DateRangePickerWithRange
                          dateRange={value}
                          onDateRangeChange={onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter file description" 
                          className="resize-none" 
                          maxLength={500}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!file || isSubmitting}
                className={cn(
                  "relative",
                  isSubmitting && "text-transparent hover:text-transparent"
                )}
              >
                {isSubmitting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {isSubmitting ? "Uploading..." : "Upload File"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
