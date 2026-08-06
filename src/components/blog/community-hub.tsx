

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Users, Mic, BarChart, ExternalLink } from 'lucide-react';
import type { Poll, ReaderEvent } from '@/lib/types';
import { format } from 'date-fns';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { collection, query, orderBy, Timestamp, doc, updateDoc, increment, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCollection, useCollectionData } from 'react-firebase-hooks/firestore';

export function CommunityHub() {
  const { toast } = useToast();

  const [pollsSnapshot, pollsLoading, pollsError] = useCollection(
    query(collection(db, 'polls'), orderBy('createdAt', 'desc'))
  );
  
  const [eventsSnapshot, eventsLoading, eventsError] = useCollection(
    query(collection(db, 'events'), orderBy('date', 'desc'))
  );

  const allPolls: Poll[] = useMemo(() => 
    pollsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll)) || [],
    [pollsSnapshot]
  );
  
  const events: ReaderEvent[] = useMemo(() => 
    eventsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReaderEvent)) || [],
    [eventsSnapshot]
  );
  
  const isLoading = pollsLoading || eventsLoading;

  useEffect(() => {
    if (pollsError || eventsError) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load community data.' });
    }
  }, [pollsError, eventsError, toast]);


  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [votedPolls, setVotedPolls] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('votedPolls');
        return new Set(saved ? JSON.parse(saved) : []);
    }
    return new Set();
  });
  
  const availablePolls = useMemo(() => {
    return allPolls.filter(poll => !votedPolls.has(poll.id));
  }, [allPolls, votedPolls]);

  const handleVote = async (pollId: string) => {
    const selectedOption = selectedOptions[pollId];
    if (!selectedOption) {
      toast({
        variant: 'destructive',
        title: 'No option selected',
        description: 'Please select an option to vote.',
      });
      return;
    }
    
    if (votedPolls.has(pollId)) {
        toast({ title: "You've already voted in this poll." });
        return;
    }
    
    const newVotedPolls = new Set(votedPolls).add(pollId);
    setVotedPolls(newVotedPolls);
    localStorage.setItem('votedPolls', JSON.stringify(Array.from(newVotedPolls)));
    
    const pollRef = doc(db, 'polls', pollId);
    const voteUpdate: Record<string, any> = {};
    voteUpdate[`options.${selectedOption}`] = increment(1);
    voteUpdate['totalVotes'] = increment(1);

    try {
        await updateDoc(pollRef, voteUpdate);
        toast({
          title: 'Vote Cast!',
          description: 'Thank you for participating.',
        });
    } catch(e) {
        console.error("Failed to update vote", e);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not cast your vote.',
        });
        const revertedVotedPolls = new Set(votedPolls);
        revertedVotedPolls.delete(pollId);
        setVotedPolls(revertedVotedPolls);
        localStorage.setItem('votedPolls', JSON.stringify(Array.from(revertedVotedPolls)));
    }
  };

  const renderPollContent = (poll: Poll) => {
    const hasVoted = votedPolls.has(poll.id);

    if (hasVoted) {
        const pollData = allPolls.find(p => p.id === poll.id);
        if (!pollData) return null;
      return (
        <div className="space-y-3">
          {Object.entries(pollData.options).map(([option, votes]) => {
            const percentage = pollData.totalVotes > 0 ? (votes / pollData.totalVotes) * 100 : 0;
            return (
              <div key={option}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{option}</span>
                  <span className="font-semibold">{percentage.toFixed(0)}%</span>
                </div>
                <Progress value={percentage} />
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <RadioGroup
        value={selectedOptions[poll.id]}
        onValueChange={(value) => setSelectedOptions(prev => ({ ...prev, [poll.id]: value }))}
        className="space-y-2"
      >
        {Object.keys(poll.options).map(option => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`${poll.id}-${option}`} />
            <Label htmlFor={`${poll.id}-${option}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  };
  
  if (isLoading) {
    return (
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  // If there are no polls AND no events, don't render the hub at all.
  // OR if the guest has voted in all available polls and there are no events.
  const noPollsForGuest = allPolls.length > 0 && availablePolls.length === 0;
  if ((allPolls.length === 0 && events.length === 0) || (noPollsForGuest && events.length === 0)) {
    return null;
  }

  return (
    <section className="bg-muted/30 py-12 border-y">
      <div className="container mx-auto px-4 lg:px-6">
        <h2 className="text-3xl font-bold font-headline text-center mb-8">Community Hub</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          {allPolls.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart/> Weekly Polls</CardTitle>
              <CardDescription>Share your opinion and see what others think.</CardDescription>
            </CardHeader>
            <CardContent>
                {availablePolls.length > 0 ? (
                  <Carousel>
                      <CarouselContent>
                          {availablePolls.map(poll => (
                              <CarouselItem key={poll.id}>
                                  <div className="p-1">
                                      <h4 className="font-semibold mb-4">{poll.question}</h4>
                                      {renderPollContent(poll)}
                                      <Button
                                          className="w-full mt-4"
                                          onClick={() => handleVote(poll.id)}
                                          disabled={votedPolls.has(poll.id)}
                                      >
                                          {votedPolls.has(poll.id) ? 'Voted' : 'Cast Your Vote'}
                                      </Button>
                                  </div>
                              </CarouselItem>
                          ))}
                      </CarouselContent>
                      {availablePolls.length > 1 && (
                          <>
                            <CarouselPrevious className="left-[-1rem]" />
                            <CarouselNext className="right-[-1rem]"/>
                          </>
                      )}
                  </Carousel>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Thanks for voting! Check back later for new polls.</p>
                )}
            </CardContent>
          </Card>
          )}

          {events.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar/> Reader Events</CardTitle>
              <CardDescription>Join our exclusive Q&As and live discussions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="flex flex-col sm:flex-row items-start gap-4 border p-4 rounded-lg">
                    <div className="text-center sm:text-left">
                        <div className="font-bold text-primary text-xl">{format((event.date as unknown as Timestamp).toDate(), 'dd')}</div>
                        <div className="text-sm uppercase text-muted-foreground">{format((event.date as unknown as Timestamp).toDate(), 'MMM')}</div>
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{format((event.date as unknown as Timestamp).toDate(), 'h:mm a')} | with {event.host}</p>
                    </div>
                    <Button asChild size="sm">
                        <a href={event.link} target="_blank" rel="noopener noreferrer">
                           Join Event <ExternalLink className="ml-2 h-4 w-4"/>
                        </a>
                    </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </section>
  );
}

