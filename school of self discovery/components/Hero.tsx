import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-primary pt-20">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo/PHOTO-2025-12-14-09-06-07.jpg"
            alt="School of Self-Discovery Logo"
            width={400}
            height={200}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Unlock Your Inner Possibilities
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
          A comprehensive journey of self-discovery designed for every stage of life
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#children"
            className="bg-accent text-primary-dark px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent-light transition-all transform hover:scale-105 shadow-xl"
          >
            Start Your Journey
          </a>
          <a
            href="#about"
            className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-all"
          >
            Learn More
          </a>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  )
}


