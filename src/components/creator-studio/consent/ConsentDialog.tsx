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
import { useRouter } from "next/navigation"

interface ConsentDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const ConsentDialog = ({ isOpen, onOpenChange }: ConsentDialogProps) => {
  const [isChecked, setIsChecked] = useState(false)
  const router = useRouter()

  const handleContinue = () => {
    if (isChecked) {
      onOpenChange(false)
      router.push("/community/create-ai-model")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Important Notice</DialogTitle>
          <DialogDescription className="text-base pt-4 space-y-4">
            <p className="text-red-500 font-semibold">
              You are about to clone yourself as an AI.
            </p>
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="consent"
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="consent" className="text-sm leading-relaxed">
                I confirm that I am over 18 years old and willing to verify my identity. 
                I understand that copying or impersonating OTHER people is strictly forbidden 
                and may result in account termination.
              </label>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button
            onClick={handleContinue}
            disabled={!isChecked}
            className="w-full bg-[#ff4d8d] hover:bg-[#ff3377] text-white"
          >
            I Understand & Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConsentDialog 