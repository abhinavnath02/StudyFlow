# **App Name**: StudyFlow

## Core Features:

- JSON Upload and Parsing: Enable users to upload a .json file containing their study plan in a defined hierarchical structure.
- Dynamic Checklist Display: Display the study plan as a dynamically generated, interactive checklist, with collapsible weekly sections and task lists within days.
- Real-time Progress Tracking: Track and visualize the user's progress with overall and weekly progress bars, updating in real-time as tasks are completed.
- Data Persistence with localStorage: Use localStorage to persist the state of the checklist, allowing users to resume their progress upon returning to the application.
- Progress Reset Functionality: Provide a "Reset Progress" button to clear the local storage and upload a new plan.

## Style Guidelines:

- Primary color: Indigo (#667EEA) for a calm, focused feel, conducive to studying.
- Background color: Dark gray (#2D3748) to create a dark mode experience, reducing eye strain during long study sessions. Desaturated hue of the primary color.
- Accent color: Teal (#4FD1C5) for interactive elements and progress indicators, providing visual contrast. 
- Font pairing: 'Space Grotesk' (sans-serif) for headlines, 'Inter' (sans-serif) for body text
- Use simple, geometric icons for weeks and days, aligning with the clean, modern aesthetic. Consider using open source libraries such as Font Awesome.
- Employ a clean, responsive layout with clear visual hierarchy to organize study tasks effectively. Utilize Tailwind CSS grid and flexbox utilities.
- Implement smooth transitions for weekly section expansion/collapse and progress bar updates, providing subtle visual feedback and a polished user experience.