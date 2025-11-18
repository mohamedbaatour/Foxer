import React, { useState, useRef, useEffect } from "react";
import "./tasks.css";
import { AnimatePresence, LayoutGroup, MotionConfig, delay, motion } from "framer-motion";
import { DndContext, useDroppable, DragOverlay, pointerWithin  } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { defaultAnimateLayoutChanges } from "@dnd-kit/sortable";


import { ReactComponent as Sun } from "../icons/sun.svg";
import { ReactComponent as Moon } from "../icons/moon.svg";
import { ReactComponent as Sunrise } from "../icons/sunrise.svg";
import { ReactComponent as Dots } from "../icons/dots.svg";
import { ReactComponent as Drag } from "../icons/drag.svg";
import { ReactComponent as Check } from "../icons/check.svg";
import {ReactComponent as CheckMark } from "../icons/check-mark.svg";
import {ReactComponent as Edit } from "../icons/edit.svg";
import {ReactComponent as Duplicate } from "../icons/duplicate.svg";
import {ReactComponent as Delete } from "../icons/delete.svg";
import {ReactComponent as Calendar } from "../icons/calendar.svg";
import {ReactComponent as Clock } from "../icons/clock.svg";
import {ReactComponent as ArrowDown } from "../icons/arrow-down.svg";
import {ReactComponent as ArrowLeft} from "../icons/arrow-left.svg"
import {ReactComponent as ArrowRight} from "../icons/arrow-right.svg"


import confetti from "canvas-confetti";

import Selecto from "react-selecto";

import dayjs from "dayjs";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, format
} from "date-fns"



const gridV = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { delayChildren: 0.03, staggerChildren: 0.012 } }
};
const cellV = {
  hidden: { opacity: 0, y: 6 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 520, damping: 34 } }
};


const CLOSE_ALL_EVENT = "task-dots-close-all";

const EASE_SOFT = [0.25, 0.8, 0.3, 1];
const POP = { type: "spring", stiffness: 420, damping: 42, mass: 0.7 };

const menuShell = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...POP,
      duration: 0.38,
      when: "beforeChildren",
      delayChildren: 0.08,
      staggerChildren: 0.06
    }
  },
  closed: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    transition: {
      duration: 0.28,
      ease: EASE_SOFT,
      when: "afterChildren",
      staggerDirection: -1
    }
  }
};

const itemsWrap = {
  open:  { transition: { staggerChildren: 0.06 } },
  closed:{ transition: { staggerChildren: 0.045, staggerDirection: -1 } }
};

const menuItem = {
  open: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 460, damping: 40, mass: 0.68 }
  },
  closed: {
    opacity: 0,
    y: -6,
    x: 4,
    scale: 0.98,
    transition: { duration: 0.18, ease: EASE_SOFT }
  }
};




