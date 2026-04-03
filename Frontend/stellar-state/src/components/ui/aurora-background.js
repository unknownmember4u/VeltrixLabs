'use client';
import { cn } from '@/lib/utils';
import React from 'react';

export const AuroraBackground = ({
	className,
	children,
	showRadialGradient = true,
	...props
}) => {
	return (
		<div
			className={cn(
				'relative flex flex-col min-h-screen w-full transition-bg',
				className,
			)}
			{...props}
		>
			<div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#faf9f6] dark:bg-[#00171f]">
				<div
					className={cn(
						`
            [--white-gradient:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)]
            [--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert dark:invert-0
            after:content-[''] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-40 will-change-transform`,

						showRadialGradient &&
							`[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`,
					)}
				/>
			</div>
			{children}
		</div>
	);
};
