'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AuthButtons() {
  return (
    <div className="flex flex-col gap-2 px-2">
      <Link href="/auth/login" className="w-full">
        <Button variant="outline" className="w-full">
          Login
        </Button>
      </Link>
      <Link href="/auth/register" className="w-full">
        <Button className="w-full bg-[#ff4d8d] hover:bg-[#ff3377]">
          Sign Up
        </Button>
      </Link>
    </div>
  );
} 