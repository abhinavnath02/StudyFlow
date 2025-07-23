'use server';
/**
 * @fileOverview A flow for generating a study plan.
 *
 * - generateStudyPlan - A function that creates a study plan based on a topic, duration, and description.
 * - GenerateStudyPlanInput - The input type for the generateStudyPlan function.
 * - GenerateStudyPlanOutput - The return type for the generateStudyPlan function.
 */

import { ai } from '@/ai/genkit';
import { Week } from '@/types/study-plan';
import { z } from 'genkit';

const GenerateStudyPlanInputSchema = z.object({
  topic: z.string().describe('The main subject or topic for the study plan.'),
  duration: z.string().describe('The total duration of the study plan (e.g., "8 weeks", "1 month").'),
  description: z.string().describe('A brief description of the learning goals or what the user wants to focus on.'),
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

const TaskSchema = z.object({
    title: z.string().describe("A concise title for the study task."),
    description: z.string().optional().describe("A brief, one-sentence description of the task."),
});

const DaySchema = z.object({
    day: z.number().describe("The day number within the week (e.g., 1 for Monday)."),
    title: z.string().describe("The main focus for the day (e.g., 'Introduction to Topic X')."),
    tasks: z.array(TaskSchema).describe("A list of tasks to complete for the day."),
});

const WeekSchema = z.object({
    week: z.number().describe("The week number of the study plan."),
    title: z.string().describe("A summary of the week's learning goals."),
    days: z.array(DaySchema).describe("A list of daily plans for the week, typically 3-5 days of study per week."),
});

const GenerateStudyPlanOutputSchema = z.object({
  weeks: z.array(WeekSchema).describe("The structured study plan, broken down by weeks."),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;


export async function generateStudyPlan(input: GenerateStudyPlanInput): Promise<GenerateStudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  input: { schema: GenerateStudyPlanInputSchema },
  output: { schema: GenerateStudyPlanOutputSchema },
  prompt: `You are an expert curriculum designer. A user wants to create a study plan.

  Topic: {{{topic}}}
  Duration: {{{duration}}}
  Goals: {{{description}}}

  Generate a comprehensive, week-by-week study plan based on the information provided.
  Each week should have a clear title and a set of daily learning activities.
  Each day should have a title and a list of specific, actionable tasks. Assume 3-5 study days per week.
  The plan should be structured logically to guide the user from fundamentals to more advanced concepts over the specified duration.
  Return the plan in the required JSON format.`,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
