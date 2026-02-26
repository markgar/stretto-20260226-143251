import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ProgramYearsService } from '../api/generated/services/ProgramYearsService';
import { AuditionDatesService } from '../api/generated/services/AuditionDatesService';
import { NotificationsService } from '../api/generated/services/NotificationsService';

const schema = z.object({
  type: z.enum(['assignment', 'audition']),
  targetId: z.string().min(1, 'Please select a program year or audition date'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
});

export type NotificationsFormValues = z.infer<typeof schema>;

export function useNotificationsForm() {
  const [previewTargetId, setPreviewTargetId] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'assignment' | 'audition' | null>(null);

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'assignment', targetId: '', subject: '', body: '' },
  });

  const watchedType = form.watch('type');

  const programYearsQuery = useQuery({
    queryKey: ['program-years'],
    queryFn: () => ProgramYearsService.getApiProgramYears(),
  });

  const auditionDatesQuery = useQuery({
    queryKey: ['audition-dates-all'],
    queryFn: () => AuditionDatesService.getApiAuditionDates(),
    enabled: watchedType === 'audition',
  });

  const recipientsQuery = useQuery({
    queryKey: ['notification-recipients', previewType, previewTargetId],
    queryFn: () =>
      previewType === 'assignment'
        ? NotificationsService.getApiNotificationsAssignmentRecipients(previewTargetId!)
        : NotificationsService.getApiNotificationsAuditionRecipients(previewTargetId!),
    enabled: previewTargetId !== null && previewType !== null,
  });

  const sendMutation = useMutation({
    mutationFn: (values: NotificationsFormValues) =>
      values.type === 'assignment'
        ? NotificationsService.postApiNotificationsAssignmentAnnouncement({
            programYearId: values.targetId,
            subject: values.subject,
            body: values.body,
          })
        : NotificationsService.postApiNotificationsAuditionAnnouncement({
            auditionDateId: values.targetId,
            subject: values.subject,
            body: values.body,
          }),
  });

  function handlePreview() {
    const values = form.getValues();
    if (!values.targetId) return;
    setPreviewType(values.type);
    setPreviewTargetId(values.targetId);
  }

  return {
    form,
    watchedType,
    programYearsQuery,
    auditionDatesQuery,
    recipientsQuery,
    sendMutation,
    handlePreview,
  };
}
