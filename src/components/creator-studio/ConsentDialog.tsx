"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"

interface ConsentDialogProps {
  isOpen: boolean
  onAccept: () => void
  onOpenChange: (open: boolean) => void
}

const ConsentDialog = ({ isOpen, onAccept, onOpenChange }: ConsentDialogProps) => {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-pink-500">Important Notice</DialogTitle>
          <DialogDescription className="text-base pt-4 space-y-4">
            <p className="text-white font-semibold">
              You are about to clone yourself as an AI.
            </p>
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="consent"
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="consent" className="text-sm leading-relaxed text-gray-200">
                I confirm that I am over 18 years old and willing to verify my identity. 
                I understand that copying or impersonating OTHER people is strictly forbidden 
                and may result in account termination.
              </label>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button
            onClick={onAccept}
            disabled={!isChecked}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
          >
            I Understand & Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConsentDialog 