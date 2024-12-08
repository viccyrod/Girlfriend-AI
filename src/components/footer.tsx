'use client';

import Link from 'next/link';

export default function Footer() {
	if (typeof window !== 'undefined' && document.getElementsByTagName('footer').length > 1) {
		return null;
	}

	return (
		<footer className='w-full border-t border-white/10 bg-black/20 backdrop-blur-sm'>
			<div className='container mx-auto px-4 py-6'>
				<div className='flex flex-col md:flex-row justify-between items-center gap-4'>
					<div className='text-sm text-gray-400'>
						© {new Date().getFullYear()} Girlfriend.cx. All rights reserved.
					</div>
					<div className='flex gap-6 text-sm text-gray-400'>
						<Link href='/legal/terms' className='hover:text-white transition-colors'>
							Terms of Service
						</Link>
						<Link href='/legal/privacy' className='hover:text-white transition-colors'>
							Privacy Policy
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