const SortableTaskItem = React.memo(function SortableTaskItem({
  task,
  onCheck,
  onDelete,
  onDuplicate, 
  isOverlay = false,
  isDraggingGlobal = false, 
  isDeleting = false,
  ...props
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      transition: null,
      animateLayoutChanges: (args) => {
        const { isSorting, wasDragging } = args;
        if (isSorting || wasDragging) return false;
        return defaultAnimateLayoutChanges(args);
      },
    });

  const [justChecked, setJustChecked] = React.useState(false);
  useEffect(() => { if (!task.completed) setJustChecked(false); }, [task.completed]);

  const nowForPopup = new Date();
  const dueForPopup = task?.due?.parsedDate ? new Date(task.due.parsedDate) : null;
  let daysLeftText = "", isNearForPopup = false, isLateForPopup = false;
  if (dueForPopup) {
    const todayMid = new Date(nowForPopup.getFullYear(), nowForPopup.getMonth(), nowForPopup.getDate());
    const dueMid   = new Date(dueForPopup.getFullYear(), dueForPopup.getMonth(), dueForPopup.getDate());
    const d = Math.round((dueMid - todayMid) / (1000*60*60*24));
    if (d > 1) daysLeftText = `${d} days left`;
    else if (d === 1) { daysLeftText = "1 day left"; isNearForPopup = true; }
    else if (d === 0) { daysLeftText = "Due today";  isNearForPopup = true; }
    else { isLateForPopup = true; const a = Math.abs(d); daysLeftText = `${a} day${a===1?"":"s"} late`; }
  }

  const disableLayout = isDraggingGlobal || isDragging || isOverlay;

  const menuRef = useRef(null);

    const [menuOpen, setMenuOpen] = React.useState(false);

    React.useEffect(() => {
  const handler = (e) => {
    if (e.detail !== task.id) setMenuOpen(false);
  };
  window.addEventListener(CLOSE_ALL_EVENT, handler);
  return () => window.removeEventListener(CLOSE_ALL_EVENT, handler);
}, [task.id]);

  React.useEffect(() => {
    if (!menuOpen) return;

    const onDocPointerDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        setMenuOpen(false); 
      }
    };

    document.addEventListener("pointerdown", onDocPointerDown)
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [menuOpen]);

  

  return (
    <motion.div
      ref={setNodeRef}
      className={`task-item selectable ${ (isDragging || isOverlay) ? "task-item-dragged" : "" } ${isDeleting ? 'deleting' : ''}`}
      layout={!disableLayout}
      layoutId={!disableLayout ? task.id : undefined}
      transition={!disableLayout ? { type: "spring", stiffness: 700, damping: 50 } : { duration: 0 }}
      animate={isDeleting ? { opacity: 0, y: -8, scale: 0.985 } : undefined}
      exit={{ opacity: 0, y: -8, scale: 0.985, transition: { duration: 0.18 } }}
      style={{
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
        opacity: isDragging && !isOverlay ? 0 : 1,
        pointerEvents: isDeleting ? "none" : undefined,
        willChange: isDragging ? "transform" : "auto",
      }}
      {...props}
    >
      <div className="task-item-left">
        <span {...listeners} {...attributes} style={{ cursor: "grab" }}>
          <Drag className="drag-handle-icon" />
        </span>

        <motion.div
          className={`check-square${task.completed || justChecked ? " checked" : ""}`}
          data-id={task.id}
          onClick={() => { if (!task.completed) setJustChecked(true); onCheck(); }}
            whileTap={{ scale: 0.92 }}
  animate={(task.completed) ? { scale: [1, 1.06, 1] } : {}}
  transition={{ duration: 3.2 }}
        >
          {(task.completed || justChecked) && <Check className="check-icon" />}
        </motion.div>

        <p className="task-title">{task.title}</p>
      </div>

      <div className="task-item-right">
        <span className={`task-time ${props.timeClass}`}>{props.time}</span>
        <div className="task-date-wrapper">
          <span className={`task-date ${props.dateClass}`}>{props.date}</span>
          {dueForPopup && !task.completed && (
            <motion.div
              className={`task-date-popup${isLateForPopup ? " late" : ""} ${isNearForPopup ? " near" : ""}`}
              role="tooltip"
              aria-hidden={isOverlay ? "true" : "false"}
              
            >
              {daysLeftText}
            </motion.div>
          )}
        </div>

        <div
          className="task-dots-container"
          ref={menuRef}
          onPointerDownCapture={(e) => { e.stopPropagation(); }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStartCapture={(e) => { e.stopPropagation(); }}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={() => {
            setTimeout(() => {
              setMenuOpen((prev) => {
           const next = !prev;
           if (next) {
             window.dispatchEvent(new CustomEvent(CLOSE_ALL_EVENT, { detail: task.id }));
           }
           return next;
         })
            }, 35);
          
          }}
        >
          <span className="task-dots" role="button" tabIndex={0} aria-label="Task actions">
            <Dots />
          </span>

<AnimatePresence initial={false} mode="wait">
  {menuOpen && (
    <motion.div
      key="menu"
      className="task-dots-dropdown"
      role="menu"
      variants={menuShell}
      initial="closed"
      animate="open"
      exit="closed"
      layout
      style={{ transformOrigin: "top right" }}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div variants={itemsWrap} initial="closed" animate="open" exit="closed">
        <motion.button
          className="dots-option"
          role="menuitem"
          variants={menuItem}
          whileHover={{ x: 1.5, scale: 1.004 }}
          whileTap={{ scale: 0.992 }}
        >
          <Edit className="dots-option-icon" /> Edit
        </motion.button>

        <motion.button
          className="dots-option"
          role="menuitem"
          variants={menuItem}
          whileHover={{ x: 1.5, scale: 1.004 }}
          whileTap={{ scale: 0.992 }}
          onClick={(e) => { e.stopPropagation(); if (onDuplicate) { onDuplicate(task.id); setMenuOpen(false); } }}
        >
          <Duplicate className="dots-option-icon" /> Duplicate
        </motion.button>

        <motion.button
  className="dots-option"
  role="menuitem"
  variants={menuItem}
  whileHover={{ x: 1.5, scale: 1.004 }}
  whileTap={{ scale: 0.992 }}
  onClick={(e) => {
    e.stopPropagation();
    if (onDelete) {
      setTimeout(() => {
        onDelete(task.id);
        setMenuOpen(false);
      }, 50);
    }
  }}
>
  <Delete className="dots-option-icon" /> Delete
</motion.button>

      </motion.div>
    </motion.div>
  )}
</AnimatePresence>



        </div>
      </div>
    </motion.div>
  );
});

  
const Tasks = () => {




function DroppableContainer({ id, children }) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} style={{ minHeight: 50, width: "100%" }}>
      {children}
    </div>
  );
}



  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const timePickerAnchorRef = useRef(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem("selectedDate");
    return saved ? new Date(saved) : new Date();
});

  useEffect(() => {
    if (!timePickerOpen) return;
    const onDocDown = (e) => {
      if (!timePickerAnchorRef.current) return;
      const root = timePickerAnchorRef.current;
      if (!root.contains(e.target) && !(document.querySelector('.mui-timepicker-popper')?.contains(e.target))) {
        setTimePickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocDown);
    return () => document.removeEventListener("pointerdown", onDocDown);
  }, [timePickerOpen]);

  

  useEffect(() => {
    try {
      if (selectedDate) localStorage.setItem("selectedDate", selectedDate.toISOString());
     else localStorage.removeItem("selectedDate");
    } catch (e) { }
  }, [selectedDate]);

  const addTask = (title) => {
  const nowIso = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let parsedDateIso = nowIso;
  if (selectedDate) {
    let d = dayjs(selectedDate);
    if (selectedTime) {
      d = d.hour(selectedTime.hour()).minute(selectedTime.minute()).second(0).millisecond(0);
    } else {
      d = d.hour(0).minute(0).second(0).millisecond(0);
    }
    parsedDateIso = d.toISOString();
  } else if (selectedTime) {
    const d = dayjs();
    const combined = d.hour(selectedTime.hour()).minute(selectedTime.minute()).second(0).millisecond(0);
    parsedDateIso = combined.toISOString();
  }

  const newTask = {
    id,
    title,
    createdAt: nowIso,
    updatedAt: nowIso,
    due: { originalInput: selectedTime ? selectedTime.format("HH:mm") : "", parsedDate: parsedDateIso },
    completed: false,
    focused: false,
    deleted: false,
  };

  setTasks((prev) => [newTask, ...prev]);

  setSelectedDate(new Date());
  setCalendarMonth(new Date());

  if (inputRef.current) inputRef.current.value = "";
  setSelectedTime(null);
  setTimePickerOpen(false);
};


  const duplicateTask = (id, fromCompleted = false) => {
    if (fromCompleted) {
      const idx = completedTasks.findIndex((t) => t.id === id);
      if (idx === -1) return;
      const src = completedTasks[idx];
      const nowIso = new Date().toISOString();
      const newTask = {
        ...src,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setCompletedTasks((prev) => {
        const before = prev.slice(0, idx + 1);
        const after = prev.slice(idx + 1);
        return [...before, newTask, ...after];
      });
    } else {
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) return;
      const src = tasks[idx];
      const nowIso = new Date().toISOString();
      const newTask = {
        ...src,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setTasks((prev) => {
        const before = prev.slice(0, idx + 1);
        const after = prev.slice(idx + 1);
        return [...before, newTask, ...after];
      });
    }
  };

const daysFromNow = (n, hours = 12) => {
  const d = new Date(Date.now() + n * 864e5);
  d.setUTCHours(hours, 0, 0, 0);
  return d.toISOString();
};

const nowDefault = new Date();

const defaultTasks = [
  {
    id: "1",
    title: "Finish project notes",
    createdAt: nowDefault.toISOString(),
    updatedAt: nowDefault.toISOString(),
    due: {
      originalInput: "today 6pm",
      parsedDate: daysFromNow(0, 18),
    },
    completed: false,
    focused: true,
    deleted: false,
  },
  {
    id: "2",
    title: "Go to the gym",
    createdAt: nowDefault.toISOString(),
    updatedAt: nowDefault.toISOString(),
    due: {
      originalInput: "tomorrow 7am",
      parsedDate: daysFromNow(1, 7),
    },
    completed: false,
    focused: false,
    deleted: false,
  },
  {
    id: "3",
    title: "Buy groceries",
    createdAt: nowDefault.toISOString(),
    updatedAt: nowDefault.toISOString(),
    due: {
      originalInput: "Saturday 4pm",
      parsedDate: daysFromNow(2, 16),
    },
    completed: false,
    focused: false,
    deleted: false,
  },
  {
    id: "4",
    title: "Plan weekend trip",
    createdAt: nowDefault.toISOString(),
    updatedAt: nowDefault.toISOString(),
    due: {
      originalInput: "Monday morning",
      parsedDate: daysFromNow(4, 9),
    },
    completed: false,
    focused: false,
    deleted: false,
  },
];

  

  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : defaultTasks;
  });

  const [completedTasks, setCompletedTasks] = useState(() => {
    const savedTasks = localStorage.getItem("completedTasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
  }, [completedTasks]);

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
 
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        if (isInputFocused) {
          setIsInputFocused(false);
          inputRef.current?.blur();
          setTimePickerOpen(false);
        }
        window.dispatchEvent(new CustomEvent(CLOSE_ALL_EVENT, { detail: null }));
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isInputFocused]);

  const getHour = (d = new Date()) => d.getHours();

 const getGreeting = (h = getHour()) =>
  h >= 6 && h < 12
    ? "Good morning"
    : h >= 12 && h < 18
    ? "Good afternoon"
    : h >= 18 && h < 22
    ? "Good evening"
    : "Good night";

 const getIcon = (h = getHour()) =>
  h >= 6 && h < 12
    ? <Sunrise className="title-icon" />
    : h >= 12 && h < 18
    ? <Sun className="title-icon" />
    : <Moon className="title-icon" />;


  const formatTaskDate = (dateString) => {
    if (!dateString) return { time: "", date: "" };
    const date = new Date(dateString);
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const today = new Date();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateMid = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((dateMid - todayMid) / (1000 * 60 * 60 * 24));

    let dateLabel;
    if (diffDays === 0) {
      dateLabel = "Today";
    } else if (diffDays === 1) {
      dateLabel = "Tomorrow";
    } else {
      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "short" });
      dateLabel = `${day} ${month}`;
    }

    return { time, date: dateLabel };
  };

  const launchSmallConfetti = (element) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    confetti({
      particleCount: 15,
      spread: 20,
      startVelocity: 9,
      ticks: 90,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2 - 20) / window.innerHeight,
      },
      scalar: 0.4,
      zIndex: 9999,
      disableForReducedMotion: true,
    });
  };

