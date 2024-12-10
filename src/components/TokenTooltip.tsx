'use client';

import { TOKEN_COSTS } from '@/lib/constants';
import { TokenIcon } from './TokenIcon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TokenTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            <TokenIcon className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">How tokens work?</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Token Usage:</p>
            <ul className="text-sm space-y-1">
              <li>• 1 message = {TOKEN_COSTS.CHAT} token</li>
              <li>• 1 photo = {TOKEN_COSTS.IMAGE} tokens</li>
              <li>• 1 character = {TOKEN_COSTS.CHARACTER} tokens</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 