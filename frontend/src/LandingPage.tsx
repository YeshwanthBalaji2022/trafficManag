import React from "react";

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-400 flex flex-col items-center justify-center">
            <header className="mb-8 text-center">
                <h1 className="text-5xl font-bold text-blue-900 mb-4">Traffic Management System</h1>
                <p className="text-lg text-blue-700">
                    Streamline and monitor city traffic with ease.
                </p>
            </header>
            <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center max-w-md w-full">
                <h2 className="text-2xl font-semibold mb-4 text-blue-800">Get Started</h2>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition">
                    Login
                </button>
            </div>
            <footer className="mt-12 text-blue-800 text-sm">
                &copy; {new Date().getFullYear()} Traffic Management System
            </footer>
        </div>
    );
};

export default LandingPage;