const getTaskDateClass = (task) => {
  if (task.completed) return "task-date-completed";

  const now = new Date();
  const dueDate = new Date(task.due.parsedDate);
  const diffMs = dueDate - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) {
    return "task-date-error";
  } else if (diffDays < 1) {
    return "task-date-warning";
  } else {
    return "task-date-accent";
  }
};

  const getTaskTimeClass = (task) => {
    if (task.completed) return "task-time-completed";
    const now = new Date();
    const dueDate = new Date(task.due.parsedDate);
    const diffMs = dueDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 3) {
      return "task-time-warning";
    } else {
      return;
    }
  };

  const [isCompletedTasksOpen, setIsCompletedTasksOpen] = useState(true);

  const toggleCompletedTasks = () => {
    setIsCompletedTasksOpen(!isCompletedTasksOpen);
  };

  const [activeId, setActiveId] = useState(null);

  const [isDragging, setIsDragging] = useState(false);

  const [deletingIds, setDeletingIds] = useState([]);
  const DELETE_ANIM_MS = 250;

  const deleteTaskWithAnimation = (id, fromCompleted = false) => {
    setDeletingIds((s) => [...s, id]);
    setTimeout(() => {
      if (fromCompleted) {
        setCompletedTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
      setDeletingIds((s) => s.filter((x) => x !== id));
    }, DELETE_ANIM_MS);
  };

  function handleDragStart(event) {
    setActiveId(event.active.id);
  setIsDragging(true);
  }

  function handleDragEnd(event) {
  const { active, over } = event;
  if (!over) {
    setActiveId(null);
    setIsDragging(false); 
    return;
  }

  const activeId = active.id;
  const overId = over.id;

  const isActiveInTasks = tasks.find((t) => t.id === activeId);
  const isOverInTasks = tasks.find((t) => t.id === overId);
  const isActiveInCompleted = completedTasks.find((t) => t.id === activeId);
  const isOverInCompleted = completedTasks.find((t) => t.id === overId);

  if (isActiveInTasks && isOverInTasks) {
    const oldIndex = tasks.findIndex((t) => t.id === activeId);
    const newIndex = tasks.findIndex((t) => t.id === overId);
    setTasks((items) => arrayMove(items, oldIndex, newIndex));
  } else if (isActiveInCompleted && isOverInCompleted) {
    const oldIndex = completedTasks.findIndex((t) => t.id === activeId);
    const newIndex = completedTasks.findIndex((t) => t.id === overId);
    setCompletedTasks((items) => arrayMove(items, oldIndex, newIndex));
  }

  else if (isActiveInTasks && isOverInCompleted) {
    const movedTask = tasks.find((t) => t.id === activeId);
    setTasks((prev) => prev.filter((t) => t.id !== activeId));
    setCompletedTasks((prev) => [{ ...movedTask, completed: true }, ...prev]);
    setIsCompletedTasksOpen(true);
  } else if (isActiveInCompleted && isOverInTasks) {
    const movedTask = completedTasks.find((t) => t.id === activeId);
    setCompletedTasks((prev) => prev.filter((t) => t.id !== activeId));
    setTasks((prev) => [...prev, { ...movedTask, completed: false }]);
  }

  setActiveId(null);
    setIsDragging(false);
}




const handleCheck = (task, fromCompleted) => {
  if (!fromCompleted) {
    setIsCompletedTasksOpen(true);
    const el = document.querySelector(`.check-square[data-id="${task.id}"]`);
    if (el) { el.classList.add("checked"); launchSmallConfetti(el); }

    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== task.id));
      setCompletedTasks(prev => [{ ...task, completed: true }, ...prev]);
      setIsCompletedTasksOpen(true);
    }, 360);
  } else {
    setTimeout(() => {
          setCompletedTasks(prev => prev.filter(t => t.id !== task.id));
    setTasks(prev => [...prev, { ...task, completed: false }]);
    }, 80);

  }
};
  

  useEffect(() => {
    const styleId = "selecto-disable-pointer";
    let styleTag = document.getElementById(styleId);

    const root = document.querySelector(".tasks-container");

    if (isDragging) {
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = styleId;
        styleTag.innerHTML = `
          .selectable, .selecto-selection {
            pointer-events: none !important;
          }
        `;
        document.head.appendChild(styleTag);
      }
      if (root && !root.classList.contains("task-holding")) {
        root.classList.add("task-holding");
      }
    } else {
      if (styleTag) {
        styleTag.remove();
      }
      if (root && root.classList.contains("task-holding")) {
        root.classList.remove("task-holding");
      }
    }
    return () => {
      if (styleTag) styleTag.remove();
      if (root && root.classList.contains("task-holding")) {
        root.classList.remove("task-holding");
      }
    };
  }, [isDragging]);

    const selectoRef = useRef(null);



  const todaysCount = tasks.filter(
    (task) =>
      new Date(task.due.parsedDate).toDateString() ===
        new Date().toDateString() && !task.completed
  ).length;



