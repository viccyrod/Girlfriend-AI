import Image from "next/image"
import { ImageIcon , HeartIcon, VideoIcon } from "@radix-ui/react-icons";

const CoverImage = () => {
    return (
        <div className="h-44 overflow-hidden relative">
            <Image
            src ="/girlfriend-1.jpeg"
            className= "h-full w-full center object-cover select-none pointer-events-none"
            fill
            sizes="100vw"
            alt= "Cover Image"
            />
            <div 
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-800 to-transparent"
                aria-hidden='true'
                />
             
        <div className="flex justify-between items-center absolute top-0 left-0 px-4 py-2 z-20 w-full">
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-white">
              <p className="font-bold">Karol</p>
              <div className="flex items-center gap-4">
                {/* Icon groups */}
                <div className="flex items-center gap-1">
                  <ImageIcon className="w-5 h-5 text-white"/>
                  <span className="text-sm font-bold">45</span>
                </div>
                <span className='text-xs'>•</span>
                <div className="flex items-center gap-1">
                  <VideoIcon className="w-5 h-5 text-white"/>
                  <span className="text-sm font-bold">67</span>
                </div>
                <span className='text-xs'>•</span>
                <div className="flex items-center gap-1">
                  <HeartIcon className="w-5 h-5 text-white"/>
                  <span className="text-sm font-bold">10k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
    );
};

export default CoverImage
