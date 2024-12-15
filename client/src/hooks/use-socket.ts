import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useUser } from './use-user';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(window.location.origin, {
      auth: {
        userId: user.id,
        username: user.username
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const joinSession = (sessionId: number) => {
    socketRef.current?.emit('join-session', sessionId);
  };

  const updateCode = (data: {
    sessionId: number;
    questionId: number;
    code: string;
  }) => {
    if (!user) return;
    socketRef.current?.emit('code-update', {
      ...data,
      userId: user.id
    });
  };

  const submitAnswer = (data: {
    sessionId: number;
    questionId: number;
    code: string;
  }) => {
    if (!user) return;
    socketRef.current?.emit('submit-answer', {
      ...data,
      userId: user.id
    });
  };

  const onCodeChange = (callback: (data: {
    questionId: number;
    code: string;
    userId: number;
  }) => void) => {
    socketRef.current?.on('code-changed', callback);
  };

  const onSubmissionResult = (callback: (data: {
    submissionId: number;
    questionId: number;
    userId: number;
    status: string;
  }) => void) => {
    socketRef.current?.on('submission-result', callback);
  };

  return {
    socket: socketRef.current,
    joinSession,
    updateCode,
    submitAnswer,
    onCodeChange,
    onSubmissionResult
  };
}
