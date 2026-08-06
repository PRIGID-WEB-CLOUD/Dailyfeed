
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { User, Role } from '@/lib/types';
import { useEffect } from 'react';

const authorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  role_id: z.string().min(1, 'Please select a role.'),
});

type AuthorFormValues = z.infer<typeof authorSchema>;

interface AuthorFormProps {
  user?: User | null;
  roles: Role[];
  onSubmit: (data: AuthorFormValues) => void;
  onCancel: () => void;
  submitButtonText?: string;
}

export function AuthorForm({
  user,
  roles,
  onSubmit,
  onCancel,
  submitButtonText = 'Submit',
}: AuthorFormProps) {
  const getDefaultRoleId = () => {
    if (user && user.roles && user.roles.length > 0) {
      return user.roles[0].id;
    }
    const defaultRole = roles.find(r => r.name === 'Author');
    return defaultRole ? defaultRole.id : '';
  };

  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role_id: getDefaultRoleId(),
    },
  });

  useEffect(() => {
    form.reset({
      name: user?.name || '',
      email: user?.email || '',
      role_id: getDefaultRoleId(),
    });
  }, [user, roles, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{submitButtonText}</Button>
        </div>
      </form>
    </Form>
  );
}