const currentMoodRef = React.useRef(null);
const activeBufRef   = React.useRef('a');
const clearTimerRef  = React.useRef(null);
const FADE_MS = 420;

const moodColorMap = {
  warning: 'rgba(247, 236, 80, 0.04)',
  error:   'rgba(247,  74, 65, 0.035)', 
  success: 'rgba(  0, 255,149, 0.045)',
};

const setBgMood = (mood) => {
  if (clearTimerRef.current) {
    clearTimeout(clearTimerRef.current);
    clearTimerRef.current = null;
  }

  const layer = document.getElementById('mood-layer');
  if (!layer) return;

  const bufA = layer.querySelector('.mood-a');
  const bufB = layer.querySelector('.mood-b');
  const active  = activeBufRef.current === 'a' ? bufA : bufB;
  const idle    = activeBufRef.current === 'a' ? bufB : bufA;

  if (!mood) {
    active.style.opacity = '0';
    currentMoodRef.current = null;
    return;
  }

  if (currentMoodRef.current === mood) return; 


  idle.style.setProperty('--mood-color', moodColorMap[mood] || 'transparent');
  idle.style.opacity = '1';
  active.style.opacity = '0';


  activeBufRef.current = activeBufRef.current === 'a' ? 'b' : 'a';
  currentMoodRef.current = mood;
};

