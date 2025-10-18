import React, { useState, useRef, useEffect } from "react";
import "./tasks.css";
import { AnimatePresence, motion } from "framer-motion";
import { DndContext, closestCenter, useDroppable, DragOverlay  } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ReactComponent as Sun } from "../icons/sun.svg";
import { ReactComponent as Moon } from "../icons/moon.svg";
import { ReactComponent as Sunrise } from "../icons/sunrise.svg";
import { ReactComponent as Dots } from "../icons/dots.svg";
import { ReactComponent as Drag } from "../icons/drag.svg";
import { ReactComponent as Check } from "../icons/check.svg";

import confetti from "canvas-confetti";

import Selecto from "react-selecto";


// Sortable Task Item
function SortableTaskItem({ task, onCheck, dragHandle, isOverlay = false, ...props }) {

  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Local state to show check icon immediately on click
  const [justChecked, setJustChecked] = React.useState(false);

  // Reset justChecked if task is removed from list (moved to completed)
  useEffect(() => {
    if (!task.completed) setJustChecked(false);
  }, [task.completed]);

  // compute days-left text for the hover popup (fix off-by-one by comparing date-only)
  const nowForPopup = new Date();
  const dueForPopup = task?.due?.parsedDate ? new Date(task.due.parsedDate) : null;
  let daysLeftText = "";
  let isLateForPopup = false;
  if (dueForPopup) {
    // Compare dates at midnight so partial-day times don't add an extra day
    const todayMid = new Date(nowForPopup.getFullYear(), nowForPopup.getMonth(), nowForPopup.getDate());
    const dueMid = new Date(dueForPopup.getFullYear(), dueForPopup.getMonth(), dueForPopup.getDate());
    const diffDaysPopup = Math.round((dueMid - todayMid) / (1000 * 60 * 60 * 24));

    if (diffDaysPopup > 1) daysLeftText = `${diffDaysPopup} days left`;
    else if (diffDaysPopup === 1) daysLeftText = "1 day left";
    else if (diffDaysPopup === 0) daysLeftText = "Due today";
    else {
      isLateForPopup = true;
      const daysLate = Math.abs(diffDaysPopup);
      daysLeftText = `${daysLate} day${daysLate === 1 ? "" : "s"} late`;
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging && !isOverlay ? 0 : 1,
        zIndex: isDragging ? 2 : 1,
      }}
      className="task-item selectable"
      {...props}
    >
      <div className="task-item-left">
        <span {...listeners} {...attributes} style={{ cursor: "grab" }}>
          <Drag className="drag-handle-icon" />
        </span>
        <div
          className={`check-square${task.completed || justChecked ? " checked" : ""}`}
          data-id={task.id}
          onClick={() => {
            if (!task.completed) setJustChecked(true);
            onCheck();
          }}
        >
          {(task.completed || justChecked) && <Check className="check-icon" />}
        </div>
        <p className="task-title">{task.title}</p>
      </div>
      <div className="task-item-right">
        <span className={`task-time ${props.timeClass}`}>{props.time}</span>

        {/* Date + hover popup */}
        <div className="task-date-wrapper">
          <span className={`task-date ${props.dateClass}`}>{props.date}</span>
          {/* don't show popup for completed tasks */}
                    {dueForPopup && !task.completed && (
            <div
              className={`task-date-popup${isLateForPopup ? " late" : ""}`}
              role="tooltip"
              aria-hidden={isOverlay ? "true" : "false"}
            >
              {daysLeftText}
            </div>
          )}
        </div>

        <div 
          className="task-dots-container"
          onPointerDownCapture={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStartCapture={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="task-dots" role="button" tabIndex={0} aria-label="Task actions">
            <Dots />
          </span>
        </div>
      </div>  
    </div>
  );
}
  
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
        parsedDate: "2025-10-18T17:00:00Z",
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

    if (diffDays < 1) {
      return "task-date-error";
    } else if (diffDays < 3) {
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

  const [isCompletedTasksOpen, setIsCompletedTasksOpen] = useState(false);

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

  // Moving between lists
  else if (isActiveInTasks && isOverInCompleted) {
    const movedTask = tasks.find((t) => t.id === activeId);
    setTasks((prev) => prev.filter((t) => t.id !== activeId));
    setCompletedTasks((prev) => [{ ...movedTask, completed: true }, ...prev]);
    setIsCompletedTasksOpen(true); // Open completed section
  } else if (isActiveInCompleted && isOverInTasks) {
    const movedTask = completedTasks.find((t) => t.id === activeId);
    setCompletedTasks((prev) => prev.filter((t) => t.id !== activeId));
    setTasks((prev) => [...prev, { ...movedTask, completed: false }]);
  }

  setActiveId(null);
    setIsDragging(false);
}



  // Checkbox click handler
  const handleCheck = (task, fromCompleted) => {
    if (!fromCompleted) {
      const el = document.querySelector(
        `.task-item .check-square:not(.checked)[data-id="${task.id}"]`
      ) || document.querySelector(`.task-item .check-square:not(.checked)`);
      if (el) {
        el.classList.add("checked");
        launchSmallConfetti(el);
      }
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        setCompletedTasks((prev) => [{ ...task, completed: true }, ...prev]);
        setIsCompletedTasksOpen(true); // Open completed section
      }, 700);
    } else {
      setCompletedTasks((prev) => prev.filter((t) => t.id !== task.id));
      setTasks((prev) => [...prev, { ...task, completed: false }]);
    }
  };
  
  // ...existing code...

  // Add this style to block pointer events on .selectable while dragging
  useEffect(() => {
    const styleId = "selecto-disable-pointer";
    let styleTag = document.getElementById(styleId);

    if (isDragging) {
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = styleId;
        // Block pointer events on .selectable and .selecto-selection
        styleTag.innerHTML = `
          .selectable, .selecto-selection {
            pointer-events: none !important;
          }
        `;
        document.head.appendChild(styleTag);
      }
    } else {
      if (styleTag) {
        styleTag.remove();
      }
    }
    return () => {
      if (styleTag) styleTag.remove();
    };
  }, [isDragging]);

    const selectoRef = useRef(null);

