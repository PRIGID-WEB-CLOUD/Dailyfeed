
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, BarChart } from 'lucide-react';
import type { Poll } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text cannot be empty.'),
});

const pollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters.'),
  options: z.array(optionSchema).min(2, 'Must have at least two options.'),
});

type PollFormValues = z.infer<typeof pollSchema>;

export default function PollsPage() {
  const { toast } = useToast();
  
  const [pollsSnapshot, isLoading, error] = useCollection(
    query(collection(db, 'polls'), orderBy('createdAt', 'desc'))
  );
  const polls: Poll[] = pollsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll)) || [];
  
  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load polls.' });
    }
  }, [error, toast]);

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      question: '',
      options: [{ text: '' }, { text: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const onSubmit = async (data: PollFormValues) => {
    const optionsObject = data.options.reduce((acc, opt) => {
        acc[opt.text] = 0;
        return acc;
    }, {} as Record<string, number>);

    try {
        await addDoc(collection(db, 'polls'), {
            question: data.question,
            options: optionsObject,
            totalVotes: 0,
            createdAt: serverTimestamp(),
        });
        form.reset();
        toast({ title: 'Poll Created!', description: 'Your new poll is now live.' });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create poll.' });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Create New Poll</CardTitle>
                <CardDescription>Add a new poll for your readers to vote on.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Input placeholder="What should we write about next?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Options</FormLabel>
                  <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`options.${index}.text`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input placeholder={`Option ${index + 1}`} {...field} />
                              </FormControl>
                              {fields.length > 2 && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ text: '' })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </CardContent>
              <CardContent>
                 <Button type="submit" className="w-full">Create Poll</Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-2">
                <BarChart />
                <CardTitle>Active Polls</CardTitle>
             </div>
            <CardDescription>View results for ongoing and past polls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              polls.map(poll => (
                <div key={poll.id} className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-semibold">{poll.question}</h4>
                  <div className="space-y-2">
                    {Object.entries(poll.options).map(([option, votes]) => {
                      const percentage = poll.totalVotes > 0 ? (votes / poll.totalVotes) * 100 : 0;
                      return (
                        <div key={option}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{option}</span>
                            <span className="font-semibold">{votes} votes ({percentage.toFixed(0)}%)</span>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                  </div>
                   <p className="text-sm text-muted-foreground text-right">Total votes: {poll.totalVotes}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
