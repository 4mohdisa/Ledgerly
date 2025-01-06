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
import { Select } from "@/components/ui/select";

interface TransactionFormData {
  amount: number;
  category: string;
  date: string;
}

export function TransactionForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<TransactionFormData>();

  const onSubmit = (data: TransactionFormData) => {
    console.log("Transaction Data:", data);
    // Add logic to handle form submission
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add Transaction</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label>Amount</label>
            <Input type="number" {...register("amount", { required: true })} />
            {errors.amount && <span>This field is required</span>}
          </div>
          <div>
            <label>Category</label>
            <Select {...register("category", { required: true })}>
              <option value="">Select a category</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Utilities">Utilities</option>
            </Select>
            {errors.category && <span>This field is required</span>}
          </div>
          <div>
            <label>Date</label>
            <Input type="date" {...register("date", { required: true })} />
            {errors.date && <span>This field is required</span>}
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
