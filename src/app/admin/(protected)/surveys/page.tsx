
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, ClipboardList } from 'lucide-react';
import type { Survey } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const questionSchema = z.object({
  text: z.string().min(5, 'Question text is too short.'),
  options: z.string().min(3, 'Provide comma-separated options.'),
});

const surveySchema = z.object({
  title: z.string().min(5, 'Title is too short.'),
  sponsor: z.string().min(2, 'Sponsor name is required.'),
  reward: z.coerce.number().min(0, 'Reward must be a positive number.'),
  status: z.enum(['Available', 'Completed']),
  questions: z.array(questionSchema).min(1, 'A survey must have at least one question.'),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

export default function SurveysPage() {
  const { toast } = useToast();
  
  const [surveysSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'surveys'), orderBy('createdAt', 'desc'))
  );
  
  const surveys: Survey[] = useMemo(() => {
    if (!surveysSnapshot) return [];
    return surveysSnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp
    } as Survey));
  }, [surveysSnapshot]);

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      title: '',
      sponsor: '',
      reward: 0,
      status: 'Available',
      questions: [{ text: '', options: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });
  
  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load surveys.' });
    }
  }, [error, toast]);


  const onSubmit = async (data: SurveyFormValues) => {
    const newSurveyData = {
      ...data,
      questions: data.questions.map((q, index) => ({
        id: `q-${Date.now()}-${index}`,
        text: q.text,
        options: q.options.split(',').map(opt => opt.trim()),
      })),
      createdAt: serverTimestamp(),
    };
    
    try {
        await addDoc(collection(db, 'surveys'), newSurveyData);
        form.reset();
        toast({ title: 'Survey Created!', description: 'Your new survey has been added.' });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create survey.' });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Create New Survey</CardTitle>
                <CardDescription>Add a sponsored survey for your readers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Feedback on Sustainable Tech" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="sponsor" render={({ field }) => (<FormItem><FormLabel>Sponsor</FormLabel><FormControl><Input placeholder="GreenTech Solutions" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="reward" render={({ field }) => (<FormItem><FormLabel>Reward ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Set status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>

                <div className="space-y-4 pt-4 border-t">
                  <FormLabel>Questions</FormLabel>
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-md space-y-2 relative">
                       <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      <FormField control={form.control} name={`questions.${index}.text`} render={({ field }) => (<FormItem><FormLabel>Question {index + 1}</FormLabel><FormControl><Input placeholder="Question text" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name={`questions.${index}.options`} render={({ field }) => (<FormItem><FormLabel>Options</FormLabel><FormControl><Input placeholder="Option 1, Option 2, Option 3" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '', options: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Question</Button>
                </div>
              </CardContent>
              <CardFooter>
                 <Button type="submit" className="w-full">Create Survey</Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
       <div className="lg:col-span-2">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-2">
                <ClipboardList />
                <CardTitle>All Surveys</CardTitle>
             </div>
            <CardDescription>View and manage all reader surveys.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
            <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Sponsor</TableHead><TableHead>Reward</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                    {surveys.map(survey => (
                        <TableRow key={survey.id}>
                            <TableCell className="font-medium">{survey.title}</TableCell>
                            <TableCell>{survey.sponsor}</TableCell>
                            <TableCell>${survey.reward.toFixed(2)}</TableCell>
                            <TableCell><Badge variant={survey.status === 'Available' ? 'secondary' : 'outline'}>{survey.status}</Badge></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
