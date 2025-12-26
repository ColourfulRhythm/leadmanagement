'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-lg py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/">
              <Image
                src="/logo/PHOTO-2025-12-14-09-06-07.jpg"
                alt="School of Self-Discovery Logo"
                width={80}
                height={40}
                className="object-contain"
              />
            </a>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#children"
              className="text-primary font-medium hover:text-accent transition-colors"
            >
              Children
            </a>
            <a
              href="#teens"
              className="text-primary font-medium hover:text-accent transition-colors"
            >
              Teens
            </a>
            <a
              href="#young-adults"
              className="text-primary font-medium hover:text-accent transition-colors"
            >
              Young Adults
            </a>
            <a
              href="#adults"
              className="text-primary font-medium hover:text-accent transition-colors"
            >
              Adults
            </a>
            <a
              href="#contact"
              className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Contact
            </a>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-primary p-2"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <a
              href="#children"
              onClick={closeMobileMenu}
              className="block text-primary font-medium hover:text-accent transition-colors py-2"
            >
              Children
            </a>
            <a
              href="#teens"
              onClick={closeMobileMenu}
              className="block text-primary font-medium hover:text-accent transition-colors py-2"
            >
              Teens
            </a>
            <a
              href="#young-adults"
              onClick={closeMobileMenu}
              className="block text-primary font-medium hover:text-accent transition-colors py-2"
            >
              Young Adults
            </a>
            <a
              href="#adults"
              onClick={closeMobileMenu}
              className="block text-primary font-medium hover:text-accent transition-colors py-2"
            >
              Adults
            </a>
            <a
              href="#contact"
              onClick={closeMobileMenu}
              className="block bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors text-center"
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

