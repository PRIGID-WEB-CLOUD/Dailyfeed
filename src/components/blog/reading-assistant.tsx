
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wand2, BookText, Languages, Speech, Loader2, X } from 'lucide-react';
import type { Post } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateBlogSummary } from '@/ai/flows/generate-blog-summary';
import { explainTextSimply } from '@/ai/flows/explain-text-simply';
import { translateText } from '@/ai/flows/translate-text';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { usePublicSubscription } from '@/hooks/use-public-subscription';
import { cn } from '@/lib/utils';

export function ReadingAssistant({ post }: { post: Post }) {
  const { toast } = useToast();
  const { isAuthenticated } = usePublicSubscription();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleAction = async (action: 'summary' | 'explain' | 'translate' | 'listen') => {
    setActiveAction(action);
    setIsDialogOpen(true);
    setIsLoading(true);
    setResult('');
    setAudioUrl(null);
    setIsAssistantOpen(false);

    try {
      if (action === 'summary') {
        const response = await generateBlogSummary({ blogPostContent: post.content });
        setResult(response.summary);
      } else if (action === 'explain') {
        const response = await explainTextSimply({ text: post.content });
        setResult(response.explanation);
      } else if (action === 'translate') {
        const response = await translateText({ text: post.content, targetLanguage: language });
        setResult(response.translatedText);
      } else if (action === 'listen') {
        if (!isAuthenticated) {
          setResult('This is a premium feature. Please subscribe to listen to articles.');
          setIsLoading(false);
          return;
        }
        const response = await textToSpeech({ text: post.content });
        setAudioUrl(response.audioUrl);
      }
    } catch (error) {
      console.error(`AI action '${action}' failed:`, error);
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: 'Sorry, I couldn\'t complete that request.',
      });
      setIsDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (activeAction) {
      case 'summary': return 'Article Summary';
      case 'explain': return 'Simplified Explanation';
      case 'translate': return `Translation to ${language}`;
      case 'listen': return 'Listen to Article';
      default: return 'AI Assistant';
    }
  };

  const assistantActions = [
    { id: 'listen', icon: Speech, label: 'Listen to Article (Premium)', action: () => handleAction('listen') },
    { id: 'summary', icon: BookText, label: 'Summarize', action: () => handleAction('summary') },
    { id: 'explain', icon: Wand2, label: 'Explain Simply', action: () => handleAction('explain') },
    { id: 'translate', icon: Languages, label: 'Translate', action: () => handleAction('translate') },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <TooltipProvider>
          <div className="relative flex flex-col items-center gap-2">
            {isAssistantOpen && assistantActions.map((item, index) => {
                 const Icon = item.icon;
                 return (
                    <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                className={cn(
                                    'rounded-full h-12 w-12 shadow-lg transition-all duration-300',
                                     isAssistantOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                                )}
                                style={{ transitionDelay: `${(assistantActions.length - index) * 50}ms` }}
                                onClick={item.action}
                            >
                                <Icon className="h-6 w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left"><p>{item.label}</p></TooltipContent>
                    </Tooltip>
                 )
            })}
             <Button
                size="icon"
                className="rounded-full h-16 w-16 shadow-lg relative z-10"
                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              >
                <Wand2 className={cn("h-7 w-7 transition-all duration-300", isAssistantOpen && "rotate-45 scale-0 opacity-0")} />
                <X className={cn("h-7 w-7 absolute transition-all duration-300", !isAssistantOpen && "-rotate-45 scale-0 opacity-0")} />
                <span className="sr-only">Toggle Reading Assistant</span>
            </Button>
          </div>
        </TooltipProvider>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
             {activeAction === 'translate' && (
                 <DialogDescription>
                    <Select value={language} onValueChange={(value) => {setLanguage(value); handleAction('translate')}}>
                        <SelectTrigger className="w-[180px] mt-2">
                            <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="German">German</SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                        </SelectContent>
                    </Select>
                 </DialogDescription>
             )}
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : audioUrl ? (
                <div className="flex justify-center">
                    <audio controls autoPlay src={audioUrl}>
                        Your browser does not support the audio element.
                    </audio>
                </div>
            ) : (
              <p className="whitespace-pre-wrap">{result}</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
