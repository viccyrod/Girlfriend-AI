import { FC, ReactNode } from 'react';

declare module 'next-cloudinary' {
    export interface CldUploadWidgetProps {
        uploadPreset: string;
        onUpload: (result: CldUploadWidgetResults) => void;
        children?: (widget: CldUploadWidgetPropsChildren) => ReactNode;
        signatureEndpoint?: string;
    }

    export interface CldUploadWidgetPropsChildren {
        open: () => void;
    }

    export interface CldUploadWidgetResults {
        info: {
            secure_url: string;
            public_id: string;
            // Add other properties as needed
        };
    }

    export const CldUploadWidget: FC<CldUploadWidgetProps>;

    // Add other exports from next-cloudinary as needed
}
