'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ShareTokensProps {
  amount: number;
  url: string;
}

export function ShareTokens({ amount, url }: ShareTokensProps) {
  return (
    <div className="bg-purple-500/10 rounded-lg p-4 space-y-4 border border-purple-500/20">
      <div className="text-center space-y-1">
        <h3 className="font-medium">Share & Get 300 More Tokens!</h3>
        <p className="text-sm text-gray-400">Share with friends to earn extra tokens</p>
      </div>
      
      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="bg-[#000000]/10 hover:bg-[#000000]/20 text-white"
          onClick={() => {
            const text = `🎉 I just got ${amount} GOON tokens on girlfriend.cx! Join me and let's chat with AI characters together!`;
            window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
          }}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Share on X
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2]"
          onClick={() => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
          }}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Share on Facebook
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Share QR Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Share via QR Code</h3>
                <p className="text-sm text-gray-400">Scan to claim tokens</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={url} size={200} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 