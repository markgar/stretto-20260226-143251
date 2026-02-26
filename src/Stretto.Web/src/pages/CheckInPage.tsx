import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AttendanceService } from '../api/generated/services/AttendanceService';

export default function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [checkedIn, setCheckedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkInMutation = useMutation({
    mutationFn: () => AttendanceService.postApiCheckin(eventId!),
    onSuccess: () => setCheckedIn(true),
    onError: () => setErrorMsg('Check-in failed. Please try again.'),
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-8">Check In</h1>
      {checkedIn ? (
        <p data-testid="checkin-success">You're checked in!</p>
      ) : (
        <>
          <button
            data-testid="checkin-button"
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-xl font-semibold py-6 rounded-xl disabled:opacity-50"
          >
            I&apos;m here
          </button>
          {errorMsg && <p className="mt-4 text-destructive">{errorMsg}</p>}
        </>
      )}
    </div>
  );
}
