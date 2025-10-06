import React from "react";

const Progress: React.FC = () => {
  return (
    <>
<section id="progress" className="pgrs">

    <div className="parMaxwid">
      <div>
      <h2 style={{ textAlign: "center", marginBottom: "0rem", fontSize: "2.5rem" }}> Progress </h2>
    </div>
    <div className="MaxWid">
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color done"></div>
          <span style={{color:"white"}}>Done</span>
        </div>
        <div className="legend-item">
          <div className="legend-color in-progress"></div>
          <span style={{color:"white"}}>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-color upcoming"></div>
          <span style={{color:"white"}}>Upcoming</span>
        </div>
        <div className="legend-item">
          <div className="legend-color milestone"></div>
          <span style={{color:"white"}}>Milestones</span>
        </div>
      </div>

      <div className="gantt-container">
        <div className="gantt-header">
          <div className="header-cell">Task</div>
          <div className="header-cell">Aug 11</div>
          <div className="header-cell">Aug 18</div>
          <div className="header-cell">Aug 25</div>
          <div className="header-cell">Sep 1</div>
          <div className="header-cell">Sep 8</div>
          <div className="header-cell">Sep 15</div>
          <div className="header-cell">Sep 22</div>
          <div className="header-cell">Sep 29</div>
          <div className="header-cell">Oct 6</div>
        </div>

        <div className="gantt-row">
          <div className="task-cell">
            <div className="task-name">Literature Review & Setup</div>
            <div className="task-dates">Aug 5 - Aug 7 (Phase 1)</div>
          </div>
          <div className="timeline-cell">
            <div className="status-bar done">
              <span className="checkmark">✓</span> Done
            </div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
        </div>

        <div className="gantt-row">
          <div className="task-cell">
            <div className="task-name">Building SUMO Environment & Simulation</div>
            <div className="task-dates">Aug 8 - Aug 10 (Phase 2)</div>
          </div>
          <div className="timeline-cell">
            <div className="status-bar done">
              <span className="checkmark">✓</span> Done
            </div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
        </div>

        <div className="gantt-row">
          <div className="task-cell">
            <div className="task-name">Model Training & Tuning</div>
            <div className="task-dates">Aug 12 - Sep 13 (3 Weeks)</div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell">
            <div className="status-bar in-progress">In Progress</div>
          </div>
          <div className="timeline-cell">
            <div className="status-bar in-progress">In Progress</div>
          </div>
          <div className="timeline-cell">
            <div className="status-bar in-progress">In Progress</div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
        </div>

        <div className="gantt-row">
          <div className="task-cell">
            <div className="task-name">Frontend Development</div>
            <div className="task-dates">Aug 20 - Sep 10 (3 Weeks)</div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell">
            <div className="status-bar in-progress">In Progress</div>
          </div>
          <div className="timeline-cell">
            <div className="status-bar in-progress">In Progress</div>
          </div>
          {/* <div className="timeline-cell">
            <div className="status-bar in-progress">In Progress</div>
          </div> */}
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
        </div>

        <div className="gantt-row">
          <div className="task-cell">
            <div className="task-name">Performance Evaluation</div>
            <div className="task-dates">Sep 2 - Sep 15 (2 Weeks)</div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell">
            <div className="status-bar upcoming">Upcoming</div>
          </div>
          <div className="timeline-cell">
            <div className="status-bar upcoming">Upcoming</div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
        </div>

        <div className="gantt-row">
          <div className="task-cell">
            <div className="task-name">Final Report Writing</div>
            <div className="task-dates">Sep 9 - Sep 22 (2 Weeks)</div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell">
            <div className="status-bar upcoming">Upcoming</div>
          </div>
          <div className="timeline-cell">
            <div className="status-bar upcoming">Upcoming</div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
        </div>

        <div className="gantt-row">
          <div className="task-cell">
            <div className="task-name">Final Presentation Prep</div>
            <div className="task-dates">Sep 16 - Sep 25 (1.5 Weeks)</div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell">
            <div className="status-bar upcoming">Upcoming</div>
          </div>
          <div className="timeline-cell">
            <div className="status-bar upcoming">Upcoming</div>
          </div>
          <div className="timeline-cell"></div>
        </div>

        <div className="gantt-row">
          <div className="task-cell">
            <div className="task-name">Key Milestones</div>
            <div className="task-dates"></div>
          </div>
          <div className="timeline-cell">
            <div className="status-bar milestone">Phase 1&2</div>
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell">
            {/* <div className="status-bar milestone">Training</div> */}
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell">
            {/* <div className="status-bar milestone">Eval</div> */}
          </div>
          <div className="timeline-cell"></div>
          <div className="timeline-cell">
            {/* <div className="status-bar milestone">Final</div> */}
          </div>
          <div className="timeline-cell"></div>
        </div>

        <div className="status-info">
          <strong>Project Status:</strong> Phase 1 (Literature Review) & Phase 2 (SUMO Environment) completed (Aug 10, 2025) • Model Training & Frontend Development in progress
          <br />
          <strong>Total Duration:</strong> ~6.5 weeks • <strong>Completion Target:</strong> September 25, 2025
        </div>
      </div></div></div>
        </section>

    </>

  );
};

export default Progress;
