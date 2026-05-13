# prd.md

# Design

Create the general design of the application
-The main page is the dashboard
--The following pages are all additional pages in no particular order
-A Calendar page
-A Tasks page
-A Reminders page
-A profile page
-A Login page
--Each page is accesible from any page but when you first log into a new session it is always on the dashboard except the login page

# The Dashboard Page

-Shows the current date prominently on load
-Displays all events scheduled for today in chronological order
-Displays tasks that are overdue or due today
-Displays reminders due today that have not been marked done
-A button triggers an AI-generated "your day ahead" summary via the Claude API, incorporating the day's events, tasks, and reminders — not auto-loaded on page visit

# The Calendar Page

-When loading in shows the month with the current day highlighted

-Supports month, week, and day views — user can switch between them

-Has a "Create an event" button

-Existing events can be seen on the calendar

-Events and tasks with a due date/time will appear at their respective times

-Reminders with a scheduled time will appear on the calendar

-Events, tasks, and reminds will all have different colors on the calendar

# The Tasks Page

-Tasks appear in two sections, incomplete and complete

-Tasks in the incomplete section in order of soonest upcoming to further out

-Has a "Task creation button"

-Has a backlog section for tasks created without a due date

# Reminders Page

-Displays a list of active reminds with their scheduled times

-Has a create reminders page

-Has sections for categories of reminders

# Login Page

-when users first open the app they are greeted with a login page.

-Users can sign in or create and account on this page

-This page is not accessible once signed in unless you sign out

# Functionality

-the purpose of this app is A personal OS with four integrated domains: a week-view calendar, a task manager, a reminders list, and a dashboard with an AI daily briefing powered by the Claude API.

-Stack: React (Vite + TypeScript + Tailwind) + Node.js/Express + PostgreSQL/Prisma + Railway.

-Multi-user and data persistence are baseline requirements across all pages. Every piece of data — events, tasks, reminders, profile — belongs to the authenticated user who created it. Users cannot see or modify each other's data. All data persists across logout/login: signing out and back in returns the user to the exact same state they left.
