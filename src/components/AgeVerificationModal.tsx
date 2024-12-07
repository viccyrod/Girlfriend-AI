// "use client";

// import { useEffect, useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";

// export function AgeVerificationModal() {
//   const [open, setOpen] = useState(false);

//   useEffect(() => {
//     // Check if user has already verified their age
//     const hasVerified = localStorage.getItem("age-verified");
//     if (!hasVerified) {
//       setOpen(true);
//     }
//   }, []);

//   const handleVerify = () => {
//     localStorage.setItem("age-verified", "true");
//     setOpen(false);
//   };

//   const handleDecline = () => {
//     // Redirect to a safe site
//     window.location.href = "https://www.google.com";
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>Age Verification Required</DialogTitle>
//           <DialogDescription>
//             This website contains adult content. You must be at least 18 years old to enter.
//           </DialogDescription>
//         </DialogHeader>
//         <div className="grid gap-4 py-4">
//           <p className="text-sm text-muted-foreground">
//             By clicking "I am 18 or older", you confirm that you are of legal age and agree to view adult content.
//           </p>
//         </div>
//         <DialogFooter className="flex gap-2">
//           <Button variant="destructive" onClick={handleDecline}>
//             I am under 18
//           </Button>
//           <Button onClick={handleVerify}>
//             I am 18 or older
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// } 