const moodFromDateClass = (cls, task) => {
  if (!cls || task?.completed) return null;
  if (cls.includes('task-date-error'))   return 'error';
  if (cls.includes('task-date-warning')) return 'warning';
  if (cls.includes('task-date-accent'))  return 'success';
  return null;
};



useEffect(() => {
  if (document.getElementById('mood-layer')) return;

  const layer = document.createElement('div');
  layer.id = 'mood-layer';

  const a = document.createElement('div');
  a.className = 'mood mood-a';

  const b = document.createElement('div');
  b.className = 'mood mood-b';

  layer.appendChild(a);
  layer.appendChild(b);
  document.body.appendChild(layer);

  return () => {
    layer.remove();
  };
}, []);


const now = new Date();
const month = now.toLocaleString('en-US',{month:'short'});
const day = now.getDate();
const dateLabel = `${day} ${month}`;


const completedRef = useRef(null);
const [showScrollBtn, setShowScrollBtn] = useState(false);

useEffect(() => {
  const onScroll = () => {
    const completedEl = completedRef.current;
    if (!completedEl) return;
    const rect = completedEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    setShowScrollBtn(rect.top > viewportHeight * 0.9);
  };
  window.addEventListener("scroll", onScroll);
  onScroll();
  return () => window.removeEventListener("scroll", onScroll);
}, []);
        const [calendarMonth, setCalendarMonth] = useState(new Date())
