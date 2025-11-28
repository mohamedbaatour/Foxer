import React, { useState, useRef, useEffect, useCallback } from "react";

import "./tasks.css";
import { AnimatePresence, LayoutGroup, MotionConfig, delay, motion } from "framer-motion";
import { DndContext, useDroppable, DragOverlay, pointerWithin, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

import _ from 'lodash';

import { ReactComponent as Sun } from "../icons/sun.svg";
import { ReactComponent as Moon } from "../icons/moon.svg";
import { ReactComponent as Sunrise } from "../icons/sunrise.svg";
import { ReactComponent as Dots } from "../icons/dots.svg";
import { ReactComponent as Drag } from "../icons/drag.svg";
import { ReactComponent as Check } from "../icons/check.svg";
import { ReactComponent as CheckMark } from "../icons/check-mark.svg";
import { ReactComponent as Edit } from "../icons/edit.svg";
import { ReactComponent as Duplicate } from "../icons/duplicate.svg";
import { ReactComponent as Delete } from "../icons/delete.svg";
import { ReactComponent as Calendar } from "../icons/calendar.svg";
import { ReactComponent as Clock } from "../icons/clock.svg";
import { ReactComponent as ArrowDown } from "../icons/arrow-down.svg";
import { ReactComponent as ArrowLeft } from "../icons/arrow-left.svg"
import { ReactComponent as ArrowRight } from "../icons/arrow-right.svg"

import { ReactComponent as SunTheme } from "../icons/sun-theme.svg";
import { ReactComponent as MoonTheme } from "../icons/moon-theme.svg";
import { ReactComponent as SystemTheme } from "../icons/system-theme.svg";
import { ReactComponent as ImportTasks } from "../icons/import-tasks.svg";
import { ReactComponent as DownloadTasks } from "../icons/download-tasks.svg";
import { ReactComponent as About } from "../icons/about.svg";
import { ReactComponent as PrivacyPolicy } from "../icons/terms-of-use.svg";
import { ReactComponent as Twitter } from "../icons/twitter.svg";
import { ReactComponent as Changelog } from "../icons/changelog.svg";
import { ReactComponent as Logo } from "../icons/logo.svg";

import * as chrono from "chrono-node";

import { usePageTitle } from "../hooks/usePageTitle";

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
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 520, damping: 34 } }
};


const CLOSE_ALL_EVENT = "task-dots-close-all";

