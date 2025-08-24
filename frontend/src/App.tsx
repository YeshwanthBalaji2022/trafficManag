import React, { useEffect } from "react";
import "./styles.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Technology from "./components/Technology";
import Results from "./components/Results";
import Footer from "./components/Footer";

const App: React.FC = () => {
  useEffect(() => {
    // Smooth scrolling
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(anchor => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector((this as HTMLAnchorElement).getAttribute("href")!);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }, []);

  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Technology />
      <Results />
      <Footer />
    </>
  );
};

export default App;
