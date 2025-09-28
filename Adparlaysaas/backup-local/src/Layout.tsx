import React, { ReactNode } from "react";

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Top Section - Video Background */}
      <div className="h-1/2 w-full relative flex items-center justify-center bg-gray-900">
        {/* Background image or video */}
        <iframe
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          src="https://www.youtube.com/embed/MnrJzXM7a6o?autoplay=1&loop=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&playlist=MnrJzXM7a6o"
          title="Black Founders and Developers"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="relative z-10 p-4 md:p-8 text-white text-center max-w-xl">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-4 drop-shadow-lg">
            Welcome to 2 Seasons Phase 1 — the city of the 1%: Startup founders, VCs, digital content creators, and entrepreneurs who value regenerative living and a healthy life.
          </h1>
        </div>
      </div>
      {/* Bottom Section - Form */}
      <div className="h-1/2 w-full flex items-center justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-md p-4 md:p-8 shadow-lg rounded-lg bg-white">
          {children || <div className="text-gray-400 text-center">[Multi-step form will go here]</div>}
        </div>
      </div>
    </div>
  );
};

export default Layout; 