const [calendarOpen, setCalendarOpen] = useState(false)
const calendarAnchorRef = useRef(null)
const calendarPopRef = useRef(null)

useEffect(() => {
    if (calendarOpen) setCalendarMonth(selectedDate || new Date());
  if (!calendarOpen) return
  const handleOutside = e => {
    if (!calendarPopRef.current?.contains(e.target) &&
        !calendarAnchorRef.current?.contains(e.target)) {
      setCalendarOpen(false)
    }
  }
  document.addEventListener("pointerdown", handleOutside)
  return () => document.removeEventListener("pointerdown", handleOutside)
}, [calendarOpen, selectedDate])

useEffect(() => {
  if (!timePickerOpen) return;

  const now = new Date();
  const idx = Math.round((now.getHours() * 60 + now.getMinutes()) / 30);
  const targetEl = document.querySelector(`.time-option:nth-child(${idx + 1})`);
  const container = document.querySelector(".time-picker-dropdown");
  if (!targetEl || !container) return;

  setTimeout(() => {
    const targetOffset =
      targetEl.offsetTop - container.clientHeight / 2 + targetEl.clientHeight / 2;
    const start = container.scrollTop;
    const diff = targetOffset - start;
    const duration = 620;
    const startTime = performance.now();

    const animate = (nowTime) => {
      const t = Math.min((nowTime - startTime) / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - t, 3);
      container.scrollTop = start + diff * easeOutCubic;
      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, 120);
}, [timePickerOpen]);




  return (
    <div className="tasks-container">
      <div style={{width: "620px"}} className="tasks-subcontainer">
      <div className="tasks-header">
        <div className="tasks-header-text">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="title-container"
          >
            {getIcon()}
            <p className="title">{getGreeting()}, User</p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="information"
          >
            It's {new Date().toLocaleString("en-US", { month: "short" })}{" "}
            {new Date().getDate()}. You have {tasks.length} remaining tasks,{" "}
            <span className={todaysCount > 0 ? "today-count" : ""}>
              {todaysCount} today
            </span>
            .
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
  <AnimatePresence initial={false}>
    {isInputFocused && (
      <motion.div
        key="left"
        className="task-input-left"
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -6 }}
        transition={{ duration: 0.22, ease: [0.25, 0.8, 0.3, 1] }}
        aria-hidden
      >
        <span className="drag-handle-icon lite"><Drag/></span>
        <div className="check-square lite" />
      </motion.div>
    )}
  </AnimatePresence>

  <motion.input
    ref={inputRef}
    placeholder="Create a new task..."
    className="task-add-input"
    onFocus={() => setIsInputFocused(true)}
    onBlur={() => setIsInputFocused(false)}
    animate={isInputFocused ? 'focused' : 'idle'}
    transition={{ duration: 0.22, ease: [0.25,0.8,0.3,1] }}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        const val = inputRef.current?.value?.trim();
        if (val) {
          addTask(val);
         setIsInputFocused(false);
         inputRef.current?.blur();
         setTimePickerOpen(false);
        }
      }
    }}
  />

  <div className="task-input-right">
    <AnimatePresence initial={false} mode="wait">
      {!isInputFocused ? (
        <motion.div
          key="kbd"
          className="task-add-tooltip"
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.25,0.8,0.3,1] }}
        >
          A
        </motion.div>
        
      ) : (
        <div  className="task-center">
          <motion.div
          layout
  key="clock"
  className={`task-date-chip task-clock-chip ${selectedTime ? "expanded" : ""}`}
  initial={{ opacity: 0, y: 6, x: 4 }}
  animate={{ opacity: 1, y: 0, x: 0 }}
  exit={{ opacity: 0, y: -6, x: 4 }}
  transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.7 }}
  ref={timePickerAnchorRef}
  onPointerDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
  onClick={(e) => {
    e.stopPropagation();
    setTimePickerOpen((s) => !s);
  }}
  role="button"
  aria-haspopup="dialog"
  aria-expanded={timePickerOpen}
>
  <motion.div    
   className="clock-ico-container"
initial={{ opacity: 0, x: 8, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 8, scale: 0.96 }}
        transition={{ delay: 0.15, duration: 0.2, ease: [0.25, 0.8, 0.3, 1] }}
          >
  <Clock className="chip-ico clock-ico" />
