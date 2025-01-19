import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categories } from "@/data/categories"

interface BulkCategoryChangeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (categoryId: number) => void
  selectedCount: number
}

export function BulkCategoryChangeDialog({ isOpen, onClose, onSave, selectedCount }: BulkCategoryChangeDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const handleSave = () => {
    if (selectedCategory) {
      onSave(parseInt(selectedCategory))
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Category for Selected Transactions</DialogTitle>
          <DialogDescription>
            Select a new category for {selectedCount} transaction(s).
          </DialogDescription>
        </DialogHeader>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedCategory}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

