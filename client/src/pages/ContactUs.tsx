import React from "react";

export default function ContactUs() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="mb-8 text-lg text-gray-700">For inquiries, please visit our consultation website.</p>
      <a
        href="https://pierlineconsultation.com"
        className="text-blue-600 hover:underline text-xl font-bold"
        target="_blank"
        rel="noopener noreferrer"
      >
        pierlineconsultation.com
      </a>
    </div>
  );
}