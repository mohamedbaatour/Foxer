import React from 'react';
import './tasks.css';

const Tasks = () => {
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

    return (
      <div className="tasks-container">
        <div className="tasks-header">
          <p className="greeting">{getGreeting()}, Alex</p>
          <p className="information">
            It's July 22. You have 6 tasks in total, 1 today.
          </p>
        </div>
        <input
          placeholder="Create a new task..."
          className="task-add-input"
        ></input>
      </div>
    );
}

export default Tasks;