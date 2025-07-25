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

// Sortable Task Item
function SortableTaskItem({ task, onCheck, dragHandle, ...props }) {

  
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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 2 : 1,
      }}
      className="task-item"
      {...props}
    >
      <div className="task-item-left">
        <span {...listeners} {...attributes} style={{ cursor: "grab" }}>
          <Drag className="drag-handle-icon" />
        </span>
        <div
          className={`check-square${
            task.completed || justChecked ? " checked" : ""
          }`}
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
        <span className={`task-date ${props.dateClass}`}>{props.date}</span>
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
      updatedAt: "2025-07-23T21:45:00Z",
      due: {
        originalInput: "tomorrow 5pm",
        parsedDate: "2025-08-04T14:00:00Z",
      },
      completed: false,
      focused: false,
      deleted: false,
    },
    {
      id: "2",
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
      id: "3",
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

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
  const { active, over } = event;
  if (!over) return;

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
  } else if (isActiveInCompleted && isOverInTasks) {
    const movedTask = completedTasks.find((t) => t.id === activeId);
    setCompletedTasks((prev) => prev.filter((t) => t.id !== activeId));
    setTasks((prev) => [...prev, { ...movedTask, completed: false }]);
  }

  setActiveId(null);
}


  // Checkbox click handler
  const handleCheck = (task, fromCompleted) => {
    if (!fromCompleted) {
      // Show checkmark immediately, play confetti, then move to completed (top)
      const el = document.querySelector(
        `.task-item .check-square:not(.checked)[data-id="${task.id}"]`
      ) || document.querySelector(`.task-item .check-square:not(.checked)`);
      if (el) {
        el.classList.add("checked"); // visually check the box
        launchSmallConfetti(el);
      }
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        setCompletedTasks((prev) => [{ ...task, completed: true }, ...prev]);
      }, 700); // 400ms for confetti animation
    } else {
      setCompletedTasks((prev) => prev.filter((t) => t.id !== task.id));
      setTasks((prev) => [...prev, { ...task, completed: false }]);
    }
  };

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
                    {completedTasks.map((task) => {
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
                          onCheck={() => handleCheck(task, true)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
                </DroppableContainer>
                <DragOverlay>
    {activeId ? (
      <SortableTaskItem
        task={
          tasks.find((t) => t.id === activeId) ||
          completedTasks.find((t) => t.id === activeId)
        }
        time=""
        date=""
        dateClass=""
        timeClass=""
        onCheck={() => {}}
      />
    ) : null}
  </DragOverlay>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DndContext>
    </div>
  );
};

export default Tasks;



