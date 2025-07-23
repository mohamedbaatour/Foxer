import React, { useState, useRef, useEffect } from "react";
import "./tasks.css";
import { AnimatePresence, motion } from "framer-motion";

import { ReactComponent as Sun } from "../icons/sun.svg";
import { ReactComponent as Moon } from "../icons/moon.svg";
import { ReactComponent as Sunrise } from "../icons/sunrise.svg";
import { ReactComponent as Dots } from "../icons/dots.svg";
import { ReactComponent as Drag } from "../icons/drag.svg";

import confetti from "canvas-confetti";

const Tasks = () => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);
  const checkboxRefs = useRef({});

  const intialTasks = [
    {
      id: 1,
      title: "My first task",
      createdAt: "2025-07-23T21:30:00Z",
      updatedAt: "2025-07-23T21:45:00Z",
      due: {
        originalInput: "tomorrow 5pm",
        parsedDate: "2025-08-04T14:00:00Z", // Updated date to match image
      },
      completed: false,
      focused: false,
      deleted: false,
    },
    {
      id: 2,
      title: "Clean the house",
      createdAt: "2025-07-23T21:30:00Z",
      updatedAt: "2025-07-23T21:45:00Z",
      due: {
        originalInput: "tomorrow 5pm",
        parsedDate: "2025-07-24T17:00:00Z",
      },
      completed: false,
      focused: false,
      deleted: false,
    },
    {
      id: 3,
      title: "Go to the gym",
      createdAt: "2025-07-23T21:30:00Z",
      updatedAt: "2025-07-23T21:45:00Z",
      due: {
        originalInput: "tomorrow 5pm",
        parsedDate: "2025-07-24T17:00:00Z",
      },
      completed: false,
      focused: false,
      deleted: false,
    },
  ];

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "a" || event.key === "A") {
        setTimeout(() => {
          inputRef.current.focus();
        }, 0);
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning";
    } else if (hour < 18) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  };

  const getIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return <Sunrise className="title-icon" />;
    } else if (hour < 18) {
      return <Sun className="title-icon" />;
    } else {
      return <Moon className="title-icon" />;
    }
  };

  const formatTaskDate = (dateString) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    return { time, date: `${day} ${month}` };
  };

  const launchSmallConfetti = (element) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();

    confetti({
      particleCount: 15, // small amount
      spread: 20, // small spread
      startVelocity: 9, // lower velocity so they don't go too far
      ticks: 90, // shorter duration
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2 - 20) / window.innerHeight,
      },
      scalar: 0.4, // smaller particles
      zIndex: 9999,
      disableForReducedMotion: true,
    });
  };

  const checkboxRef = useRef();

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="tasks-header-text">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="title-container"
          >
            {getIcon()}
            <p className="title">{getGreeting()}, Alex</p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="information"
          >
            It's July 22. You have 6 tasks in total, 1 today.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="dots-icon"
        >
          <Dots />
        </motion.div>
      </div>
      <div className="task-input-container">
        <input
          ref={inputRef}
          placeholder="Create a new task..."
          className="task-add-input"
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        ></input>
        <div className="task-add-tooltip">A</div>
      </div>
      <div className="task-list-container">
        {intialTasks.map((task) => {
          const { time, date } = formatTaskDate(task.due.parsedDate);

          return (
            <div key={task.id} className="task-item">
              <div className="task-item-left">
                <Drag className="drag-handle-icon" />
                <div
                  className="check-square"
                  ref={(el) => (checkboxRefs.current[task.id] = el)}
                  onClick={() =>
                    launchSmallConfetti(checkboxRefs.current[task.id])
                  }
                ></div>
                <p className="task-title">{task.title}</p>
              </div>
              <div className="task-item-right">
                <span className="task-time">{time}</span>
                <span className="task-date">{date}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="completed-task-list">
        <div className="completed-task-line"></div>
        <p className="completed-task-title">Completed(0)</p>
        <div className="completed-task-line"></div>
      </div>
    </div>
  );
};

export default Tasks;
