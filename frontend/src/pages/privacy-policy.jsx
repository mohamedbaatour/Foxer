import React from "react";
import "./privacy-policy.css";
import { usePageTitle } from "../hooks/usePageTitle";
import { delay, motion, scale } from "framer-motion";
import AnimatedText from "../components/AnimatedText";
import { ReactComponent as ArrowLeft } from "../icons/arrow-left.svg";
import { ReactComponent as Defending } from "../icons/defending.svg";

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

const defendingVariants = {
    hidden: { opacity: 0, y: 80, scale: 0.9, filter: "blur(24px)" },
    visible: {
        opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
            duration: 0.5,
            delay: 0.3,
        },
    },
};

const itemVariants = {
    hidden: {
        opacity: 0,
        y: 20,
        filter: "blur(4px)"
    },
    visible: {
        delay: 1.0,
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
        },
    },
};

export default function PrivacyPolicy() {
    usePageTitle("Foxer - Privacy Policy");
    return (
        <motion.div
            className="privacy-policy"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >

            <div className="privacy-policy-content">
                <button onClick={() => window.history.back()} className="privacy-policy-back-button">
                    <ArrowLeft />
                    Go back
                </button>
                <AnimatedText text="Privacy Policy" className="privacy-policy-title" tag="p" />
                <AnimatedText text="Version 2.0 - 22 Nov 2025" className="privacy-policy-subtitle" tag="p" />

                <div className="privacy-policy-text">
                    <AnimatedText text="1. Data We Collect" className="privacy-policy-text-header" tag="p" />
                    <motion.p className="privacy-policy-text-item" variants={itemVariants}>
                        Foxer does not collect, request, or process any personal information. The app does not ask for your name, email address, phone number, or any other identifying details. The only data Foxer works with is the content you create inside the app itself, such as your tasks, their dates and times, their completion status, and any app preferences you configure (for example, theme or layout). All of this information is handled locally in your browser and is never sent to us.
                    </motion.p>

                    <AnimatedText text="2. Where Your Data Is Stored" className="privacy-policy-text-header" tag="p" />
                    <motion.p className="privacy-policy-text-item" variants={itemVariants}>
                        All data used by Foxer is stored locally on your device via your browser&apos;s localStorage. We do not operate any database or remote storage for your Foxer data, and we do not mirror or sync your information to any server. This means that your tasks and preferences remain on the device and browser where you created them and do not leave that environment through Foxer.
                    </motion.p>

                    <AnimatedText text="3. No Accounts" className="privacy-policy-text-header" tag="p" />
                    <motion.p className="privacy-policy-text-item" variants={itemVariants}>
                        Foxer does not use user accounts, logins, passwords, syncing, or cloud backups. This means your data stays on your device and cannot be accessed by us or anyone else through Foxer. There is no registration, no sign-in process, and no remote profile associated with your use of the app.
                    </motion.p>

                    <AnimatedText text="4. No Tracking or Analytics" className="privacy-policy-text-header" tag="p" />
                    <motion.p className="privacy-policy-text-item" variants={itemVariants}>
                        Foxer does not use analytics services, advertising trackers, cookies for profiling, or any third-party tracking tools. We do not monitor how you use the app, do not track your behavior, and do not build any usage profile. Your interaction with Foxer is private and remains on your device.
                    </motion.p>

                    <AnimatedText text="5. Offline Usage" className="privacy-policy-text-header" tag="p" />
                    <motion.p className="privacy-policy-text-item" variants={itemVariants}>
                        Foxer is designed to work fully offline. An internet connection is not required to create, edit, or complete tasks. If you visit a website where Foxer is hosted, the web host may collect standard technical logs for security or performance reasons (such as IP address, browser type, or request metadata), but this logging is separate from the app itself, and Foxer does not send your task data or content to any server.
                    </motion.p>

                    <AnimatedText text="6. Third-Party Libraries" className="privacy-policy-text-header" tag="p" />
                    <motion.p className="privacy-policy-text-item" variants={itemVariants}>
                        Foxer may use third-party frontend libraries, such as Framer Motion for animations or Chrono (or similar libraries) for natural language date and time detection. These libraries run locally in your browser as part of the app code and are not used to send your data to external services. They operate only on the data already present in your browser and do not transmit it out of your device.
                    </motion.p>

                    <AnimatedText text="7. Data Deletion" className="privacy-policy-text-header" tag="p" />
                    <motion.p className="privacy-policy-text-item" variants={itemVariants}>
                        Because Foxer stores data only on your device, you are in full control of deletion. You can remove all Foxer data at any time by clearing your browser&apos;s localStorage for the site where Foxer runs, by clearing site data in your browser settings. Once you delete this data, it is permanently removed and cannot be restored by us, as we do not keep any copy on remote servers.
                    </motion.p>

                    <AnimatedText text="8. Children&apos;s Privacy" className="privacy-policy-text-header" tag="p" />
                    <motion.p className="privacy-policy-text-item" variants={itemVariants}>
                        Foxer does not collect personal information and does not require any form of registration, so it does not knowingly collect data from children or adults. The app can be used by people of any age, and since no personal data is transmitted to us, there is no central storage of information about children.
                    </motion.p>

                    <AnimatedText text="9. Changes to This Policy" className="privacy-policy-text-header" tag="p" />
                    <motion.p className="privacy-policy-text-item" variants={itemVariants}>
                        We may update this privacy policy if Foxer gains new features or if our data practices change. When changes are made, the updated version will be published where the policy is displayed, and the &quot;Last updated&quot; date at the top will be revised. Continued use of Foxer after changes to this policy means you accept the updated version.
                    </motion.p>
                    <p className="privacy-policy-end">© 2025 Foxer. All rights reserved.</p>
                </div>
            </div>
            <motion.div
                variants={defendingVariants}
                initial="hidden"
                animate="visible"
                className="privacy-policy-defending-container"
            >
                <Defending className="privacy-policy-defending" />
            </motion.div>
        </motion.div>
    );
}