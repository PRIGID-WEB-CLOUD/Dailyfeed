
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, ClipboardList } from 'lucide-react';
import type { Survey } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function SponsoredSurvey() {
  const { toast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchSurvey = async () => {
        setIsLoading(true);
        try {
            const surveysQuery = query(collection(db, 'surveys'), where('status', '==', 'Available'));
            const surveysSnapshot = await getDocs(surveysQuery);
            if (!surveysSnapshot.empty) {
                const doc = surveysSnapshot.docs[0];
                setSurvey({ id: doc.id, ...doc.data() } as Survey);
            }
        } catch (error) {
            console.error("Failed to load surveys", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchSurvey();
  }, []);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSurvey, setShowSurvey] = useState(true);
  
  useEffect(() => {
    if (survey) {
      const lastCompletion = localStorage.getItem(`survey_${survey.id}_completed`);
      if (lastCompletion) {
        setShowSurvey(false);
      }
    }
  }, [survey]);

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!survey) return;

    if (Object.keys(answers).length !== survey.questions.length) {
      toast({ variant: 'destructive', title: 'Incomplete Survey', description: 'Please answer all questions.' });
      return;
    }
    
    setIsCompleted(true);
    
    const completionDate = new Date().toDateString();
    localStorage.setItem(`survey_${survey.id}_completed`, completionDate);

    toast({
      title: 'Survey Submitted!',
      description: `Thank you for your feedback. You've earned $${survey.reward.toFixed(2)}.`,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center my-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!survey || !showSurvey) {
    return null;
  }

  return (
    <div className="my-8">
    <Card className="bg-muted/30 border-dashed">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
            <div>
                 <CardTitle className="flex items-center gap-2"><ClipboardList /> Sponsored Survey</CardTitle>
                <CardDescription>Participate for a reward from {survey.sponsor}.</CardDescription>
            </div>
             <Badge variant="secondary">Reward: ${survey.reward.toFixed(2)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isCompleted ? (
            <div className="flex flex-col items-center justify-center text-center p-8 text-green-600">
                <CheckCircle className="h-12 w-12 mb-4"/>
                <h3 className="text-xl font-semibold">Thank you!</h3>
                <p>Your response has been recorded.</p>
            </div>
        ): (
            <div className="space-y-4">
                {survey.questions.map((q, qIndex) => (
                    <div key={q.id} className="space-y-3">
                        <p className="font-medium">{qIndex + 1}. {q.text}</p>
                        <RadioGroup
                            onValueChange={(value) => handleAnswerChange(q.id, value)}
                            value={answers[q.id]}
                            className="pl-2 space-y-2"
                        >
                            {q.options.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                                <Label htmlFor={`${q.id}-${option}`}>{option}</Label>
                            </div>
                            ))}
                        </RadioGroup>
                    </div>
                ))}
            </div>
        )}
      </CardContent>
      {!isCompleted && (
        <CardFooter>
            <Button className="w-full" onClick={handleSubmit}>Submit Survey</Button>
        </CardFooter>
      )}
    </Card>
    </div>
  );
}
