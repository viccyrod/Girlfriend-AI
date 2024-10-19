import { FC } from 'react';

declare module 'next-cloudinary' {
    export const CldUploadWidget: FC<CldUploadWidgetProps>;
    export const CldVideoPlayer: FC<CldVideoPlayerProps>;
    export interface CloudinaryUploadWidgetInfo {
        event: string;
        info: {
            secure_url?: string;
            // Add other properties as needed
        };
    }

    interface CldUploadWidgetProps {
        uploadPreset: string;
        onUpload: (result: CloudinaryUploadWidgetInfo) => void;
        // Add other props as needed
    }

    interface CldVideoPlayerProps {
        src: string;
        // Add other props as needed
    }

    // Add other exports from next-cloudinary as needed
}
