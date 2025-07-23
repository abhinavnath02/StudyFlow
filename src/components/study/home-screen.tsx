"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Week, SubjectBackground } from '@/types/study-plan';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, UploadCloud, FileJson } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';

const PLANS_STORAGE_KEY = 'studyflow-plans';
const PROGRESS_STORAGE_KEY = 'studyflow-progress';
const BACKGROUNDS_STORAGE_KEY = 'studyflow-backgrounds';

const SubjectCard = React.memo(({ subject, plan, progressData, background, onDelete }: {
    subject: string;
    plan: Week[];
    progressData: Record<string, boolean>;
    background: SubjectBackground | undefined;
    onDelete: (subject: string) => void;
}) => {
    const { completedTasks, totalTasks, overallProgress } = useMemo(() => {
        if (!plan || !progressData) return { totalTasks: 0, completedTasks: 0, overallProgress: 0 };
        const total = plan.reduce((acc, week) => acc + week.days.reduce((dAcc, day) => dAcc + day.tasks.length, 0), 0);
        const completed = Object.values(progressData).filter(Boolean).length;
        return {
            totalTasks: total,
            completedTasks: completed,
            overallProgress: total > 0 ? (completed / total) * 100 : 0,
        };
    }, [plan, progressData]);

    const backgroundStyle = useMemo(() => {
        if (!background) return {};
        return background.type === 'image'
            ? { backgroundImage: `url(${background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { backgroundColor: background.value };
    }, [background]);

    return (
        <Card className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
            <Link href={`/subject/${encodeURIComponent(subject)}`} className="flex-grow flex flex-col">
                <CardHeader style={backgroundStyle} className="text-card-foreground p-6">
                    <div className="bg-background/70 backdrop-blur-sm p-3 rounded-md">
                        <CardTitle className="text-2xl font-headline font-semibold break-all">{subject}</CardTitle>
                        <CardDescription className='text-foreground/80'>{completedTasks} of {totalTasks} tasks completed</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-6 flex-grow flex flex-col justify-end">
                    {totalTasks > 0 ? (
                        <div className="flex items-center gap-4">
                            <Progress value={overallProgress} className="h-2" />
                            <span className="font-mono text-base font-semibold text-primary">{Math.round(overallProgress)}%</span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No tasks in this plan yet.</p>
                    )}
                </CardContent>
            </Link>
             <div className="p-4 pt-0">
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive-foreground hover:bg-destructive">
                       <Trash2 className="mr-2 h-4 w-4"/> Delete Subject
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                       <AlertDialogDescription>
                         This will permanently delete the study plan and all progress for "{subject}". This action cannot be undone.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancel</AlertDialogCancel>
                       <AlertDialogAction onClick={() => onDelete(subject)}>Continue</AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
             </div>
        </Card>
    );
});
SubjectCard.displayName = 'SubjectCard';


export function HomeScreen() {
    const [isMounted, setIsMounted] = useState(false);
    const [studyPlans, setStudyPlans] = useState<Record<string, Week[]>>({});
    const [allProgress, setAllProgress] = useState<Record<string, Record<string, boolean>>>({});
    const [backgrounds, setBackgrounds] = useState<Record<string, SubjectBackground>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            try {
                const savedPlans = localStorage.getItem(PLANS_STORAGE_KEY);
                const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
                const savedBackgrounds = localStorage.getItem(BACKGROUNDS_STORAGE_KEY);

                const parsedPlans = savedPlans ? JSON.parse(savedPlans) : {};
                setStudyPlans(parsedPlans);
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

    const initializeProgress = useCallback((plan: Week[], subject: string) => {
        const initialProgress: Record<string, boolean> = {};
        const getTaskId = (subject: string, weekIdx: number, dayIdx: number, taskIdx: number) => `${subject}-w${weekIdx}d${dayIdx}t${taskIdx}`;
        plan.forEach((week, weekIdx) => {
            week.days.forEach((day, dayIdx) => {
                day.tasks.forEach((_, taskIdx) => {
                    initialProgress[getTaskId(subject, weekIdx, dayIdx, taskIdx)] = false;
                });
            });
        });
        return initialProgress;
    }, []);
    
    const handleSetNewPlan = useCallback((subject: string, newPlan: Week[]) => {
        setStudyPlans(prev => ({ ...prev, [subject]: newPlan }));
        setAllProgress(prev => ({ ...prev, [subject]: initializeProgress(newPlan, subject) }));
        setBackgrounds(prev => ({ ...prev, [subject]: { type: 'color', value: '#f3f0e9' } }));
    }, [initializeProgress]);

    const handleDeleteSubject = useCallback((subjectToDelete: string) => {
        setStudyPlans(prev => {
            const newPlans = { ...prev };
            delete newPlans[subjectToDelete];
            return newPlans;
        });
        setAllProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[subjectToDelete];
            return newProgress;
        });
        setBackgrounds(prev => {
            const newBackgrounds = { ...prev };
            delete newBackgrounds[subjectToDelete];
            return newBackgrounds;
        });

        toast({
            title: "Subject Deleted",
            description: `The subject "${subjectToDelete}" and its progress have been cleared.`,
        });
    }, [toast]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    const subjects = Object.keys(studyPlans);

    return (
        <div 
          className="min-h-screen w-full transition-all duration-500"
          style={{ backgroundColor: 'hsl(var(--background))' }}
        >
          <main className="container mx-auto max-w-5xl py-8 px-4">
            <header className="mb-8 text-center">
              <div className="flex justify-center items-center gap-3 mb-2">
                <BookOpen className="h-10 w-10 text-primary" />
                <h1 className="text-5xl md:text-6xl font-handwriting tracking-wide">StudyFlow</h1>
              </div>
              <p className="text-muted-foreground">Your personal learning dashboard.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map(subject => (
                    <SubjectCard
                        key={subject}
                        subject={subject}
                        plan={studyPlans[subject]}
                        progressData={allProgress[subject]}
                        background={backgrounds[subject]}
                        onDelete={handleDeleteSubject}
                    />
                ))}

                <NewPlanCreator onPlanCreated={handleSetNewPlan} />
            </div>

          </main>
        </div>
    )
}

function NewPlanCreator({ onPlanCreated }: { onPlanCreated: (subject: string, plan: Week[]) => void; }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card className="border-2 border-dashed transition-colors duration-300 border-border bg-transparent hover:border-primary hover:text-primary min-h-[250px] flex items-center justify-center">
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <button className='w-full h-full'>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-headline mb-2">Create New Plan</h3>
                <p className="text-muted-foreground text-sm">Add a new subject to your dashboard.</p>
              </CardContent>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-[480px]">
              <PlanCreationDialogContent onPlanCreated={onPlanCreated} setDialogOpen={setDialogOpen} />
          </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function PlanCreationDialogContent({ onPlanCreated, setDialogOpen }: { onPlanCreated: (subject: string, plan: Week[]) => void; setDialogOpen: (open: boolean) => void; }) {
    const { toast } = useToast();

    const handleManualCreate = useCallback((subject: string) => {
      if (!subject.trim()) {
        toast({
          variant: "destructive",
          title: "Missing subject",
          description: "Please enter a subject name.",
        });
        return;
      }
      onPlanCreated(subject.trim(), [{ week: 1, title: "Week 1", days: [] }]);
      toast({
        title: "Success!",
        description: `Your study plan for "${subject.trim()}" has been created.`,
      });
      setDialogOpen(false);
    }, [onPlanCreated, setDialogOpen, toast]);
    
    const handleJsonUpload = useCallback((subject: string, plan: Week[]) => {
      onPlanCreated(subject, plan);
      setDialogOpen(false);
    }, [onPlanCreated, setDialogOpen]);

    return (
      <>
        <AlertDialogHeader>
            <AlertDialogTitle>Create a New Study Plan</AlertDialogTitle>
            <AlertDialogDescription>
                Choose a method to create your new study plan.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual"><Edit className="mr-2 h-4 w-4"/>Manual</TabsTrigger>
                <TabsTrigger value="upload"><UploadCloud className="mr-2 h-4 w-4"/>Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
                <ManualCreationForm onCreate={handleManualCreate} setDialogOpen={setDialogOpen} />
            </TabsContent>
            <TabsContent value="upload">
                <JsonUploadForm onUpload={handleJsonUpload} setDialogOpen={setDialogOpen} />
            </TabsContent>
        </Tabs>
      </>
    );
}


function ManualCreationForm({ onCreate, setDialogOpen }: { onCreate: (subject: string) => void; setDialogOpen: (open: boolean) => void; }) {
  const [subject, setSubject] = useState('');

  const handleCreate = useCallback(() => {
    onCreate(subject)
  }, [onCreate, subject]);

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
          <Label htmlFor="subject-manual">Subject Name</Label>
          <Input id="subject-manual" placeholder="e.g., Web Development" value={subject} onChange={e => setSubject(e.target.value)} />
      </div>
      <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDialogOpen(false)}>Cancel</AlertDialogCancel>
          <Button onClick={handleCreate}><PlusCircle className="mr-2"/>Create Plan</Button>
      </AlertDialogFooter>
    </div>
  )
}

function JsonUploadForm({ onUpload, setDialogOpen }: { onUpload: (subject: string, plan: Week[]) => void; setDialogOpen: (open: boolean) => void; }) {
    const [subject, setSubject] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/json') {
                setFile(selectedFile);
                setFileName(selectedFile.name);
            } else {
                setFile(null);
                setFileName('');
                toast({
                    variant: "destructive",
                    title: "Invalid file type",
                    description: "Please upload a valid JSON file.",
                });
            }
        }
    }, [toast]);

    const handleUpload = useCallback(() => {
        if (!subject.trim()) {
            toast({ variant: "destructive", title: "Missing subject", description: "Please enter a subject name." });
            return;
        }
        if (!file) {
            toast({ variant: "destructive", title: "No file selected", description: "Please select a JSON file to upload." });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') throw new Error("File content is not a string.");
                const parsedContent = JSON.parse(content);
                // Basic validation, can be improved with Zod
                if (Array.isArray(parsedContent) && parsedContent.every(w => 'week' in w && 'title' in w && 'days' in w)) {
                    onUpload(subject.trim(), parsedContent);
                    toast({ title: "Success!", description: `Plan for "${subject.trim()}" uploaded.` });
                } else {
                    throw new Error("JSON structure is invalid.");
                }
            } catch (err) {
                 toast({
                    variant: "destructive",
                    title: "Upload Error",
                    description: `Failed to parse JSON file. ${err instanceof Error ? err.message : "Unknown error"}`,
                });
            }
        };
        reader.onerror = () => {
             toast({
                variant: "destructive",
                title: "File Read Error",
                description: "Could not read the selected file.",
            });
        };
        reader.readAsText(file);
    }, [file, subject, onUpload, toast]);

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="subject-upload">Subject Name</Label>
                <Input id="subject-upload" placeholder="e.g., History of Art" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="file-upload">JSON File</Label>
                <Input id="file-upload" type="file" accept=".json" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full justify-start text-muted-foreground">
                    <FileJson className="mr-2 h-4 w-4" />
                    {fileName || 'Select a file'}
                </Button>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDialogOpen(false)}>Cancel</AlertDialogCancel>
                <Button onClick={handleUpload}><UploadCloud className="mr-2"/>Upload Plan</Button>
            </AlertDialogFooter>
        </div>
    );
}

// Helper to generate a unique ID for each task
export const getTaskId = (subject: string, weekIdx: number, dayIdx: number, taskIdx: number) => `${subject}-w${weekIdx}d${dayIdx}t${taskIdx}`;