const EASE_SOFT = [0.25, 0.8, 0.3, 1];
const POP = { type: "spring", stiffness: 420, damping: 42, mass: 0.7, delay: 0.03 };

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
  open: { transition: { staggerChildren: 0.06 } },
  closed: { transition: { staggerChildren: 0.045, staggerDirection: -1 } }
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
  onTitleCommit,
  onDateChange,
  isOverlay = false,
  isDeleting = false,
  isBaseHidden = false,
  isDraggingGlobal = false,
  draggedCount = 1,
  isGroupDragging = false,
  ...props
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    animateLayoutChanges: (args) => {
      const { isSorting, wasDragging } = args;
      if (isSorting || wasDragging) return false;
      return defaultAnimateLayoutChanges(args);
    },
  });

  const titleRef = useRef(null);

  const commitTitle = useCallback(() => {
    if (!onTitleCommit || !titleRef.current) return;
    const raw = titleRef.current.innerText;
    const next = _.trim(raw.replace(/\s+/g, " "));
    if (!next) {
      titleRef.current.innerText = task.title;
      return;
    }
    if (next !== task.title) onTitleCommit(next);
    else titleRef.current.innerText = task.title;
  }, [onTitleCommit, task.title]);

  const [dateCalOpen, setDateCalOpen] = React.useState(false);
  const [dateMonth, setDateMonth] = React.useState(() =>
    task?.due?.parsedDate ? new Date(task.due.parsedDate) : new Date()
  );
  const dateAnchorRef = React.useRef(null);
  const datePopRef = React.useRef(null);

  useHotkeys(
    'esc',
    (e) => {
      if (!dateCalOpen) return;
      e.preventDefault();
      setDateCalOpen(false);
    },
    { enableOnTags: ['*'], keydown: true }
  );


  const selectedTaskDate = task?.due?.parsedDate
    ? new Date(task.due.parsedDate)
    : null;

  React.useEffect(() => {
    if (!dateCalOpen) return;

    const base = task?.due?.parsedDate
      ? new Date(task.due.parsedDate)
      : new Date();

    setDateMonth(base);

    const handleOutside = (e) => {
      if (
        !datePopRef.current?.contains(e.target) &&
        !dateAnchorRef.current?.contains(e.target)
      ) {
        setDateCalOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [dateCalOpen, task?.due?.parsedDate]);


  const [justChecked, setJustChecked] = React.useState(false);
  useEffect(() => { if (!task.completed) setJustChecked(false); }, [task.completed]);

  const nowForPopup = new Date();
  const dueForPopup = task?.due?.parsedDate ? new Date(task.due.parsedDate) : null;
  let daysLeftText = "", isNearForPopup = false, isLateForPopup = false;
  if (dueForPopup) {
    const todayMid = new Date(nowForPopup.getFullYear(), nowForPopup.getMonth(), nowForPopup.getDate());
    const dueMid = new Date(dueForPopup.getFullYear(), dueForPopup.getMonth(), dueForPopup.getDate());
    const d = Math.round((dueMid - todayMid) / (1000 * 60 * 60 * 24));
    if (d > 1) daysLeftText = `${d} days left`;
    else if (d === 1) { daysLeftText = "1 day left"; isNearForPopup = true; }
    else if (d === 0) { daysLeftText = "Due today"; isNearForPopup = true; }
    else { isLateForPopup = true; const a = Math.abs(d); daysLeftText = `${a} day${a === 1 ? "" : "s"} late`; }
  }

  const disableLayout = isDragging || isOverlay || isDraggingGlobal || isBaseHidden;

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
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [menuOpen]);

  let finalTransform = transform;

  if (
    !isOverlay &&
    !isBaseHidden &&
    finalTransform &&
    isDraggingGlobal &&
    draggedCount > 1 &&
    !isGroupDragging
  ) {
    finalTransform = {
      ...finalTransform,
      y: finalTransform.y * draggedCount,
    };
  }

  const dndStyle =
    !isOverlay && !isBaseHidden && finalTransform
      ? { transform: CSS.Transform.toString(finalTransform), transition }
      : {};

  return (
    <motion.div
      ref={setNodeRef}
      data-id={task.id}
      className={
        `task-item selectable ${isOverlay ? "task-item-dragged" : ""}` +
        (isDeleting ? " deleting" : "")
      }
      layout={!disableLayout}
      layoutId={!disableLayout ? task.id : undefined}
      transition={
        !disableLayout
          ? { type: "spring", stiffness: 700, damping: 50 }
          : { duration: 0 }
      }
      animate={isDeleting ? { opacity: 0, y: -8, scale: 0.985 } : undefined}
      exit={{ opacity: 0, y: -8, scale: 0.985, transition: { duration: 0.18 } }}
      style={{
        ...dndStyle,
        opacity: isOverlay ? 1 : (isBaseHidden ? 0 : 1),
        pointerEvents: isDeleting ? "none" : undefined,
        willChange: !isOverlay && isDragging ? "transform" : "auto",
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
          onClick={() => { if (!task.completed) setJustChecked(true); onCheck?.(); }}
          whileTap={{ scale: 0.92 }}
          animate={task.completed ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 3.2 }}
        >
          {(task.completed || justChecked) && <Check className="check-icon" />}
        </motion.div>

        <p
          ref={titleRef}
          className="task-title"
          contentEditable={!isOverlay}
          suppressContentEditableWarning
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTitle();
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              if (titleRef.current) titleRef.current.innerText = task.title;
              e.currentTarget.blur();
            }
          }}
        >
          {task.title}
        </p>
      </div>

      <div className="task-item-right" style={{ position: "relative" }}>
        <span className={`task-time ${props.timeClass}`}>{props.time}</span>

        <div
          className={`task-date-wrapper${dateCalOpen ? " calendar-open" : ""}`}
          ref={dateAnchorRef}
          onClick={(e) => {
            e.stopPropagation();
            if (isOverlay) return;
            setTimeout(() => {
              setDateCalOpen(s => !s);
            }, 40);
          }}
        >

          <motion.span className={`task-date ${props.dateClass}`}>{props.date}</motion.span>
          {dueForPopup && !task.completed && (
            <motion.div
              className={`task-date-popup${isLateForPopup ? " late" : ""} ${isNearForPopup ? " near" : ""}`}
              role="tooltip"
              aria-hidden={isOverlay ? "true" : "false"}
            >
              {daysLeftText}
            </motion.div>
          )}

          <AnimatePresence>
            {dateCalOpen && !isOverlay && (
              <motion.div
                key="task-calendar-popup"
                ref={datePopRef}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.25, 0.8, 0.3, 1] }}
                className="calendar-popup"
                style={{
                  position: "absolute",
                  top: (dateAnchorRef.current?.offsetTop || 0) + 38,
                  right: -47,
                  zIndex: 3000,
                  transformOrigin: "top right",
                  willChange: "transform, opacity",
                }}
                onClick={e => e.stopPropagation()}
                layout
              >
                {(() => {
                  const monthStart = startOfMonth(dateMonth);
                  const monthEnd = endOfMonth(dateMonth);
                  const startDate = startOfWeek(monthStart);
                  const endDate = endOfWeek(monthEnd);

                  const rows = [];
                  let days = [];
                  let day = startDate;

                  while (day <= endDate) {
                    for (let i = 0; i < 7; i++) {
                      const clone = day;
                      const isPast = day < new Date().setHours(0, 0, 0, 0);
                      const isSelected =
                        selectedTaskDate && isSameDay(day, selectedTaskDate);

                      days.push(
                        <motion.button
                          key={day.getTime()}
                          variants={cellV}
                          whileHover={!isPast ? { scale: 1.04 } : {}}
                          whileTap={!isPast ? { scale: 0.96 } : {}}
                          disabled={isPast}
                          className={
                            "calendar-day" +
                            (!isSameMonth(day, dateMonth) ? " dim" : "") +
                            (isPast ? " disabled" : "") +
                            (isSelected ? " selected" : "")
                          }
                          onClick={() => {
                            if (isPast) return;

                            setDateCalOpen(false);

                            if (onDateChange) {
                              setTimeout(() => {
                                onDateChange(clone);
                              }, 100);
                            }
                          }}

                        >
                          {format(day, "d")}
                        </motion.button>
                      );
                      day = addDays(day, 1);
                    }
                    rows.push(
                      <div className="calendar-row" key={day.getTime()}>
                        {days}
                      </div>
                    );
                    days = [];
                  }

                  return (
                    <div className="calendar-box">
                      <div className="calendar-head">
                        <button
                          type="button"
                          className="calendar-arrow-container"
                          onClick={e => {
                            e.stopPropagation();
                            setDateMonth(m => subMonths(m, 1));
                          }}
                        >
                          <ArrowLeft className="calendar-arrow" />
                        </button>

                        <span>{format(dateMonth, "MMMM yyyy")}</span>

                        <button
                          type="button"
                          className="calendar-arrow-container"
                          onClick={e => {
                            e.stopPropagation();
                            setDateMonth(m => addMonths(m, 1));
                          }}
                        >
                          <ArrowRight className="calendar-arrow" />
                        </button>

                      </div>

                      <motion.div
                        key={dateMonth.getTime()}
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
              });
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
                    className="dots-option disabled"
                    role="menuitem"
                    variants={menuItem}
                    whileHover={{ x: 1.5, scale: 1.004 }}
                    whileTap={{ scale: 0.992 }}
                  >
                    <Edit className="dots-option-icon disabled" /> Edit
                  </motion.button>

                  <motion.button
                    className="dots-option"
                    role="menuitem"
                    variants={menuItem}
                    whileHover={{ x: 1.5, scale: 1.004 }}
                    whileTap={{ scale: 0.992 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.(task.id);
                      setMenuOpen(false);
                    }}
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
                      if (!onDelete) return;
                      setTimeout(() => {
                        onDelete(task.id);
                        setMenuOpen(false);
                      }, 50);
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
  usePageTitle("Foxer - Tasks");
  const nav = useNavigate();


  const handleTitleCommit = (id, title, fromCompleted = false) => {
    const v = _.trim(title);
    if (!v) return;
    const nowIso = new Date().toISOString();

    if (fromCompleted) {
      setCompletedTasks(prev =>
        prev.map(t => t.id === id ? { ...t, title: v, updatedAt: nowIso } : t)
      );
    } else {
      setTasks(prev =>
        prev.map(t => t.id === id ? { ...t, title: v, updatedAt: nowIso } : t)
      );
    }
  };


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
  const containerRef = useRef(null);
  const isInteractingWithControls = useRef(false);

  useEffect(() => {
    if (!isInputFocused) return;

    const onDocPointerDown = (e) => {
      if (inputRef.current && inputRef.current.contains(e.target)) return;
      if (containerRef.current && containerRef.current.contains(e.target)) return;

      setIsInputFocused(false);
    };

    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [isInputFocused]);

  useEffect(() => {
    if (!isInputFocused) {
      setTimePickerOpen(false);
      setCalendarOpen(false);
    }
  }, [isInputFocused]);

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const timePickerAnchorRef = useRef(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => new Date());


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
      title: "Mark this task complete",
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
      title: "Reorder tasks by dragging",
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
      title: "Edit a task title by clicking on it",
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
      title: "Open the settings menu",
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

  const defaultCompletedTasks = [
    {
      id: "5",
      title: "Drag and drop this in active tasks",
      createdAt: nowDefault.toISOString(),
      updatedAt: nowDefault.toISOString(),
      due: {
        originalInput: "today 6pm",
        parsedDate: daysFromNow(3, 16),
      },
      completed: true,
      focused: true,
      deleted: false,
    },
  ];


  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : defaultTasks;
  });

  const [completedTasks, setCompletedTasks] = useState(() => {
    const savedTasks = localStorage.getItem("completedTasks");
    return savedTasks ? JSON.parse(savedTasks) : defaultCompletedTasks;
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
  }, [completedTasks]);

  useHotkeys('a', (e) => {
    e.preventDefault();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  });

  useHotkeys(
    'esc',
    () => {
      const noPopups = !calendarOpen && !timePickerOpen && !headerMenuOpen
      if (timePickerOpen) setTimePickerOpen(false)
      if (calendarOpen) setCalendarOpen(false)
      if (headerMenuOpen) setHeaderMenuOpen(false)
      if (noPopups) {
        setIsInputFocused(false)
        inputRef.current?.blur()
      }
      window.dispatchEvent(new CustomEvent(CLOSE_ALL_EVENT, { detail: null }))
    },
    { enableOnTags: ['*'], keydown: true }
  )



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

  const [multiDragging, setMultiDragging] = useState([]);
  const [multiOffsets, setMultiOffsets] = useState({});

  const multiPointerOffsetYRef = useRef(0);

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
    const activeId = event.active.id;
    setActiveId(activeId);
    setIsDragging(true);

    const selectedEls = Array.from(
      document.querySelectorAll(".task-item.selectable.selected")
    );

    let group = selectedEls
      .map(el => el.getAttribute("data-id"))
      .filter(Boolean);

    if (!group.length || !group.includes(activeId)) group = [activeId];

    group = group.filter(id => document.querySelector(`[data-id="${id}"]`));

    const rects = {};
    group.forEach(id => {
      const el = document.querySelector(`[data-id="${id}"]`);
      if (!el) return;
      rects[id] = el.getBoundingClientRect();
    });

    const baseRect = rects[activeId] || Object.values(rects)[0];
    if (!baseRect) {
      setMultiDragging([]);
      setMultiOffsets({});
      multiPointerOffsetYRef.current = 0;
      return;
    }

    const tops = Object.values(rects).map(r => r.top);
    const bottoms = Object.values(rects).map(r => r.bottom);
    const groupTop = Math.min(...tops);
    const groupBottom = Math.max(...bottoms);
    const groupCenter = (groupTop + groupBottom) / 2;
    const activeCenter = (baseRect.top + baseRect.bottom) / 2;

    multiPointerOffsetYRef.current = groupCenter - activeCenter;

    const offsets = {};
    Object.entries(rects).forEach(([id, r]) => {
      offsets[id] = {
        x: r.left - baseRect.left,
        y: r.top - baseRect.top,
      };
    });

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setHiddenIds(group);

    setMultiDragging(group);
    setMultiOffsets(offsets);
  }



  const reorderBlockByStart = (ids, groupIds, desiredStart) => {
    const N = ids.length;
    const groupSet = new Set(groupIds);
    const group = ids.filter(id => groupSet.has(id));
    const g = group.length;
    if (!g) return ids;

    let start = desiredStart;
    if (start < 0) start = 0;
    if (start > N - g) start = N - g;

    const others = ids.filter(id => !groupSet.has(id));
    const res = [];
    let gi = 0;
    let oi = 0;

    for (let pos = 0; pos < N; pos++) {
      if (pos >= start && pos < start + g) {
        res.push(group[gi++]);
      } else {
        res.push(others[oi++]);
      }
    }
    return res;
  };


  const reorderMultiTasks = (list, rawGroupIds, activeId, overId) => {
    const ids = list.map(t => t.id);
    if (!ids.includes(activeId) || !ids.includes(overId)) return list;

    let groupIds = rawGroupIds.filter(id => ids.includes(id));
    if (!groupIds.length) groupIds = [activeId];

    const groupSet = new Set(groupIds);
    if (groupSet.has(overId)) return list;

    const N = ids.length;
    const idxs = ids
      .map((id, i) => (groupSet.has(id) ? i : -1))
      .filter(i => i !== -1);

    const first = Math.min(...idxs);
    const last = Math.max(...idxs);
    const overIndex = ids.indexOf(overId);
    const g = groupIds.length;

    let desiredStart;
    if (g === 1) {
      desiredStart = overIndex;
    } else {
      if (overIndex > last) {
        desiredStart = overIndex - g + 1;
      } else if (overIndex < first) {
        desiredStart = overIndex;
      } else {
        desiredStart = overIndex;
      }
    }

    const newIds = reorderBlockByStart(ids, groupIds, desiredStart);
    const idToTask = new Map(list.map(t => [t.id, t]));
    return newIds.map(id => idToTask.get(id));
  };

  const resetDragState = () => {
    setActiveId(null);
    setIsDragging(false);
    setMultiDragging([]);
    setMultiOffsets({});
    multiPointerOffsetYRef.current = 0;
  };

  const [hiddenIds, setHiddenIds] = useState([]);
  const hideTimeoutRef = useRef(null);

  const DROP_MS = 260;


  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over) {
      const idsToHide = multiDragging.length ? multiDragging : [active.id];

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      setHiddenIds(idsToHide);

      hideTimeoutRef.current = setTimeout(() => {
        setHiddenIds([]);
        hideTimeoutRef.current = null;
        resetDragState();
      }, DROP_MS);

      return;
    }

    const activeId = active.id;
    const overId = over.id;
    const groupIds = multiDragging.length ? multiDragging : [activeId];

    const isActiveInTasks = tasks.some(t => t.id === activeId);
    const isOverInTasks = tasks.some(t => t.id === overId);
    const isActiveInCompleted = completedTasks.some(t => t.id === activeId);
    const isOverInCompleted = completedTasks.some(t => t.id === overId);

    if (isActiveInTasks && isOverInTasks) {
      setTasks(prev => reorderMultiTasks(prev, groupIds, activeId, overId));
    } else if (isActiveInCompleted && isOverInCompleted) {
      setCompletedTasks(prev => reorderMultiTasks(prev, groupIds, activeId, overId));
    } else if (isActiveInTasks && isOverInCompleted) {
      const sourceIds = new Set(
        groupIds.filter(id => tasks.some(t => t.id === id))
      );
      if (sourceIds.size) {
        const moved = tasks
          .filter(t => sourceIds.has(t.id))
          .map(t => ({ ...t, completed: true }));
        const remaining = tasks.filter(t => !sourceIds.has(t.id));
        setTasks(remaining);
        setCompletedTasks(prev => [...moved, ...prev]);
        setIsCompletedTasksOpen(true);
      }
    } else if (isActiveInCompleted && isOverInTasks) {
      const sourceIds = new Set(
        groupIds.filter(id => completedTasks.some(t => t.id === id))
      );
      if (sourceIds.size) {
        const moved = completedTasks
          .filter(t => sourceIds.has(t.id))
          .map(t => ({ ...t, completed: false }));
        const remaining = completedTasks.filter(t => !sourceIds.has(t.id));
        setCompletedTasks(remaining);
        setTasks(prev => [...prev, ...moved]);
      }
    }

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setHiddenIds(groupIds);

    hideTimeoutRef.current = setTimeout(() => {
      setHiddenIds([]);
      hideTimeoutRef.current = null;
    }, DROP_MS);

    resetDragState();
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
      }, 550);
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
  const activeBufRef = React.useRef('a');
  const clearTimerRef = React.useRef(null);
  const FADE_MS = 420;

  const moodColorMap = {
    warning: 'rgba(247, 236, 80, 0.04)',
    error: 'rgba(247,  74, 65, 0.035)',
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
    const active = activeBufRef.current === 'a' ? bufA : bufB;
    const idle = activeBufRef.current === 'a' ? bufB : bufA;

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
    if (cls.includes('task-date-error')) return 'error';
    if (cls.includes('task-date-warning')) return 'warning';
    if (cls.includes('task-date-accent')) return 'success';
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
  const month = now.toLocaleString('en-US', { month: 'short' });
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


  const [nlDate, setNlDate] = useState(null);
  const [nlLabel, setNlLabel] = useState("");

  const [manualTimeSet, setManualTimeSet] = useState(false);
  const [manualDateSet, setManualDateSet] = useState(false);

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!headerMenuOpen) return;

    const onDocPointerDown = (e) => {
      if (!headerMenuRef.current) return;
      if (!headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [headerMenuOpen]);



  const liveParseNatural = (raw) => {
    const results = chrono.parse(raw);

    if (!results.length) {
      if (!manualDateSet) setNlDate(null);
      if (!manualTimeSet) setSelectedTime(null);
      setNlLabel("");
      return;
    }

    const r = results[0];
    const dateObj = r.start.date();

    if (!manualDateSet) {
      setSelectedDate(dateObj);
    }
    if (!manualTimeSet) {
      setSelectedTime(
        dayjs().hour(dateObj.getHours()).minute(dateObj.getMinutes())
      );
    }

    setNlDate(dateObj);
    setNlLabel(dayjs(dateObj).format("ddd, DD MMM · HH:mm"));
  };



  useEffect(() => {
    if (!inputRef.current) return;

    const updatePadding = () => {
      const right = document.querySelector(".task-input-right");
      if (!right) return;

      const w = right.getBoundingClientRect().width;
      inputRef.current.style.paddingRight = `${w + 20}px`;
    };

    updatePadding();

    const ro = new ResizeObserver(updatePadding);
    const right = document.querySelector(".task-input-right");
    if (right) ro.observe(right);

    return () => ro.disconnect();
  }, [isInputFocused, selectedTime, selectedDate, timePickerOpen, calendarOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const collisionDetection = useCallback(
    (args) => {
      const { active, pointerCoordinates } = args;

      if (
        !pointerCoordinates ||
        multiDragging.length <= 1 ||
        !multiDragging.includes(active.id) ||
        !multiPointerOffsetYRef.current
      ) {
        return pointerWithin(args);
      }

      const shiftedArgs = {
        ...args,
        pointerCoordinates: {
          x: pointerCoordinates.x,
          y: pointerCoordinates.y + multiPointerOffsetYRef.current,
        },
      };

      return pointerWithin(shiftedArgs);
    },
    [multiDragging]
  );

  const handleTaskDateChange = (id, fromCompleted, pickedDate) => {
    const mergeDate = t => {
      const base = t?.due?.parsedDate ? new Date(t.due.parsedDate) : new Date();
      const d = new Date(pickedDate);
      d.setHours(
        base.getHours(),
        base.getMinutes(),
        base.getSeconds(),
        base.getMilliseconds()
      );
      return {
        ...t,
        due: { ...t.due, parsedDate: d.toISOString() },
        updatedAt: new Date().toISOString(),
      };
    };

    if (fromCompleted) {
      setCompletedTasks(prev =>
        prev.map(t => (t.id === id ? mergeDate(t) : t))
      );
    } else {
      setTasks(prev =>
        prev.map(t => (t.id === id ? mergeDate(t) : t))
      );
    }
  };


  return (
    <div className="tasks-container">
      <div className="tasks-subcontainer">
        <div className="tasks-header">
          <div className="tasks-header-text">
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="title-container"
            >
              {getIcon()}
              <p className="title">{getGreeting()}</p>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="information"
            >
              It's {new Date().toLocaleString("en-US", { month: "short" })}{" "}
              {new Date().getDate()}. You have {tasks.length} remaining tasks,{" "}
              <span className={todaysCount > 0 ? "today-count active" : "today-count"}>
                {todaysCount} today
              </span>
              .
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="header-dots-container"
            ref={headerMenuRef}
            onPointerDownCapture={(e) => { e.stopPropagation(); }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => { e.stopPropagation(); }}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={() => {
              setTimeout(() => {
                setHeaderMenuOpen((prev) => !prev);
              }, 35);
            }}
          >
            <span className="header-dots" role="button" tabIndex={0} aria-label="Header actions">
              <Dots />
            </span>

            <AnimatePresence initial={false} mode="wait">
              {headerMenuOpen && (
                <motion.div
                  key="menu"
                  className="header-dots-dropdown"
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
                    <div className="dropdown-section-title theme">Theme</div>

                    <div className="theme-options-row">
                      <motion.button
                        className="theme-option"
                        role="menuitem"
                        variants={menuItem}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTheme("system")}
                      >
                        {theme === "system" && (
                          <motion.div
                            className="theme-selection-bg"
                            layoutId="theme-selection"
                            transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                          />
                        )}
                        <span className={`theme-option-content${theme === "system" ? " selected" : ""}`}>
                          <SystemTheme className="theme-option-icon" /> System
                        </span>
                      </motion.button>

                      <motion.button
                        className="theme-option"
                        role="menuitem"
                        variants={menuItem}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTheme("dark")}
                      >
                        {theme === "dark" && (
                          <motion.div
                            className="theme-selection-bg"
                            layoutId="theme-selection"
                            transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                          />
                        )}
                        <span className={`theme-option-content${theme === "dark" ? " selected" : ""}`}>
                          <MoonTheme className="theme-option-icon" /> Dark
                        </span>
                      </motion.button>

                      <motion.button
                        className="theme-option"
                        role="menuitem"
                        variants={menuItem}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTheme("light")}
                      >
                        {theme === "light" && (
                          <motion.div
                            className="theme-selection-bg"
                            layoutId="theme-selection"
                            transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                          />
                        )}
                        <span className={`theme-option-content${theme === "light" ? " selected" : ""}`}>
                          <SunTheme className="theme-option-icon" /> Light
                        </span>
                      </motion.button>
                    </div>

                    <div className="dropdown-section-title">Tasks</div>

                    <motion.button
                      className="dots-option header tasks disabled"
                      role="menuitem"
                      variants={menuItem}
                      whileHover={{ x: 1.5, scale: 1.004 }}
                      whileTap={{ scale: 0.992 }}
                    >
                      <DownloadTasks className="dots-option-icon header disabled" /> Download tasks
                    </motion.button>

                    <motion.button
                      className="dots-option header tasks disabled"
                      role="menuitem"
                      variants={menuItem}
                      whileHover={{ x: 1.5, scale: 1.004 }}
                      whileTap={{ scale: 0.992 }}
                    >
                      <ImportTasks className="dots-option-icon header disabled" /> Import tasks
                    </motion.button>

                    <div className="dropdown-divider"></div>

                    <motion.button
                      className="dots-option header disabled"
                      role="menuitem"
                      variants={menuItem}
                      whileHover={{ x: 1.5, scale: 1.004 }}
                      whileTap={{ scale: 0.992 }}
                    >
                      <Changelog className="dots-option-icon header disabled" /> Changelog
                    </motion.button>

                    <motion.button
                      className="dots-option header"
                      role="menuitem"
                      variants={menuItem}
                      whileHover={{ x: 1.5, scale: 1.004 }}
                      whileTap={{ scale: 0.992 }}
                      onClick={() => nav("/privacy-policy")}
                    >
                      <PrivacyPolicy className="dots-option-icon header" /> Privacy policy
                    </motion.button>

                    <motion.button
                      className="dots-option header"
                      role="menuitem"
                      variants={menuItem}
                      whileHover={{ x: 1.5, scale: 1.004 }}
                      whileTap={{ scale: 0.992 }}
                      onClick={() => nav("/about")}
                    >
                      <About className="dots-option-icon header" /> About
                    </motion.button>

                    <motion.button
                      className="dots-option header twitter"
                      role="menuitem"
                      variants={menuItem}
                      whileHover={{ x: 1.5, scale: 1.004 }}
                      whileTap={{ scale: 0.992 }}
                      onClick={() => window.open('https://x.com/FoxerHQ', '_blank')}
                    >
                      <Twitter className="dots-option-icon header twitter" /> Follow us on X
                    </motion.button>

                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>


          </motion.div>
        </div>
        <motion.div
          className="task-input-container"
          ref={containerRef}
        >
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
                <span className="drag-handle-icon lite"><Drag /></span>
                <div className="check-square lite" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.input
            ref={inputRef}
            placeholder="Create a new task..."
            className="task-add-input"
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              setTimeout(() => {
                if (isInteractingWithControls.current) return;
                setIsInputFocused(false);
              }, 100);
            }}
            animate={isInputFocused ? 'focused' : 'idle'}
            transition={{ duration: 0.22, ease: [0.25, 0.8, 0.3, 1] }}
            onChange={(e) => {
              const v = e.target.value;
              if (!v.trim()) {
                setManualTimeSet(false);
                setManualDateSet(false);
              }
              liveParseNatural(v);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = _.trim(inputRef.current?.value)
                if (val) {
                  addTask(val)
                  setIsInputFocused(false)
                  inputRef.current?.blur()
                  setTimePickerOpen(false)
                  setCalendarOpen(false)
                }
              }

              if (e.key === 'Escape') {
                const noPopups = !calendarOpen && !timePickerOpen
                if (noPopups) {
                  inputRef.current?.blur()
                  setIsInputFocused(false)
                }

                if (timePickerOpen) setTimePickerOpen(false)
                if (calendarOpen) setCalendarOpen(false)
              }
            }}
          />


          <div
            className="task-input-right"
            onMouseDown={(e) => {
              e.preventDefault();
              isInteractingWithControls.current = true;
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              isInteractingWithControls.current = true;
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              isInteractingWithControls.current = true;
              setTimeout(() => { isInteractingWithControls.current = false; }, 500);
            }}
          >

            <AnimatePresence initial={false} mode="wait">
              {!isInputFocused ? (
                <motion.div
                  key="kbd"
                  className="task-add-tooltip"
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.8, 0.3, 1] }}
                >
                  A
                </motion.div>

              ) : (
                <div className="task-center">
                  <motion.div
                    layout
                    key="clock"
                    className={`task-date-chip task-clock-chip ${selectedTime ? "expanded" : ""}`}
                    initial={{ opacity: 0, y: 6, x: 4 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -6, x: 4 }}
                    transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.7 }}
                    ref={timePickerAnchorRef}
                    onPointerDownCapture={(e) => { e.stopPropagation(); }}
                    onClick={e => {
                      e.stopPropagation()
                      if (calendarOpen) setCalendarOpen(false)
                      setTimePickerOpen(s => !s)
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
                    <AnimatePresence mode="wait" initial={false}>
                      {selectedTime && (
                        <motion.span
                          key={selectedTime.format("HH:mm")}
                          className="chip-time-label"
                          initial={{ opacity: 0, y: 6, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.92 }}
                          transition={{ delay: 0.1, duration: 0.22, ease: [0.25, 0.8, 0.3, 1] }}
                        >
                          {selectedTime.format("h:mm A")}
                        </motion.span>
                      )}
                    </AnimatePresence>


                    <AnimatePresence>
                      {timePickerOpen && (
                        <motion.div
                          key="custom-time-picker"
                          className="time-picker-dropdown"
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96, }}
                          transition={{ delay: 0.1, duration: 0.3, ease: [0.25, 0.8, 0.3, 1] }}
                          style={{
                            position: "absolute",
                            top: timePickerAnchorRef.current?.offsetTop + 42 || 0,
                            right: -1.5,
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
                                  setManualTimeSet(true);
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
                    layout
                    className="task-date-chip"
                    initial={{ opacity: 0, y: 6, x: 4 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -6, x: 4, }}
                    transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.7 }}
                    onClick={e => {
                      e.stopPropagation()
                      if (timePickerOpen) setTimePickerOpen(false)
                      setCalendarOpen(s => !s)
                    }}

                    ref={calendarAnchorRef}
                    onPointerDownCapture={(e) => { e.stopPropagation(); }}
                    role="button"
                    aria-haspopup="dialog"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: 8, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 8, scale: 0.96 }}
                      transition={{ delay: 0.15, duration: 0.2, ease: [0.25, 0.8, 0.3, 1] }}
                    >
                      <Calendar className="chip-ico calendar-ico" />
                    </motion.div>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={selectedDate ? selectedDate.toISOString().slice(0, 10) : "none"}
                        className="task-date-chip-text"
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.92 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.8, 0.3, 1] }}
                      >
                        {selectedDate
                          ? selectedDate.toLocaleDateString("en-US", { day: "numeric", month: "short" })
                          : dateLabel}
                      </motion.div>
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
                          right: -1.5,
                          zIndex: 3000,
                          transformOrigin: "top right",
                          willChange: "transform, opacity"
                        }}
                        onClick={e => e.stopPropagation()}
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
                                      setManualDateSet(true);
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
        </motion.div>


        <MotionConfig transition={{ layout: isDragging ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 50 } }}>
          <LayoutGroup id="lists" layout>
            <DndContext
              collisionDetection={collisionDetection}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              sensors={sensors}
            >



              <DroppableContainer id="tasks">
                <SortableContext
                  items={tasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="tasks-list-container">
                    {tasks.length === 0 ? (
                      <div
                        className="empty-state"
                      >
                        <Logo className="empty-state-logo" />
                        <p className="empty-state-text">No tasks remaining</p>
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {tasks.map((task) => {
                          const { time, date } = formatTaskDate(task.due.parsedDate);
                          const dateClass = getTaskDateClass(task);
                          const timeClass = getTaskTimeClass(task);
                          const isGroupDragging = isDragging && multiDragging.includes(task.id);
                          const isBaseHidden = hiddenIds.includes(task.id);
                          const draggedCount = multiDragging.length || 1;

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
                              onTitleCommit={(title) => handleTitleCommit(task.id, title, false)}
                              onDateChange={(newDate) => handleTaskDateChange(task.id, false, newDate)}
                              isDraggingGlobal={isDragging}
                              isDeleting={deletingIds.includes(task.id)}
                              isGroupDragging={isGroupDragging}
                              isBaseHidden={isBaseHidden}
                              draggedCount={draggedCount}
                            />
                          );
                        })}


                      </AnimatePresence>
                    )}

                  </div>
                </SortableContext>
              </DroppableContainer>


              <div className="completed-tasks-list" ref={completedRef}>
                <div className="completed-tasks-header">
                  <div
                    className={`completed-tasks-line ${isCompletedTasksOpen
                      ? "line-expand"
                      : "line-hidden"
                      }`}
                  ></div>
                  <p className="completed-tasks-title" onClick={toggleCompletedTasks}>
                    Completed ({completedTasks.length})
                  </p>
                  <div
                    className={`completed-tasks-line ${isCompletedTasksOpen
                      ? "line-expand"
                      : "line-hidden"
                      }`}
                  ></div>
                </div>
                <AnimatePresence>
                  {isCompletedTasksOpen && (
                    <motion.div
                      style={{ width: "100%" }}
                      initial={{ opacity: 0, y: 8, scale: 0.995, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 8, scale: 0.995, filter: "blur(8px)" }}
                      transition={{ duration: 0.6, ease: [0.25, 0.8, 0.3, 1] }}
                    >
                      {completedTasks.length === 0 ? (
                        <motion.div initial={{ scale: 0.995, opacity: 0, filter: "blur(8px)" }} animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }} exit={{ scale: 0.995, opacity: 0, filter: "blur(8px)" }} transition={{ duration: 0.5, ease: [0.25, 0.8, 0.3, 1] }} className="empty-state">
                          <Logo className="empty-state-logo" />
                          <p className="empty-state-text">No completed tasks</p>
                        </motion.div>
                      ) : (
                        <DroppableContainer id="completedTasks">
                          <SortableContext
                            items={completedTasks.map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="tasks-list-container">
                              {completedTasks.map(task => {
                                const { time, date } = formatTaskDate(task.due.parsedDate);
                                const isGroupDragging = isDragging && multiDragging.includes(task.id);
                                const isBaseHidden = hiddenIds.includes(task.id);
                                const draggedCount = multiDragging.length || 1;

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
                                    onTitleCommit={(title) => handleTitleCommit(task.id, title, true)}
                                    onDateChange={(newDate) => handleTaskDateChange(task.id, true, newDate)}
                                    isDraggingGlobal={isDragging}
                                    isDeleting={deletingIds.includes(task.id)}
                                    isGroupDragging={isGroupDragging}
                                    isBaseHidden={isBaseHidden}
                                    draggedCount={draggedCount}
                                  />
                                );
                              })}




                            </div>
                          </SortableContext>
                        </DroppableContainer>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>


                <DragOverlay >
                  {multiDragging.length > 1 && activeId ? (
                    <div style={{ position: "relative" }}>
                      {multiDragging.map(id => {
                        const taskObj =
                          tasks.find(t => t.id === id) ||
                          completedTasks.find(t => t.id === id);
                        if (!taskObj) return null;

                        const { x = 0, y = 0 } = multiOffsets[id] || {};
                        const { time, date } = formatTaskDate(taskObj.due?.parsedDate);
                        const dateClass = getTaskDateClass(taskObj);
                        const timeClass = getTaskTimeClass(taskObj);

                        return (
                          <div
                            key={id}
                            style={{
                              position: "absolute",
                              transform: `translate(${x}px, ${y}px)`,
                              width: "100%",
                            }}
                          >
                            <SortableTaskItem
                              task={taskObj}
                              time={time}
                              date={date}
                              dateClass={dateClass}
                              timeClass={timeClass}
                              onCheck={() => { }}
                              isOverlay
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : activeId ? (
                    (() => {
                      const activeTask =
                        tasks.find(t => t.id === activeId) ||
                        completedTasks.find(t => t.id === activeId);
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
                          onCheck={() => { }}
                          isOverlay
                        />
                      );
                    })()
                  ) : null}
                </DragOverlay>



              </div>
            </DndContext>
          </LayoutGroup>
        </MotionConfig>
      </div >
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


    </div >
  );
};

export default Tasks;