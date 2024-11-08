"use client" // This directive ensures the component is rendered on the client side.

// Import necessary components and hooks.
import { Dialog, DialogContent } from "@/components/ui/dialog" // Importing Dialog and DialogContent components for modal functionality.
import AuthButtons from "./AuthButtons" // Importing AuthButtons component, which contains the authentication buttons.

// Define the properties (props) for the AuthDialog component.
interface AuthDialogProps {
  isOpen: boolean // Boolean value to determine whether the dialog is open.
  onOpenChange: (open: boolean) => void // Function to handle when the open state changes.
}

// Define the AuthDialog component, which takes `isOpen` and `onOpenChange` as props.
const AuthDialog = ({ isOpen, onOpenChange }: AuthDialogProps) => {
  return (
    // Render the Dialog component, controlling its open state and providing a function to handle state changes.
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* DialogContent contains the contents of the modal, with a defined max width and padding for styling. */}
      <DialogContent className="sm:max-w-[425px] p-6">
        <div className="space-y-6 text-center"> {/* A container for the dialog contents with space and text alignment styling. */}
          <h2 className="text-2xl font-bold">Welcome</h2> {/* Heading for the dialog. */}
          <p className="text-muted-foreground"> {/* Subheading prompting the user to login or sign up. */}
            Please login or sign up to continue
          </p>
          <AuthButtons /> {/* Render the authentication buttons. */}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog // Export the AuthDialog component for use in other parts of the application.
