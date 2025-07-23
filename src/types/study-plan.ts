export interface Task {
  title: string;
  description?: string;
  timeSpent?: number; // in seconds
  timerDuration?: number; // in minutes
}

export interface Day {
  day: number;
  title: string;
  tasks: Task[];
}

export interface Week {
  week: number;
  title:string;
  days: Day[];
}

export interface SubjectBackground {
    type: 'color' | 'image';
    value: string; // hex code for color, data URL for image
}
