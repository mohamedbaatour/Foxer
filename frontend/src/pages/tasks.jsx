import React, { useState, useRef, useEffect } from "react";
import "./tasks.css";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
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
import {ReactComponent as Edit } from "../icons/edit.svg";
import {ReactComponent as Duplicate } from "../icons/duplicate.svg";
import {ReactComponent as Delete } from "../icons/delete.svg";

import confetti from "canvas-confetti";

import Selecto from "react-selecto";

const CLOSE_ALL_EVENT = "task-dots-close-all";

const menuVariants = {
  open:   { opacity: 1, scale: 1, y: 0,   transition: { duration: 0.18 } },
  closed: { opacity: 0, scale: 0.96, y: -6, transition: { duration: 0.18 } },
};

// Sortable Task Item
const SortableTaskItem = React.memo(function SortableTaskItem({
  task,
  onCheck,
  isOverlay = false,
  isDraggingGlobal = false, 
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

  // Close on outside click

    const [menuOpen, setMenuOpen] = React.useState(false);

    React.useEffect(() => {
  const handler = (e) => {
    // If some OTHER task opened, close me.
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
        setMenuOpen(false); // triggers AnimatePresence exit
      }
    };

    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [menuOpen]);

  return (
    <motion.div
      ref={setNodeRef}
      className={`task-item selectable ${ (isDragging || isOverlay) ? "task-item-dragged" : "" }`}
      layout={!disableLayout}
      layoutId={!disableLayout ? task.id : undefined}
      transition={!disableLayout ? { type: "spring", stiffness: 700, damping: 50 } : { duration: 0 }}
      style={{
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
        opacity: isDragging && !isOverlay ? 0 : 1,
        willChange: isDragging ? "transform" : "auto",
      }}
      {...props}
    >
      <div className="task-item-left">
        <span {...listeners} {...attributes} style={{ cursor: "grab" }}>
          <Drag className="drag-handle-icon" />
        </span>

        <div
          className={`check-square${task.completed || justChecked ? " checked" : ""}`}
          data-id={task.id}
          onClick={() => { if (!task.completed) setJustChecked(true); onCheck(); }}
        >
          {(task.completed || justChecked) && <Check className="check-icon" />}
        </div>

        <p className="task-title">{task.title}</p>
      </div>

      <div className="task-item-right">
        <span className={`task-time ${props.timeClass}`}>{props.time}</span>
        <div className="task-date-wrapper">
          <span className={`task-date ${props.dateClass}`}>{props.date}</span>
          {dueForPopup && !task.completed && (
            <div
              className={`task-date-popup${isLateForPopup ? " late" : ""} ${isNearForPopup ? " near" : ""}`}
              role="tooltip"
              aria-hidden={isOverlay ? "true" : "false"}
            >
              {daysLeftText}
            </div>
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
          setMenuOpen((prev) => {
           const next = !prev;
           // If we're opening this one, broadcast to others to close themselves.
           if (next) {
             window.dispatchEvent(new CustomEvent(CLOSE_ALL_EVENT, { detail: task.id }));
           }
           return next;
         })
          }}
        >
          <span className="task-dots" role="button" tabIndex={0} aria-label="Task actions">
            <Dots />
          </span>

          {/* Plain, instant dropdown — no AnimatePresence, no motion, no variants */}
            <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.div
                key="menu"
                className="task-dots-dropdown"
                role="menu"
                variants={menuVariants}
                initial="closed"
                animate="open"
                exit="closed"
                style={{ transformOrigin: "top right" }}
                // don’t let clicks bubble to the container (which would toggle)
                onClick={(e) => e.stopPropagation()}
              >
                <button className="dots-option" role="menuitem">
                  <Edit className="dots-option-icon" /> Edit
                </button>
                <button className="dots-option" role="menuitem">
                  <Duplicate className="dots-option-icon" /> Duplicate
                </button>
                <button className="dots-option" role="menuitem">
                  <Delete className="dots-option-icon" /> Delete
                </button>
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



  const defaultTasks = [
    {
      id: "1",
      title: "Go shopping",
      createdAt: "2025-07-23T21:30:00Z",
      updatedAt: "2025-10-23T21:45:00Z",
      due: {
        originalInput: "tomorrow 5pm",
        parsedDate: "2025-10-17T14:00:00Z",
      },
      completed: false,
      focused: false,
      deleted: false,
    },
    {
      id: "2",
      title: "Clean the house",
      createdAt: "2025-10-23T21:30:00Z",
      updatedAt: "2025-10-23T21:45:00Z",
      due: {
        originalInput: "tomorrow 5pm",
        parsedDate: "2025-10-19T17:00:00Z",
      },
      completed: false,
      focused: false,
      deleted: false,
    },
    {
      id: "3",
      title: "Go to the GYM",
      createdAt: "2025-10-23T21:30:00Z",
      updatedAt: "2025-10-23T21:45:00Z",
      due: {
        originalInput: "tomorrow 5pm",
        parsedDate: "2025-10-20T17:00:00Z",
      },
      completed: false,
      focused: false,
      deleted: false,
    },
    {
      id: "4",
      title: "Play video games",
      createdAt: "2025-10-23T21:30:00Z",
      updatedAt: "2025-10-23T21:45:00Z",
      due: {
        originalInput: "tomorrow 5pm",
        parsedDate: "2025-10-23T17:00:00Z",
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
    if (!dateString) return { time: "", date: "" };
    const date = new Date(dateString);
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // compare only year/month/day to get day-diff
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
  const diffDays = diffMs / (1000 * 60 * 60 * 48);

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

  // DnDKit logic
  const [activeId, setActiveId] = useState(null);

  const [isDragging, setIsDragging] = useState(false);

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

  // Reordering within the same list
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
    }, 140);
  } else {
    setCompletedTasks(prev => prev.filter(t => t.id !== task.id));
    setTasks(prev => [...prev, { ...task, completed: false }]);
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
    // Fade out current active overlay smoothly
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





  return (
    <div className="tasks-container">
      <div style={{width: "620px"}} className="tasks-subcontainer">
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
            <p className="title">{getGreeting()}, User</p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="information"
          >
            It's {new Date().toLocaleString("en-US", { month: "short" })}{" "}
            {new Date().getDate()}. You have {tasks.length} tasks in total,{" "}
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
        <input
          ref={inputRef}
          placeholder="Create a new task..."
          className="task-add-input"
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        ></input>
        <div className="task-add-tooltip">A</div>
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
      isDraggingGlobal={isDragging}
      
    />
  );
})}

          </div>
        </SortableContext>
        </DroppableContainer>

        <div className="completed-tasks-list">
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, delay: 0.1 }}
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
                  isDraggingGlobal={isDragging}
                  
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

    </div>
  );
};

export default Tasks;