</motion.div>
  {selectedTime && (
    <motion.span
      key="time-label"
      className="chip-time-label"
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
              transition={{ delay: 0.15, duration: 0.2, ease: [0.25, 0.8, 0.3, 1] }}
    >
      {selectedTime.format("h:mm A")}
    </motion.span>
  )}

  <AnimatePresence>
    {timePickerOpen && (
      <motion.div
        key="custom-time-picker"
        className="time-picker-dropdown"
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96,}}
        transition={{ duration: 0.3, ease: [0.25, 0.8, 0.3, 1] }}
        style={{
          position: "absolute",
          top: timePickerAnchorRef.current?.offsetTop + 42 || 0,
          right: 0,
          zIndex: 3100,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {Array.from({ length: 48 }, (_, i) => {
          const totalMinutes = i * 30;
          const hour24 = Math.floor(totalMinutes / 60);
          const minute = totalMinutes % 60;
          const label = new Date(0, 0, 0, hour24, minute).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          const isSelected =
            selectedTime &&
            selectedTime.hour() === hour24 &&
            selectedTime.minute() === minute;

          return (
            <div
            key={`${hour24}-${minute}`}
                className={`time-option ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  const newTime = dayjs().hour(hour24).minute(minute).second(0);
                  setSelectedTime(newTime);
                  setTimePickerOpen(false);
               }}
>
  <span>{label}</span>
  {isSelected && <CheckMark className="time-check" />}
</div>

          );
        })}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>


        <motion.div
          key="date"
          className="task-date-chip"
          initial={{ opacity: 0, y: 6, x: 4}}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -6, x: 4,}}
          transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.7 }}
            onClick={(e) => {
              e.stopPropagation()
              setCalendarOpen(s => !s)
              
            }}
  ref={calendarAnchorRef}        
            onPointerDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}  
  role="button"
          aria-haspopup="dialog"
        >
          <motion.div    
initial={{ opacity: 0, x: 8, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 8, scale: 0.96 }}
        transition={{ delay: 0.15, duration: 0.2, ease: [0.25, 0.8, 0.3, 1] }}
          >
          <Calendar className="chip-ico calendar-ico"/>
          </motion.div>
          <AnimatePresence
          mode="wait"
          initial={false}
          >
          <motion.div className="task-date-chip-text">
            {selectedDate ? selectedDate.toLocaleDateString("en-US", { day: "numeric", month: "short" }) : dateLabel}</motion.div>
          </AnimatePresence>
        </motion.div>
        
<AnimatePresence>
  {calendarOpen && (
    <motion.div
      key="calendar-popup"
      ref={calendarPopRef}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.25, 0.8, 0.3, 1] }}
      className="calendar-popup"
      style={{
        position: "absolute",
        top: calendarAnchorRef.current?.offsetTop + 42 || 0,
        right: 0,
        zIndex: 3000,
        transformOrigin: "top right",
        willChange: "transform, opacity"
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.preventDefault()}
      onPointerDown={e => e.preventDefault()}
      onTouchStart={e => e.preventDefault()}
      layout
    >
      {(() => {
        const monthStart = startOfMonth(calendarMonth);
        const monthEnd = endOfMonth(calendarMonth);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
          for (let i = 0; i < 7; i++) {
            const clone = day;
            const isPast = day < new Date().setHours(0, 0, 0, 0);
            days.push(
              

<motion.button
  key={day.getTime()}
  variants={cellV}
  whileHover={!isPast ? { scale: 1.04 } : {}}
  whileTap={!isPast ? { scale: 0.96 } : {}}
  disabled={isPast}
  className={
    "calendar-day" +
    (!isSameMonth(day, calendarMonth) ? " dim" : "") +
    (isPast ? " disabled" : "") +
    (isSameDay(day, selectedDate) ? " selected" : "")
  }
  onClick={() => {
    if (isPast) return;
    setTimeout(() => {
          setSelectedDate(clone);
    setCalendarOpen(false);
    }, 40);

  }}
>
  {format(day, "d")}
</motion.button>

            );
            day = addDays(day, 1);
          }
          rows.push(<div className="calendar-row" key={day.getTime()}>{days}</div>);
          days = [];
        }

        return (
          <div className="calendar-box">
            <div className="calendar-head">
              <button className="calendar-arrow-container" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}><ArrowLeft className="calendar-arrow" /></button>
              <span>{format(calendarMonth, "MMMM yyyy")}</span>
              <button className="calendar-arrow-container" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}><ArrowRight className="calendar-arrow" /></button>
            </div>

            <motion.div
              key={calendarMonth.getTime()}
              variants={gridV}
              initial="hidden"
              animate="show"
              className="calendar-body"
            >
              {rows}
            </motion.div>
          </div>
        );
      })()}
    </motion.div>
  )}
</AnimatePresence>

        </div>
      )}
    </AnimatePresence>
  </div>
</div>


      <MotionConfig transition={{ layout: isDragging ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 50 } }}>
      <LayoutGroup id="lists" layout>
      <DndContext
        collisionDetection={pointerWithin} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >

        <DroppableContainer id="tasks">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="tasks-list-container">
<AnimatePresence initial={false}>
            {tasks.map((task) => {
  const { time, date } = formatTaskDate(task.due.parsedDate);
  const dateClass = getTaskDateClass(task);
  const timeClass = getTaskTimeClass(task);

  return (
    <SortableTaskItem
      key={task.id}
      task={task}
      time={time}
      date={date}
      dateClass={dateClass}
      timeClass={timeClass}
      onMouseEnter={() => !isDragging && setBgMood(moodFromDateClass(dateClass, task))}
      onMouseLeave={() => setBgMood(null)}
      onCheck={() => handleCheck(task, false)}
      onDelete={(id) => deleteTaskWithAnimation(id, false)}
      onDuplicate={(id) => duplicateTask(id, false)}
      isDraggingGlobal={isDragging}
      isDeleting={deletingIds.includes(task.id)}
      
    />
  );
})}
          </AnimatePresence>

          </div>
        </SortableContext>
        </DroppableContainer>

        <div className="completed-tasks-list" ref={completedRef}>
          <div className="completed-tasks-header">
            <div
              className={`completed-tasks-line ${
                isCompletedTasksOpen && completedTasks.length > 0
                  ? "line-expand"
                  : "line-hidden"
              }`}
            ></div>
            <p className="completed-tasks-title" onClick={toggleCompletedTasks}>
              Completed ({completedTasks.length})
            </p>
            <div
              className={`completed-tasks-line ${
                isCompletedTasksOpen && completedTasks.length > 0
                  ? "line-expand"
                  : "line-hidden"
              }`}
            ></div>
          </div>
          <AnimatePresence>
  {isCompletedTasksOpen && (
    <motion.div
      style={{ width: "100%" }}
        initial={{ opacity: 0, y: 8, scale: 0.995 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 8, scale: 0.995 }}
  transition={{ duration: 0.28, ease: [0.25,0.8,0.3,1] }}
    >
      <DroppableContainer id="completedTasks">
        <SortableContext
          items={completedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="tasks-list-container">
            {completedTasks.map(task => {
              const { time, date } = formatTaskDate(task.due.parsedDate);
              return (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  time={time}
                  date={date}
                  dateClass={getTaskDateClass(task)}
                  timeClass={getTaskTimeClass(task)}
                  onCheck={() => handleCheck(task, true)}
                  onDelete={(id) => deleteTaskWithAnimation(id, true)}
                  onDuplicate={(id) => duplicateTask(id, true)}
                  isDraggingGlobal={isDragging}
                  isDeleting={deletingIds.includes(task.id)}
                  
                />
              );
            })}
          </div>
        </SortableContext>
      </DroppableContainer>
    </motion.div>
  )}
</AnimatePresence>


<DragOverlay dropAnimation={null}>
  {activeId ? (() => {
    const activeTask =
      tasks.find((t) => t.id === activeId) ||
      completedTasks.find((t) => t.id === activeId);
    if (!activeTask) return null;
    const { time, date } = formatTaskDate(activeTask.due?.parsedDate);
    const dateClass = getTaskDateClass(activeTask);
    const timeClass = getTaskTimeClass(activeTask);
    return (  
      <SortableTaskItem
        task={activeTask}
        time={time}
        date={date}
        dateClass={dateClass}
        timeClass={timeClass}
        onCheck={() => {}}
        isOverlay={true}
      />
    );
  })() : null}
</DragOverlay>
        </div>
      </DndContext>
            </LayoutGroup>
            </MotionConfig>

</div>
{!isDragging && (
  <Selecto
    key="selecto"
    ref={selectoRef}
    container={document.body}
    selectableTargets={[".selectable"]}
    selectByClick={false}
    selectFromInside={false}
    continueSelect={false}
    toggleContinueSelect={["ctrl", "meta"]}

    hitRate={0}
    ratio={0}

    onSelect={e => {
      e.added.forEach(el => el.classList.add("selected"));
      e.removed.forEach(el => el.classList.remove("selected"));
    }}
    onSelectEnd={e => {
    }}
  />
)}

<AnimatePresence>
  {showScrollBtn && (
    <motion.div
      className="scroll-to-completed"
      onClick={() =>
        completedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <ArrowDown className="scroll-icon" />
    </motion.div>
  )}
</AnimatePresence>


    </div>
  );
};

export default Tasks;



