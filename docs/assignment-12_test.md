## 3.3
- **Postponed Frontend Development:**
  - **Decision:** Shifted focus entirely to Backend API completeness and extensive testing (Unit, BDD, Load).
  - **Reason:** Ensuring a robust, testable core architecture was prioritized over UI implementation within the limited time frame.

- **Simplified Notifications:**
  - **Decision:** Implemented as API endpoints (polling model) instead of real-time push (WebSockets).
  - **Reason:** Reduced complexity to ensure stable delivery of the core logic and notification storage.

- **Dropped PDF Export:**
  - **Decision:** Only ICS (Calendar) export was implemented; PDF export was dropped.
  - **Reason:** ICS offers higher utility for students to integrate tasks into their existing digital calendars compared to static PDF files.

  ## 3.4
  - **Design Principles (KISS):** 
    - The *planned* UI prioritizes strict minimalism to reduce cognitive load.
    - "Less is More": Only essential actions (Create, Complete) will be prominent.
- **Accessibility:** 
    - Planned compliance with WCAG 2.1 AA.
    - Focus on semantic HTML and keyboard navigability.
- **User Flow:** 
    - **Streamlined Actions:** Minimizing clicks for frequent tasks to allow quick entry/updates.
    - **Intuitive Navigation:** Flat hierarchy to avoid deep nesting of menus.
- **Responsiveness (Planned):** 
    - **Flexible Layout:** The design concept ensures usability on both small (mobile) and large (desktop) screens, ensuring students can access the tool anywhere.

  ## 4.2 
    - **Technical Challenges:**
    - **Dockerized Testing:** Configuring Jest and Cucumber to communicate reliably with the containerized PostgreSQL database (handling connection timing and networking).
    - **Type Safety w/ Raw SQL:** Manually maintaining TypeScript interfaces to match `schema.sql` entities without the safety net of an ORM.
    - **Test Data Isolation:** Ensuring strict cleanup between BDD scenarios so that data from one test didn't cause failures in another.
    - **Organizational Challenges:**
    - **Scheduling & Coordination:** With 5 members balancing different jobs, university timetables, and personal lives, finding common synchronous meeting times was extremely difficult, slowing down decision-making.