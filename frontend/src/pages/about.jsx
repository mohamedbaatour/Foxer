import "./about.css";
import { usePageTitle } from "../hooks/usePageTitle";
import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import AnimatedText from "../components/AnimatedText";
import { ReactComponent as ArrowLeft } from "../icons/arrow-left.svg";
import { ReactComponent as Logo } from "../icons/logo.svg";

import _ from "lodash";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
};


const logoVariants = {
    hidden: { opacity: 0, scale: 0.9, filter: "blur(24px)" },
    visible: {
        opacity: 1, scale: 1, filter: "blur(0px)", transition: {
            type: "spring",
            stiffness: 50,
            damping: 15,
            duration: 0.9,
            delay: 0.3,
        },
    },
};

function About() {
    usePageTitle("Foxer - About");

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const sx = useSpring(x, { stiffness: 40, damping: 12 });
    const sy = useSpring(y, { stiffness: 40, damping: 12 });

    useEffect(() => {
        const handler = (e) => {
            const { innerWidth, innerHeight } = window;
            const nx = (e.clientX / innerWidth) * 2 - 1;
            const ny = (e.clientY / innerHeight) * 2 - 1;
            x.set(nx * 20);
            y.set(ny * 20);
        };
        window.addEventListener("mousemove", handler);
        return () => window.removeEventListener("mousemove", handler);
    }, []);

    return (
        <motion.div
            className="about"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="about-content">
                <button onClick={() => window.history.back()} className="about-back-button">
                    <ArrowLeft />
                    Go back
                </button>

                <AnimatedText text="About Foxer" className="about-title" tag="p" />
                <AnimatedText text="Version 2.0 - 24 Nov 2025" className="about-subtitle" tag="p" />

                <div className="about-text">

                    <AnimatedText text="1. What Is Foxer?" className="about-text-header" tag="p" />
                    <motion.p
                        className="about-text-item"
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                    >
                        Foxer is a fast, minimal to-do app designed to remove noise and help you stay focused. It gives you a clean, distraction-free space to plan your day, organize tasks, and stay on track without extra features slowing you down.
                    </motion.p>

                    <AnimatedText text="2. Why We Built Foxer" className="about-text-header" tag="p" />
                    <motion.p
                        className="about-text-item"
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                    >
                        Most productivity apps are overloaded with tabs, accounts, syncing, and endless menus. Foxer takes the opposite approach: simplicity, speed, and clarity. You open it - and you focus instantly.
                    </motion.p>

                    <AnimatedText text="3. Philosophy" className="about-text-header" tag="p" />
                    <motion.p
                        className="about-text-item"
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                    >
                        Foxer is built around four principles: simplicity first, privacy by default, offline-first reliability, and instant responsiveness. Everything is designed to help you think less about organizing and more about completing.
                    </motion.p>

                    <AnimatedText text="4. Offline by Design" className="about-text-header" tag="p" />
                    <motion.p
                        className="about-text-item"
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                    >
                        Foxer works fully offline. There is no syncing, no cloud layer, and no account system. Your tasks live directly in your device’s storage, ready the moment you open the app.
                    </motion.p>

                    <AnimatedText text="5. Built for Real-Life Productivity" className="about-text-header" tag="p" />
                    <motion.p
                        className="about-text-item"
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                    >
                        Natural language input, quick task organization, and smooth animations make Foxer feel effortless. Whether it’s work, school, or personal planning, the app fits your day without demanding anything from you.
                    </motion.p>

                    <AnimatedText text="6. How Foxer Handles Data" className="about-text-header" tag="p" />
                    <motion.p
                        className="about-text-item"
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                    >
                        Foxer keeps your tasks and preferences on your device using your browser’s localStorage. This information never leaves your device. We use a small analytics tool only to understand overall traffic, but it never sees your tasks or any personal details.
                    </motion.p>

                    <AnimatedText text="7. Tools Used" className="about-text-header" tag="p" />
                    <motion.p
                        className="about-text-item"
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                    >
                        Foxer uses modern frontend libraries like Framer Motion for animations and natural-language parsing tools for smart date detection - all running locally as part of the app code.
                    </motion.p>

                    <AnimatedText text="8. Our Vision" className="about-text-header" tag="p" />
                    <motion.p
                        className="about-text-item"
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                    >
                        The goal is simple: keep Foxer clean, fast, and genuinely useful. As the app evolves, every update will stay aligned with the core principles of simplicity, privacy, and focus.
                    </motion.p>

                    <p className="about-end">© 2025 Foxer. All rights reserved.</p>
                </div>
            </div>

            <motion.div
                variants={logoVariants}
                initial="hidden"
                animate="visible"
                className="about-logo-container"
            >
                <motion.div
                    style={{ x: sx, y: sy }}
                    variants={logoVariants}
                    initial="hidden"
                    animate="visible"
                    className="about-logo-container"
                >
                    <Logo className="about-logo" />
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

export default About;
