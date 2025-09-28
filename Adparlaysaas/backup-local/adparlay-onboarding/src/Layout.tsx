import React from "react";
import AuthForm from "./AuthForm";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Video Section */}
      <div className="lg:w-1/2 bg-black relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <iframe
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&loop=1&mute=1&controls=0&playlist=dQw4w9WgXcQ"
            title="Background Video"
            className="w-full h-full object-cover"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 flex items-center justify-center h-full text-white">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">2 Seasons</h1>
            <p className="text-xl lg:text-2xl">Your Trusted Property Partner</p>
          </div>
        </div>
      </div>

      {/* Auth Section */}
      <div className="lg:w-1/2 bg-white flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Adparlay</h1>
            <p className="text-lg text-gray-600">Smart lead collection for modern business</p>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Layout;
