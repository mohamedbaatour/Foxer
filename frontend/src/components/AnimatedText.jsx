import React from "react";
import { motion } from "framer-motion";

const wrapperVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.015,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: {
        opacity: 0,
        y: 10,
        filter: "blur(4px)"
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            damping: 10,
            stiffness: 50,
            duration: 2.0,
        },
    },
};

export default function AnimatedText({ text, className, tag = "p" }) {
    // Split text into characters
    const characters = text.split("");
    const Tag = motion[tag];

    return (
        <Tag className={className} variants={wrapperVariants} initial="hidden" animate="visible">
            {characters.map((char, index) => (
                <motion.span key={index} variants={itemVariants} style={{ display: "inline-block" }}>
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </Tag>
    );
}