// useEffect(() => {
//   function handleClickOutside(e) {
//     // if click is truly outside both your items and the selecto UI:
//     if (
//       !e.target.closest(".task-item") &&
//       !e.target.closest(".selecto-selection") &&
//       !e.target.closest(".selecto-area")
//     ) {
//       // 1) clear your CSS classes
//       document
//         .querySelectorAll(".task-item.selected")
//         .forEach(el => el.classList.remove("selected"));

//       // 2) and _also_ tell Selecto to forget everything:
//       if (selectoRef.current) {
//         // this will reset its internal selected-targets array
//         selectoRef.current.setSelectedTargets([]);
//       }
//     }
//   }

//   document.addEventListener("click", handleClickOutside);
//   return () => {
//     document.removeEventListener("click", handleClickOutside);
//   };
// }, []);


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
            <p className="title">{getGreeting()}, Alex</p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="information"
          >
            It's {new Date().toLocaleString("en-US", { month: "long" })}{" "}
            {new Date().getDate()}. You have {tasks.length} tasks in total,{" "}
            {
              tasks.filter(
                (task) =>
                  new Date(task.due.parsedDate).toDateString() ===
                    new Date().toDateString() && !task.completed
              ).length
            }{" "}
            today.
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
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Tasks List */}
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
                  onCheck={() => handleCheck(task, false)}
                />
              );
            })}
          </div>
        </SortableContext>
        </DroppableContainer>
        {/* Completed Tasks */}
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
                />
              );
            })}
          </div>
        </SortableContext>
      </DroppableContainer>
    </motion.div>
  )}
</AnimatePresence>

{/* <-- Move DragOverlay here, outside of the conditional */}
<DragOverlay>
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

</div>
{!isDragging && (
  <Selecto
    key="selecto"
    ref={selectoRef}
    container={document.body}
    selectableTargets={[".selectable"]}
    hitRate={0}
    selectByClick={true} // <-- Prevent selection on click
    selectFromInside  
    continueSelect={true}
    toggleContinueSelect={"shift"}
    ratio={0}
    selectable={true}
    
    onSelect={e => {
      e.added.forEach(el => el.classList.add("selected"));
      e.removed.forEach(el => el.classList.remove("selected"));
    }}
    onSelectEnd={e => {
      if (e.selected.length === 0) {
        document.querySelectorAll(".task-item.selected").forEach((el) => {
          el.classList.remove("selected");
        });
      }
    }}
  />
)}
    </div>
  );
};

export default Tasks;



