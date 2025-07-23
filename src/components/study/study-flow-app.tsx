"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Week, Day, Task, SubjectBackground } from '@/types/study-plan';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle, Loader2, PlusCircle, Trash2, Edit, Save, X, Palette, ImageUp, ArrowLeft, Timer, Play, Pause, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import Link from 'next/link';
import { getTaskId } from './home-screen';


const PLANS_STORAGE_KEY = 'studyflow-plans';
const PROGRESS_STORAGE_KEY = 'studyflow-progress';
const BACKGROUNDS_STORAGE_KEY = 'studyflow-backgrounds';


export function StudyFlowApp({ subjectName }: { subjectName: string }) {
  const [isMounted, setIsMounted] = useState(false);
  const [studyPlans, setStudyPlans] = useState<Record<string, Week[]>>({});
  const [allProgress, setAllProgress] = useState<Record<string, Record<string, boolean>>>({});
  const [backgrounds, setBackgrounds] = useState<Record<string, SubjectBackground>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const currentSubject = subjectName;
  const studyPlan = currentSubject ? studyPlans[currentSubject] : null;
  const progress = currentSubject ? allProgress[currentSubject] : {};
  const background = currentSubject ? backgrounds[currentSubject] : null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const savedPlans = localStorage.getItem(PLANS_STORAGE_KEY);
        const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
        const savedBackgrounds = localStorage.getItem(BACKGROUNDS_STORAGE_KEY);

        setStudyPlans(savedPlans ? JSON.parse(savedPlans) : {});
        setAllProgress(savedProgress ? JSON.parse(savedProgress) : {});
        setBackgrounds(savedBackgrounds ? JSON.parse(savedBackgrounds) : {});
        
      } catch (error) {
        console.error("Failed to load data from localStorage", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load saved data. It might be corrupted.",
        });
        localStorage.removeItem(PLANS_STORAGE_KEY);
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
        localStorage.removeItem(BACKGROUNDS_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isMounted, toast]);

  useEffect(() => {
    if (isMounted) {
      if (Object.keys(studyPlans).length > 0) {
        localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(studyPlans));
      } else {
        localStorage.removeItem(PLANS_STORAGE_KEY);
      }
      if (Object.keys(allProgress).length > 0) {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(allProgress));
      } else {
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
      }
      if (Object.keys(backgrounds).length > 0) {
        localStorage.setItem(BACKGROUNDS_STORAGE_KEY, JSON.stringify(backgrounds));
      } else {
        localStorage.removeItem(BACKGROUNDS_STORAGE_KEY);
      }
    }
  }, [studyPlans, allProgress, backgrounds, isMounted]);

  
  const handleUpdatePlan = useCallback((subject: string, updatedPlan: Week[]) => {
    setStudyPlans(prev => {
        const newPlans = { ...prev, [subject]: updatedPlan };
        // We need to re-initialize progress in case tasks were added/removed
        const currentProgress = allProgress[subject] || {};
        const newProgressForSubject: Record<string, boolean> = {};
        updatedPlan.forEach((week, weekIdx) => {
          week.days.forEach((day, dayIdx) => {
            day.tasks.forEach((_, taskIdx) => {
              const taskId = getTaskId(subject, weekIdx, dayIdx, taskIdx);
              newProgressForSubject[taskId] = currentProgress[taskId] || false;
            });
          });
        });

        const newProgress = { ...allProgress, [subject]: newProgressForSubject };
        setAllProgress(newProgress);
        return newPlans;
    });
  }, [allProgress]);

  const handleProgressChange = useCallback((taskId: string, isChecked: boolean) => {
    if (currentSubject) {
      setAllProgress(prev => ({
        ...prev,
        [currentSubject]: {
          ...prev[currentSubject],
          [taskId]: isChecked
        }
      }));
    }
  }, [currentSubject]);
  
  const handleBackgroundChange = useCallback((subject: string, bg: SubjectBackground) => {
      setBackgrounds(prev => ({...prev, [subject]: bg}));
  }, []);

  const { totalTasks, completedTasks, overallProgress } = useMemo(() => {
    if (!studyPlan || !progress) return { totalTasks: 0, completedTasks: 0, overallProgress: 0 };
    const total = studyPlan.reduce((acc, week) => acc + week.days.reduce((dAcc, day) => dAcc + day.tasks.length, 0), 0);
    const completed = Object.values(progress).filter(Boolean).length;
    return {
      totalTasks: total,
      completedTasks: completed,
      overallProgress: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [studyPlan, progress]);
  
  const backgroundStyle = useMemo(() => {
    if (!background) return { backgroundColor: 'hsl(var(--background))' };
    if (background.type === 'color') {
      return { backgroundColor: background.value };
    }
    if (background.type === 'image') {
      return { backgroundImage: `url(${background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { backgroundColor: 'hsl(var(--background))' };
  }, [background]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!studyPlan) {
    return (
        <div className="flex h-screen items-center justify-center text-center flex-col gap-4">
            <h2 className="text-2xl font-bold">Oops!</h2>
            <p className="text-muted-foreground">We couldn't find a study plan for "{currentSubject}".</p>
            <Button asChild>
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard</Link>
            </Button>
        </div>
    )
  }

  return (
    <div 
      className="min-h-screen w-full transition-all duration-500"
      style={backgroundStyle}
    >
      <main className="container mx-auto max-w-5xl py-8 px-4">
          <div>
            <Card className="mb-8 bg-card/60 backdrop-blur-md shadow-lg border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className='flex items-center gap-4'>
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                      <CardTitle className="text-2xl font-headline font-semibold">Overall Progress for <span className="text-primary font-bold">{currentSubject}</span></CardTitle>
                      <CardDescription>{completedTasks} of {totalTasks} tasks completed</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <BackgroundPicker subject={currentSubject!} currentBackground={background!} onBackgroundChange={handleBackgroundChange} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={overallProgress} className="h-2 transition-all duration-500" />
                  <span className="font-mono text-base font-semibold text-primary">{Math.round(overallProgress)}%</span>
                </div>
              </CardContent>
            </Card>

            <StudyPlanView 
              plan={studyPlan} 
              progress={progress} 
              onProgressChange={handleProgressChange} 
              subject={currentSubject!}
              onPlanUpdate={handleUpdatePlan}
            />
          </div>
      </main>
    </div>
  );
}

const defaultColors = ['#f3f0e9', '#e6f3e6', '#e6e6f3', '#f3e6e6', '#f3f3e6'];

function BackgroundPicker({ subject, currentBackground, onBackgroundChange }: { subject: string, currentBackground: SubjectBackground, onBackgroundChange: (subject: string, bg: SubjectBackground) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleColorChange = useCallback((color: string) => {
    onBackgroundChange(subject, { type: 'color', value: color });
  }, [onBackgroundChange, subject]);
  
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({ variant: 'destructive', title: 'Image too large', description: 'Please upload an image smaller than 2MB.'});
          return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onBackgroundChange(subject, { type: 'image', value: result });
      };
      reader.readAsDataURL(file);
    }
  }, [onBackgroundChange, subject, toast]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm"><Palette className="mr-2 h-4 w-4"/> Background</Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {defaultColors.map(color => (
              <button 
                key={color} 
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                   currentBackground.type === 'color' && currentBackground.value === color ? 'border-primary' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
           <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
              <ImageUp className="mr-2 h-4 w-4" />
              Upload Image
           </Button>
           <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
        </div>
      </PopoverContent>
    </Popover>
  );
}


function EditableField({ value, onSave, label, className, as }: { value: string, onSave: (newValue: string) => void, label: string, className?: string, as?: 'span' | 'p' | 'div' }) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(value);
    const Comp = as || 'div';

    const handleSave = useCallback(() => {
        onSave(text);
        setIsEditing(false);
    }, [onSave, text]);
    
    useEffect(() => {
        setText(value);
    }, [value]);

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} aria-label={label} className={cn("h-8", className)} onBlur={handleSave} onKeyDown={(e) => {if(e.key === 'Enter') handleSave()}}/>
                <Button size="icon" variant="ghost" onClick={handleSave}><Save className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
            </div>
        );
    }

    return (
        <Comp className={cn("flex items-center gap-2 group", className)} onClick={() => setIsEditing(true)}>
            <span className="flex-grow">{value}</span>
            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 -mr-2">
                <Edit className="h-4 w-4" />
            </Button>
        </Comp>
    );
}

const TaskTimer = React.memo(({ task, onUpdateTask }: {
  task: Task;
  onUpdateTask: (updatedTask: Partial<Task>) => void;
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const timeSpent = task.timeSpent || 0;
  const timerDuration = (task.timerDuration || 0) * 60; // convert to seconds

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        onUpdateTask({ timeSpent: (task.timeSpent || 0) + 1 });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, onUpdateTask, task.timeSpent]);

  const toggleTimer = useCallback(() => setIsRunning(prev => !prev), []);
  
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    onUpdateTask({ timeSpent: 0 });
  }, [onUpdateTask]);
  
  const handleDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(e.target.value, 10);
    onUpdateTask({ timerDuration: isNaN(newDuration) ? undefined : newDuration });
  }, [onUpdateTask]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = timerDuration > 0 ? (timeSpent / timerDuration) : 0;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));


  return (
    <div className='flex items-center justify-between gap-4 mt-2 pt-2 border-t border-border/20'>
      <div className="relative h-12 w-12">
        <svg className="h-full w-full" viewBox="0 0 50 50">
          <circle
            className="text-border/20"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="25"
            cy="25"
          />
          <circle
            className="text-primary"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="25"
            cy="25"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
        <Button variant="ghost" size="icon" className="absolute inset-0 h-full w-full rounded-full" onClick={toggleTimer}>
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>

       <div className='flex flex-col items-end'>
          <span className='font-mono text-xl'>{formatTime(timeSpent)}</span>
          <div className='flex items-center gap-1'>
            <Input 
              type="number"
              placeholder='Mins'
              value={task.timerDuration || ''}
              onChange={handleDurationChange}
              className="h-7 w-16 text-xs text-right"
              aria-label="Timer duration in minutes"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetTimer}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
       </div>
    </div>
  );
});
TaskTimer.displayName = "TaskTimer";


const DayCard = React.memo(({ day, dayIdx, weekIdx, subject, progress, onProgressChange, onUpdateDay, onDeleteDay, onAddTask, onUpdateTask, onDeleteTask }: {
    day: Day;
    dayIdx: number;
    weekIdx: number;
    subject: string;
    progress: Record<string, boolean>;
    onProgressChange: (taskId: string, isChecked: boolean) => void;
    onUpdateDay: (weekIndex: number, dayIndex: number, newTitle: string) => void;
    onDeleteDay: (weekIndex: number, dayIndex: number) => void;
    onAddTask: (weekIndex: number, dayIndex: number) => void;
    onUpdateTask: (weekIndex: number, dayIndex: number, taskIndex: number, updatedTask: Partial<Task>) => void;
    onDeleteTask: (weekIndex: number, dayIndex: number, taskIndex: number) => void;
}) => {
    return (
        <Card className="bg-background/70 flex flex-col">
            <CardHeader className="flex-row items-center justify-between p-4">
                <CardTitle className='text-base font-headline'>
                    <EditableField as="div" value={day.title} onSave={(newTitle) => onUpdateDay(weekIdx, dayIdx, newTitle)} label="Day Title" />
                </CardTitle>
                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onDeleteDay(weekIdx, dayIdx)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow p-4 pt-0">
                {day.tasks.map((task, taskIdx) => {
                    const taskId = getTaskId(subject, weekIdx, dayIdx, taskIdx);
                    return (
                        <div key={taskId} className="flex items-start gap-3 group/task pt-3 border-t border-border/20 first:border-t-0">
                            <Checkbox
                                id={taskId}
                                checked={!!progress[taskId]}
                                onCheckedChange={(checked) => onProgressChange(taskId, !!checked)}
                                className="mt-1"
                            />
                            <div className="grid gap-1.5 leading-none flex-grow">
                                <Label htmlFor={taskId} className={`cursor-pointer ${progress[taskId] ? 'line-through text-muted-foreground' : ''}`}>
                                    <EditableField as="span" value={task.title} onSave={(newValue) => onUpdateTask(weekIdx, dayIdx, taskIdx, { title: newValue })} label="Task Title" />
                                </Label>
                                {task.description && (
                                    <p className="text-sm text-muted-foreground">
                                        <EditableField as="span" value={task.description} onSave={(newValue) => onUpdateTask(weekIdx, dayIdx, taskIdx, { description: newValue })} label="Task Description" />
                                    </p>
                                )}
                                <TaskTimer
                                    task={task}
                                    onUpdateTask={(updatedTask) => onUpdateTask(weekIdx, dayIdx, taskIdx, updatedTask)}
                                />
                            </div>
                            <Button variant="ghost" size="icon" className="w-5 h-5 opacity-0 group-hover/task:opacity-100" onClick={() => onDeleteTask(weekIdx, dayIdx, taskIdx)}><Trash2 className="w-3 h-3 text-destructive"/></Button>
                        </div>
                    );
                })}
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => onAddTask(weekIdx, dayIdx)}><PlusCircle className="mr-2 h-4 w-4"/>Add Task</Button>
            </CardContent>
        </Card>
    );
});
DayCard.displayName = 'DayCard';


function StudyPlanView({ plan, progress, onProgressChange, subject, onPlanUpdate }: { plan: Week[]; progress: Record<string, boolean>; onProgressChange: (id: string, checked: boolean) => void; subject: string, onPlanUpdate: (subject: string, plan: Week[]) => void }) {
  const defaultOpen = useMemo(() => plan.map(week => `week-${week.week}`), [plan]);

  const updatePlan = useCallback((updatedPlan: Week[]) => {
    onPlanUpdate(subject, updatedPlan);
  }, [onPlanUpdate, subject]);
  
  const handleAddWeek = useCallback(() => {
    const newWeek: Week = {
      week: plan.length + 1,
      title: `Week ${plan.length + 1}`,
      days: [],
    };
    updatePlan([...plan, newWeek]);
  }, [plan, updatePlan]);
  
  const handleUpdateWeek = useCallback((weekIndex: number, newTitle: string) => {
    const newPlan = [...plan];
    newPlan[weekIndex].title = newTitle;
    updatePlan(newPlan);
  }, [plan, updatePlan]);
  
  const handleDeleteWeek = useCallback((weekIndex: number) => {
    const newPlan = plan.filter((_, i) => i !== weekIndex).map((week, i) => ({ ...week, week: i + 1, title: week.title.replace(/\d+$/, `${i + 1}`) }));
    updatePlan(newPlan);
  }, [plan, updatePlan]);

  const handleAddDay = useCallback((weekIndex: number) => {
    const newPlan = [...plan];
    const week = newPlan[weekIndex];
    const newDay: Day = {
      day: week.days.length + 1,
      title: `Day ${week.days.length + 1}`,
      tasks: [],
    };
    week.days.push(newDay);
    updatePlan(newPlan);
  }, [plan, updatePlan]);
  
  const handleUpdateDay = useCallback((weekIndex: number, dayIndex: number, newTitle: string) => {
    const newPlan = [...plan];
    newPlan[weekIndex].days[dayIndex].title = newTitle;
    updatePlan(newPlan);
  }, [plan, updatePlan]);

  const handleDeleteDay = useCallback((weekIndex: number, dayIndex: number) => {
    const newPlan = [...plan];
    newPlan[weekIndex].days = newPlan[weekIndex].days.filter((_, i) => i !== dayIndex);
    updatePlan(newPlan);
  }, [plan, updatePlan]);
  
  const handleAddTask = useCallback((weekIndex: number, dayIndex: number) => {
    const newPlan = [...plan];
    const newT: Task = { title: "New Task", description: "A new task description" };
    newPlan[weekIndex].days[dayIndex].tasks.push(newT);
    updatePlan(newPlan);
  }, [plan, updatePlan]);

  const handleUpdateTask = useCallback((weekIndex: number, dayIndex: number, taskIndex: number, updatedTask: Partial<Task>) => {
    const newPlan = [...plan];
    newPlan[weekIndex].days[dayIndex].tasks[taskIndex] = {
      ...newPlan[weekIndex].days[dayIndex].tasks[taskIndex],
      ...updatedTask,
    };
    updatePlan(newPlan);
  }, [plan, updatePlan]);

  const handleDeleteTask = useCallback((weekIndex: number, dayIndex: number, taskIndex: number) => {
    const newPlan = [...plan];
    newPlan[weekIndex].days[dayIndex].tasks = newPlan[weekIndex].days[dayIndex].tasks.filter((_, i) => i !== taskIndex);
    updatePlan(newPlan);
  }, [plan, updatePlan]);


  return (
    <>
      <Accordion type="multiple" defaultValue={defaultOpen} className="w-full space-y-4">
        {plan.map((week, weekIdx) => {
          const weekTasks = week.days.flatMap((day, dayIdx) => day.tasks.map((_, taskIdx) => getTaskId(subject, weekIdx, dayIdx, taskIdx)));
          const completedWeekTasks = weekTasks.filter(id => progress[id]).length;
          const totalWeekTasks = weekTasks.length;
          const isWeekComplete = totalWeekTasks > 0 && completedWeekTasks === totalWeekTasks;
          
          return (
            <AccordionItem key={`week-${week.week}`} value={`week-${week.week}`} className="bg-card/60 backdrop-blur-md rounded-lg border shadow-sm overflow-hidden">
                <div className="flex items-center group p-4 text-lg font-semibold">
                    <AccordionTrigger className="p-2 flex-grow justify-start">
                      <div className="flex items-center gap-4">
                          {isWeekComplete ? <CheckCircle className="h-6 w-6 text-accent" /> : <BookOpen className="h-6 w-6 text-primary" />}
                          <EditableField as="div" value={week.title} onSave={(newTitle) => handleUpdateWeek(weekIdx, newTitle)} label="Week Title" className='text-xl font-headline' />
                      </div>
                    </AccordionTrigger>
                    <span className="text-sm font-normal text-muted-foreground whitespace-nowrap mx-4">{completedWeekTasks} / {totalWeekTasks} tasks</span>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteWeek(weekIdx)}}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                </div>
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {week.days.map((day, dayIdx) => (
                    <DayCard
                        key={`day-${day.day}-${day.title}-${dayIdx}`}
                        day={day}
                        dayIdx={dayIdx}
                        weekIdx={weekIdx}
                        subject={subject}
                        progress={progress}
                        onProgressChange={onProgressChange}
                        onUpdateDay={handleUpdateDay}
                        onDeleteDay={handleDeleteDay}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                    />
                  ))}
                   <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border/70 hover:border-primary transition-colors min-h-[150px]">
                      <Button variant="ghost" onClick={() => handleAddDay(weekIdx)} className="w-full h-full text-muted-foreground hover:text-primary">
                        <PlusCircle className="mr-2 h-4 w-4"/>Add Day
                      </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <div className="mt-4 flex justify-center">
        <Button onClick={handleAddWeek}><PlusCircle className="mr-2 h-4 w-4"/>Add Week</Button>
      </div>
    </>
  );
}
